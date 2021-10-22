/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

const users = [
  {
    uid: 'user1',
    avatar: '',
    createdAt: { seconds: 0, nanoseconds: 0 },
    lastPostedAt: { seconds: 1, nanoseconds: 0 },
    deleted: false,
    fullName: 'Forename Surname',
    email: 'email@email.com',
    password: 'password',
    username: 'Username',
    following: ['user3', 'user4'],
    followers: ['user2', 'user3'],
    likedPosts: ['post1', 'post2']
  },
  {
    uid: 'user2',
    avatar: '',
    createdAt: { seconds: 1, nanoseconds: 0 },
    lastPostedAt: { seconds: 3, nanoseconds: 0 },
    deleted: false,
    fullName: 'User Two',
    email: 'user2@email.com',
    password: 'password2',
    username: 'Username2',
    following: ['user1'],
    followers: [],
    likedPosts: ['post1']
  },
  {
    uid: 'user3',
    avatar: '',
    createdAt: { seconds: 2, nanoseconds: 0 },
    lastPostedAt: { seconds: 3, nanoseconds: 0 },
    deleted: false,
    fullName: 'User Three',
    email: 'user3@email.com',
    password: 'password3',
    username: 'Username3',
    following: ['user1'],
    followers: ['user1'],
    likedPosts: []
  },
  {
    uid: 'user4',
    avatar: '',
    createdAt: { seconds: 3, nanoseconds: 0 },
    lastPostedAt: { seconds: 4, nanoseconds: 0 },
    deleted: false,
    fullName: 'User Four',
    email: 'user4@email.com',
    password: 'password4',
    username: 'Username4',
    following: [],
    followers: ['user1'],
    likedPosts: []
  }
]

const posts = {
  post1: {
    attachment: '',
    createdAt: { seconds: 1, nanoseconds: 0 },
    deleted: false,
    deletedReplies: [],
    message: 'mock message',
    owner: 'user1',
    replies: ['post2'],
    replyTo: null,
    likes: ['user1', 'user2']
  },
  post2: {
    attachment: '',
    createdAt: { seconds: 2, nanoseconds: 0 },
    deleted: false,
    deletedReplies: [],
    message: 'mock message',
    owner: 'user2',
    replies: [],
    replyTo: {
      id: 'post1',
      owner: 'user1'
    },
    likes: ['user1']
  }
}

const database = {
  users: {
    _docs: new Map(
      users.map(user => [
        user.uid,
        {
          _collections: {
            private: {
              _docs: new Map([
                [
                  'details',
                  {
                    _fields: {
                      fullName: user.fullName,
                      email: user.email
                    }
                  }
                ]
              ])
            },
            followers: {
              _docs: new Map(user.followers.map(followerId => [followerId, {}]))
            },
            following: {
              _docs: new Map([
                [
                  'details',
                  {
                    _fields: {
                      uids: user.following
                    }
                  }
                ]
              ])
            },
            likedPosts: {
              _docs: new Map([
                [
                  'details',
                  {
                    _fields: {
                      postIds: user.likedPosts
                    }
                  }
                ]
              ])
            }
          },
          _fields: {
            avatar: user.avatar,
            createdAt: user.createdAt,
            lastPostedAt: user.lastPostedAt,
            deleted: user.deleted,
            followersCount: user.followers.length,
            username: user.username,
            usernameLowerCase: user.username.toLowerCase()
          }
        }
      ])
    )
  },
  posts: {
    _docs: new Map(
      Object.keys(posts).map(postId => {
        const { likes, attachment, message, ...post } = posts[postId]

        return [
          postId,
          {
            _collections: {
              likes: {
                _docs: new Map(likes.map(likerId => [likerId, {}]))
              },
              content: {
                _docs: new Map([
                  [
                    'details',
                    {
                      _fields: {
                        attachment,
                        message
                      }
                    }
                  ]
                ])
              }
            },
            _fields: {
              ...post,
              likesCount: likes.length
            }
          }
        ]
      })
    )
  }
}

const userCredentials = {
  uid: users[0].uid,
  email: users[0].email,
  password: users[0].password
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

// prettier-ignore
const createUserWithEmailAndPassword = jest.fn(email => Promise.resolve({
  user: {
    uid: 'mock user id',
    email: email.toLowerCase(),
    updateProfile
  }
}))

// prettier-ignore
const signInWithEmailAndPassword = jest.fn(
  (email, password) => new Promise((resolve, reject) => {
    if (email !== userCredentials.email) {
      reject(
        new Error(
          'There is no user record corresponding to this identifier. The user may have been deleted.'
        )
      )
    }

    if (password !== userCredentials.password) {
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

const updateEmail = jest.fn(() => Promise.resolve())
const updatePassword = jest.fn(() => Promise.resolve())

const auth = jest.fn(() => ({
  currentUser: {
    uid: userCredentials.uid,
    email: userCredentials.email,
    updateEmail,
    updatePassword
  },
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
}))

function timestampToMillis(timestamp) {
  return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000)
}

function sortByField(docs, field, direction) {
  let sortedDocs

  if (field.endsWith('At')) {
    sortedDocs = docs.sort((a, b) => {
      if (timestampToMillis(a[1]._fields[field]) < timestampToMillis(b[1]._fields[field])) return -1
      if (timestampToMillis(a[1]._fields[field]) > timestampToMillis(b[1]._fields[field])) return 1

      return 0
    })
  } else {
    sortedDocs = docs.sort((a, b) => {
      if (a[1]._fields[field] < b[1]._fields[field]) return -1
      if (a[1]._fields[field] > b[1]._fields[field]) return 1

      return 0
    })
  }

  if (direction === 'desc') {
    sortedDocs.reverse()
  }

  return sortedDocs
}

const get = jest.fn(function () {
  const metadata = { fromCache: false }

  let response
  if ('_docs' in this) {
    let docs = [...this._docs.entries()]

    if ('_orderBy' in this) {
      docs = sortByField(docs, this._orderBy.field, this._orderBy.direction)
    }

    if ('_startAfter' in this) {
      const indexOfEntry = docs.findIndex(([key]) => key === this._startAfter?.id)
      docs = docs.slice(indexOfEntry + 1)
    }

    response = {
      docs: docs.slice(0, this._limit).map(([id, doc]) => ({
        id,
        data: () => doc._fields
      })),
      metadata,
      exists: true
    }
  } else if ('_fields' in this) {
    response = {
      id: this._id,
      data: () => this._fields,
      metadata,
      exists: true,
      _collections: this._collections
    }
  } else if ('_id' in this) {
    response = {
      id: this._id,
      data: () => [],
      metadata,
      exists: true
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

const startAfter = jest.fn(function (document) {
  return { ...this, _startAfter: document }
})

const limit = jest.fn(function (num) {
  return { ...this, _limit: num }
})

const orderBy = jest.fn(function (field, direction) {
  return { ...this, _orderBy: { field, direction } }
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
    ...this,
    _docs: new Map(docs)
  }
})

const add = jest.fn(() => Promise.resolve())

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
    startAfter,
    where,
    orderBy,
    limit,
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

// prettier-ignore
const runTransaction = jest.fn(updateFunction => (
  updateFunction({
    get(documentRef) {
      return documentRef.get()
    },
    set(documentRef, data) {
      return documentRef.set(data)
    },
    update(documentRef, data) {
      return documentRef.update(data)
    },
    delete(documentRef) {
      return documentRef.delete()
    }
  })
))

const firestore = jest.fn(() => ({ _collections: database, collection, batch, runTransaction }))

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
  updateEmail,
  updatePassword,
  auth,
  get,
  onSnapshotCleanupFunction,
  onSnapshot,
  set,
  update,
  docDelete,
  add,
  startAfter,
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
