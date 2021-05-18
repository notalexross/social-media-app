const user = {
  uid: '1',
  email: 'email@email.com',
  password: 'password',
  username: 'Username'
}

const collections = {
  users: {
    [user.uid]: {
      email: user.email,
      username: user.username,
      usernameLowerCase: user.username.toLowerCase()
    }
  }
}

const userCredentials = {
  uid: user.uid,
  email: user.email
}

class FirebaseEventTarget extends EventTarget {
  signIn = () => {
    this.dispatchEvent(new CustomEvent('change', { detail: userCredentials }))
  }

  signOut = () => {
    this.dispatchEvent(new CustomEvent('change', { detail: null }))
  }
}

const firebaseEventTarget = new FirebaseEventTarget()

const updateProfile = jest.fn(() => {})

const createUserWithEmailAndPassword = jest.fn(email => Promise.resolve({
  user: {
    uid: 'mock user id',
    email: email.toLowerCase(),
    updateProfile
  }
}))

const signInWithEmailAndPassword = jest.fn(
  (email, password) => new Promise((resolve, reject) => {
    if (email !== user.email) {
      reject(
        new Error(
          'There is no user record corresponding to this identifier. The user may have been deleted.'
        )
      )
    }

    if (password !== user.password) {
      reject(new Error('The password is invalid or the user does not have a password.'))
    }

    firebaseEventTarget.signIn()
    resolve(userCredentials)
  })
)

const signOut = jest.fn(() => {
  firebaseEventTarget.signOut()
})

const handleAuthStateChanged = jest.fn((callback, { detail }) => callback(detail))

const onAuthStateChanged = jest.fn(callback => {
  const handleChange = event => handleAuthStateChanged(callback, event)

  firebaseEventTarget.addEventListener('change', handleChange)

  return () => firebaseEventTarget.removeEventListener('change', handleChange)
})

const auth = jest.fn(() => ({
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
}))

const get = jest.fn(function get() {
  const response = [...this._docs]
  response.docs = this._docs

  return Promise.resolve(response)
})

const set = jest.fn(() => {})

const where = jest.fn(function where(field, operator, value) {
  const matchingEntries = Object.entries(this.data).filter(([_, entry]) => {
    switch (operator) {
      case '==':
        return entry[field] === value
      default:
        return false
    }
  })

  const docs = matchingEntries.map(([id, doc]) => ({
    id,
    data: () => doc
  }))

  return {
    _docs: docs,
    get
  }
})

const add = jest.fn(() => Promise.resolve())

let collection

const doc = jest.fn(() => ({ set, collection }))

collection = jest.fn(id => ({
  data: collections[id],
  where,
  add,
  doc
}))

const serverTimestamp = jest.fn(() => 'mock server timestamp')

const firestore = jest.fn(() => ({ collection }))

firestore.FieldValue = { serverTimestamp }

const initializeApp = jest.fn()

const firebase = {
  auth,
  firestore,
  initializeApp
}

const mockFunctions = {
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  handleAuthStateChanged,
  onAuthStateChanged,
  auth,
  get,
  firestore,
  set,
  add,
  where,
  doc,
  collection,
  serverTimestamp,
  initializeApp
}

export default firebase
export { mockFunctions }
