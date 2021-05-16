import { mockFunctions } from 'firebase/app'
import { isUsernameTaken, signUp, signIn } from './firebase'

describe(`${isUsernameTaken.name}`, () => {
  test('given no arguments, returns false', async () => {
    const result = await isUsernameTaken()

    expect(result).toBe(false)
  })

  test('given valid arguments, calls firebase methods', async () => {
    await isUsernameTaken('username')

    expect(mockFunctions.where).toBeCalledTimes(1)
    expect(mockFunctions.get).toBeCalledTimes(1)
  })

  test('given username is not taken, returns false', async () => {
    const result = await isUsernameTaken('untakenUsername')

    expect(result).toBe(false)
  })

  test('given username is taken, returns true', async () => {
    const result = await isUsernameTaken('username')

    expect(result).toBe(true)
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

      expect(mockFunctions.where).toBeCalledTimes(1)
      expect(mockFunctions.get).toBeCalledTimes(1)
      expect(mockFunctions.auth).toBeCalledTimes(1)
      expect(mockFunctions.createUserWithEmailAndPassword).toBeCalledTimes(1)
      expect(mockFunctions.set).toBeCalledTimes(2)
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
