import { mockFunctions } from 'firebase/app'
import { getUserById, onUserUpdated, isUsernameAvailable, signUp, signIn } from './firebase'

describe(`${getUserById.name}`, () => {
  const uid = 'user1'

  describe('without options', () => {
    let result

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
      expect(await result).toEqual({
        uid: 'user1',
        avatar: '',
        createdAt: '',
        deleted: false,
        username: 'Username',
        usernameLowerCase: 'username',
        followersCount: 2
      })
    })
  })

  describe('with private data', () => {
    let result

    beforeEach(() => {
      const options = { includePrivate: true }
      result = getUserById(uid, options)
    })

    test('calls firestore methods', () => {
      expect(mockFunctions.get).toHaveBeenCalledTimes(2)
    })

    test('returns correct data', async () => {
      expect(await result).toEqual({
        uid: 'user1',
        avatar: '',
        createdAt: '',
        deleted: false,
        username: 'Username',
        usernameLowerCase: 'username',
        followersCount: 2,
        email: 'email@email.com',
        fullName: 'Forename Surname'
      })
    })
  })
})

describe(`${onUserUpdated.name}`, () => {
  const callback = jest.fn()
  const uid = 'user1'

  describe('without options', () => {
    let result

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
        createdAt: '',
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
    let result

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
        createdAt: '',
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
  test('given no arguments, throws error', async () => {
    await expect(signUp).rejects.toThrowError('Invalid data supplied.')
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
  test('given no arguments, throws error', async () => {
    await expect(signIn).rejects.toThrowError('Invalid data supplied.')
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

      expect(mockFunctions.auth).toBeCalledTimes(1)
      expect(mockFunctions.signInWithEmailAndPassword).toBeCalledTimes(1)
    })
  })
})
