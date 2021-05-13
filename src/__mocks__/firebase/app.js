const updateProfile = jest.fn(() => {})
const signInWithEmailAndPassword = jest.fn(() => Promise.resolve())
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

const get = jest.fn(() => Promise.resolve({ docs: [] }))
const set = jest.fn(() => {})
const add = jest.fn(() => Promise.resolve())
const where = jest.fn(() => ({ get }))
const doc = jest.fn(() => ({ set }))
const collection = jest.fn(() => ({ add, where, doc }))
const serverTimestamp = jest.fn(() => 'mock server timestamp')
const firestore = jest.fn(() => ({ collection }))
firestore.FieldValue = { serverTimestamp }

const firebase = {
  auth,
  firestore
}

export default firebase
export const mockFunctions = {
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
  serverTimestamp
}
