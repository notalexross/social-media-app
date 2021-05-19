import firebase from 'firebase/app'
import { isValidSignUpInputs, isValidSignInInputs } from '../utils'

const firestore = firebase.firestore()
const usersQuery = firestore.collection('users')

function getUserQueries(uid) {
  const publicQuery = usersQuery.doc(uid)
  const privateQuery = firestore.collection(`users/${uid}/private`).doc('details')
  const followersQuery = firestore.collection(`users/${uid}/followers`)
  const followingQuery = firestore.collection(`users/${uid}/following`)

  return { publicQuery, privateQuery, followersQuery, followingQuery }
}

function getPublicDetails(uid) {
  const { publicQuery } = getUserQueries(uid)

  return publicQuery.get().then(doc => doc.data())
}

function getPrivateDetails(uid) {
  const { privateQuery } = getUserQueries(uid)

  return privateQuery.get().then(doc => doc.data())
}

function getFollowers(uid) {
  const { followersQuery } = getUserQueries(uid)

  return followersQuery.get().then(snap => ({ followers: snap.docs.map(doc => doc.id) }))
}

function getFollowing(uid) {
  const { followingQuery } = getUserQueries(uid)

  return followingQuery.get().then(snap => ({ following: snap.docs.map(doc => doc.id) }))
}

function settledQueriesReducer(acc, { value, status, reason }) {
  if (status === 'rejected') {
    console.error(reason)

    return acc
  }

  return { ...acc, ...value }
}

export function getUserById(uid, { includePrivate = false } = {}) {
  const queries = [getPublicDetails(uid), getFollowers(uid), getFollowing(uid)]

  if (includePrivate) {
    queries.push(getPrivateDetails(uid))
  }

  return Promise.allSettled(queries).then(results => ({
    uid,
    ...results.reduce(settledQueriesReducer, {})
  }))
}

export function onUserUpdated(uid, callback, { includePrivate = false } = {}) {
  const { publicQuery, privateQuery, followersQuery, followingQuery } = getUserQueries(uid)

  const listeners = [
    publicQuery.onSnapshot(snap => callback({ uid, ...snap.data() })),
    followersQuery.onSnapshot(snap => callback({ uid, followers: snap.docs.map(doc => doc.id) })),
    followingQuery.onSnapshot(snap => callback({ uid, following: snap.docs.map(doc => doc.id) }))
  ]

  if (includePrivate) {
    listeners.push(privateQuery.onSnapshot(snap => callback({ uid, ...snap.data() })))
  }

  return () => listeners.forEach(listener => listener())
}

export function onAuthStateChanged(callback) {
  return firebase.auth().onAuthStateChanged(user => callback(user || {}))
}

export async function signOut() {
  return firebase.auth().signOut()
}

export async function isUsernameTaken(username = '') {
  const isTaken = await usersQuery
    .where('usernameLowerCase', '==', username.toLowerCase())
    .get()
    .then(snap => snap.docs.length > 0)

  return isTaken
}

export async function signUp({ username, fullName, email, password } = {}) {
  const isValidUsername = username && username.match(/[A-z0-9_]/g).length === username.length

  if (!isValidSignUpInputs({ username, fullName, email, password })) {
    throw new Error('Invalid data supplied.')
  }

  if (!isValidUsername) {
    throw new Error('Username must only be made up of letters, numbers, and underscores.')
  }

  if (await isUsernameTaken(username)) {
    throw new Error(`The username "${username}" is already taken.`)
  }

  return firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(async ({ user }) => {
      const { publicQuery, privateQuery } = getUserQueries(user.uid)
      const avatar = user.photoUrl || null

      publicQuery.set({
        dateCreated: firebase.firestore.FieldValue.serverTimestamp(),
        username,
        usernameLowerCase: username.toLowerCase(),
        avatar
      })

      privateQuery.set({
        fullName,
        email: user.email
      })
    })
}

export async function signIn({ email, password } = {}) {
  if (!isValidSignInInputs({ email, password })) {
    throw new Error('Invalid data supplied.')
  }

  return firebase.auth().signInWithEmailAndPassword(email, password)
}
