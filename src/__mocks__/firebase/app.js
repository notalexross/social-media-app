/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

const user = {
  uid: 'user1',
  avatar: '',
  createdAt: '',
  deleted: false,
  fullName: 'Forename Surname',
  email: 'email@email.com',
  password: 'password',
  username: 'Username',
  following: ['user3', 'user4'],
  followers: ['user2', 'user3'],
  likedPosts: ['post1', 'post2']
}

const posts = {
  post1: {
    attachment: '',
    createdAt: '',
    deleted: false,
    message: 'mock message',
    owner: 'user1',
    replies: ['post2'],
    replyTo: '',
    likes: ['user1', 'user2']
  },
  post2: {
    attachment: '',
    createdAt: '',
    deleted: false,
    message: 'mock message',
    owner: 'user2',
    replies: [],
    replyTo: 'post1',
    likes: ['user1']
  }
}

const database = {
  users: {
    _docs: {
      [user.uid]: {
        _collections: {
          private: {
            _docs: {
              details: {
                _fields: {
                  fullName: user.fullName,
                  email: user.email
                }
              }
            }
          },
          followers: {
            _docs: {
              ...Object.fromEntries(user.followers.map(followerId => [followerId, {}]))
            }
          },
          following: {
            _docs: {
              details: {
                _fields: {
                  uids: user.following
                }
              }
            }
          },
          likedPosts: {
            _docs: {
              details: {
                _fields: {
                  postIds: user.likedPosts
                }
              }
            }
          }
        },
        _fields: {
          avatar: user.avatar,
          createdAt: user.createdAt,
          deleted: user.deleted,
          followersCount: user.followers.length,
          username: user.username,
          usernameLowerCase: user.username.toLowerCase()
        }
      }
    }
  },
  posts: {
    _docs: {
      ...Object.keys(posts).reduce((acc, postId) => {
        const { likes, ...post } = posts[postId]

        return {
          ...acc,
          [postId]: {
            _collections: {
              likes: {
                _docs: {
                  ...Object.fromEntries(likes.map(likerId => [likerId, {}]))
                }
              }
            },
            _fields: {
              ...post,
              likesCount: likes.length
            }
          }
        }
      }, {})
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

  callback(null)

  return () => firebaseEventTarget.removeEventListener('change', handleChange)
})

const auth = jest.fn(() => ({
  currentUser: { uid: user.uid },
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
}))

let collection

const get = jest.fn(function () {
  let response
  if ('_docs' in this) {
    // collection().get()
    response = {
      docs: Object.entries(this._docs).map(([id, doc]) => ({ id, data: () => doc._fields }))
    }
  } else if ('_fields' in this) {
    // doc().get()
    response = {
      id: this._id,
      data: () => this._fields,
      _collections: this._collections
    }
  } else if ('_id' in this) {
    // doc('unknown doc').get()
    response = {
      id: this._id,
      data: () => []
    }
  } else {
    throw new Error('Missing or insufficient permissions')
  }

  return Promise.resolve(response)
})

const onSnapshotCleanupFunction = jest.fn()

const onSnapshot = jest.fn(function (callback) {
  this.get().then(callback)

  return onSnapshotCleanupFunction
})

const set = jest.fn(() => Promise.resolve())
const update = jest.fn(() => Promise.resolve())

const doc = jest.fn(function (id) {
  return {
    _fields: this._docs[id]?._fields,
    _id: id,
    _collections: this._docs[id]?._collections || {},
    id: id || 'mockId',
    get,
    onSnapshot,
    set,
    update,
    collection
  }
})

const where = jest.fn(function (field, operator, value) {
  const docs = Object.entries(this._docs).filter(([_, entry]) => {
    switch (operator) {
      case '==':
        return entry._fields[field] === value
      default:
        return false
    }
  })

  return {
    _docs: Object.fromEntries(docs),
    where,
    get,
    onSnapshot
  }
})

const add = jest.fn(() => Promise.resolve())

collection = jest.fn(function (path) {
  const parts = path.split('/')
  const [part1, part2, ...restParts] = parts

  if (parts.length % 2 === 0) {
    throw new Error(
      `Invalid collection reference. Collection references must have an odd number of segments, but ${path} has ${parts.length}`
    )
  }

  if (part2) {
    return this.collection(part1).doc(part2).collection(restParts.join('/'))
  }

  return {
    _docs: this._collections[path]?._docs || {},
    where,
    add,
    doc,
    get,
    onSnapshot
  }
})

const batch = jest.fn(() => ({
  _tasks: [],
  set(documentRef, data) {
    return this._tasks.push(() => documentRef.set(data))
  },
  update(documentRef, data) {
    return this._tasks.push(() => documentRef.update(data))
  },
  delete(documentRef) {
    return this._tasks.push(() => documentRef.delete())
  },
  commit() {
    return Promise.all(this._tasks.map(task => task()))
  }
}))

const serverTimestamp = jest.fn(() => 'mock server timestamp')
const arrayUnion = jest.fn()
const arrayRemove = jest.fn()
const increment = jest.fn()

const firestore = jest.fn(() => ({ _collections: database, collection, batch }))

firestore.FieldValue = { serverTimestamp, arrayUnion, arrayRemove, increment }

const put = jest.fn()

const getDownloadURL = jest.fn(() => 'mock download url')

const child = jest.fn(() => ({ put, getDownloadURL }))

const ref = jest.fn(() => ({ child }))

const storage = jest.fn(() => ({ ref }))

const initializeApp = jest.fn()

const firebase = {
  auth,
  firestore,
  storage,
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
  onSnapshotCleanupFunction,
  onSnapshot,
  set,
  update,
  add,
  where,
  doc,
  collection,
  firestore,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  ref,
  child,
  getDownloadURL,
  put,
  storage,
  initializeApp
}

export default firebase
export { mockFunctions }
