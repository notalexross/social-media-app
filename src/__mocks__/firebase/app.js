const user = {
  uid: '1',
  email: 'email@email.com',
  password: 'password',
  username: 'Username'
}

const collections = {
  users: {
    [user.uid]: {
      email: user.email
    }
  },
  'users-public': {
    [user.uid]: {
      username: user.username,
      usernameLowerCase: user.username.toLowerCase()
    }
  }
}

const updateProfile = jest.fn(() => {})

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

    resolve()
  })
)

const createUserWithEmailAndPassword = jest.fn(email => Promise.resolve({
  user: {
    uid: 'mock user id',
    email: email.toLowerCase(),
    updateProfile
  }
}))

const auth = jest.fn(() => ({
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
}))

// eslint-disable-next-line func-names
const get = jest.fn(function () {
  const response = [...this._docs]
  response.docs = this._docs

  return Promise.resolve(response)
})

const set = jest.fn(() => {})

// eslint-disable-next-line func-names
const where = jest.fn(function (field, operator, value) {
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

const doc = jest.fn(() => ({ set }))

const collection = jest.fn(id => ({
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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
