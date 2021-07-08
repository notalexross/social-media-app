/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

const user = {
  uid: 'user1',
  avatar: '',
  createdAt: '0',
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
    createdAt: '1',
    deleted: false,
    message: 'mock message',
    owner: 'user1',
    replies: ['post2'],
    replyTo: '',
    likes: ['user1', 'user2']
  },
  post2: {
    attachment: '',
    createdAt: '2',
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
    _docs: new Map([[user.uid, {
      _collections: {
        private: {
          _docs: new Map([['details', {
            _fields: {
              fullName: user.fullName,
              email: user.email
            }
          }]])
        },
        followers: {
          _docs: new Map(user.followers.map(followerId => [followerId, {}]))
        },
        following: {
          _docs: new Map([['details', {
            _fields: {
              uids: user.following
            }
          }]])
        },
        likedPosts: {
          _docs: new Map([['details', {
            _fields: {
              postIds: user.likedPosts
            }
          }]])
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
    }]])
  },
  posts: {
    _docs: new Map(Object.keys(posts).map(postId => {
      const { likes, replies, ...post } = posts[postId]

      return [
        postId,
        {
          _collections: {
            likes: {
              _docs: new Map(likes.map(likerId => [likerId, {}]))
            },
            replies: {
              _docs: new Map([['details', {
                _fields: {
                  postIds: replies
                }
              }]])
            }
          },
          _fields: {
            ...post,
            likesCount: likes.length
          }
        }
      ]
    }))
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

const updateProfile = jest.fn(() => Promise.resolve())

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

  return Promise.resolve()
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

const get = jest.fn(function () {
  let response
  if ('_docs' in this) {
    response = {
      docs: [...this._docs.entries()].map(([id, doc]) => ({ id, data: () => doc._fields }))
    }
  } else if ('_fields' in this) {
    response = {
      id: this._id,
      data: () => this._fields,
      _collections: this._collections
    }
  } else if ('_id' in this) {
    response = {
      id: this._id,
      data: () => []
    }
  } else {
    return Promise.reject(new Error('Missing or insufficient permissions.'))
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
const docDelete = jest.fn(() => Promise.resolve())

let collection

const doc = jest.fn(function (id) {
  return {
    _fields: this._docs.get(id)?._fields,
    _id: id,
    _collections: this._docs.get(id)?._collections || {},
    id: id || 'mockId',
    get,
    onSnapshot,
    set,
    update,
    delete: docDelete,
    collection
  }
})

const limit = jest.fn(function (num) {
  const docs = [...this._docs.entries()].slice(0, num)

  return {
    _docs: new Map(docs),
    get,
    onSnapshot
  }
})

const orderBy = jest.fn(function (field, direction) {
  const docs = [...this._docs.entries()].sort((a, b) => {
    if (a[1][field] < b[1][field]) return -1
    if (a[1][field] > b[1][field]) return 1

    return 0
  })

  if (direction === 'desc') {
    docs.reverse()
  }

  return {
    _docs: new Map(docs),
    limit,
    get,
    onSnapshot
  }
})

const where = jest.fn(function (field, operator, value) {
  const docs = [...this._docs.entries()].filter(([, entry]) => {
    switch (operator) {
      case '==':
        return entry._fields[field] === value
      case 'in':
        return value.includes(entry._fields[field])
      default:
        return false
    }
  })

  return {
    _docs: new Map(docs),
    where,
    orderBy,
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
      `Invalid collection reference. Collection references must have an odd number of segments, but ${path} has ${parts.length}.`
    )
  }

  if (part2) {
    return this.collection(part1).doc(part2).collection(restParts.join('/'))
  }

  return {
    _docs: this._collections[path]?._docs || new Map(),
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
  async commit() {
    await Promise.all(this._tasks.map(task => task()))
  }
}))

const firestore = jest.fn(() => ({ _collections: database, collection, batch }))

const serverTimestamp = jest.fn(() => 'mock server timestamp')
const arrayUnion = jest.fn()
const arrayRemove = jest.fn()
const increment = jest.fn()
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
  docDelete,
  add,
  limit,
  orderBy,
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
