import firebase from 'firebase/app'
import {
  isValidEmail,
  isValidSignUpInputs,
  isValidSignInInputs,
  sortByTimestamp,
  chunkArray
} from '../utils'
import { SelfUpdatingCache } from '../classes'

type UserPublic = {
  avatar: string | null
  createdAt: firebase.firestore.Timestamp
  deleted: boolean
  followersCount: number
  username: string
  usernameLowerCase: string
  lastPostedAt?: firebase.firestore.Timestamp
}

type UserPrivate = {
  email: string
  fullName: string
}

type UserFollowing = { following: string[] }
type UserLikedPosts = { likedPosts: string[] }
type UserCreatable = Partial<
  Omit<
    UserPublic & UserPrivate,
    'createdAt' | 'deleted' | 'followersCount' | 'usernameLowerCase' | 'lastPostedAt'
  >
>
type UserQuery = Promise<UserPublic | UserPrivate | UserFollowing | UserLikedPosts>

export type User = Partial<UserPublic & UserPrivate & UserFollowing & UserLikedPosts> & {
  uid: string
}

export type ReplyTo = {
  id: string
  owner: string
} | null

type PostPublic = {
  createdAt: firebase.firestore.Timestamp
  deleted: boolean
  likesCount: number
  owner: string
  replyTo: ReplyTo
  replies: string[]
  updatedAt?: firebase.firestore.Timestamp | null
}

type PostContent = {
  attachment: string
  message: string
}

type Post = PostPublic & PostContent

type PostUpdatable = Partial<
  Omit<Post, 'createdAt' | 'likesCount' | 'owner' | 'replyTo' | 'replies' | 'updatedAt'>
>

export type PostPublicWithId = PostPublic & { id: string }
export type PostContentWithId = PostContent & { id: string }
export type PostWithId = Post & { id: string }
export type PostWithUserDetails = PostWithId & {
  ownerDetails: User
} & {
  replyToOwnerDetails?: User
}

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
    public: `User with id "${uid}" does not exist`,
    private: `No private details found for user with id "${uid}"`,
    following: `No following details found for user with id "${uid}"`,
    likes: `No liked posts details found for user with id "${uid}"`
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
      if (uid === undefined) {
        throw new Error(`User with username "${username}" not found.`)
      }

      const cachingCallback = (details: User): void => {
        usersByUsernameCache.set(username, details).catch(console.error)
        callback(details)
      }

      if (isCurrent) {
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

function createUserInDB(
  uid: string,
  { avatar = '', email = '', fullName = '', username = '' }: UserCreatable
): Promise<void> {
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

  return batch.commit().catch(error => {
    console.error(error)
    throw error
  })
}

function updateEmailInDB(uid: string, email: string): Promise<void> {
  if (!email) {
    throw new Error('Invalid email supplied.')
  }

  const { userPrivateRef } = getUserQueries(uid)

  return userPrivateRef
    .update({
      email,
      lastUpdatedAt: FieldValue.serverTimestamp()
    })
    .catch(error => {
      console.error(error)
      throw error
    })
}

async function updateUserInDB(
  uid: string,
  updates: {
    avatar?: string
    deleted?: boolean
    fullName?: string
    username?: string
  }
): Promise<void> {
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

  if (publicUpdates.username) {
    if (!(await isUsernameAvailable(publicUpdates.username))) {
      throw new Error(`The username "${publicUpdates.username}" is already taken.`)
    }

    publicUpdates.usernameLowerCase = publicUpdates.username.toLowerCase()
  }

  const promises: Promise<void>[] = []

  if (Object.keys(publicUpdates).length) {
    promises.push(
      userPublicRef.update({
        ...publicUpdates,
        lastUpdatedAt: FieldValue.serverTimestamp()
      })
    )
  }

  if (Object.keys(privateUpdates).length) {
    promises.push(
      userPrivateRef.update({
        ...privateUpdates,
        lastUpdatedAt: FieldValue.serverTimestamp()
      })
    )
  }

  if (!promises.length) {
    throw new Error(`No valid updates were supplied for user with id "${uid}".`)
  }

  await Promise.all(promises).catch(err => {
    throw err
  })
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
    public: `Post with id "${postId}" does not exist`,
    content: `No content found for post with id "${postId}"`
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

export function getPosts(postIds: string[], maxRetries = 1): Promise<(PostWithId | undefined)[]> {
  const promises = postIds.map(async postId => {
    if (!postId) {
      return undefined
    }

    const { postPublicRef, postContentRef } = getPostQueries(postId)

    const postWithId = await firestore.runTransaction(async transaction => {
      // Retries necessary when grabbing a new post, by current user, with pending writes. Transactions use server data only, no local cache. As such, this transaction is racing against said pending writes.
      for (let i = 0; i <= maxRetries; i++) {
        // eslint-disable-next-line no-await-in-loop
        const postPublicDoc = await transaction.get(postPublicRef)

        if (postPublicDoc.exists) {
          const postPublic = postPublicDoc.data() as PostPublic

          let post: Post = { ...postPublic, attachment: '', message: '' }
          if (!postPublic.deleted) {
            // eslint-disable-next-line no-await-in-loop
            const postContentDoc = await transaction.get(postContentRef)
            const postContent = postContentDoc.data() as PostContent
            post = { ...post, ...postContent }
          }

          return { ...post, id: postId }
        }
      }

      return undefined
    })

    return postWithId
  })

  return Promise.all(promises)
}

export function onPostsUpdated(
  postIds: string[],
  callback: (updatedPost: PostWithId) => void,
  errorCallback?: (error: unknown) => void
): () => void {
  const listeners = postIds.reduce<(() => void)[]>((acc, postId) => {
    if (!postId) {
      return acc
    }

    let post: Post | PostPublic | PostContent | Record<string, never> = {}

    const handleResponse = (response: PostPublic | PostContent) => {
      post = { ...post, ...response }

      if ('owner' in post) {
        if ('message' in post) {
          callback({ ...post, id: postId })
        } else {
          callback({ ...post, message: '', attachment: '', id: postId })
        }
      }
    }

    const handleContentError = () => {
      console.error('Unable to get post content, post possibly deleted.')
    }

    acc.push(
      listenPostDetails(postId, 'public', handleResponse, errorCallback),
      listenPostDetails(postId, 'content', handleResponse, handleContentError)
    )

    return acc
  }, [])

  return () => listeners.forEach(listener => listener())
}

type CreatePostInDBOptions = {
  attachment?: string
  message?: string
  replyTo?: ReplyTo
} & ({ message: string } | { attachment: string })

function createPostInDB(
  uid: string,
  { attachment = '', message = '', replyTo = null }: CreatePostInDBOptions
): Promise<string> {
  const post = postsRef.doc()
  const batch = firestore.batch()

  if (attachment || message) {
    batch.set(post, {
      createdAt: FieldValue.serverTimestamp(),
      deleted: false,
      likesCount: 0,
      owner: uid,
      replyTo,
      replies: []
    })

    batch.set(getPostQueries(post.id).postContentRef, {
      attachment,
      message
    })

    if (replyTo) {
      batch.update(getPostQueries(replyTo.id).postPublicRef, {
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

  return Promise.reject(new Error('A post must have at least an attachment or a message.'))
}

function updatePostInDB(
  post: PostUpdatable & { id: string; owner: string },
  updates: PostUpdatable
): Promise<void> {
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
  const updatedProperties = [...Object.keys(postPublicUpdates), ...Object.keys(postContentUpdates)]

  if (updatedProperties.length) {
    const batch = firebase.firestore().batch()

    if (updatedProperties.length === 1 && updatedProperties[0] === 'deleted') {
      batch.update(postPublicRef, postPublicUpdates)
    } else {
      batch.update(postPublicRef, {
        ...postPublicUpdates,
        updatedAt: FieldValue.serverTimestamp()
      })
      batch.update(postContentRef, postContentUpdates)
    }

    return batch.commit()
  }

  return Promise.reject(new Error(`No valid updates were supplied for post with id "${post.id}".`))
}

function updateFollowInDB(
  type: 'unfollow' | 'follow',
  followerUid: string,
  followedUid: string
): Promise<void> {
  if (!followedUid.length) {
    return Promise.reject(new Error('Invalid user ID supplied.'))
  }

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
    return Promise.reject(new Error('Invalid type supplied.'))
  }

  if (increment) {
    batch.update(userPublicRef, {
      followersCount: FieldValue.increment(increment)
    })
  }

  return batch.commit().catch(error => {
    console.error(error)
    throw error
  })
}

function updateLikeInDB(type: 'unlike' | 'like', likerUid: string, postId: string): Promise<void> {
  if (!postId.length) {
    return Promise.reject(new Error('Invalid post ID supplied.'))
  }

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
    return Promise.reject(new Error('Invalid type supplied.'))
  }

  if (increment) {
    batch.update(postPublicRef, {
      likesCount: FieldValue.increment(increment)
    })
  }

  return batch.commit().catch(error => {
    console.error(error)
    throw error
  })
}

async function uploadFile(path: string, file: File): Promise<string> {
  try {
    let fullPath = path
    if (path.endsWith('/')) {
      const uniqueId = firestore.collection('non-existant').doc().id
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
  const { userPublicRef } = getUserQueries(uid)
  const avatar = await uploadFile(`avatars/${uid}`, imageFile).catch(error => {
    console.error(error)
    throw error
  })

  await userPublicRef.update({ avatar }).catch(error => {
    console.error(error)
    throw error
  })

  return avatar
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

export async function editUser(updates: {
  avatar?: string
  deleted?: boolean
  fullName?: string
  username?: string
}): Promise<void> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return updateUserInDB(currentUser.uid, updates)
}

async function getAttachmentUrl(directory: string, attachment?: File | string | null) {
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
  attachment?: File | string | null
  message?: string
  replyTo?: ReplyTo
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
  attachment?: File | string
  message?: string
}

export async function editPost(
  post: PostUpdatable & { id: string; owner: string },
  { attachment, ...restUpdates }: EditPostOptions = {}
): Promise<void> {
  if (attachment !== undefined) {
    const url = await getAttachmentUrl(post.owner, attachment)

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
      throw new Error('Unable to get posts as currently offline')
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
          const post = fetchedPostsSorted[postIdx]
          const chunk = userChunks[post.chunkIndex]
          chunk.numReturned += 1

          const shouldChunkFetch = !chunk.isDone && chunk.numReturned >= chunk.numFetched - 1
          if (shouldChunkFetch) {
            chunksToFetch = [chunk]
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
            throw new Error('Unable to get posts as currently offline')
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
  uid: string,
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
      .get(uid, count > 0 ? 0 : maxAge, {
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
  uid: string,
  {
    exclude = [] as string[],
    max = 10,
    fractionLatestPosters = 0.5,
    recentlySeenTimePeriod = 10 * 60 * 1000
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
      ...(await getCachedLatestPosters(uid, {
        maxAge: 10 * 60 * 10000,
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
