// eslint-disable-next-line jest/no-mocks-import
import { mockFunctions } from '../__mocks__/firebase/app'
import {
  getUserById,
  getUserByUsername,
  onUserUpdated,
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
  getMultiUserPosts
} from './firebase'

describe(`${getUserById.name}`, () => {
  const uid = 'user1'

  describe('without options', () => {
    let result: ReturnType<typeof getUserById>

    beforeEach(() => {
      result = getUserById(uid)
    })

    test('calls firestore methods', () => {
      expect(mockFunctions.get).toHaveBeenCalledTimes(1)
    })

    test('returns a promise', () => {
      expect(result).toBeInstanceOf(Promise)
    })

    test('returns correct data', async () => {
      await expect(result).resolves.toEqual({
        uid: 'user1',
        avatar: '',
        createdAt: '0',
        deleted: false,
        username: 'Username',
        usernameLowerCase: 'username',
        followersCount: 2
      })
    })
  })

  describe('with private data', () => {
    let result: ReturnType<typeof getUserById>

    beforeEach(() => {
      const options = { includePrivate: true }
      result = getUserById(uid, options)
    })

    test('calls firestore methods', () => {
      expect(mockFunctions.get).toHaveBeenCalledTimes(2)
    })

    test('returns correct data', async () => {
      await expect(result).resolves.toEqual({
        uid: 'user1',
        avatar: '',
        createdAt: '0',
        deleted: false,
        username: 'Username',
        usernameLowerCase: 'username',
        followersCount: 2,
        email: 'email@email.com',
        fullName: 'Forename Surname'
      })
    })
  })

  describe('with following and likedPosts data', () => {
    let result: ReturnType<typeof getUserById>

    beforeEach(() => {
      const options = { includeFollowing: true, includeLikedPosts: true }
      result = getUserById(uid, options)
    })

    test('calls firestore methods', () => {
      expect(mockFunctions.get).toHaveBeenCalledTimes(3)
    })

    test('returns correct data', async () => {
      await expect(result).resolves.toEqual({
        uid: 'user1',
        avatar: '',
        createdAt: '0',
        deleted: false,
        username: 'Username',
        usernameLowerCase: 'username',
        followersCount: 2,
        following: ['user3', 'user4'],
        likedPosts: ['post1', 'post2']
      })
    })
  })
})

describe(`${getUserByUsername.name}`, () => {
  test('returns a promise', () => {
    const result = getUserByUsername('username')

    expect(result).toBeInstanceOf(Promise)
  })

  test('given username does not exist, throws error', async () => {
    const result = getUserByUsername('untakenUsername')

    await expect(result).rejects.toThrowError('User with username "untakenUsername" not found.')
  })

  test('given username exists, returns user data', async () => {
    const result = getUserByUsername('username')

    await expect(result).resolves.toEqual({
      uid: 'user1',
      avatar: '',
      createdAt: '0',
      deleted: false,
      username: 'Username',
      usernameLowerCase: 'username',
      followersCount: 2
    })
  })

  test('given all inclusions, returns all data', async () => {
    const result = getUserByUsername('username', {
      includePrivate: true,
      includeFollowing: true,
      includeLikedPosts: true
    })

    await expect(result).resolves.toEqual({
      uid: 'user1',
      avatar: '',
      createdAt: '0',
      deleted: false,
      username: 'Username',
      usernameLowerCase: 'username',
      followersCount: 2,
      email: 'email@email.com',
      fullName: 'Forename Surname',
      following: ['user3', 'user4'],
      likedPosts: ['post1', 'post2']
    })
  })
})

describe(`${onUserUpdated.name}`, () => {
  const callback = jest.fn()
  const uid = 'user1'

  describe('without options', () => {
    let result: ReturnType<typeof onUserUpdated>

    beforeEach(() => {
      result = onUserUpdated(uid, callback)
    })

    test('calls firestore methods', () => {
      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(1)
    })

    test('calls callback with correct data', () => {
      expect(callback).toBeCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        uid,
        avatar: '',
        createdAt: '0',
        deleted: false,
        followersCount: 2,
        username: 'Username',
        usernameLowerCase: 'username'
      })
    })

    test('returns a cleanup function', () => {
      result()

      expect(typeof result).toBe('function')
      expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe('with private data', () => {
    let result: ReturnType<typeof onUserUpdated>

    beforeEach(() => {
      const options = { includePrivate: true }
      result = onUserUpdated(uid, callback, options)
    })

    test('calls firestore methods', () => {
      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(2)
    })

    test('calls callback with correct data', () => {
      expect(callback).toBeCalledTimes(2)
      expect(callback).toHaveBeenCalledWith({
        uid,
        avatar: '',
        createdAt: '0',
        deleted: false,
        followersCount: 2,
        username: 'Username',
        usernameLowerCase: 'username'
      })

      expect(callback).toHaveBeenCalledWith({
        uid,
        fullName: 'Forename Surname',
        email: 'email@email.com'
      })
    })

    test('returns a cleanup function', () => {
      result()

      expect(typeof result).toBe('function')
      expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(2)
    })
  })

  describe('with following and likedPosts data', () => {
    let result: ReturnType<typeof onUserUpdated>

    beforeEach(() => {
      const options = { includeFollowing: true, includeLikedPosts: true }
      result = onUserUpdated(uid, callback, options)
    })

    test('calls firestore methods', () => {
      expect(mockFunctions.onSnapshot).toHaveBeenCalledTimes(3)
    })

    test('calls callback with correct data', () => {
      expect(callback).toBeCalledTimes(3)
      expect(callback).toHaveBeenCalledWith({
        uid: 'user1',
        avatar: '',
        createdAt: '0',
        deleted: false,
        username: 'Username',
        usernameLowerCase: 'username',
        followersCount: 2
      })

      expect(callback).toHaveBeenCalledWith({
        uid,
        following: ['user3', 'user4']
      })

      expect(callback).toHaveBeenCalledWith({
        uid,
        likedPosts: ['post1', 'post2']
      })
    })

    test('returns a cleanup function', () => {
      result()

      expect(typeof result).toBe('function')
      expect(mockFunctions.onSnapshotCleanupFunction).toHaveBeenCalledTimes(3)
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

    expect(mockFunctions.where).toBeCalledTimes(2)
    expect(mockFunctions.get).toBeCalledTimes(1)
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

      expect(mockFunctions.where).toBeCalledTimes(2)
      expect(mockFunctions.get).toBeCalledTimes(1)
      expect(mockFunctions.createUserWithEmailAndPassword).toBeCalledTimes(1)
      expect(mockFunctions.set).toBeCalledTimes(4)
      expect(mockFunctions.serverTimestamp).toBeCalledTimes(1)
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

      expect(mockFunctions.signInWithEmailAndPassword).toBeCalledTimes(1)
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

    expect(mockFunctions.update).toBeCalledTimes(1)
    expect(mockFunctions.serverTimestamp).toBeCalledTimes(1)
  })

  test('given private details updated, calls firestore update method once', async () => {
    await editUser({ fullName: 'NewForename NewSurname' })

    expect(mockFunctions.update).toBeCalledTimes(1)
    expect(mockFunctions.serverTimestamp).toBeCalledTimes(1)
  })

  test('given mixed details updated, calls firestore update method twice', async () => {
    await editUser({ username: 'NewUsername', fullName: 'NewForename NewSurname' })

    expect(mockFunctions.update).toBeCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toBeCalledTimes(2)
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
    expect(mockFunctions.set).toBeCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toBeCalledTimes(2)
    expect(mockFunctions.update).toBeCalledTimes(1)
  })

  test('given post has content and is a reply, resolves and calls firebase methods', async () => {
    const result = addPost({ message: 'message', replyTo: { id: 'post1', owner: 'user1' } })

    await expect(result).resolves.toBe('mockId')
    expect(mockFunctions.set).toBeCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toBeCalledTimes(2)
    expect(mockFunctions.update).toBeCalledTimes(2)
    expect(mockFunctions.arrayUnion).toBeCalledTimes(1)
  })

  test('given post has an attachment, resolves and calls firebase methods', async () => {
    const file = new File(['attachment'], 'attachment.png', { type: 'image/png' })

    const result = addPost({ attachment: file })

    await expect(result).resolves.toBe('mockId')
    expect(mockFunctions.put).toBeCalledTimes(1)
    expect(mockFunctions.getDownloadURL).toBeCalledTimes(1)
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
    expect(mockFunctions.update).toBeCalledTimes(2)
    expect(mockFunctions.serverTimestamp).toBeCalledTimes(1)
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
    expect(mockFunctions.increment).toBeCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(1)
    expect(mockFunctions.update).toBeCalledTimes(2)
    expect(mockFunctions.arrayUnion).toBeCalledTimes(1)
    expect(mockFunctions.arrayUnion).toBeCalledWith(uid)
    expect(mockFunctions.set).toBeCalledTimes(1)
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
    expect(mockFunctions.increment).toBeCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(-1)
    expect(mockFunctions.update).toBeCalledTimes(2)
    expect(mockFunctions.arrayRemove).toBeCalledTimes(1)
    expect(mockFunctions.arrayRemove).toBeCalledWith(uid)
    expect(mockFunctions.docDelete).toBeCalledTimes(1)
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
    expect(mockFunctions.increment).toBeCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(1)
    expect(mockFunctions.update).toBeCalledTimes(2)
    expect(mockFunctions.arrayUnion).toBeCalledTimes(1)
    expect(mockFunctions.arrayUnion).toBeCalledWith(postId)
    expect(mockFunctions.set).toBeCalledTimes(1)
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
    expect(mockFunctions.increment).toBeCalledTimes(1)
    expect(mockFunctions.increment).toBeCalledWith(-1)
    expect(mockFunctions.update).toBeCalledTimes(2)
    expect(mockFunctions.arrayRemove).toBeCalledTimes(1)
    expect(mockFunctions.arrayRemove).toBeCalledWith(postId)
    expect(mockFunctions.docDelete).toBeCalledTimes(1)
  })
})

describe(`${getMultiUserPosts.name}`, () => {
  const statusCallback = jest.fn()
  const loadingCallback = jest.fn()

  test('calls firebase methods', async () => {
    const users = ['user1', 'user2']

    const loadNextPage = getMultiUserPosts(users, statusCallback, loadingCallback)

    await loadNextPage()

    expect(mockFunctions.orderBy).toBeCalledTimes(1)
    expect(mockFunctions.limit).toBeCalledTimes(1)
    expect(mockFunctions.get).toBeCalledTimes(5)
  })

  test('calls callbacks with correct data', async () => {
    const users = ['user1', 'user2']

    const loadNextPage = getMultiUserPosts(users, statusCallback, loadingCallback)

    await loadNextPage()

    expect(loadingCallback).toHaveBeenCalledTimes(2)
    expect(loadingCallback).toHaveBeenCalledWith(true)
    expect(loadingCallback).toHaveBeenCalledWith(false)
    expect(statusCallback).toHaveBeenCalledTimes(1)
    expect(statusCallback).toHaveBeenCalledWith({
      posts: [
        {
          attachment: '',
          createdAt: '2',
          deleted: false,
          id: 'post2',
          likesCount: 1,
          message: 'mock message',
          owner: 'user2',
          replies: [],
          replyTo: {
            id: 'post1',
            owner: 'user1'
          },
          ownerDetails: expect.objectContaining({
            uid: 'user2'
          }) as unknown,
          replyToOwnerDetails: expect.objectContaining({
            uid: 'user1'
          }) as unknown
        },
        {
          attachment: '',
          createdAt: '1',
          deleted: false,
          id: 'post1',
          likesCount: 2,
          message: 'mock message',
          owner: 'user1',
          replies: ['post2'],
          replyTo: null,
          ownerDetails: expect.objectContaining({
            uid: 'user1'
          }) as unknown
        }
      ],
      isComplete: true,
      page: 1,
      stats: { fetchCount: 1, docsFetchedCount: 2, docReadCount: 2, chunks: 1, users: 2 }
    })
  })

  test('given multiple pages, calls callbacks with correct data', async () => {
    const users = ['user1', 'user2']

    const loadNextPage = getMultiUserPosts(users, statusCallback, loadingCallback, 1)

    await loadNextPage()

    expect(loadingCallback).toHaveBeenCalledTimes(2)
    expect(loadingCallback).toHaveBeenCalledWith(true)
    expect(loadingCallback).toHaveBeenCalledWith(false)
    expect(statusCallback).toHaveBeenCalledTimes(1)
    expect(statusCallback).toHaveBeenCalledWith({
      posts: [
        {
          attachment: '',
          createdAt: '2',
          deleted: false,
          id: 'post2',
          likesCount: 1,
          message: 'mock message',
          owner: 'user2',
          replies: [],
          replyTo: {
            id: 'post1',
            owner: 'user1'
          },
          ownerDetails: expect.objectContaining({
            uid: 'user2'
          }) as unknown,
          replyToOwnerDetails: expect.objectContaining({
            uid: 'user1'
          }) as unknown
        }
      ],
      isComplete: false,
      page: 1,
      stats: { fetchCount: 1, docsFetchedCount: 2, docReadCount: 2, chunks: 1, users: 2 }
    })
  })

  test('given no users supplied, callback argument includes empty posts array', async () => {
    const loadNextPage = getMultiUserPosts([], statusCallback, loadingCallback)

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
