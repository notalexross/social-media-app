import firebase from 'firebase/app'
import { isValidSignUpInputs, isValidSignInInputs } from '../utils'

const firestore = firebase.firestore()
const auth = firebase.auth()
const { FieldValue } = firebase.firestore
const usersQuery = firestore.collection('users')

function getUserQueries(uid) {
  const publicQuery = usersQuery.doc(uid)
  const privateQuery = firestore.collection(`users/${uid}/private`).doc('details')
  const followersQuery = firestore.collection(`users/${uid}/followers`)
  const followingQuery = firestore.collection(`users/${uid}/following`).doc('details')
  const likedPostsQuery = firestore.collection(`users/${uid}/likedPosts`).doc('details')

  return { publicQuery, privateQuery, followersQuery, followingQuery, likedPostsQuery }
}

function getPublicDetails(uid) {
  return getUserQueries(uid)
    .publicQuery.get()
    .then(doc => doc.data())
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function getPrivateDetails(uid) {
  return getUserQueries(uid)
    .privateQuery.get()
    .then(doc => doc.data())
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function getFollowing(uid) {
  return getUserQueries(uid)
    .followingQuery.get()
    .then(doc => ({ following: doc.data()?.uids }))
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function getLikedPosts(uid) {
  return getUserQueries(uid)
    .likedPostsQuery.get()
    .then(doc => ({ likedPosts: doc.data()?.postIds }))
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

function listenPublicDetails(uid, callback) {
  return getUserQueries(uid).publicQuery.onSnapshot(snap => {
    callback({ uid, ...snap.data() })
  })
}

function listenPrivateDetails(uid, callback) {
  return getUserQueries(uid).privateQuery.onSnapshot(
    snap => {
      callback({ uid, ...snap.data() })
    },
    error => {
      console.error(error)
      console.error(new Error(error))
    }
  )
}

function listenFollowing(uid, callback) {
  return getUserQueries(uid).followingQuery.onSnapshot(
    snap => {
      callback({ uid, following: snap.data()?.uids })
    },
    error => {
      console.error(error)
      console.error(new Error(error))
    }
  )
}

function listenLikedPosts(uid, callback) {
  return getUserQueries(uid).likedPostsQuery.onSnapshot(
    snap => {
      callback({ uid, likedPosts: snap.data()?.postIds })
    },
    error => {
      console.error(error)
      console.error(new Error(error))
    }
  )
}

async function getUserId(username) {
  const { uid, publicData } = await usersQuery
    .where('deleted', '==', false)
    .where('usernameLowerCase', '==', username.toLowerCase())
    .get()
    .then(snap => ({
      uid: snap.docs[0]?.id,
      publicData: snap.docs[0]?.data()
    }))
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })

  return { uid, publicData }
}

export function getUserById(
  uid,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
) {
  const queries = [getPublicDetails(uid)]

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
  username,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
) {
  const { uid, publicData } = await getUserId(username)

  if (uid === undefined) {
    throw new Error(`User with username "${username}" not found.`)
  }

  const queries = [publicData]

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
  uid,
  callback,
  { includePrivate = false, includeFollowing = false, includeLikedPosts = false } = {}
) {
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

function createUserInDB(uid, { avatar = '', email = '', fullName = '', username = '' } = {}) {
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

  return batch
    .commit()
    .then(() => publicQuery)
    .catch(error => {
      console.error(error)
      throw new Error(error)
    })
}

export function onAuthStateChanged(callback) {
  return firebase.auth().onAuthStateChanged(user => callback(user || {}))
}

export async function signOut() {
  return firebase.auth().signOut()
}

export async function isUsernameAvailable(username = '') {
  return getUserId(username).then(user => user.uid === undefined)
}

export async function signUp({ username, fullName, email, password } = {}) {
  const isValidUsername = username && username.match(/[A-z0-9_]/g).length === username.length

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

  return createUserInDB(user.uid, {
    avatar: user.photoUrl,
    email,
    fullName,
    username
  })
}

export async function signIn({ email, password } = {}) {
  if (!isValidSignInInputs({ email, password })) {
    throw new Error('Invalid data supplied.')
  }

  return firebase.auth().signInWithEmailAndPassword(email, password)
}
