import { isValidSignUpInputs, isValidSignInInputs, sortBy, chunkArray } from '.'

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
    const result = isValidSignUpInputs({})

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
    const result = isValidSignInInputs({})

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

describe(`${sortBy.name}`, () => {
  test('given "asc", sorts array of objects by property in ascending order', () => {
    const objectArray = [{ a: '2' }, { a: '3' }, { a: '1' }]

    const result = sortBy(objectArray, 'a', 'asc')

    expect(result).toStrictEqual([{ a: '1' }, { a: '2' }, { a: '3' }])
  })

  test('given "desc", sorts array of objects by property in descending order', () => {
    const objectArray = [{ a: '2' }, { a: '3' }, { a: '1' }]

    const result = sortBy(objectArray, 'a', 'desc')

    expect(result).toStrictEqual([{ a: '3' }, { a: '2' }, { a: '1' }])
  })
})

describe(`${chunkArray.name}`, () => {
  test('given numPerChunk is 2, returns correctly chunked array', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8]

    const result = chunkArray(array, 2)

    expect(result).toStrictEqual([[1, 2], [3, 4], [5, 6], [7, 8]])
  })

  test('given numPerChunk is 3, returns correctly chunked array', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8]

    const result = chunkArray(array, 3)

    expect(result).toStrictEqual([[1, 2, 3], [4, 5, 6], [7, 8]])
  })
})
