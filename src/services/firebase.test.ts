import firebase from 'firebase'
import { waitFor } from '@testing-library/react'
// eslint-disable-next-line jest/no-mocks-import
import { mockFunctions } from '../__mocks__/firebase/app'
import type { FetchPostOptions } from './firebase'
import {
  getCachedUserById,
  getCachedUserByUsername,
  onUserByIdUpdated,
  onUserByUsernameUpdated,
  isUsernameAvailable,
  signUp,
  signIn,
  editUser,
  addPost,
  editPost,
  followUser,
  unfollowUser,
  likePost,
  unlikePost,
  getMultiUserPosts,
  getAllUserPosts,
  usersByIdCache,
  getRecentlySeenPosters,
  getLatestPosters,
  latestPostersCache,
  getCachedLatestPosters,
  getSuggestedUsers,
  changeEmail,
  changePassword,
  fetchPost
} from './firebase'

const user = {
  uid: 'user1',
  public: {
    avatar: '',
    createdAt: { seconds: 0, nanoseconds: 0 },
    deleted: false,
    followersCount: 2,
    lastPostedAt: { seconds: 1, nanoseconds: 0 },
    username: 'Username',
    usernameLowerCase: 'username'
  },
  private: {
    email: 'email@email.com',
    fullName: 'Forename Surname'
  },
  following: {
    following: ['user3', 'user4']
  },
  likedPosts: {
    likedPosts: ['post1', 'post2']
  }
}

describe(`${getCachedUserById.name}`, () => {
  test('returns a promise', () => {
    const result = getCachedUserById(user.uid)

    expect(result).toBeInstanceOf(Promise)
  })

  describe('without options', () => {
    test('calls firestore methods', async () => {
      await getCachedUserById(user.uid)

      expect(mockFunctions.get).toHaveBeenCalledTimes(1)
    })

    test('returns correct data', async () => {
      const result = getCachedUserById(user.uid)

      await expect(result).resolves.toEqual({
        uid: user.uid,
        ...user.public
      })
    })
  })

  describe('with private data', () => {
    const options = { includePrivate: true }

    test('calls firestore methods', async () => {
      await getCachedUserById(user.uid, 0, options)

      expect(mockFunctions.get).toHaveBeenCalledTimes(2)
    })

    test('returns correct data', async () => {
      const result = getCachedUserById(user.uid, 0, options)

      await expect(result).resolves.toEqual({
        uid: user.uid,
        ...user.public,
        ...user.private
      })
    })
  })

  describe('with following and likedPosts data', () => {
    const options = { includeFollowing: true, includeLikedPosts: true }

    test('calls firestore methods', async () => {
      await getCachedUserById(user.uid, 0, options)

      expect(mockFunctions.get).toHaveBeenCalledTimes(3)
    })

    test('returns correct data', async () => {
      const result = getCachedUserById(user.uid, 0, options)

      await expect(result).resolves.toEqual({
        uid: user.uid,
        ...user.public,
        ...user.following,
        ...user.likedPosts
      })
    })
  })
})

describe(`${getCachedUserByUsername.name}`, () => {
  test('returns a promise', () => {
    const result = getCachedUserByUsername(user.public.username)

    expect(result).toBeInstanceOf(Promise)
  })

  test('given username does not exist, throws error', async () => {
    const result = getCachedUserByUsername('untakenUsername')

    await expect(result).rejects.toThrowError('User with username "untakenUsername" not found.')
  })

  test('given username exists, returns user data', async () => {
    const result = getCachedUserByUsername(user.public.username)

    await expect(result).resolves.toEqual({
      uid: user.uid,
      ...user.public
    })
  })

  test('given all inclusions, returns all data', async () => {
    const result = getCachedUserByUsername(user.public.username, 0, {
      includePrivate: true,
      includeFollowing: true,
      includeLikedPosts: true
    })

    await expect(result).resolves.toEqual({
      uid: user.uid,
      ...user.public,
      ...user.private,
      ...user.following,
      ...user.likedPosts
    })
  })
})

describe(`${onUserByIdUpdated.name}`, () => {
  test('calls firestore methods', async () => {
    const callback = jest.fn()
    onUserByIdUpdated(user.uid, callback)
    await waitFor(() => expect(callback).toHaveBeenCalled())

    expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
  })

  test('calls callback with correct data', async () => {
    const callback = jest.fn()
    onUserByIdUpdated(user.uid, callback)
    await waitFor(() => expect(callback).toHaveBeenCalled())

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ uid: user.uid, ...user.public })
  })

  test('returns a cleanup function', async () => {
    const callback = jest.fn()
    const result = onUserByIdUpdated(user.uid, callback)
    await waitFor(() => expect(callback).toHaveBeenCalled())
    result()

    expect(typeof result).toBe('function')
    expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
  })

  describe('with private data', () => {
    const options = { includePrivate: true }

    test('calls firestore methods', async () => {
      const callback = jest.fn()
      onUserByIdUpdated(user.uid, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
    })

    test('calls callback with correct data', async () => {
      const callback = jest.fn()
      onUserByIdUpdated(user.uid, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        uid: user.uid,
        ...user.public,
        ...user.private
      })
    })
  })

  describe('with following and likedPosts data', () => {
    const options = { includeFollowing: true, includeLikedPosts: true }

    test('calls firestore methods', async () => {
      const callback = jest.fn()
      onUserByIdUpdated(user.uid, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(3)
    })

    test('calls callback with correct data', async () => {
      const callback = jest.fn()
      onUserByIdUpdated(user.uid, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        uid: user.uid,
        ...user.public,
        ...user.following,
        ...user.likedPosts
      })
    })
  })
})

describe(`${onUserByUsernameUpdated.name}`, () => {
  test('calls firestore methods', async () => {
    const callback = jest.fn()
    onUserByUsernameUpdated(user.public.username, callback)
    await waitFor(() => expect(callback).toHaveBeenCalled())

    expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
  })

  test('calls callback with correct data', async () => {
    const callback = jest.fn()
    onUserByUsernameUpdated(user.public.username, callback)
    await waitFor(() => expect(callback).toHaveBeenCalled())

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ uid: user.uid, ...user.public })
  })

  test('returns a cleanup function', async () => {
    const callback = jest.fn()
    const result = onUserByUsernameUpdated(user.public.username, callback)
    await waitFor(() => expect(callback).toHaveBeenCalled())

    result()

    expect(typeof result).toBe('function')
    expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
  })

  describe('with private data', () => {
    const options = { includePrivate: true }

    test('calls firestore methods', async () => {
      const callback = jest.fn()
      onUserByUsernameUpdated(user.public.username, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
    })

    test('calls callback with correct data', async () => {
      const callback = jest.fn()
      onUserByUsernameUpdated(user.public.username, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        uid: user.uid,
        ...user.public,
        ...user.private
      })
    })
  })

  describe('with following and likedPosts data', () => {
    const options = { includeFollowing: true, includeLikedPosts: true }

    test('calls firestore methods', async () => {
      const callback = jest.fn()
      onUserByUsernameUpdated(user.public.username, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(3)
    })

    test('calls callback with correct data', async () => {
      const callback = jest.fn()
      onUserByUsernameUpdated(user.public.username, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        uid: user.uid,
        ...user.public,
        ...user.following,
        ...user.likedPosts
      })
    })
  })
})

describe(`${isUsernameAvailable.name}`, () => {
  test('given no arguments, returns true', async () => {
    const result = await isUsernameAvailable()

    expect(result).toBe(true)
  })

  test('given valid arguments, calls firebase methods', async () => {
    await isUsernameAvailable('username')

    expect(mockFunctions.where).toHaveBeenCalledTimes(2)
    expect(mockFunctions.get).toHaveBeenCalledTimes(1)
  })

  test('given username is not taken, returns true', async () => {
    const result = await isUsernameAvailable('untakenUsername')

    expect(result).toBe(true)
  })

  test('given username is taken, returns false', async () => {
    const result = await isUsernameAvailable('username')

    expect(result).toBe(false)
  })
})

describe(`${signUp.name}`, () => {
  test('given invalid email, throws error', async () => {
    const options = {
      fullName: 'forename surname',
      username: 'user name',
      email: 'email@',
      password: 'password'
    }

    const result = signUp(options)

    await expect(result).rejects.toThrowError('Invalid data supplied.')
  })

  test('given invalid username, throws error', async () => {
    const options = {
      fullName: 'forename surname',
      username: 'user name',
      email: 'email@email.com',
      password: 'password'
    }

    await expect(() => signUp(options)).rejects.toThrowError(
      'Username must only be made up of letters, numbers, and underscores.'
    )
  })

  test('given username taken, throws error', async () => {
    const options = {
      fullName: 'forename surname',
      username: 'username',
      email: 'email@email.com',
      password: 'password'
    }

    await expect(() => signUp(options)).rejects.toThrowError(
      'The username "username" is already taken.'
    )
  })

  describe('with valid arguments', () => {
    const options = {
      fullName: 'forename surname',
      username: 'untakenUsername',
      email: 'email@email.com',
      password: 'password'
    }

    test('resolves', async () => {
      const result = signUp(options)

      await expect(result).resolves.not.toThrow()
    })

    test('calls firebase methods', async () => {
      await signUp(options)

      expect(mockFunctions.where).toHaveBeenCalledTimes(2)
      expect(mockFunctions.get).toHaveBeenCalledTimes(1)
      expect(mockFunctions.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1)
      expect(mockFunctions.set).toHaveBeenCalledTimes(4)
      expect(mockFunctions.serverTimestamp).toHaveBeenCalledTimes(1)
    })
  })
})

describe(`${signIn.name}`, () => {
  test('given invalid email, throws error', async () => {
    const options = {
      email: 'email@',
      password: 'password'
    }

    const result = signIn(options)

    await expect(result).rejects.toThrowError('Invalid data supplied.')
  })

  test('given incorrect email, throws error', async () => {
    const options = {
      email: 'wrongemail@email.com',
      password: 'password'
    }

    const result = signIn(options)

    await expect(result).rejects.toThrowError(
      'There is no user record corresponding to this identifier. The user may have been deleted.'
    )
  })

  test('given incorrect password, throws error', async () => {
    const options = {
      email: 'email@email.com',
      password: 'wrongpassword'
    }

    const result = signIn(options)

    await expect(result).rejects.toThrowError(
      'The password is invalid or the user does not have a password.'
    )
  })

  describe('with correct credentials', () => {
    const options = {
      email: 'email@email.com',
      password: 'password'
    }

    test('resolves', async () => {
      const result = signIn(options)

      await expect(result).resolves.not.toThrow()
    })

    test('calls firebase methods', async () => {
      await signIn(options)

      expect(mockFunctions.signInWithEmailAndPassword).toHaveBeenCalledTimes(1)
    })
  })
})

describe(`${editUser.name}`, () => {
  test('returns a promise', () => {
    const result = editUser({ username: 'NewUsername' })

    expect(result).toBeInstanceOf(Promise)
  })

  test('given no updates supplied, throws error', async () => {
    const result = editUser({})

    await expect(result).rejects.toThrowError(
      'No valid updates were supplied for user with id "user1".'
    )
  })

  test('given public details updated, calls firestore update method once', async () => {
    await editUser({ username: 'NewUsername' })

    expect(mockFunctions.update).toHaveBeenCalledTimes(1)
    expect(mockFunctions.serverTimestamp).toHaveBeenCalledTimes(1)
  })

  test('given private details updated, calls firestore update method once', async () => {
    await editUser({ fullName: 'NewForename NewSurname' })

    expect(mockFunctions.update).toHaveBeenCalledTimes(1)
    expect(mockFunctions.serverTimestamp).toHaveBeenCalledTimes(1)
  })

  test('given mixed details updated, calls firestore update method twice', async () => {
    await editUser({ username: 'NewUsername', fullName: 'NewForename NewSurname' })

    expect(mockFunctions.update).toHaveBeenCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toHaveBeenCalledTimes(2)
  })
})

describe(`${addPost.name}`, () => {
  test('returns a promise', () => {
    const result = addPost({ message: 'message' })

    expect(result).toBeInstanceOf(Promise)
  })

  test('given post has no content, throws error', async () => {
    const result = addPost({ message: '' })

    await expect(result).rejects.toThrowError(
      'A post must have at least an attachment or a message.'
    )
  })

  test('given post has content, resolves and calls firebase methods', async () => {
    const result = addPost({ message: 'message' })

    await expect(result).resolves.toBe('mockId')
    expect(mockFunctions.set).toHaveBeenCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toHaveBeenCalledTimes(2)
    expect(mockFunctions.update).toHaveBeenCalledTimes(1)
  })

  test('given post has content and is a reply, resolves and calls firebase methods', async () => {
    const result = addPost({ message: 'message', replyTo: 'post1' })

    await expect(result).resolves.toBe('mockId')
    expect(mockFunctions.set).toHaveBeenCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toHaveBeenCalledTimes(2)
    expect(mockFunctions.update).toHaveBeenCalledTimes(2)
    expect(mockFunctions.arrayUnion).toHaveBeenCalledTimes(1)
  })

  test('given post has an attachment, resolves and calls firebase methods', async () => {
    const file = new File(['attachment'], 'attachment.png', { type: 'image/png' })

    const result = addPost({ attachment: file })

    await expect(result).resolves.toBe('mockId')
    expect(mockFunctions.put).toHaveBeenCalledTimes(1)
    expect(mockFunctions.getDownloadURL).toHaveBeenCalledTimes(1)
  })
})

describe(`${editPost.name}`, () => {
  test('returns a promise', () => {
    const result = editPost(
      { id: 'post1', owner: 'user1', deleted: false, message: '', attachment: '' },
      { message: 'new message' }
    )

    expect(result).toBeInstanceOf(Promise)
  })

  test('given no updates, throws error', async () => {
    const result = editPost(
      { id: 'post1', owner: 'user1', deleted: false, message: '', attachment: '' },
      {}
    )

    await expect(result).rejects.toThrowError(
      'No valid updates were supplied for post with id "post1".'
    )
  })

  test('given updates, resolves and calls firebase methods', async () => {
    const result = editPost(
      { id: 'post1', owner: 'user1', deleted: false, message: '', attachment: '' },
      { message: 'new message' }
    )

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.update).toHaveBeenCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toHaveBeenCalledTimes(1)
  })
})

describe(`${followUser.name}`, () => {
  test('returns a promise', () => {
    const uid = 'user2'

    const result = followUser(uid)

    expect(result).toBeInstanceOf(Promise)
  })

  test('given no uid, throws error', async () => {
    const result = followUser('')

    await expect(result).rejects.toThrowError('Invalid user ID supplied.')
  })

  test('given uid, resolves and calls firebase methods', async () => {
    const uid = 'user2'

    const result = followUser(uid)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.increment).toHaveBeenCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(1)
    expect(mockFunctions.update).toHaveBeenCalledTimes(2)
    expect(mockFunctions.arrayUnion).toHaveBeenCalledTimes(1)
    expect(mockFunctions.arrayUnion).toBeCalledWith(uid)
    expect(mockFunctions.set).toHaveBeenCalledTimes(1)
  })
})

describe(`${unfollowUser.name}`, () => {
  test('returns a promise', () => {
    const uid = 'user2'

    const result = unfollowUser(uid)

    expect(result).toBeInstanceOf(Promise)
  })

  test('given no uid, throws error', async () => {
    const result = unfollowUser('')

    await expect(result).rejects.toThrowError('Invalid user ID supplied.')
  })

  test('given uid, resolves and calls firebase methods', async () => {
    const uid = 'user2'

    const result = unfollowUser(uid)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.increment).toHaveBeenCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(-1)
    expect(mockFunctions.update).toHaveBeenCalledTimes(2)
    expect(mockFunctions.arrayRemove).toHaveBeenCalledTimes(1)
    expect(mockFunctions.arrayRemove).toBeCalledWith(uid)
    expect(mockFunctions.docDelete).toHaveBeenCalledTimes(1)
  })
})

describe(`${likePost.name}`, () => {
  test('returns a promise', () => {
    const postId = 'post3'

    const result = likePost(postId)

    expect(result).toBeInstanceOf(Promise)
  })

  test('given no postId, throws error', async () => {
    const result = likePost('')

    await expect(result).rejects.toThrowError('Invalid post ID supplied.')
  })

  test('given postId, resolves and calls firebase methods', async () => {
    const postId = 'post3'

    const result = likePost(postId)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.increment).toHaveBeenCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(1)
    expect(mockFunctions.update).toHaveBeenCalledTimes(2)
    expect(mockFunctions.arrayUnion).toHaveBeenCalledTimes(1)
    expect(mockFunctions.arrayUnion).toBeCalledWith(postId)
    expect(mockFunctions.set).toHaveBeenCalledTimes(1)
  })
})

describe(`${unlikePost.name}`, () => {
  test('returns a promise', () => {
    const postId = 'post3'

    const result = unlikePost(postId)

    expect(result).toBeInstanceOf(Promise)
  })

  test('given no postId, throws error', async () => {
    const result = unlikePost('')

    await expect(result).rejects.toThrowError('Invalid post ID supplied.')
  })

  test('given postId, resolves and calls firebase methods', async () => {
    const postId = 'post3'

    const result = unlikePost(postId)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.increment).toHaveBeenCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(-1)
    expect(mockFunctions.update).toHaveBeenCalledTimes(2)
    expect(mockFunctions.arrayRemove).toHaveBeenCalledTimes(1)
    expect(mockFunctions.arrayRemove).toBeCalledWith(postId)
    expect(mockFunctions.docDelete).toHaveBeenCalledTimes(1)
  })
})

describe(`${getMultiUserPosts.name}`, () => {
  const statusCallback = jest.fn()
  const loadingCallback = jest.fn()

  test('calls firebase methods', async () => {
    const users = ['user1', 'user2']

    const loadNextPage = getMultiUserPosts(users, statusCallback, { loadingCallback })

    await loadNextPage()

    expect(mockFunctions.orderBy).toHaveBeenCalledTimes(1)
    expect(mockFunctions.limit).toHaveBeenCalledTimes(1)
    expect(mockFunctions.get).toHaveBeenCalledTimes(1)
  })

  test('calls callbacks with correct data', async () => {
    const users = ['user1', 'user2']

    const loadNextPage = getMultiUserPosts(users, statusCallback, { loadingCallback })

    await loadNextPage()

    expect(loadingCallback).toHaveBeenCalledTimes(2)
    expect(loadingCallback).toHaveBeenCalledWith(true)
    expect(loadingCallback).toHaveBeenCalledWith(false)
    expect(statusCallback).toHaveBeenCalledTimes(1)
    expect(statusCallback).toHaveBeenCalledWith({
      posts: [
        {
          createdAt: { seconds: 2, nanoseconds: 0 },
          deleted: false,
          deletedReplies: [],
          id: 'post2',
          likesCount: 1,
          owner: 'user2',
          replies: [],
          replyTo: 'post1'
        },
        {
          createdAt: { seconds: 1, nanoseconds: 0 },
          deleted: false,
          deletedReplies: [],
          id: 'post1',
          likesCount: 2,
          owner: 'user1',
          replies: ['post2'],
          replyTo: null
        }
      ],
      isComplete: true,
      page: 1,
      stats: { fetchCount: 1, docsFetchedCount: 2, docReadCount: 2, chunks: 1, users: 2 }
    })
  })

  test('given multiple pages, calls callbacks with correct data', async () => {
    const users = ['user1', 'user2']

    const loadNextPage = getMultiUserPosts(users, statusCallback, {
      loadingCallback,
      postsPerPage: 1
    })

    await loadNextPage()

    expect(loadingCallback).toHaveBeenCalledTimes(2)
    expect(loadingCallback).toHaveBeenCalledWith(true)
    expect(loadingCallback).toHaveBeenCalledWith(false)
    expect(statusCallback).toHaveBeenCalledTimes(1)
    expect(statusCallback).toHaveBeenCalledWith({
      posts: [
        {
          createdAt: { seconds: 2, nanoseconds: 0 },
          deleted: false,
          deletedReplies: [],
          id: 'post2',
          likesCount: 1,
          owner: 'user2',
          replies: [],
          replyTo: 'post1'
        }
      ],
      isComplete: false,
      page: 1,
      stats: { fetchCount: 1, docsFetchedCount: 2, docReadCount: 2, chunks: 1, users: 2 }
    })
  })

  test('given no users supplied, callback argument includes empty posts array', async () => {
    const loadNextPage = getMultiUserPosts([], statusCallback, { loadingCallback })

    await loadNextPage()

    expect(loadingCallback).toHaveBeenCalledTimes(2)
    expect(loadingCallback).toHaveBeenCalledWith(true)
    expect(loadingCallback).toHaveBeenCalledWith(false)
    expect(statusCallback).toHaveBeenCalledTimes(1)
    expect(statusCallback).toHaveBeenCalledWith({
      posts: [],
      isComplete: true,
      page: 1,
      stats: { fetchCount: 0, docsFetchedCount: 0, docReadCount: 0, chunks: 0, users: 0 }
    })
  })
})

describe(`${getAllUserPosts.name}`, () => {
  const statusCallback = jest.fn()
  const loadingCallback = jest.fn()

  test('calls firebase methods', async () => {
    const loadNextPage = getAllUserPosts(statusCallback, { loadingCallback })

    await loadNextPage()

    expect(mockFunctions.orderBy).toHaveBeenCalledTimes(1)
    expect(mockFunctions.limit).toHaveBeenCalledTimes(1)
    expect(mockFunctions.get).toHaveBeenCalledTimes(1)
  })

  test('calls callbacks with correct data', async () => {
    const loadNextPage = getAllUserPosts(statusCallback, { loadingCallback })

    await loadNextPage()

    expect(loadingCallback).toHaveBeenCalledTimes(2)
    expect(loadingCallback).toHaveBeenCalledWith(true)
    expect(loadingCallback).toHaveBeenCalledWith(false)
    expect(statusCallback).toHaveBeenCalledTimes(1)
    expect(statusCallback).toHaveBeenCalledWith({
      posts: [expect.objectContaining({ id: 'post2' }), expect.objectContaining({ id: 'post1' })],
      isComplete: true,
      page: 1
    })
  })

  test('given multiple pages, calls callbacks with correct data', async () => {
    const loadNextPage = getAllUserPosts(statusCallback, { loadingCallback, postsPerPage: 1 })

    await loadNextPage()

    expect(loadingCallback).toHaveBeenCalledTimes(2)
    expect(loadingCallback).toHaveBeenCalledWith(true)
    expect(loadingCallback).toHaveBeenCalledWith(false)
    expect(statusCallback).toHaveBeenCalledTimes(1)
    expect(statusCallback).toHaveBeenCalledWith({
      posts: [expect.objectContaining({ id: 'post2' })],
      isComplete: false,
      page: 1
    })
  })
})

describe(`${getRecentlySeenPosters.name}`, () => {
  test('returns a promise', () => {
    const result = getRecentlySeenPosters()

    expect(result).toBeInstanceOf(Promise)
  })

  test('given no cached users, returns an empty array', async () => {
    const result = getRecentlySeenPosters()

    await expect(result).resolves.toEqual([])
  })

  describe('with cached users', () => {
    let DateNowOriginal: typeof Date.now

    beforeAll(() => {
      DateNowOriginal = Date.now
      Date.now = () => Date.parse('2021-07-31T16:00:00.000Z')
    })

    beforeEach(async () => {
      await Promise.all(
        ['user3', 'user2', 'user1'].map((uid, idx) => {
          const lastPostedAt = firebase.firestore.Timestamp.fromMillis(Date.now() - idx * 100)

          return usersByIdCache.set(uid, { uid, lastPostedAt })
        })
      )
    })

    afterAll(() => {
      Date.now = DateNowOriginal
    })

    test('returns up to num cached users ordered by lastPostedAt', async () => {
      const result = getRecentlySeenPosters({ num: 2 })

      await expect(result).resolves.toEqual([
        expect.objectContaining({ uid: 'user3' }),
        expect.objectContaining({ uid: 'user2' })
      ])
    })

    test('returns users excluding those specified', async () => {
      const result = getRecentlySeenPosters({ exclude: ['user2'] })

      await expect(result).resolves.toEqual([
        expect.objectContaining({ uid: 'user3' }),
        expect.objectContaining({ uid: 'user1' })
      ])
    })

    test('returns users last seen in the past timePeriod milliseconds', async () => {
      const result = getRecentlySeenPosters({ num: 1, timePeriod: 0 })

      await expect(result).resolves.toEqual([expect.objectContaining({ uid: 'user3' })])
    })
  })
})

describe(`${getLatestPosters.name}`, () => {
  test('returns a promise', () => {
    const result = getLatestPosters()

    expect(result).toBeInstanceOf(Promise)
  })

  test('given more users available for getting, returns exhaused = false', async () => {
    const result = getLatestPosters({ minUnexcluded: 2 })

    await expect(result).resolves.toMatchObject({ exhausted: false })
  })

  test('given exhausted all users, returns exhaused = true', async () => {
    const result = getLatestPosters({ minUnexcluded: 10 })

    await expect(result).resolves.toMatchObject({ exhausted: true })
  })

  test('returns at least minUnexcluded users ordered by lastPostedAt', async () => {
    const result = getLatestPosters({ minUnexcluded: 2 })

    await expect(result).resolves.toMatchObject({
      users: expect.arrayContaining([
        expect.objectContaining({ uid: 'user4' }),
        expect.objectContaining({ uid: 'user3' })
      ]) as unknown
    })
  })

  test('returns users including those passed to exclude', async () => {
    const result = getLatestPosters({ minUnexcluded: 2, exclude: ['user4'] })

    await expect(result).resolves.toMatchObject({
      users: expect.arrayContaining([
        expect.objectContaining({ uid: 'user4' }),
        expect.objectContaining({ uid: 'user3' }),
        expect.objectContaining({ uid: 'user2' })
      ]) as unknown
    })
  })

  test('calls firebase methods', async () => {
    await getLatestPosters({ maxRequests: 1 })

    expect(mockFunctions.get).toHaveBeenCalledTimes(1)
  })
})

describe(`${getCachedLatestPosters.name}`, () => {
  test('returns a promise', () => {
    const result = getCachedLatestPosters(user.uid)

    expect(result).toBeInstanceOf(Promise)
  })

  test('returns up to num users ordered by lastPostedAt', async () => {
    const result = getCachedLatestPosters('user1', { num: 2 })

    await expect(result).resolves.toEqual([
      expect.objectContaining({ uid: 'user4' }),
      expect.objectContaining({ uid: 'user3' })
    ])
  })

  test('returns users excluding those specified', async () => {
    const result = getCachedLatestPosters('user1', { exclude: ['user1', 'user3'] })

    await expect(result).resolves.toEqual([
      expect.objectContaining({ uid: 'user4' }),
      expect.objectContaining({ uid: 'user2' })
    ])
  })

  test('given no cached users, calls firebase methods', async () => {
    await getCachedLatestPosters('user1', { maxAge: 1, num: 1 })

    expect(mockFunctions.get).toHaveBeenCalledTimes(1)
  })

  describe('with cached users', () => {
    let DateNowOriginal: typeof Date.now

    beforeAll(() => {
      DateNowOriginal = Date.now
      Date.now = () => Date.parse('2021-07-31T16:00:00.000Z')
    })

    beforeEach(async () => {
      const exhausted = false
      const users = ['user5', 'user6', 'user7'].map(uid => ({ uid }))

      return latestPostersCache.set('user1', { exhausted, users })
    })

    afterAll(() => {
      Date.now = DateNowOriginal
    })

    test('given enough cached users, does not call firebase methods', async () => {
      await getCachedLatestPosters('user1', { maxAge: 1, num: 1 })

      expect(mockFunctions.get).toHaveBeenCalledTimes(0)
    })

    test('given enough cached users, returns recently cached users', async () => {
      const result = getCachedLatestPosters('user1', { maxAge: 1, num: 3 })

      await expect(result).resolves.toEqual([
        expect.objectContaining({ uid: 'user5' }),
        expect.objectContaining({ uid: 'user6' }),
        expect.objectContaining({ uid: 'user7' })
      ])
      expect(mockFunctions.get).toHaveBeenCalledTimes(0)
    })

    test('given not enough cached users and users not exhausted, gets latest posters from firebase', async () => {
      const result = getCachedLatestPosters('user1', { maxAge: 1, num: 4 })

      await expect(result).resolves.toEqual([
        expect.objectContaining({ uid: 'user4' }),
        expect.objectContaining({ uid: 'user3' }),
        expect.objectContaining({ uid: 'user2' }),
        expect.objectContaining({ uid: 'user1' })
      ])
    })
  })
})

describe(`${getSuggestedUsers.name}`, () => {
  test('returns max users ordered by lastPostedAt', async () => {
    const result = getSuggestedUsers('user1', { max: 2 })

    await expect(result).resolves.toEqual([
      expect.objectContaining({ uid: 'user4' }),
      expect.objectContaining({ uid: 'user3' })
    ])
  })

  test('returns users excluding those specified', async () => {
    const result = getSuggestedUsers('user1', { max: 2, exclude: ['user3'] })

    await expect(result).resolves.toEqual([
      expect.objectContaining({ uid: 'user4' }),
      expect.objectContaining({ uid: 'user2' })
    ])
  })
})

describe(`${changeEmail.name}`, () => {
  const password = 'password'

  test('updates email in authentication system', async () => {
    const newEmail = 'newemail@email.com'

    const result = changeEmail(newEmail, password)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.updateEmail).toHaveBeenCalledTimes(1)
    expect(mockFunctions.updateEmail).toBeCalledWith(newEmail)
  })

  test('updates email in database', async () => {
    const newEmail = 'newemail@email.com'

    const result = changeEmail(newEmail, password)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.update).toHaveBeenCalledTimes(1)
    expect(mockFunctions.update).toBeCalledWith(expect.objectContaining({ email: newEmail }))
  })

  test('given invalid email, throws error', async () => {
    const newEmail = 'email@'

    const result = changeEmail(newEmail, password)

    await expect(result).rejects.toThrowError('The email address is badly formatted.')
  })
})

describe(`${changePassword.name}`, () => {
  const email = 'email@email.com'
  const password = 'password'

  test('updates password in authentication system', async () => {
    const newPassword = 'newpassword'

    const result = changePassword(newPassword, password)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.updatePassword).toHaveBeenCalledTimes(1)
    expect(mockFunctions.updatePassword).toBeCalledWith(newPassword)
  })

  test('signs user in again', async () => {
    const newPassword = 'newpassword'

    const result = changePassword(newPassword, password)

    await expect(result).resolves.toBeUndefined()
    expect(mockFunctions.signInWithEmailAndPassword).toHaveBeenCalledTimes(1)
    expect(mockFunctions.signInWithEmailAndPassword).toBeCalledWith(email, password)
  })
})

describe(`${fetchPost.name}`, () => {
  const user1 = {
    avatar: '',
    createdAt: { nanoseconds: 0, seconds: 0 } as firebase.firestore.Timestamp,
    deleted: false,
    followersCount: 2,
    lastPostedAt: { nanoseconds: 0, seconds: 1 } as firebase.firestore.Timestamp,
    uid: 'user1',
    username: 'Username',
    usernameLowerCase: 'username'
  }

  const user2 = {
    avatar: '',
    createdAt: { seconds: 1, nanoseconds: 0 } as firebase.firestore.Timestamp,
    deleted: false,
    followersCount: 0,
    lastPostedAt: { seconds: 3, nanoseconds: 0 } as firebase.firestore.Timestamp,
    uid: 'user2',
    username: 'Username2',
    usernameLowerCase: 'username2'
  }

  const post = {
    id: 'post1',
    public: {
      createdAt: { seconds: 1, nanoseconds: 0 } as firebase.firestore.Timestamp,
      deleted: false,
      deletedReplies: [],
      likesCount: 2,
      owner: 'user1',
      replies: ['post2'],
      replyTo: null
    },
    content: {
      attachment: '',
      message: 'mock message',
      owner: 'user1'
    },
    ownerDetails: user1
  }

  const reply = {
    id: 'post2',
    public: {
      createdAt: { seconds: 2, nanoseconds: 0 } as firebase.firestore.Timestamp,
      deleted: false,
      deletedReplies: [],
      likesCount: 1,
      owner: 'user2',
      replies: [],
      replyTo: 'post1'
    },
    content: {
      attachment: '',
      message: 'mock message',
      owner: 'user2'
    },
    ownerDetails: user2
  }

  const nullOwnerPost = {
    id: 'post3',
    public: {
      createdAt: { seconds: 3, nanoseconds: 0 } as firebase.firestore.Timestamp,
      deleted: true,
      deletedReplies: ['post4'],
      likesCount: 0,
      owner: null,
      replies: ['post4'],
      replyTo: null
    },
    content: {
      attachment: '',
      message: 'mock message',
      owner: 'user3'
    }
  }

  const replyToNullOwnerPost = {
    id: 'post4',
    public: {
      createdAt: { seconds: 4, nanoseconds: 0 } as firebase.firestore.Timestamp,
      deleted: true,
      deletedReplies: [],
      likesCount: 0,
      owner: null,
      replies: [],
      replyTo: 'post3'
    },
    content: {
      attachment: '',
      message: 'mock message',
      owner: 'user1'
    }
  }

  test('returns a cleanup function', () => {
    const callback = jest.fn()

    const result = fetchPost(post.id, callback)

    expect(typeof result).toBe('function')
  })

  test('on error, calls errorCallback', async () => {
    const callback = jest.fn()
    const errorCallback = jest.fn()
    const error = new Error('Post with id "nonExistentId" does not exist')
    const options: FetchPostOptions = {
      existingPost: { id: post.id },
      fetchPublic: 'subscribe',
      fetchContent: 'none',
      fetchReplyTo: 'none',
      errorCallback
    }

    fetchPost('nonExistentId', callback, options)

    await waitFor(() => expect(errorCallback).toHaveBeenCalledWith(error))
  })

  describe('with all fetch options "none"', () => {
    const options: FetchPostOptions = {
      existingPost: { id: post.id },
      fetchPublic: 'none',
      fetchContent: 'none',
      fetchReplyTo: 'none'
    }

    test('callback is called with copy of existing post', async () => {
      const callback = jest.fn()

      fetchPost(post.id, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(callback).toHaveBeenNthCalledWith(1, { id: post.id })
    })

    test('no firebase methods called', async () => {
      const callback = jest.fn()

      fetchPost(post.id, callback, options)
      await waitFor(() => expect(callback).toHaveBeenCalled())

      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(0)
      expect(mockFunctions.get).toHaveBeenCalledTimes(0)
      expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
    })
  })

  describe('without an existing post', () => {
    describe('with fetchPublic option: "get"', () => {
      const options: FetchPostOptions = {
        fetchPublic: 'get',
        fetchContent: 'none',
        fetchReplyTo: 'none'
      }

      test('callback is called once, with public details only, including owner details', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)

        await waitFor(() => expect(callback).toHaveBeenCalled())
        expect(callback).toHaveBeenNthCalledWith(1, {
          id: post.id,
          ...post.public,
          ownerDetails: post.ownerDetails
        })
      })

      test('public listener is removed after first response', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
      })

      test('firebase methods called', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.get).toHaveBeenCalledTimes(1)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
      })

      describe('given post is deleted and public owner is null', () => {
        test('callback is called once, with public details only, with owner details null', async () => {
          const callback = jest.fn()

          fetchPost(nullOwnerPost.id, callback, options)

          await waitFor(() => expect(callback).toHaveBeenCalled())
          expect(callback).toHaveBeenNthCalledWith(1, {
            id: nullOwnerPost.id,
            ...nullOwnerPost.public,
            ownerDetails: null
          })
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(nullOwnerPost.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
          expect(mockFunctions.get).toHaveBeenCalledTimes(0)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('with fetchPublic option: "subscribe"', () => {
      const options: FetchPostOptions = {
        fetchPublic: 'subscribe',
        fetchContent: 'none',
        fetchReplyTo: 'none'
      }

      test('callback is called once initially, with public details only, including owner details', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)

        await waitFor(() => expect(callback).toHaveBeenCalled())
        expect(callback).toHaveBeenNthCalledWith(1, {
          id: post.id,
          ...post.public,
          ownerDetails: post.ownerDetails
        })
      })

      test('public listener is not removed', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
      })

      test('firebase methods called', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.get).toHaveBeenCalledTimes(1)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
      })
    })

    describe('with fetchContent option: "get"', () => {
      const options: FetchPostOptions = {
        fetchPublic: 'none',
        fetchContent: 'get',
        fetchReplyTo: 'none'
      }

      test('callback is called once, with content only', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)

        await waitFor(() => expect(callback).toHaveBeenCalled())
        expect(callback).toHaveBeenNthCalledWith(1, {
          id: post.id,
          ...post.content
        })
      })

      test('content listener is removed after first response', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
      })

      test('firebase methods called', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.get).toHaveBeenCalledTimes(0)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
      })
    })

    describe('with fetchContent option: "subscribe"', () => {
      const options: FetchPostOptions = {
        fetchPublic: 'none',
        fetchContent: 'subscribe',
        fetchReplyTo: 'none'
      }

      test('callback is called once initially, with content only', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)

        await waitFor(() => expect(callback).toHaveBeenCalled())
        expect(callback).toHaveBeenNthCalledWith(1, {
          id: post.id,
          ...post.content
        })
      })

      test('content listener is not removed', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
      })

      test('firebase methods called', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.get).toHaveBeenCalledTimes(0)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
      })
    })

    describe('with fetchContent option: "subscribeIfOwner"', () => {
      const options: FetchPostOptions = {
        fetchPublic: 'none',
        fetchContent: 'subscribeIfOwner',
        fetchReplyTo: 'none'
      }

      test('callback is called once initially, with content, public', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)

        await waitFor(() => expect(callback).toHaveBeenCalled())
        expect(callback).toHaveBeenNthCalledWith(1, {
          id: post.id,
          ...post.public,
          ...post.content
        })
      })

      test('public listener is removed after first response', async () => {
        const callback = jest.fn()

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
      })

      describe('given current user is the owner', () => {
        test('content listener is not removed', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
          expect(mockFunctions.get).toHaveBeenCalledTimes(0)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
        })
      })

      describe('given current user is not the owner', () => {
        test('content listener is removed after first response', async () => {
          const callback = jest.fn()

          fetchPost(reply.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(2)
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(reply.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
          expect(mockFunctions.get).toHaveBeenCalledTimes(0)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(2)
        })
      })

      describe('given post is deleted and public owner is null', () => {
        describe('given current user is the owner', () => {
          test('content listener is not removed', async () => {
            const callback = jest.fn()

            fetchPost(replyToNullOwnerPost.id, callback, options)
            await waitFor(() => expect(callback).toHaveBeenCalled())

            expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
            expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
          })

          test('firebase methods called', async () => {
            const callback = jest.fn()

            fetchPost(replyToNullOwnerPost.id, callback, options)
            await waitFor(() => expect(callback).toHaveBeenCalled())

            expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
            expect(mockFunctions.get).toHaveBeenCalledTimes(0)
            expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
          })
        })

        describe('given current user is not the owner', () => {
          test('content listener is removed after first response', async () => {
            const callback = jest.fn()

            fetchPost(nullOwnerPost.id, callback, options)
            await waitFor(() => expect(callback).toHaveBeenCalled())

            expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
            expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(2)
          })

          test('firebase methods called', async () => {
            const callback = jest.fn()

            fetchPost(nullOwnerPost.id, callback, options)
            await waitFor(() => expect(callback).toHaveBeenCalled())

            expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
            expect(mockFunctions.get).toHaveBeenCalledTimes(0)
            expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(2)
          })
        })
      })
    })

    describe('with fetchReplyTo option: "get"', () => {
      const options: FetchPostOptions = {
        fetchPublic: 'none',
        fetchContent: 'none',
        fetchReplyTo: 'get'
      }

      test('public listener created and removed after first response', async () => {
        const callback = jest.fn()

        setTimeout(() => {
          callback()
        }, 0)

        fetchPost(post.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
      })

      describe('given post is not a reply', () => {
        test('callback is called with public details and replyToPost null', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)

          await waitFor(() => expect(callback).toHaveBeenCalled())
          expect(callback).toHaveBeenNthCalledWith(1, {
            id: post.id,
            ...post.public,
            replyToPost: null
          })
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
          expect(mockFunctions.get).toHaveBeenCalledTimes(0)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
        })
      })

      describe('given post is a reply', () => {
        test('callback is called with public details and reply to post public details, including owner details', async () => {
          const callback = jest.fn()

          fetchPost(reply.id, callback, options)

          await waitFor(() => expect(callback).toHaveBeenCalled())
          expect(callback).toHaveBeenNthCalledWith(1, {
            id: reply.id,
            ...reply.public,
            replyToPost: {
              id: post.id,
              ...post.public,
              ownerDetails: post.ownerDetails
            }
          })
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(reply.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
          expect(mockFunctions.get).toHaveBeenCalledTimes(2)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
        })

        describe('given reply is deleted and public owner is null', () => {
          test('callback is called with public details and reply to post public details, with owner details null', async () => {
            const callback = jest.fn()

            fetchPost(replyToNullOwnerPost.id, callback, options)

            await waitFor(() => expect(callback).toHaveBeenCalled())
            expect(callback).toHaveBeenNthCalledWith(1, {
              id: replyToNullOwnerPost.id,
              ...replyToNullOwnerPost.public,
              replyToPost: {
                id: nullOwnerPost.id,
                ...nullOwnerPost.public,
                ownerDetails: null
              }
            })
          })

          test('firebase methods called', async () => {
            const callback = jest.fn()

            fetchPost(replyToNullOwnerPost.id, callback, options)
            await waitFor(() => expect(callback).toHaveBeenCalled())

            expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
            expect(mockFunctions.get).toHaveBeenCalledTimes(1)
            expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
          })
        })
      })
    })

    describe('with all fetch options not "none"', () => {
      const options: FetchPostOptions = {
        fetchPublic: 'get',
        fetchContent: 'get',
        fetchReplyTo: 'get'
      }

      describe('given post is not a reply', () => {
        test('callback is called with completed post', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)

          await waitFor(() => expect(callback).toHaveBeenCalled())
          expect(callback).toHaveBeenNthCalledWith(1, {
            id: post.id,
            ...post.public,
            ...post.content,
            ownerDetails: post.ownerDetails,
            replyToPost: null
          })
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
          expect(mockFunctions.get).toHaveBeenCalledTimes(1)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(2)
        })
      })

      describe('given post is a reply', () => {
        test('callback is called with completed post', async () => {
          const callback = jest.fn()

          fetchPost(reply.id, callback, options)

          await waitFor(() => expect(callback).toHaveBeenCalled())
          expect(callback).toHaveBeenNthCalledWith(1, {
            id: reply.id,
            ...reply.public,
            ...reply.content,
            ownerDetails: reply.ownerDetails,
            replyToPost: {
              id: post.id,
              ...post.public,
              ownerDetails: post.ownerDetails
            }
          })
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(reply.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
          expect(mockFunctions.get).toHaveBeenCalledTimes(3)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(2)
        })
      })
    })
  })

  describe('with an existing post', () => {
    describe('given existing post is complete', () => {
      const existingPost = {
        id: post.id,
        ...post.public,
        ...post.content,
        deletedReplies: ['out-of-date deleted reply'],
        message: 'out-of-date message',
        ownerDetails: post.ownerDetails,
        replyToPost: null
      }

      describe('with "get" fetch options only', () => {
        const options: FetchPostOptions = {
          existingPost,
          fetchPublic: 'get',
          fetchContent: 'get',
          fetchReplyTo: 'get'
        }

        test('callback is called with existing post', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)

          await waitFor(() => expect(callback).toHaveBeenCalled())
          expect(callback).toHaveBeenNthCalledWith(1, existingPost)
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalled())

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(0)
          expect(mockFunctions.get).toHaveBeenCalledTimes(0)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
        })
      })

      describe('with some "subscribe" fetch options', () => {
        const options: FetchPostOptions = {
          existingPost,
          fetchPublic: 'subscribe',
          fetchContent: 'subscribe',
          fetchReplyTo: 'get'
        }

        test('callback is called with existing post initially and then with up-to-date details', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)

          await waitFor(() => expect(callback).toHaveBeenCalledTimes(1))
          expect(callback).toHaveBeenNthCalledWith(1, {
            ...existingPost,
            ...post.public,
            ...post.content,
            ownerDetails: post.ownerDetails
          })
        })

        test('firebase methods called', async () => {
          const callback = jest.fn()

          fetchPost(post.id, callback, options)
          await waitFor(() => expect(callback).toHaveBeenCalledTimes(1))

          expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
          expect(mockFunctions.get).toHaveBeenCalledTimes(0)
          expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
        })
      })
    })

    describe('given existing post is not complete', () => {
      const existingPost = {
        id: reply.id,
        ...reply.public,
        ...reply.content,
        message: 'out-of-date message'
      }
      const options: FetchPostOptions = {
        existingPost,
        fetchPublic: 'get',
        fetchContent: 'get',
        fetchReplyTo: 'get'
      }

      test('callback is called once, with existing post plus newly fetched missing data', async () => {
        const callback = jest.fn()

        fetchPost(reply.id, callback, options)

        await waitFor(() => expect(callback).toHaveBeenCalled())
        expect(callback).toHaveBeenNthCalledWith(1, {
          ...existingPost,
          ownerDetails: reply.ownerDetails,
          replyToPost: {
            id: post.id,
            ...post.public,
            ownerDetails: post.ownerDetails
          }
        })
      })

      test('firebase methods called', async () => {
        const callback = jest.fn()

        fetchPost(reply.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(0)
        expect(mockFunctions.get).toHaveBeenCalledTimes(3)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
      })
    })

    describe('given fetchContent is "subscribeIfOwner" and existing post has content and owner ID already', () => {
      const existingPost = {
        id: reply.id,
        ...reply.public,
        ...reply.content
      }
      const options: FetchPostOptions = {
        existingPost,
        fetchPublic: 'none',
        fetchContent: 'subscribeIfOwner',
        fetchReplyTo: 'get'
      }

      test('callback is called once, with existing post, and no content listener is added/removed', async () => {
        const callback = jest.fn()

        fetchPost(reply.id, callback, options)
        await waitFor(() => expect(callback).toHaveBeenCalled())

        expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(0)
        expect(mockFunctions.get).toHaveBeenCalledTimes(2)
        expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(0)
      })
    })
  })
})
