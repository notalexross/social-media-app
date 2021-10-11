import firebase from 'firebase'
import {
  isValidSignUpInputs,
  isValidSignInInputs,
  timestampToMillis,
  sortBy,
  sortByTimestamp,
  chunkArray,
  formatDateTime,
  modulo,
  onIntervalAfter,
  stringifyError,
  paginateArray,
  disableElements,
  enableElements,
  disableForm
} from '.'

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

describe(`${timestampToMillis.name}`, () => {
  test('given firebase timestamp, returns time in milliseconds', () => {
    const date = new Date()
    const timestamp = firebase.firestore.Timestamp.fromDate(date)

    const result = timestampToMillis(timestamp)

    expect(result).toBe(date.getTime())
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

describe(`${sortByTimestamp.name}`, () => {
  test('given "asc", sorts array of objects by timestamp property in ascending order', () => {
    const objectArray = [
      { a: { seconds: 1620000000, nanoseconds: 0 } },
      { a: { seconds: 1630000000, nanoseconds: 0 } },
      { a: { seconds: 1610000000, nanoseconds: 0 } }
    ]

    const result = sortByTimestamp(objectArray, 'a', 'asc')

    expect(result).toEqual([objectArray[2], objectArray[0], objectArray[1]])
  })

  test('given "desc", sorts array of objects by timestamp property in descending order', () => {
    const objectArray = [
      { a: { seconds: 1620000000, nanoseconds: 0 } },
      { a: { seconds: 1630000000, nanoseconds: 0 } },
      { a: { seconds: 1610000000, nanoseconds: 0 } }
    ]

    const result = sortByTimestamp(objectArray, 'a', 'desc')

    expect(result).toEqual([objectArray[1], objectArray[0], objectArray[2]])
  })
})

describe(`${chunkArray.name}`, () => {
  test('given numPerChunk is 2, returns correctly chunked array', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8]

    const result = chunkArray(array, 2)

    expect(result).toStrictEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8]
    ])
  })

  test('given numPerChunk is 3, returns correctly chunked array', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8]

    const result = chunkArray(array, 3)

    expect(result).toStrictEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8]
    ])
  })
})

describe(`${formatDateTime.name}`, () => {
  const dateNow = '2021-07-31T16:00:00.000Z'

  describe(`where date now is ${dateNow}`, () => {
    beforeEach(() => {
      jest.useFakeTimers('modern')
      jest.setSystemTime(Date.parse(dateNow))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('returns formatted date in full', () => {
      const date = new Date('2021-07-31T16:00:00.000Z')

      const [, dateFull] = formatDateTime(date)

      expect(dateFull).toBe('4:00 pm · Jul 31, 2021')
    })

    test('returns formatted date in full, minus time', () => {
      const date = new Date('2021-07-31T16:00:00.000Z')

      const [,, datePartial] = formatDateTime(date)

      expect(datePartial).toBe('Jul 31, 2021')
    })

    describe('elapsed time', () => {
      describe('where input is a date from this year', () => {
        test('given date < 1 minute ago, returns seconds', () => {
          const date = new Date('2021-07-31T15:59:01.000Z')

          const [timeElapsed] = formatDateTime(date)

          expect(timeElapsed).toBe('59s')
        })

        test('given date < 1 hour ago, returns minutes', () => {
          const date = new Date('2021-07-31T15:00:01.000Z')

          const [timeElapsed] = formatDateTime(date)

          expect(timeElapsed).toBe('59m')
        })

        test('given date < 24 hours ago, returns hours', () => {
          const date = new Date('2021-07-30T16:00:01.000Z')

          const [timeElapsed] = formatDateTime(date)

          expect(timeElapsed).toBe('23h')
        })

        test('given date >= 24 hours ago, returns month and day', () => {
          const date = new Date('2021-07-30T16:00:00.000Z')

          const [timeElapsed] = formatDateTime(date)

          expect(timeElapsed).toBe('Jul 30')
        })
      })

      describe('where input is a date from a previous year', () => {
        test('returns month, day, and year', () => {
          const date = new Date('2020-07-31T16:00:00.000Z')

          const [timeElapsed] = formatDateTime(date)

          expect(timeElapsed).toBe('Jul 31, 2020')
        })
      })
    })

    describe('edge cases', () => {
      const cases: [Date, string, string, string][] = [
        [new Date('2021-07-31T15:59:59.999Z'), '0s', '3:59 pm · Jul 31, 2021', 'Jul 31, 2021'],
        [new Date('2021-07-31T15:59:59.000Z'), '1s', '3:59 pm · Jul 31, 2021', 'Jul 31, 2021'],
        [new Date('2021-07-31T15:59:00.001Z'), '59s', '3:59 pm · Jul 31, 2021', 'Jul 31, 2021'],
        [new Date('2021-07-31T15:59:00.000Z'), '1m', '3:59 pm · Jul 31, 2021', 'Jul 31, 2021'],
        [new Date('2021-07-31T15:00:00.001Z'), '59m', '3:00 pm · Jul 31, 2021', 'Jul 31, 2021'],
        [new Date('2021-07-31T15:00:00.000Z'), '1h', '3:00 pm · Jul 31, 2021', 'Jul 31, 2021'],
        [new Date('2021-07-30T16:00:00.001Z'), '23h', '4:00 pm · Jul 30, 2021', 'Jul 30, 2021'],
        [new Date('2021-07-30T16:00:00.000Z'), 'Jul 30', '4:00 pm · Jul 30, 2021', 'Jul 30, 2021'],
        [new Date('2021-01-01T00:00:00.000Z'), 'Jan 1', '12:00 am · Jan 1, 2021', 'Jan 1, 2021'],
        [new Date('2020-12-31T23:59:59.999Z'), 'Dec 31, 2020', '11:59 pm · Dec 31, 2020', 'Dec 31, 2020'],
        [new Date('2021-07-31T12:00:00.000Z'), '4h', '12:00 pm · Jul 31, 2021', 'Jul 31, 2021'],
        [new Date('2021-07-31T00:00:00.000Z'), '16h', '12:00 am · Jul 31, 2021', 'Jul 31, 2021']
      ]

      test.each(cases)('given %s, returns [%s, %s, %s]', (date, expTimeElapsed, expFullDate, expPartialDate) => {
        const result = formatDateTime(date)

        expect(result).toEqual([expTimeElapsed, expFullDate, expPartialDate])
      })
    })
  })
})

describe(`${modulo.name}`, () => {
  test('returns the modulus of two numbers', () => {
    const numerator = 5
    const denominator = 3

    const result = modulo(numerator, denominator)

    expect(result).toBe(2)
  })

  test('given negative numerator and denominator, returns a value with the same sign as the denominator', () => {
    const numerator = -5
    const denominator = -3

    const result = modulo(numerator, denominator)

    expect(result).toBe(-2)
  })

  test('given negative denominator, returns a value with the same sign as the denominator', () => {
    const numerator = 5
    const denominator = -3

    const result = modulo(numerator, denominator)

    expect(result).toBe(-1)
  })

  test('given negative numerator, returns a value with the same sign as the denominator', () => {
    const numerator = -5
    const denominator = 3

    const result = modulo(numerator, denominator)

    expect(result).toBe(1)
  })
})

describe(`${onIntervalAfter.name}`, () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('returns a cleanup function', () => {
    const startFromNow = 2000
    const interval = 5000

    const callback = jest.fn()
    const start = Date.now() + startFromNow
    const timeUntilFirst = startFromNow

    const cleanup = onIntervalAfter(start, interval, callback)

    jest.advanceTimersByTime(timeUntilFirst + interval * 1000)
    expect(callback).toBeCalledTimes(1001)
    cleanup()
    jest.advanceTimersByTime(interval * 1000)
    expect(callback).toBeCalledTimes(1001)
  })

  describe('starting from a future date', () => {
    test('calls callback at start time', () => {
      const startFromNow = 1540145
      const interval = Infinity

      const callback = jest.fn()
      const start = Date.now() + startFromNow
      const timeUntilFirst = startFromNow

      onIntervalAfter(start, interval, callback)

      expect(callback).toBeCalledTimes(0)
      jest.advanceTimersByTime(timeUntilFirst - 1)
      expect(callback).toBeCalledTimes(0)
      jest.advanceTimersByTime(1)
      expect(callback).toBeCalledTimes(1)
    })

    test('calls callback on interval after start time', () => {
      const startFromNow = 954679
      const interval = 6347

      const callback = jest.fn()
      const start = Date.now() + startFromNow
      const timeUntilFirst = startFromNow

      onIntervalAfter(start, interval, callback)

      expect(callback).toBeCalledTimes(0)
      jest.advanceTimersByTime(timeUntilFirst)
      expect(callback).toBeCalledTimes(1)
      jest.advanceTimersByTime(interval - 1)
      expect(callback).toBeCalledTimes(1)
      jest.advanceTimersByTime(1)
      expect(callback).toBeCalledTimes(2)
      jest.advanceTimersByTime(interval * 1000)
      expect(callback).toBeCalledTimes(1002)
    })
  })

  describe('starting from a past date', () => {
    test('calls callback on interval based on start time', () => {
      const startFromNow = -7862154
      const interval = 84278

      const callback = jest.fn()
      const start = Date.now() + startFromNow
      const timeUntilFirst = interval - (-startFromNow % interval)

      onIntervalAfter(start, interval, callback)

      expect(callback).toBeCalledTimes(0)
      jest.advanceTimersByTime(timeUntilFirst - 1)
      expect(callback).toBeCalledTimes(0)
      jest.advanceTimersByTime(1)
      expect(callback).toBeCalledTimes(1)
      jest.advanceTimersByTime(interval * 1000)
      expect(callback).toBeCalledTimes(1001)
    })
  })
})

describe(`${stringifyError.name}`, () => {
  test('converts error of type Error to string', () => {
    const result = stringifyError(new Error('error message'))

    expect(result).toBe('error message')
  })

  test('converts error of type string to string', () => {
    const result = stringifyError('error message')

    expect(result).toBe('error message')
  })

  test('converts error of non string or Error types to string', () => {
    const result = stringifyError({ error: 'error message' })

    expect(result).toBe('{"error":"error message"}')
  })
})

describe(`${paginateArray.name}`, () => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const callback = jest.fn(() => {})

  test('returns a function', () => {
    const loadNextPage = paginateArray(array, callback)

    expect(typeof loadNextPage).toBe('function')
  })

  test('callback is called when returned function called', () => {
    const entriesPerPage = 2

    const loadNextPage = paginateArray(array, callback, entriesPerPage)
    loadNextPage()
    loadNextPage()

    expect(callback).toHaveBeenCalledTimes(2)
  })

  test('callback called with a status object', () => {
    const entriesPerPage = 2

    const loadNextPage = paginateArray(array, callback, entriesPerPage)
    loadNextPage()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({
      entries: array.slice(0, 2),
      isComplete: false,
      page: 1
    })
  })

  test('"entries" in status object contains page * entriesPerPage array entries', () => {
    const entriesPerPage = 2

    const loadNextPage = paginateArray(array, callback, entriesPerPage)
    loadNextPage()
    loadNextPage()

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      entries: array.slice(0, 4),
      page: 2
    }))
  })

  test('page count increments on calling returned function', () => {
    const entriesPerPage = 2

    const loadNextPage = paginateArray(array, callback, entriesPerPage)
    loadNextPage()
    loadNextPage()

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
  })

  test('given all array entries returned, page count stops incrementing', () => {
    const entriesPerPage = 5

    const loadNextPage = paginateArray(array, callback, entriesPerPage)
    loadNextPage()
    loadNextPage()
    loadNextPage()

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ page: 1, isComplete: false }))
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ page: 2, isComplete: true }))
    expect(callback).not.toHaveBeenCalledWith(expect.objectContaining({ page: 3 }))
  })
})

describe(`${disableElements.name}`, () => {
  test('disables all elements in an array of DOM elements', () => {
    const elements = [document.createElement('button'), document.createElement('input')]

    disableElements(elements)

    elements.forEach(element => {
      expect(element).toHaveAttribute('disabled')
    })
  })
})

describe(`${enableElements.name}`, () => {
  test('enables all elements in an array of DOM elements', () => {
    const elements = [document.createElement('button'), document.createElement('input')]
    disableElements(elements)

    enableElements(elements)

    elements.forEach(element => {
      expect(element).not.toHaveAttribute('disabled')
    })
  })
})

describe(`${disableForm.name}`, () => {
  test('disables all form elements', () => {
    const form = document.createElement('form')
    const formElements = [document.createElement('button'), document.createElement('input')]
    formElements.forEach(element => form.appendChild(element))

    const result = disableForm(form)

    expect(result).toHaveLength(2)
    result.forEach(element => {
      expect(element).toHaveAttribute('disabled')
    })
  })

  test('returns array of newly disabled elements', () => {
    const form = document.createElement('form')
    const formElements = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('input')
    ]
    formElements.forEach(element => form.appendChild(element))
    disableElements([formElements[0]])

    const result = disableForm(form)

    expect(result).toHaveLength(2)
    result.forEach(element => {
      expect(element).toHaveAttribute('disabled')
    })
  })
})
