import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

const {
  REACT_APP_FIREBASE_API_KEY,
  REACT_APP_FIREBASE_PROJECT_ID,
  REACT_APP_FIREBASE_SENDER_ID,
  REACT_APP_FIREBASE_APP_ID
} = process.env

if (
  REACT_APP_FIREBASE_API_KEY === undefined ||
  REACT_APP_FIREBASE_PROJECT_ID === undefined ||
  REACT_APP_FIREBASE_SENDER_ID === undefined ||
  REACT_APP_FIREBASE_APP_ID === undefined
) {
  throw new Error('Missing Firebase environment variables.')
}

const firebaseConfig = {
  apiKey: REACT_APP_FIREBASE_API_KEY,
  authDomain: `${REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: `${REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: REACT_APP_FIREBASE_SENDER_ID,
  appId: REACT_APP_FIREBASE_APP_ID
}

firebase.initializeApp(firebaseConfig)
