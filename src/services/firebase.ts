import firebase from 'firebase/app'
import { isValidSignUpInputs, isValidSignInInputs, sortBy, chunkArray } from '../utils'

type UserPublic = {
  avatar: string | null
  deleted: boolean
  username: string
  usernameLowerCase: string
}

type UserPrivate = {
  email: string
  fullName: string
}

type UserFollowing = { following: string[] }
type UserLikedPosts = { likedPosts: string[] }
type UserCreatable = Partial<Omit<UserPublic & UserPrivate, 'usernameLowerCase' | 'deleted'>>
type UserUpdatable = Partial<Omit<UserPublic & UserPrivate, 'usernameLowerCase'>>
type UserQuery = Promise<UserPublic | UserPrivate | UserFollowing | UserLikedPosts>

export type User = Partial<UserPublic & UserPrivate & UserFollowing & UserLikedPosts> & {
  uid: string
}

type Post = {
  attachment: string
  createdAt: firebase.firestore.Timestamp
  deleted: boolean
  likesCount: number
  message: string
  owner: string
  replies: string[]
  replyTo: string
}

type PostCreatable = Partial<Omit<Post, 'deleted' | 'likesCount' | 'owner' | 'replies'>> & (
  { message: string } | { attachment: string }
)
type PostUpdatable = Partial<Omit<Post, 'likesCount' | 'owner' | 'replies' | 'replyTo'>>

export type PostWithId = Post & { id: string }

export type PostsStatus = {
  posts: PostWithId[] | null
  isComplete: boolean
  currentPage: number
  statistics: Stats
}

type FetchedPost = {
  post: PostWithId
  createdAt: string
  chunkIndex: number
}

type UserChunk = {
  chunkIndex: number
  users: string[]
  lastPostFetched: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null
  numPostsFetched: number
  numPostsReturned: number
  isDone: boolean
}

type Stats = {
  fetchCount: number
  docReadCount: number
  chunks: number
  users: number
}

const firestore = firebase.firestore()
const storage = firebase.storage()
const auth = firebase.auth()
const { FieldValue } = firebase.firestore
const usersQuery = firestore.collection('users')
const postsQuery = firestore.collection('posts')

function getUserQueries(uid: string) {
  const publicQuery = usersQuery.doc(uid)
  const privateQuery = firestore.collection(`users/${uid}/private`).doc('details')
  const followersQuery = firestore.collection(`users/${uid}/followers`)
  const followingQuery = firestore.collection(`users/${uid}/following`).doc('details')
  const likedPostsQuery = firestore.collection(`users/${uid}/likedPosts`).doc('details')

  return { publicQuery, privateQuery, followersQuery, followingQuery, likedPostsQuery }
}

function getPostQueries(postId: string) {
  const postQuery = postsQuery.doc(postId)
  const likesQuery = postQuery.collection('likes')

  return { postQuery, likesQuery }
}

function getPublicDetails(uid: string): Promise<UserPublic> {
  return getUserQueries(uid)
    .publicQuery.get()
    .then(doc => doc.data() as UserPublic)
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function getPrivateDetails(uid: string): Promise<UserPrivate> {
  return getUserQueries(uid)
    .privateQuery.get()
    .then(doc => doc.data() as UserPrivate)
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function getFollowing(uid: string): Promise<UserFollowing> {
  return getUserQueries(uid)
    .followingQuery.get()
    .then(doc => ({ following: doc.data()?.uids as string[] }))
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function getLikedPosts(uid: string): Promise<UserLikedPosts> {
  return getUserQueries(uid)
    .likedPostsQuery.get()
    .then(doc => ({ likedPosts: doc.data()?.postIds as string[] }))
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function listenPublicDetails(
  uid: string,
  callback: (details: { uid: string } & UserPublic) => void
): () => void {
  return getUserQueries(uid).publicQuery.onSnapshot(snap => {
    callback({ uid, ...(snap.data() as UserPublic) })
  })
}

function listenPrivateDetails(
  uid: string,
  callback: (details: { uid: string } & UserPrivate) => void
): () => void {
  return getUserQueries(uid).privateQuery.onSnapshot(
    snap => {
      callback({ uid, ...(snap.data() as UserPrivate) })
    },
    error => {
      console.error(error)
      console.error(new Error(error.message))
    }
  )
}

function listenFollowing(
  uid: string,
  callback: (details: { uid: string } & UserFollowing) => void
): () => void {
  return getUserQueries(uid).followingQuery.onSnapshot(
    snap => {
      callback({ uid, following: snap.data()?.uids as string[] })
    },
    error => {
      console.error(error)
      console.error(new Error(error.message))
    }
  )
}

function listenLikedPosts(
  uid: string,
  callback: (details: { uid: string } & UserLikedPosts) => void
): () => void {
  return getUserQueries(uid).likedPostsQuery.onSnapshot(
    snap => {
      callback({ uid, likedPosts: snap.data()?.postIds as string[] })
    },
    error => {
      console.error(error)
      console.error(new Error(error.message))
    }
  )
}

function getUserId(username: string): Promise<{ uid: string } & UserPublic> {
  return usersQuery
    .where('deleted', '==', false)
    .where('usernameLowerCase', '==', username.toLowerCase())
    .get()
    .then(snap => ({
      uid: snap.docs[0]?.id,
      ...(snap.docs[0]?.data() as UserPublic)
    }))
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

export function getUserById(
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
    uid,
    ...results.reduce((acc, cur) => ({ ...acc, ...cur }), {})
  }))
}

export async function getUserByUsername(
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
    uid,
    ...results.reduce((acc, cur) => ({ ...acc, ...cur }), {})
  }))
}

export function onUserUpdated(
  uid: string,
  callback: (details: User) => void,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
): () => void {
  const listeners = [listenPublicDetails(uid, callback)]

  if (includePrivate) {
    listeners.push(listenPrivateDetails(uid, callback))
  }

  if (includeFollowing) {
    listeners.push(listenFollowing(uid, callback))
  }

  if (includeLikedPosts) {
    listeners.push(listenLikedPosts(uid, callback))
  }

  return () => listeners.forEach(listener => listener())
}

function createUserInDB(
  uid: string,
  { avatar = '', email = '', fullName = '', username = '' }: UserCreatable
): Promise<void> {
  const { publicQuery, privateQuery, followingQuery, likedPostsQuery } = getUserQueries(uid)
  const batch = firestore.batch()

  batch.set(publicQuery, {
    avatar,
    createdAt: FieldValue.serverTimestamp(),
    deleted: false,
    followersCount: 0,
    username,
    usernameLowerCase: username.toLowerCase()
  })

  batch.set(privateQuery, {
    email,
    fullName
  })

  batch.set(followingQuery, {
    uids: []
  })

  batch.set(likedPostsQuery, {
    postIds: []
  })

  return batch.commit().catch(error => {
    console.error(error)
    throw new Error(error)
  })
}

async function updateUserInDB(uid: string, updates: UserUpdatable): Promise<void> {
  const { publicQuery, privateQuery } = getUserQueries(uid)
  const publicKeys = ['avatar', 'deleted', 'username'] as const
  const privateKeys = ['email', 'fullName'] as const

  const publicUpdates: Partial<UserPublic> = publicKeys.reduce(
    (acc, cur) => (cur in updates ? { ...acc, [cur]: updates[cur] } : acc),
    {}
  )

  const privateUpdates: Partial<UserPrivate> = privateKeys.reduce(
    (acc, cur) => (cur in updates ? { ...acc, [cur]: updates[cur] } : acc),
    {}
  )

  if (publicUpdates.username) {
    publicUpdates.usernameLowerCase = publicUpdates.username.toLowerCase()
  }

  const promises: Promise<void>[] = []

  if (Object.keys(publicUpdates).length) {
    promises.push(
      publicQuery.update({
        ...publicUpdates,
        lastUpdatedAt: FieldValue.serverTimestamp()
      })
    )
  }

  if (Object.keys(privateUpdates).length) {
    promises.push(
      privateQuery.update({
        ...privateUpdates,
        lastUpdatedAt: FieldValue.serverTimestamp()
      })
    )
  }

  if (!promises.length) {
    throw new Error(`No valid updates were supplied for user with id "${uid}".`)
  }

  await Promise.all(promises).catch(err => {
    throw new Error(err)
  })
}

function createPostInDB(
  uid: string,
  { attachment = '', message = '', replyTo = '' }: PostCreatable
): Promise<string> {
  const post = postsQuery.doc()
  const batch = firestore.batch()

  if (attachment || message) {
    batch.set(post, {
      attachment,
      createdAt: FieldValue.serverTimestamp(),
      deleted: false,
      likesCount: 0,
      message,
      owner: uid,
      replies: [],
      replyTo
    })

    if (replyTo) {
      const replyToPost = postsQuery.doc(replyTo)
      batch.update(replyToPost, {
        replies: FieldValue.arrayUnion(post.id)
      })
    }

    return batch
      .commit()
      .then(() => post.id)
      .catch(error => {
        console.error(error)
        throw new Error(error)
      })
  }

  return Promise.reject(new Error('A post must have at least an attachment or a message.'))
}

function updatePostInDB(postId: string, updates: PostUpdatable): Promise<void> {
  const { postQuery } = getPostQueries(postId)
  const postKeys = ['attachment', 'deleted', 'message'] as const

  const postUpdates: PostUpdatable = postKeys.reduce(
    (acc, cur) => (cur in updates ? { ...acc, [cur]: updates[cur] } : acc),
    {}
  )

  if (Object.keys(postUpdates).length) {
    return postQuery.update({
      ...postUpdates,
      lastEditedAt: FieldValue.serverTimestamp()
    })
  }

  return Promise.reject(new Error(`No valid updates were supplied for post with id "${postId}".`))
}

export function updateFollowInDB(
  type: 'unfollow' | 'follow',
  followerUid: string,
  followedUid: string
): Promise<void> {
  if (!followedUid.length) {
    return Promise.reject(new Error('Invalid user ID supplied.'))
  }

  const batch = firestore.batch()
  const { followingQuery } = getUserQueries(followerUid)
  const { publicQuery, followersQuery } = getUserQueries(followedUid)

  let increment
  if (type === 'unfollow') {
    increment = -1
    batch.delete(followersQuery.doc(followerUid))
    batch.update(followingQuery, {
      uids: FieldValue.arrayRemove(followedUid)
    })
  } else if (type === 'follow') {
    increment = 1
    batch.set(followersQuery.doc(followerUid), {})
    batch.update(followingQuery, {
      uids: FieldValue.arrayUnion(followedUid)
    })
  } else {
    return Promise.reject(new Error('Invalid type supplied.'))
  }

  if (increment) {
    batch.update(publicQuery, {
      followersCount: FieldValue.increment(increment)
    })
  }

  return batch.commit().catch(error => {
    console.error(error)
    throw new Error(error)
  })
}

export function updateLikeInDB(
  type: 'unlike' | 'like',
  likerUid: string,
  postId: string
): Promise<void> {
  if (!postId.length) {
    return Promise.reject(new Error('Invalid post ID supplied.'))
  }

  const batch = firestore.batch()
  const { postQuery, likesQuery } = getPostQueries(postId)
  const { likedPostsQuery } = getUserQueries(likerUid)

  let increment
  if (type === 'unlike') {
    increment = -1
    batch.delete(likesQuery.doc(likerUid))
    batch.update(likedPostsQuery, {
      postIds: FieldValue.arrayRemove(postId)
    })
  } else if (type === 'like') {
    increment = 1
    batch.set(likesQuery.doc(likerUid), {})
    batch.update(likedPostsQuery, {
      postIds: FieldValue.arrayUnion(postId)
    })
  } else {
    return Promise.reject(new Error('Invalid type supplied.'))
  }

  if (increment) {
    batch.update(postQuery, {
      likesCount: FieldValue.increment(increment)
    })
  }

  return batch.commit().catch(error => {
    console.error(error)
    throw new Error(error)
  })
}

async function uploadFile(path: string, file: File): Promise<string> {
  try {
    const storagePathRef = storage.ref().child(path)

    await storagePathRef.put(file)

    return (await storagePathRef.getDownloadURL()) as string
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
}

export async function updateAvatar(uid: string, imageFile: File): Promise<string> {
  const { publicQuery } = getUserQueries(uid)
  const avatar = await uploadFile(`avatars/${uid}`, imageFile).catch(error => {
    console.error(error)
    throw new Error(error)
  })

  await publicQuery.update({ avatar }).catch(error => {
    console.error(error)
    throw new Error(error)
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

export async function isUsernameAvailable(username = ''): Promise<boolean> {
  return getUserId(username).then(user => user.uid === undefined)
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

export async function editUser(updates: UserUpdatable): Promise<void> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return updateUserInDB(currentUser.uid, updates)
}

export async function addPost({
  message = '',
  attachment = '',
  replyTo = ''
}: PostCreatable): Promise<string> {
  const { currentUser } = auth

  if (!currentUser) {
    throw new Error('No user.')
  }

  return createPostInDB(currentUser.uid, { attachment, message, replyTo })
}

export function editPost(postId: string, updates: PostUpdatable): Promise<void> {
  return updatePostInDB(postId, updates)
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

function initUserChunks(usersArray: string[]): UserChunk[] {
  const chunks = chunkArray(usersArray).map((users, chunkIndex) => ({
    chunkIndex,
    users,
    lastPostFetched: null,
    numPostsFetched: 0,
    numPostsReturned: 0,
    isDone: false
  }))

  return chunks
}

async function fetchPostsAndUpdateUsers(
  chunks: UserChunk[],
  limitPerChunk: number,
  statistics?: Stats
): Promise<FetchedPost[]> {
  const requests: Promise<void>[] = []
  const fetchedPosts: FetchedPost[] = []

  chunks.forEach(chunk => {
    let query = firestore
      .collection('posts')
      .where('deleted', '==', false)
      .where('owner', 'in', chunk.users)
      .orderBy('createdAt', 'desc')
      .limit(limitPerChunk)

    if (chunk.lastPostFetched) {
      query = query.startAfter(chunk.lastPostFetched)
    }

    requests.push(
      query.get().then(({ docs }) => {
        if (statistics) {
          statistics.fetchCount += 1
          statistics.docReadCount += docs.length
        }

        chunk.isDone = docs.length < limitPerChunk
        docs.forEach(doc => {
          const post = { id: doc.id, ...(doc.data() as Post) }
          fetchedPosts.push({
            post,
            createdAt: post.createdAt.valueOf(),
            chunkIndex: chunk.chunkIndex
          })
          chunk.numPostsFetched += 1
          chunk.lastPostFetched = doc
        })
      })
    )
  })

  try {
    await Promise.all(requests)
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }

  return fetchedPosts
}

export function getMultiUserPosts(
  users: string[],
  statusCallback: (status: PostsStatus) => void,
  loadingCallback?: (isLoading: boolean) => void,
  postsPerPage = 10
): () => Promise<void> {
  const userChunks = initUserChunks(users)
  const fetchedPosts: FetchedPost[] = []
  const statistics: Stats = {
    fetchCount: 0,
    docReadCount: 0,
    chunks: userChunks.length,
    users: users.length
  }
  let chunksToFetch = userChunks
  let fetchedPostsSorted: FetchedPost[] = []
  let currentPage = 0
  let currentPostIndex = -1
  let isComplete = false

  const loadNextPage: () => Promise<void> = async () => {
    try {
      if (!isComplete) {
        if (loadingCallback) {
          loadingCallback(true)
        }

        if (users.length === 0) {
          isComplete = true
        }

        currentPage += 1

        while (currentPostIndex + 1 < postsPerPage * currentPage && !isComplete) {
          if (chunksToFetch.length > 0) {
            // eslint-disable-next-line no-await-in-loop
            const newPosts = await fetchPostsAndUpdateUsers(chunksToFetch, postsPerPage, statistics)
            fetchedPosts.push(...newPosts)
            fetchedPostsSorted = sortBy(fetchedPosts, 'createdAt', 'desc')
            chunksToFetch = []
          }

          currentPostIndex += 1

          const currentPost = fetchedPostsSorted[currentPostIndex]
          const currentChunk = userChunks[currentPost.chunkIndex]
          currentChunk.numPostsReturned += 1
          const hasCurrentChunkReturnedAllFetched =
            currentChunk.numPostsReturned === currentChunk.numPostsFetched

          if (hasCurrentChunkReturnedAllFetched && !currentChunk.isDone) {
            chunksToFetch = [currentChunk]
          }

          isComplete = userChunks.every(chunk => {
            const hasFetchedAllPosts = chunk.isDone
            const hasReturnedAllFetched = chunk.numPostsFetched === chunk.numPostsReturned

            return hasFetchedAllPosts && hasReturnedAllFetched
          })
        }

        const posts = fetchedPostsSorted.slice(0, currentPostIndex + 1).map(post => post.post)
        const postsStatus: PostsStatus = { posts, isComplete, currentPage, statistics }

        statusCallback(postsStatus)

        if (loadingCallback) {
          loadingCallback(false)
        }
      }
    } catch (error) {
      console.error(error)
      window.alert(error)
    }
  }

  return loadNextPage
}
