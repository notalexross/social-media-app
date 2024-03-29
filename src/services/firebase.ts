import firebase from 'firebase/app'
import { CombinationOf } from '../types'
import {
  isValidEmail,
  isValidSignUpInputs,
  isValidSignInInputs,
  sortByTimestamp,
  chunkArray,
  deepCloneObject,
  resizeImage,
  buildCooldownEnforcer
} from '../utils'
import { SelfUpdatingCache } from '../classes'
import {
  CREATE_POST_COOLDOWN,
  CREATE_USER_COOLDOWN,
  FOLLOW_USER_COOLDOWN,
  LIKE_POST_COOLDOWN,
  POST_MESSAGE_SOFT_CHARACTER_LIMIT,
  UPDATE_POST_COOLDOWN,
  UPDATE_USER_COOLDOWN,
  USER_AVATAR_PIXEL_LIMIT,
  USER_AVATAR_QUALITY,
  USER_FULL_NAME_CHARACTER_LIMIT,
  USER_USERNAME_CHARACTER_LIMIT
} from '../constants/config'

type UserPublic = {
  avatar: string | null
  createdAt: firebase.firestore.Timestamp
  deleted: boolean
  followersCount: number
  username: string
  usernameLowerCase: string
  lastPostedAt?: firebase.firestore.Timestamp
  lastUpdatedAt?: firebase.firestore.Timestamp
}

type UserPrivate = {
  email: string
  fullName: string
  lastUpdatedPrivateAt?: firebase.firestore.Timestamp
}

type UserFollowing = { following: string[] }
type UserLikedPosts = { likedPosts: string[] }
type UserCreatable = Partial<
  Omit<
    UserPublic & UserPrivate,
    | 'createdAt'
    | 'deleted'
    | 'followersCount'
    | 'usernameLowerCase'
    | 'lastPostedAt'
    | 'lastUpdatedAt'
    | 'lastUpdatedPrivateAt'
  >
>
type UserQuery = Promise<UserPublic | UserPrivate | UserFollowing | UserLikedPosts>

export type User = Partial<UserPublic & UserPrivate & UserFollowing & UserLikedPosts> & {
  uid: string
}

type PostPublic = {
  createdAt: firebase.firestore.Timestamp
  deleted: boolean
  deletedReplies: string[]
  likesCount: number
  owner: string | null
  replyTo: string | null
  replies: string[]
}

type PostContent = {
  attachment: string
  message: string
  owner: string
  updatedAt?: firebase.firestore.Timestamp | null
}

type PostUpdatable = Partial<
  Omit<
    PostPublic & PostContent,
    'createdAt' | 'deletedReplies' | 'likesCount' | 'owner' | 'replyTo' | 'replies' | 'updatedAt'
  >
>

type Post = (PostPublic | (PostPublic & PostContent)) & { id: string }

export type PostPublicWithId = PostPublic & { id: string }
export type PostContentWithId = PostContent & { id: string }
export type PostWithId = PostPublic & PostContent & { id: string }
export type PostWithUserDetails = Post & {
  ownerDetails: User | null
}
export type PostWithReplyTo = PostWithUserDetails & {
  replyToPost: PostWithUserDetails | null
}
export type PostOrPostId = string | Post | PostWithUserDetails | PostWithReplyTo

type ReplyToPost = PostPublicWithId | (PostPublicWithId & { ownerDetails: User | null })

export type PostPiece = CombinationOf<
  { id: string },
  PostPublicWithId,
  PostPublicWithId & { ownerDetails: User | null },
  PostPublicWithId & { replyToPost: ReplyToPost | null },
  PostContentWithId
>

export type PostsStatus = {
  posts: PostPublicWithId[] | null
  isComplete: boolean
  page: number
  stats?: Stats
}

type FetchedPost = {
  post: PostPublicWithId
  createdAt: firebase.firestore.Timestamp
  chunkIndex: number
}

type UserChunk = {
  chunkIndex: number
  users: string[]
  lastFetched: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null
  numFetched: number
  numReturned: number
  isDone: boolean
}

type Stats = {
  fetchCount: number
  docsFetchedCount: number
  docReadCount: number
  chunks: number
  users: number
}

const firestore = firebase.firestore()
const storage = firebase.storage()
const auth = firebase.auth()
const { FieldValue } = firebase.firestore
const usersRef = firestore.collection('users')
const postsRef = firestore.collection('posts')
const enforceCooldown = buildCooldownEnforcer({
  createPost: CREATE_POST_COOLDOWN,
  updatePost: UPDATE_POST_COOLDOWN,
  likePost: LIKE_POST_COOLDOWN,
  createUser: CREATE_USER_COOLDOWN,
  updateUser: UPDATE_USER_COOLDOWN,
  followUser: FOLLOW_USER_COOLDOWN
})

function getUserQueries(uid: string) {
  const userPublicRef = usersRef.doc(uid)
  const userPrivateRef = usersRef.doc(uid).collection('private').doc('details')
  const userFollowersRef = usersRef.doc(uid).collection('followers')
  const userFollowingRef = usersRef.doc(uid).collection('following').doc('details')
  const userLikedPostsRef = usersRef.doc(uid).collection('likedPosts').doc('details')

  return { userPublicRef, userPrivateRef, userFollowersRef, userFollowingRef, userLikedPostsRef }
}

function getPostQueries(postId: string) {
  const postPublicRef = postsRef.doc(postId)
  const postContentRef = postPublicRef.collection('content').doc('details')
  const postLikesRef = postPublicRef.collection('likes')

  return { postPublicRef, postContentRef, postLikesRef }
}

function getPublicDetails(uid: string): Promise<UserPublic> {
  return getUserQueries(uid)
    .userPublicRef.get()
    .then(doc => doc.data() as UserPublic)
    .catch(error => {
      console.error(error)
      throw error
    })
}

function getPrivateDetails(uid: string): Promise<UserPrivate> {
  return getUserQueries(uid)
    .userPrivateRef.get()
    .then(doc => doc.data() as UserPrivate)
    .catch(error => {
      console.error(error)
      throw error
    })
}

function getFollowing(uid: string): Promise<UserFollowing> {
  return getUserQueries(uid)
    .userFollowingRef.get()
    .then(doc => ({ following: doc.data()?.uids as string[] }))
    .catch(error => {
      console.error(error)
      throw error
    })
}

function getLikedPosts(uid: string): Promise<UserLikedPosts> {
  return getUserQueries(uid)
    .userLikedPostsRef.get()
    .then(doc => ({ likedPosts: doc.data()?.postIds as string[] }))
    .catch(error => {
      console.error(error)
      throw error
    })
}

// prettier-ignore
type UserDetails<T> =
  T extends 'public'
    ? UserPublic
    : T extends 'private'
      ? UserPrivate
      : T extends 'following'
        ? UserFollowing
        : T extends 'likes'
          ? UserLikedPosts
          : never

function listenUserDetails<T extends 'public' | 'private' | 'following' | 'likes'>(
  uid: string,
  type: T,
  callback: (details: { uid: string } & UserDetails<T>) => void,
  errorCallback?: (error: unknown) => void
): () => void {
  const refNames = {
    public: 'userPublicRef',
    private: 'userPrivateRef',
    following: 'userFollowingRef',
    likes: 'userLikedPostsRef'
  } as const
  const errorMessages = {
    public: `User with id "${uid}" does not exist.`,
    private: `No private details found for user with id "${uid}".`,
    following: `No following details found for user with id "${uid}".`,
    likes: `No liked posts details found for user with id "${uid}".`
  } as const

  return getUserQueries(uid)[refNames[type]].onSnapshot(
    snap => {
      try {
        if (!snap.metadata.fromCache && !snap.exists) {
          throw new Error(errorMessages[type])
        }

        const data = snap.data()

        if (data) {
          if (type === 'public' || type === 'private') {
            const details = data as UserDetails<T>
            callback({ ...details, uid })
          } else if (type === 'following') {
            const details = { following: data.uids as string[] } as UserDetails<T>
            callback({ ...details, uid })
          } else if (type === 'likes') {
            const details = { likedPosts: data.postIds as string[] } as UserDetails<T>
            callback({ ...details, uid })
          }
        }
      } catch (error) {
        console.error(error)
        if (errorCallback) {
          errorCallback(error)
        }
      }
    },
    error => {
      console.error(error)
      if (errorCallback) {
        errorCallback(error)
      }
    }
  )
}

function getUserId(username: string): Promise<{ uid: string } & UserPublic> {
  return usersRef
    .where('deleted', '==', false)
    .where('usernameLowerCase', '==', username.toLowerCase())
    .get()
    .then(snap => ({
      ...(snap.docs[0]?.data() as UserPublic),
      uid: snap.docs[0]?.id
    }))
    .catch(error => {
      console.error(error)
      throw error
    })
}

function getUserById(
  uid: string,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
): Promise<User> {
  const queries: UserQuery[] = [getPublicDetails(uid)]

  if (includePrivate) {
    queries.push(getPrivateDetails(uid))
  }

  if (includeFollowing) {
    queries.push(getFollowing(uid))
  }

  if (includeLikedPosts) {
    queries.push(getLikedPosts(uid))
  }

  return Promise.all(queries).then(results => ({
    ...results.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
    uid
  }))
}

async function getUserByUsername(
  username: string,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
): Promise<User> {
  const { uid, ...publicData } = await getUserId(username)

  if (uid === undefined) {
    throw new Error(`User with username "${username}" not found.`)
  }

  const queries: (UserQuery | UserPublic)[] = [publicData]

  if (includePrivate) {
    queries.push(getPrivateDetails(uid))
  }

  if (includeFollowing) {
    queries.push(getFollowing(uid))
  }

  if (includeLikedPosts) {
    queries.push(getLikedPosts(uid))
  }

  return Promise.all(queries).then(results => ({
    ...results.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
    uid
  }))
}

export const usersByIdCache = new SelfUpdatingCache('users', getUserById)
export const usersByUsernameCache = new SelfUpdatingCache('usernames', getUserByUsername)

export async function getCachedUserById(
  uid: string,
  maxAge = 10000,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
): Promise<User> {
  return usersByIdCache
    .get(uid, maxAge, uid, { includePrivate, includeFollowing, includeLikedPosts })
    .then(user => user?.data || { uid })
    .catch(error => {
      console.error(error)
      throw error
    })
}

export async function getCachedUserByUsername(
  username: string,
  maxAge = 10000,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
): Promise<User | undefined> {
  return usersByUsernameCache
    .get(username, maxAge, username, { includePrivate, includeFollowing, includeLikedPosts })
    .then(user => user?.data)
    .catch(error => {
      console.error(error)
      throw error
    })
}

type OnUserUpdatedOptions = {
  includePrivate?: boolean
  includeFollowing?: boolean
  includeLikedPosts?: boolean
  errorCallback?: (error: unknown) => void
}

export function onUserByIdUpdated(
  uid: string,
  callback: (details: User) => void,
  {
    includePrivate = false,
    includeFollowing = false,
    includeLikedPosts = false,
    errorCallback
  }: OnUserUpdatedOptions = {}
): () => void {
  let fullDetails: User = { uid }
  let callCount = 0
  let minCalls = 1
  if (includePrivate) minCalls += 1
  if (includeFollowing) minCalls += 1
  if (includeLikedPosts) minCalls += 1

  const cachingCallback = (details: User): void => {
    callCount += 1
    fullDetails = { ...fullDetails, ...details }
    if (callCount >= minCalls) {
      usersByIdCache.set(uid, fullDetails).catch(console.error)
      callback(fullDetails)
    }
  }

  const listeners = [listenUserDetails(uid, 'public', cachingCallback, errorCallback)]

  if (includePrivate) {
    listeners.push(listenUserDetails(uid, 'private', cachingCallback, errorCallback))
  }

  if (includeFollowing) {
    listeners.push(listenUserDetails(uid, 'following', cachingCallback, errorCallback))
  }

  if (includeLikedPosts) {
    listeners.push(listenUserDetails(uid, 'likes', cachingCallback, errorCallback))
  }

  return () => listeners.forEach(listener => listener())
}

export function onUserByUsernameUpdated(
  username: string,
  callback: (details: User) => void,
  {
    includePrivate = false,
    includeFollowing = false,
    includeLikedPosts = false,
    errorCallback
  }: OnUserUpdatedOptions = {}
): () => void {
  let isCurrent = true
  let cleanup = () => {
    isCurrent = false
  }

  getUserId(username)
    .then(({ uid }) => {
      if (isCurrent) {
        if (uid === undefined) {
          throw new Error(`User with username "${username}" not found.`)
        }

        const cachingCallback = (details: User): void => {
          usersByUsernameCache.set(username, details).catch(console.error)
          callback(details)
        }

        cleanup = onUserByIdUpdated(uid, cachingCallback, {
          includePrivate,
          includeFollowing,
          includeLikedPosts,
          errorCallback
        })
      }
    })
    .catch((error: Error) => {
      console.error(error)
      if (errorCallback) {
        errorCallback(error)
      }
    })

  return () => cleanup()
}

export async function isUsernameAvailable(username = ''): Promise<boolean> {
  return getUserId(username).then(user => user.uid === undefined)
}

async function createUserInDB(
  uid: string,
  { avatar = '', email = '', fullName = '', username = '' }: UserCreatable
): Promise<void> {
  if (fullName.length > USER_FULL_NAME_CHARACTER_LIMIT) {
    throw new Error(
      `Username is longer than the ${USER_FULL_NAME_CHARACTER_LIMIT} character limit.`
    )
  }

  if (username.length > USER_USERNAME_CHARACTER_LIMIT) {
    throw new Error(`Username is longer than the ${USER_USERNAME_CHARACTER_LIMIT} character limit.`)
  }

  enforceCooldown('createUser')

  const { userPublicRef, userPrivateRef, userFollowingRef, userLikedPostsRef } = getUserQueries(uid)
  const batch = firestore.batch()

  batch.set(userPublicRef, {
    avatar,
    createdAt: FieldValue.serverTimestamp(),
    deleted: false,
    followersCount: 0,
    username,
    usernameLowerCase: username.toLowerCase()
  })

  batch.set(userPrivateRef, {
    email,
    fullName
  })

  batch.set(userFollowingRef, {
    uids: []
  })

  batch.set(userLikedPostsRef, {
    postIds: []
  })

  return batch.commit()
}

function updateEmailInDB(uid: string, email: string): Promise<void> {
  if (!email) {
    throw new Error('Invalid email supplied.')
  }

  const { userPrivateRef } = getUserQueries(uid)

  return userPrivateRef.update({ email, lastUpdatedPrivateAt: FieldValue.serverTimestamp() })
}

async function updateUserInDB(
  uid: string,
  updates: {
    avatar?: string
    deleted?: boolean
    fullName?: string
    username?: string
  },
  ignoreCooldown = false
): Promise<void> {
  if ((updates.fullName?.length || 0) > USER_FULL_NAME_CHARACTER_LIMIT) {
    throw new Error(
      `Username is longer than the ${USER_FULL_NAME_CHARACTER_LIMIT} character limit.`
    )
  }

  if ((updates.username?.length || 0) > USER_USERNAME_CHARACTER_LIMIT) {
    throw new Error(`Username is longer than the ${USER_USERNAME_CHARACTER_LIMIT} character limit.`)
  }

  if (!ignoreCooldown) {
    enforceCooldown('updateUser')
  }

  const batch = firestore.batch()
  const { userPublicRef, userPrivateRef } = getUserQueries(uid)
  const publicKeys = ['avatar', 'deleted', 'username'] as const
  const privateKeys = ['fullName'] as const

  const publicUpdates: Partial<UserPublic> = publicKeys.reduce(
    (acc, cur) => (cur in updates ? { ...acc, [cur]: updates[cur] } : acc),
    {}
  )

  const privateUpdates: Partial<UserPrivate> = privateKeys.reduce(
    (acc, cur) => (cur in updates ? { ...acc, [cur]: updates[cur] } : acc),
    {}
  )

  const numPrivateUpdates = Object.keys(privateUpdates).length
  const numPublicUpdates = Object.keys(publicUpdates).length
  const numUpdates = numPrivateUpdates + numPublicUpdates

  if (publicUpdates.username) {
    if (!(await isUsernameAvailable(publicUpdates.username))) {
      throw new Error(`The username "${publicUpdates.username}" is already taken.`)
    }

    publicUpdates.usernameLowerCase = publicUpdates.username.toLowerCase()
  }

  if (numPrivateUpdates) {
    batch.update(userPrivateRef, {
      ...privateUpdates,
      lastUpdatedPrivateAt: FieldValue.serverTimestamp()
    })
  }

  if (numPublicUpdates) {
    batch.update(userPublicRef, {
      ...publicUpdates,
      lastUpdatedAt: FieldValue.serverTimestamp()
    })
  }

  if (!numUpdates) {
    throw new Error(`No valid updates were supplied for user with id "${uid}".`)
  }

  return batch.commit()
}

// prettier-ignore
type PostDetails<T> =
  T extends 'public'
    ? PostPublic
    : T extends 'content'
      ? PostContent
      : never

function listenPostDetails<T extends 'public' | 'content'>(
  postId: string,
  type: T,
  callback: (response: PostDetails<T>) => void,
  errorCallback?: (error: unknown) => void
): () => void {
  const refNames = {
    public: 'postPublicRef',
    content: 'postContentRef'
  } as const
  const errorMessages = {
    public: `Post with id "${postId}" does not exist.`,
    content: `No content found for post with id "${postId}".`
  } as const

  return getPostQueries(postId)[refNames[type]].onSnapshot(
    snap => {
      try {
        if (!snap.metadata.fromCache && !snap.exists) {
          throw new Error(errorMessages[type])
        }

        const data = snap.data()

        if (data) {
          callback(data as PostDetails<T>)
        }
      } catch (error) {
        console.error(error)
        if (errorCallback) {
          errorCallback(error)
        }
      }
    },
    error => {
      console.error(error)
      if (errorCallback) {
        errorCallback(error)
      }
    }
  )
}

export type FetchPostOptions = {
  existingPost?: PostPiece
  fetchPublic?: 'get' | 'subscribe' | 'none'
  fetchContent?: 'get' | 'subscribe' | 'subscribeIfOwner' | 'none'
  fetchReplyTo?: 'get' | 'none'
  errorCallback?: (error: unknown) => void
  onRequestMade?: () => void
}

export function fetchPost(
  postId: string,
  callback: (updatedPost: PostPiece) => void,
  {
    existingPost = { id: postId },
    fetchPublic = 'get',
    fetchContent = 'none',
    fetchReplyTo = 'none',
    errorCallback,
    onRequestMade = () => {}
  }: FetchPostOptions = {}
): () => void {
  let post: PostPiece = deepCloneObject(existingPost)
  let publicListener: (() => void) | undefined
  let contentListener: (() => void) | undefined
  let isGettingOwnerDetails = false
  let isGettingReplyToPost = false
  let isGettingReplyToPostOwnerDetails = false
  let didUpdatePublic = false
  let didUpdateContent = false
  let contentError = false
  let contentHasErrored = false
  let isCurrent = true

  // Note: TypeScript control flow analysis of aliased conditions requires an object to be readonly.
  const assemblePost = (immutablePost: Readonly<PostPiece>) => {
    const hasPublic = 'createdAt' in immutablePost
    const hasNonNullOwnerId = hasPublic && immutablePost.owner !== null
    const hasOwnerDetails =
      'ownerDetails' in immutablePost && (immutablePost.ownerDetails !== null || !hasNonNullOwnerId)
    const hasReplyToPost = 'replyToPost' in immutablePost
    const hasNonNullReplyToPost = hasReplyToPost && immutablePost.replyToPost !== null
    const hasReplyToPostOwnerDetails =
      hasNonNullReplyToPost && 'ownerDetails' in immutablePost.replyToPost
    const hasContent = 'message' in immutablePost
    const isOwner = hasNonNullOwnerId && immutablePost.owner === auth.currentUser?.uid
    const isDeleted = hasPublic && immutablePost.deleted
    // Note: isAllowedContent always returns true until fetching content has been attempted at least once, even if the post is deleted. If the post is deleted then cannot know for sure that content isn't allowed until it is fetched, since the owner ID is only stored in the content for deleted posts.
    const isAllowedContent = (!isDeleted || !contentHasErrored) && !contentError
    const needOwnerId = fetchContent === 'subscribeIfOwner' && !hasPublic
    const needOwnerDetails = fetchPublic !== 'none' && hasPublic
    const needReplyToPost = fetchReplyTo !== 'none'
    const needReplyToPostOwnerDetails = needReplyToPost && hasNonNullReplyToPost
    const needPublic =
      fetchPublic !== 'none' ||
      needOwnerId ||
      needOwnerDetails ||
      needReplyToPost ||
      needReplyToPostOwnerDetails
    const needSubscribePublic = fetchPublic === 'subscribe'
    const needRemovePublicListener =
      publicListener !== undefined && hasPublic && !needSubscribePublic

    // Note: Given fetchContent is "get"; needContent returns false if content has errored once already, to prevent content being fetched again on post undeletion and to allow callback to be called with no content.
    // Note: Given fetchContent is "subscribeIfOwner"; needContent will always initially return true, so that content is fetched at least once even if the current user is not the owner. This also allows addition of owner in the case of a deleted post, as the owner ID only exists on the content in that case (null in public).
    const needContent =
      (fetchContent === 'get' && !contentHasErrored) ||
      (fetchContent === 'subscribe' && isAllowedContent) ||
      (fetchContent === 'subscribeIfOwner' && isAllowedContent && !contentHasErrored)
    const needSubscribeContent =
      (fetchContent === 'subscribe' && isAllowedContent) ||
      (fetchContent === 'subscribeIfOwner' && (!hasPublic || isOwner) && isAllowedContent)
    const needRemoveContentListener =
      contentListener !== undefined &&
      hasContent &&
      fetchContent !== 'subscribe' &&
      (fetchContent !== 'subscribeIfOwner' || (hasPublic && !isOwner))

    const shouldNextUpdatePublic =
      ((!hasPublic && needPublic) || needSubscribePublic) && !publicListener
    const shouldNextUpdateContent =
      ((!hasContent && needContent) || needSubscribeContent) && !contentListener
    const shouldNextUpdateReplyToPost =
      !hasReplyToPost && needReplyToPost && !isGettingReplyToPost && hasPublic
    const shouldNextUpdateOwnerDetails =
      !hasOwnerDetails && needOwnerDetails && !isGettingOwnerDetails
    const shouldNextUpdateReplyToPostOwnerDetails =
      !hasReplyToPostOwnerDetails &&
      needReplyToPostOwnerDetails &&
      !isGettingReplyToPostOwnerDetails
    const shouldCallCallback =
      (hasPublic || !needPublic) &&
      (hasOwnerDetails || !needOwnerDetails) &&
      (hasReplyToPost || !needReplyToPost) &&
      (hasReplyToPostOwnerDetails || !needReplyToPostOwnerDetails) &&
      (hasContent || !needContent) &&
      (didUpdatePublic || !needSubscribePublic) &&
      (didUpdateContent || !needSubscribeContent)

    if (shouldNextUpdatePublic) {
      onRequestMade()

      publicListener = listenPostDetails(
        postId,
        'public',
        response => {
          if (isCurrent) {
            if ('owner' in post && post.owner !== null) {
              post = { ...post, ...response, owner: post.owner }
            } else {
              post = { ...post, ...response }
            }

            didUpdatePublic = true
            contentError = false
            assemblePost(post)
          }
        },
        errorCallback
      )
    } else if (shouldNextUpdateContent) {
      const handleContentError = () => {
        console.error('Unable to get post content, post possibly deleted.')

        if (contentListener) {
          contentListener()
          contentListener = undefined
        }

        contentError = true
        contentHasErrored = true
        assemblePost(post)
      }

      onRequestMade()

      contentListener = listenPostDetails(
        postId,
        'content',
        response => {
          if (isCurrent) {
            post = { ...post, ...response }
            didUpdateContent = true
            contentError = false
            assemblePost(post)
          }
        },
        handleContentError
      )
    } else if (shouldNextUpdateReplyToPost) {
      isGettingReplyToPost = true
      if (immutablePost.replyTo) {
        onRequestMade()

        const { replyTo } = immutablePost
        const { postPublicRef } = getPostQueries(immutablePost.replyTo)
        postPublicRef
          .get()
          .then(doc => {
            if (isCurrent) {
              post = { ...post, replyToPost: { ...(doc.data() as PostPublic), id: replyTo } }
              assemblePost(post)
            }
          })
          .catch(errorCallback)
      } else {
        post = { ...post, replyToPost: null }
        assemblePost(post)
      }
    } else if (shouldNextUpdateOwnerDetails) {
      isGettingOwnerDetails = true
      if (hasNonNullOwnerId) {
        onRequestMade()

        getCachedUserById(immutablePost.owner, 10 * 1000)
          .then(ownerDetails => {
            if (isCurrent) {
              post = { ...post, ownerDetails }
              assemblePost(post)
            }
          })
          .catch(errorCallback)
      } else {
        post = { ...post, ownerDetails: null }
        assemblePost(post)
      }
    } else if (shouldNextUpdateReplyToPostOwnerDetails) {
      isGettingReplyToPostOwnerDetails = true
      if (immutablePost.replyToPost.owner) {
        onRequestMade()

        getCachedUserById(immutablePost.replyToPost.owner, 10 * 1000)
          .then(ownerDetails => {
            if (isCurrent) {
              if ('replyToPost' in post && post.replyToPost !== null) {
                post = { ...post, replyToPost: { ...post.replyToPost, ownerDetails } }
              }

              assemblePost(post)
            }
          })
          .catch(errorCallback)
      } else if ('replyToPost' in post && post.replyToPost !== null) {
        post = { ...post, replyToPost: { ...post.replyToPost, ownerDetails: null } }
        assemblePost(post)
      }
    }

    if (publicListener && needRemovePublicListener) {
      publicListener()
      publicListener = undefined
    }

    if (contentListener && needRemoveContentListener) {
      contentListener()
      contentListener = undefined
    }

    if (shouldCallCallback) {
      callback(post)
    }
  }

  assemblePost(post)

  return () => {
    isCurrent = false

    if (publicListener) {
      publicListener()
    }

    if (contentListener) {
      contentListener()
    }
  }
}

type CreatePostInDBOptions = {
  attachment?: string
  message?: string
  replyTo?: string | null
} & ({ message: string } | { attachment: string })

async function createPostInDB(
  uid: string,
  { attachment = '', message = '', replyTo = null }: CreatePostInDBOptions
): Promise<string> {
  if (message.length > POST_MESSAGE_SOFT_CHARACTER_LIMIT) {
    throw new Error(`Post is longer than the ${POST_MESSAGE_SOFT_CHARACTER_LIMIT} character limit.`)
  }

  enforceCooldown('createPost')

  const post = postsRef.doc()
  const batch = firestore.batch()

  if (attachment || message) {
    batch.set(post, {
      createdAt: FieldValue.serverTimestamp(),
      deleted: false,
      deletedReplies: [],
      likesCount: 0,
      owner: uid,
      replyTo,
      replies: []
    })

    batch.set(getPostQueries(post.id).postContentRef, {
      attachment,
      message,
      owner: uid
    })

    if (replyTo) {
      batch.update(getPostQueries(replyTo).postPublicRef, {
        replies: FieldValue.arrayUnion(post.id)
      })
    }

    batch.update(getUserQueries(uid).userPublicRef, {
      lastPostedAt: FieldValue.serverTimestamp()
    })

    return batch
      .commit()
      .then(() => post.id)
      .catch(error => {
        console.error(error)
        throw error
      })
  }

  throw new Error('A post must have at least an attachment or a message.')
}

async function updatePostInDB(
  post: PostUpdatable & { id: string },
  updates: PostUpdatable
): Promise<void> {
  if ((updates?.message?.length || 0) > POST_MESSAGE_SOFT_CHARACTER_LIMIT) {
    throw new Error(`Post is longer than the ${POST_MESSAGE_SOFT_CHARACTER_LIMIT} character limit.`)
  }

  const { postPublicRef, postContentRef } = getPostQueries(post.id)
  const postPublicKeys = ['deleted'] as const
  const postContentKeys = ['attachment', 'message'] as const

  const callback = (acc: typeof updates, cur: keyof typeof updates) => {
    if (cur in updates && post[cur] !== updates[cur]) {
      return { ...acc, [cur]: updates[cur] }
    }

    return acc
  }

  const postPublicUpdates: Partial<PostPublic> = postPublicKeys.reduce(callback, {})
  const postContentUpdates: Partial<PostContent> = postContentKeys.reduce(callback, {})
  const numPublicUpdates = Object.keys(postPublicUpdates).length
  const numContentUpdates = Object.keys(postContentUpdates).length
  const numUpdates = numPublicUpdates + numContentUpdates

  if (numUpdates) {
    enforceCooldown('updatePost')

    return firestore.runTransaction(async transaction => {
      const postPublicDoc = await transaction.get(postPublicRef)

      if (!postPublicDoc.exists) {
        throw new Error('Unable to update post as it does not exist.')
      }

      if (numPublicUpdates) {
        const { replyTo } = postPublicDoc.data() as PostPublic

        if ('deleted' in postPublicUpdates) {
          if (postPublicUpdates.deleted) {
            transaction.update(postPublicRef, { owner: null })
          } else {
            const { owner } = (await transaction.get(postContentRef)).data() as PostContent

            transaction.update(postPublicRef, { owner })
          }

          if (replyTo) {
            const { postPublicRef: replyToPostPublicRef } = getPostQueries(replyTo)

            if (postPublicUpdates.deleted) {
              transaction.update(replyToPostPublicRef, {
                deletedReplies: FieldValue.arrayUnion(post.id)
              })
            } else {
              transaction.update(replyToPostPublicRef, {
                deletedReplies: FieldValue.arrayRemove(post.id)
              })
            }
          }
        }

        transaction.update(postPublicRef, postPublicUpdates)
      }

      if (numContentUpdates) {
        transaction.update(postContentRef, {
          ...postContentUpdates,
          updatedAt: FieldValue.serverTimestamp()
        })
      }
    })
  }

  throw new Error(`No valid updates were supplied for post with id "${post.id}".`)
}

async function updateFollowInDB(
  type: 'unfollow' | 'follow',
  followerUid: string,
  followedUid: string
): Promise<void> {
  if (!followedUid.length) {
    throw new Error('Invalid user ID supplied.')
  }

  enforceCooldown('followUser')

  const batch = firestore.batch()
  const { userFollowingRef } = getUserQueries(followerUid)
  const { userPublicRef, userFollowersRef } = getUserQueries(followedUid)

  let increment
  if (type === 'unfollow') {
    increment = -1
    batch.delete(userFollowersRef.doc(followerUid))
    batch.update(userFollowingRef, {
      uids: FieldValue.arrayRemove(followedUid)
    })
  } else if (type === 'follow') {
    increment = 1
    batch.set(userFollowersRef.doc(followerUid), {})
    batch.update(userFollowingRef, {
      uids: FieldValue.arrayUnion(followedUid)
    })
  } else {
    throw new Error('Invalid type supplied.')
  }

  if (increment) {
    batch.update(userPublicRef, {
      followersCount: FieldValue.increment(increment)
    })
  }

  return batch.commit()
}

async function updateLikeInDB(
  type: 'unlike' | 'like',
  likerUid: string,
  postId: string
): Promise<void> {
  if (!postId.length) {
    throw new Error('Invalid post ID supplied.')
  }

  enforceCooldown('likePost')

  const batch = firestore.batch()
  const { postPublicRef, postLikesRef } = getPostQueries(postId)
  const { userLikedPostsRef } = getUserQueries(likerUid)

  let increment
  if (type === 'unlike') {
    increment = -1
    batch.delete(postLikesRef.doc(likerUid))
    batch.update(userLikedPostsRef, {
      postIds: FieldValue.arrayRemove(postId)
    })
  } else if (type === 'like') {
    increment = 1
    batch.set(postLikesRef.doc(likerUid), {})
    batch.update(userLikedPostsRef, {
      postIds: FieldValue.arrayUnion(postId)
    })
  } else {
    throw new Error('Invalid type supplied.')
  }

  if (increment) {
    batch.update(postPublicRef, {
      likesCount: FieldValue.increment(increment)
    })
  }

  return batch.commit()
}

export function onAuthStateChanged(
  callback: (user: Partial<firebase.User>) => void
): firebase.Unsubscribe {
  return auth.onAuthStateChanged(user => callback(user || {}))
}

export async function signOut(): Promise<void> {
  return auth.signOut()
}

export async function signUp({
  username,
  fullName,
  email,
  password
}: {
  username: string
  fullName: string
  email: string
  password: string
}): Promise<string> {
  const isValidUsername = username && username.match(/[A-z0-9_]/g)?.length === username.length

  if (!isValidSignUpInputs({ username, fullName, email, password })) {
    throw new Error('Invalid data supplied.')
  }

  if (!isValidUsername) {
    throw new Error('Username must only be made up of letters, numbers, and underscores.')
  }

  if (!(await isUsernameAvailable(username))) {
    throw new Error(`The username "${username}" is already taken.`)
  }

  const { user } = await auth.createUserWithEmailAndPassword(email, password)

  if (!user) {
    throw new Error('Failed to create user.')
  }

  await createUserInDB(user.uid, {
    avatar: user.photoURL,
    email,
    fullName,
    username
  })

  return user.uid
}

export async function signIn({
  email,
  password
}: {
  email: string
  password: string
}): Promise<firebase.auth.UserCredential> {
  if (!isValidSignInInputs({ email, password })) {
    throw new Error('Invalid data supplied.')
  }

  return auth.signInWithEmailAndPassword(email, password)
}

export async function changeEmail(newEmail: string, currentPassword: string): Promise<void> {
  const { currentUser } = auth

  if (!currentUser || !currentUser.email) {
    throw new Error('No user.')
  }

  if (!isValidEmail(newEmail)) {
    throw new Error('The email address is badly formatted.')
  }

  // WARNING: If connection lost then auth email may be different from database email.
  return auth
    .signInWithEmailAndPassword(currentUser.email, currentPassword)
    .then(() => currentUser.updateEmail(newEmail))
    .then(() => updateEmailInDB(currentUser.uid, newEmail))
    .catch(error => {
      console.error(error)
      throw error
    })
}

export async function changePassword(newPassword: string, currentPassword: string): Promise<void> {
  const { currentUser } = auth

  if (!currentUser || !currentUser.email) {
    throw new Error('No user.')
  }

  return auth
    .signInWithEmailAndPassword(currentUser.email, currentPassword)
    .then(() => currentUser.updatePassword(newPassword))
    .catch(error => {
      console.error(error)
      throw error
    })
}

export async function editUser(
  updates: {
    avatar?: string
    deleted?: boolean
    fullName?: string
    username?: string
  },
  ignoreCooldown = false
): Promise<void> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return updateUserInDB(currentUser.uid, updates, ignoreCooldown)
}

async function uploadFile(path: string, file: Blob): Promise<string> {
  try {
    let fullPath = path
    if (path.endsWith('/')) {
      const uniqueId = firestore.collection('non-existent').doc().id
      fullPath = `${path}${uniqueId}`
    }

    const storagePathRef = storage.ref().child(fullPath)

    await storagePathRef.put(file)

    return (await storagePathRef.getDownloadURL()) as string
  } catch (error) {
    console.error(error)
    throw error
  }
}

export async function updateAvatar(uid: string, imageFile: File): Promise<string> {
  enforceCooldown('updateUser')

  const resizedImage = await resizeImage(imageFile, USER_AVATAR_PIXEL_LIMIT, USER_AVATAR_QUALITY)
  const avatar = await uploadFile(`avatars/${uid}`, resizedImage)

  await editUser({ avatar }, true)

  return avatar
}

async function getAttachmentUrl(directory: string, attachment?: Blob | string | null) {
  let url = ''
  if (attachment) {
    if (typeof attachment === 'string') {
      url = attachment
    } else {
      url = await uploadFile(`attachments/${directory}/`, attachment).catch(error => {
        console.error(error)
        throw error
      })
    }
  }

  return url
}

type AddPostOptions = {
  attachment?: Blob | string | null
  message?: string
  replyTo?: string | null
}

export async function addPost({
  attachment = null,
  message = '',
  replyTo = null
}: AddPostOptions): Promise<string> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  const url = await getAttachmentUrl(currentUser.uid, attachment)

  return createPostInDB(currentUser.uid, { attachment: url, message, replyTo })
}

type EditPostOptions = {
  deleted?: boolean
  attachment?: Blob | string
  message?: string
}

export async function editPost(
  post: PostUpdatable & { id: string; owner: string | null },
  updates: EditPostOptions = {}
): Promise<void> {
  const { attachment, ...restUpdates } = updates

  if ('attachment' in updates) {
    const url = await getAttachmentUrl(post.owner || 'unknown-user', attachment)

    return updatePostInDB(post, { attachment: url, ...restUpdates })
  }

  return updatePostInDB(post, restUpdates)
}

export async function followUser(uid: string): Promise<void> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return updateFollowInDB('follow', currentUser.uid, uid)
}

export async function unfollowUser(uid: string): Promise<void> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return updateFollowInDB('unfollow', currentUser.uid, uid)
}

export async function likePost(postId: string): Promise<void> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return updateLikeInDB('like', currentUser.uid, postId)
}

export async function unlikePost(postId: string): Promise<void> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return updateLikeInDB('unlike', currentUser.uid, postId)
}

function initUserChunks(usersArray: string[], numPerChunk = 10): UserChunk[] {
  const chunks = chunkArray(usersArray, numPerChunk).map((users, chunkIndex) => ({
    chunkIndex,
    users,
    lastFetched: null,
    numFetched: 0,
    numReturned: 0,
    isDone: false
  }))

  return chunks
}

async function fetchPosts(
  chunks: UserChunk[],
  limitPerChunk: number,
  stats?: Stats
): Promise<FetchedPost[]> {
  const requests = chunks.map(async chunk => {
    let query = postsRef
      .where('deleted', '==', false)
      .where('owner', 'in', chunk.users)
      .orderBy('createdAt', 'desc')
      .limit(limitPerChunk)

    if (chunk.lastFetched) {
      query = query.startAfter(chunk.lastFetched)
    }

    const { docs, metadata } = await query.get()

    if (metadata.fromCache) {
      throw new Error('Unable to get posts as currently offline.')
    }

    const chunkFetchedPosts = await Promise.all(
      docs.map(doc => {
        const postPublic = doc.data() as PostPublic
        const post = { ...postPublic, id: doc.id }

        return {
          post,
          createdAt: post.createdAt,
          chunkIndex: chunk.chunkIndex
        }
      })
    )

    chunk.numFetched += docs.length
    chunk.lastFetched = docs[docs.length - 1]
    chunk.isDone = docs.length < limitPerChunk

    if (stats) {
      stats.fetchCount += 1
      stats.docsFetchedCount += docs.length
      stats.docReadCount += docs.length || 1
    }

    return chunkFetchedPosts
  })

  const fetchedPosts = (await Promise.all(requests)).reduce((acc, cur) => {
    acc.push(...cur)

    return acc
  }, [])

  return fetchedPosts
}

type GetUserPostsOptions = {
  postsPerPage?: number
  loadingCallback?: (isLoading: boolean) => void
  errorCallback?: (error: unknown) => void
}

export function getMultiUserPosts(
  users: string[],
  statusCallback: (status: PostsStatus) => void,
  { postsPerPage = 10, loadingCallback, errorCallback }: GetUserPostsOptions = {}
): () => Promise<void> {
  const userChunks = initUserChunks(users, 10)
  const fetchedPosts: FetchedPost[] = []
  const stats: Stats = {
    fetchCount: 0,
    docsFetchedCount: 0,
    docReadCount: 0,
    chunks: userChunks.length,
    users: users.length
  }
  let chunksToFetch = userChunks
  let fetchedPostsSorted: FetchedPost[] = []
  let page = 0
  let postIdx = -1
  let isComplete = false
  let isLoading = false

  const loadNextPage: () => Promise<void> = async () => {
    if (!isComplete && !isLoading) {
      isLoading = true

      if (loadingCallback) {
        loadingCallback(true)
      }

      if (users.length === 0) {
        isComplete = true
      }

      page += 1

      try {
        while (postIdx + 1 < postsPerPage * page && !isComplete) {
          if (chunksToFetch.length > 0) {
            // eslint-disable-next-line no-await-in-loop
            const newPosts = await fetchPosts(chunksToFetch, postsPerPage + 1, stats)
            fetchedPosts.push(...newPosts)
            fetchedPostsSorted = sortByTimestamp(fetchedPosts, 'createdAt', 'desc')
            chunksToFetch = []
          }

          postIdx += 1

          if (fetchedPostsSorted.length > 0) {
            const post = fetchedPostsSorted[postIdx]
            const chunk = userChunks[post.chunkIndex]
            chunk.numReturned += 1

            const shouldChunkFetch = !chunk.isDone && chunk.numReturned >= chunk.numFetched - 1
            if (shouldChunkFetch) {
              chunksToFetch = [chunk]
            }
          }

          isComplete = userChunks.every(chnk => chnk.isDone && chnk.numFetched === chnk.numReturned)
        }
      } catch (error) {
        page -= 1
        console.error(error)
        if (errorCallback) {
          errorCallback(error)
        }
      }

      const posts = fetchedPostsSorted.slice(0, page * postsPerPage).map(post => post.post)
      const postsStatus: PostsStatus = { posts, isComplete, page, stats }

      statusCallback(postsStatus)

      if (loadingCallback) {
        loadingCallback(false)
      }

      isLoading = false
    }
  }

  return loadNextPage
}

export function getAllUserPosts(
  statusCallback: (status: PostsStatus) => void,
  { postsPerPage = 10, loadingCallback, errorCallback }: GetUserPostsOptions = {}
): () => Promise<void> {
  const fetchedPosts: PostPublicWithId[] = []
  let last: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null = null
  let page = 0
  let isComplete = false
  let isLoading = false

  const loadNextPage: () => Promise<void> = async () => {
    if (!isComplete && !isLoading) {
      isLoading = true

      if (loadingCallback) {
        loadingCallback(true)
      }

      page += 1

      const numPostsToFetch = page * postsPerPage + 1 - fetchedPosts.length

      if (numPostsToFetch) {
        let query = postsRef
          .where('deleted', '==', false)
          .orderBy('createdAt', 'desc')
          .limit(numPostsToFetch)

        if (last) {
          query = query.startAfter(last)
        }

        try {
          const { docs, metadata } = await query.get()

          if (metadata.fromCache) {
            throw new Error('Unable to get posts as currently offline.')
          }

          const newPosts = await Promise.all(
            docs.map(doc => {
              const postPublic = doc.data() as PostPublic
              const post = { ...postPublic, id: doc.id }

              return post
            })
          )

          last = docs[docs.length - 1]
          isComplete = docs.length < numPostsToFetch
          fetchedPosts.push(...newPosts)
        } catch (error) {
          page -= 1
          console.error(error)
          if (errorCallback) {
            errorCallback(error)
          }
        }
      }

      const posts = fetchedPosts.slice(0, page * postsPerPage)
      const postsStatus = { posts, isComplete, page }

      statusCallback(postsStatus)

      if (loadingCallback) {
        loadingCallback(false)
      }

      isLoading = false
    }
  }

  return loadNextPage
}

type LatestPosters = {
  users: User[]
  exhausted: boolean
}

export async function getLatestPosters({
  exclude = [] as string[],
  minUnexcluded = 5,
  maxRequests = 10,
  minDocsPerRequest = 5
} = {}): Promise<LatestPosters> {
  const users: User[] = []
  let last: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null = null
  let requestsMade = 0
  let numUnexcluded = 0

  while (
    numUnexcluded < minUnexcluded &&
    requestsMade < maxRequests &&
    (last || requestsMade === 0)
  ) {
    const remaining = minUnexcluded - numUnexcluded
    const limit = exclude.length ? Math.max(remaining, minDocsPerRequest) : remaining
    let query = usersRef.where('deleted', '==', false).orderBy('lastPostedAt', 'desc').limit(limit)
    query = last ? query.startAfter(last) : query

    // eslint-disable-next-line no-await-in-loop
    const docs = await query.get().then(snap => snap.docs)
    numUnexcluded += docs.filter(doc => !exclude.includes(doc.id)).length
    users.push(...docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserPublic) })))
    requestsMade += 1
    last = docs[docs.length - 1]
  }

  const exhausted = !last

  return { users, exhausted }
}

export async function getRecentlySeenPosters({
  num = 10,
  timePeriod = 10 * 60 * 1000,
  exclude = [] as string[]
} = {}): Promise<User[]> {
  const cutoff = Math.max(Date.now() - timePeriod, 0)
  const recentlySeen = (await usersByIdCache.getAll())
    .filter(entry => entry.lastUpdated >= cutoff)
    .map(entry => entry.data)
  const sorted = sortByTimestamp(recentlySeen, 'lastPostedAt', 'desc')

  return sorted.filter(user => !exclude.includes(user.uid)).slice(0, num)
}

export const latestPostersCache = new SelfUpdatingCache('latest-posters', getLatestPosters)

export async function getCachedLatestPosters(
  key: string,
  {
    maxAge = 0,
    exclude = [] as string[],
    num = 5,
    buffer = 0,
    maxRequests = 10,
    minDocsPerRequest = 5
  } = {}
): Promise<User[]> {
  let exhausted = false
  let filtered: User[] = []
  let count = 0

  while (!exhausted && count < 2 && filtered.length < num) {
    // eslint-disable-next-line no-await-in-loop
    const latestPosters = await latestPostersCache
      .get(key, count > 0 ? 0 : maxAge, {
        exclude,
        minUnexcluded: num + buffer,
        maxRequests,
        minDocsPerRequest
      })
      .then(entry => entry?.data || { users: [], exhausted: false })
    const { users } = latestPosters
    exhausted = latestPosters.exhausted
    filtered = users.filter(user => !exclude.includes(user.uid)).slice(0, num)
    count += 1
  }

  return filtered
}

export async function getSuggestedUsers(
  key: string,
  {
    exclude = [] as string[],
    max = 10,
    fractionLatestPosters = 0.5,
    recentlySeenTimePeriod = 10 * 60 * 1000,
    cachedLatestPostersMaxAge = 10 * 60 * 1000
  } = {}
): Promise<User[]> {
  const numLatestPosters = Math.max(Math.min(Math.ceil(fractionLatestPosters * max), max), 0)
  const suggestions: User[] = []

  if (max - numLatestPosters) {
    suggestions.push(
      ...(await getRecentlySeenPosters({
        num: max - numLatestPosters,
        timePeriod: recentlySeenTimePeriod,
        exclude
      }))
    )
  }

  if (suggestions.length < max) {
    suggestions.push(
      ...(await getCachedLatestPosters(key, {
        maxAge: cachedLatestPostersMaxAge,
        exclude: [...exclude, ...suggestions.map(user => user.uid)],
        num: max - suggestions.length,
        buffer: 5,
        maxRequests: 10,
        minDocsPerRequest: 5
      }))
    )
  }

  if (suggestions.length < max) {
    suggestions.push(
      ...(await getRecentlySeenPosters({
        num: max - suggestions.length,
        timePeriod: recentlySeenTimePeriod,
        exclude: [...exclude, ...suggestions.map(user => user.uid)]
      }))
    )
  }

  return sortByTimestamp(suggestions, 'lastPostedAt', 'desc')
}
