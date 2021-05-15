import firebase from 'firebase/app'
import { isValidSignUpInputs, isValidSignInInputs } from '../utils'

export async function isUsernameTaken(username = '') {
  const isTaken = await firebase
    .firestore()
    .collection('users-public')
    .where('usernameLowerCase', '==', username.toLowerCase())
    .get()
    .then(collection => collection.docs.length > 0)

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
    .then(({ user }) => {
      user.updateProfile({
        displayName: username
      })

      firebase.firestore().collection('users-public').doc(user.uid).set({
        username,
        usernameLowerCase: username.toLowerCase(),
        followers: []
      })

      firebase.firestore().collection('users').doc(user.uid).set({
        dateCreated: firebase.firestore.FieldValue.serverTimestamp(),
        fullName,
        email: user.email,
        following: []
      })
    })
}

export async function signIn({ email, password } = {}) {
  if (!isValidSignInInputs({ email, password })) {
    throw new Error('Invalid data supplied.')
  }

  return firebase.auth().signInWithEmailAndPassword(email, password)
}
