import { isValidSignUpInputs, isValidSignInInputs } from '.'

describe(`${isValidSignUpInputs.name}`, () => {
  test('given valid inputs, returns true', () => {
    const options = {
      username: 'username',
      fullName: 'forename surname',
      email: 'email@email.com',
      password: 'password'
    }

    const result = isValidSignUpInputs(options)

    expect(result).toBe(true)
  })

  test('given no arguments, returns false', () => {
    const result = isValidSignUpInputs()

    expect(result).toBe(false)
  })

  test('given invalid email, returns false', () => {
    const options = {
      username: 'username',
      fullName: 'forename surname',
      email: 'email@',
      password: 'password'
    }

    const result = isValidSignUpInputs(options)

    expect(result).toBe(false)
  })
})

describe(`${isValidSignInInputs.name}`, () => {
  test('given valid inputs, returns true', () => {
    const options = {
      email: 'email@email.com',
      password: 'password'
    }

    const result = isValidSignInInputs(options)

    expect(result).toBe(true)
  })

  test('given no arguments, returns false', () => {
    const result = isValidSignInInputs()

    expect(result).toBe(false)
  })

  test('given invalid email, returns false', () => {
    const options = {
      email: 'email@',
      password: 'password'
    }

    const result = isValidSignInInputs(options)

    expect(result).toBe(false)
  })
})
