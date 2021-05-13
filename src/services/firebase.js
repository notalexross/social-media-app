import firebase from 'firebase/app'
import { isValidSignInInputs } from '../utils'

// eslint-disable-next-line import/prefer-default-export
export async function signIn({ email, password } = {}) {
  if (!isValidSignInInputs({ email, password })) {
    throw new Error('Invalid data supplied.')
  }

  return firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
}
