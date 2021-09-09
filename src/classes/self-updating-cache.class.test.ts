import SelfUpdatingCache from './self-updating-cache.class'

function getTestData(value: string, { shouldThrow = false } = {}) {
  if (!shouldThrow) return Promise.resolve(value)
  throw new Error('error')
}

const getTestDataFn = jest.fn(getTestData)
const cache = new SelfUpdatingCache('test', getTestDataFn)
const initialDateNow = Date.parse('2021-07-31T16:00:00.000Z')

let dateNow = initialDateNow
Date.now = () => dateNow

beforeEach(async () => {
  dateNow = initialDateNow
  await cache.clear()
})

describe(`${cache.set.name}`, () => {
  test('returns a promise', () => {
    const result = cache.set('test-entry', 'value')

    expect(result).toBeInstanceOf(Promise)
  })

  test('resolves to new cache entry', async () => {
    const result = cache.set('test-entry', 'value')

    await expect(result).resolves.toEqual({ data: 'value', lastUpdated: dateNow })
  })

  test('adds a new entry to cache', async () => {
    await cache.set('test-entry', 'value')

    const result = cache.getAll()
    await expect(result).resolves.toEqual([{ data: 'value', lastUpdated: dateNow }])
  })

  test('updates an existing entry in cache', async () => {
    await cache.set('test-entry', 'value')
    dateNow += 100

    await cache.set('test-entry', 'value2')

    const result = cache.getAll()
    await expect(result).resolves.toEqual([{ data: 'value2', lastUpdated: initialDateNow + 100 }])
  })

  test('does not call update function', async () => {
    await cache.set('test-entry', 'value')

    expect(getTestDataFn).toBeCalledTimes(0)
  })
})

describe(`${cache.getAll.name}`, () => {
  test('returns a promise', () => {
    const result = cache.getAll()

    expect(result).toBeInstanceOf(Promise)
  })

  test('given empty cache, resolves to empty array', async () => {
    const result = cache.getAll()

    await expect(result).resolves.toEqual([])
  })

  test('resolves to cache entry array', async () => {
    await cache.set('test-entry1', 'value1')
    dateNow += 100
    await cache.set('test-entry2', 'value2')
    dateNow += 100
    await cache.set('test-entry3', 'value3')

    const result = cache.getAll()

    await expect(result).resolves.toEqual([
      { data: 'value1', lastUpdated: initialDateNow },
      { data: 'value2', lastUpdated: initialDateNow + 100 },
      { data: 'value3', lastUpdated: initialDateNow + 200 }
    ])
  })

  test('does not call update function', async () => {
    await cache.set('test-entry1', 'value1')
    await cache.set('test-entry2', 'value2')

    await cache.getAll()

    expect(getTestDataFn).toBeCalledTimes(0)
  })
})

describe(`${cache.clear.name}`, () => {
  test('returns a promise', () => {
    const result = cache.clear()

    expect(result).toBeInstanceOf(Promise)
  })

  test('resolves to undefined', async () => {
    const result = cache.clear()

    await expect(result).resolves.toBeUndefined()
  })

  test('removes all entries from cache', async () => {
    await cache.set('test-entry1', 'value1')
    await cache.set('test-entry2', 'value2')
    await cache.set('test-entry3', 'value3')

    await cache.clear()

    const result = cache.getAll()
    await expect(result).resolves.toEqual([])
  })
})

describe(`${cache.get.name}`, () => {
  test('returns a promise', () => {
    const result = cache.get('test-entry', 0, 'value')

    expect(result).toBeInstanceOf(Promise)
  })

  test('resolves to cache entry', async () => {
    const result = cache.get('test-entry', 0, 'value')

    await expect(result).resolves.toEqual({ data: 'value', lastUpdated: dateNow })
  })

  test('rejects if update function throw error', async () => {
    const result = cache.get('test-entry', 0, 'value', { shouldThrow: true })

    await expect(result).rejects.toThrowError('error')
  })

  test("calls update function if entry doesn't exist", async () => {
    await cache.get('test-entry', 0, 'value')

    expect(getTestDataFn).toBeCalledTimes(1)
  })

  test('passes arguments to update function', async () => {
    await cache.get('test-entry', 0, 'value')

    expect(getTestDataFn).toBeCalledWith('value')
  })

  test('does not call update function if recent entry exists', async () => {
    await cache.get('test-entry', 0, 'value1')

    await cache.get('test-entry', 100, 'value2')

    expect(getTestDataFn).toBeCalledTimes(1)
    expect(getTestDataFn).toBeCalledWith('value1')
  })

  test('calls update function if entry exists but is not recent', async () => {
    await cache.get('test-entry', 0, 'value1')
    dateNow += 10000

    await cache.get('test-entry', 10000, 'value2')

    expect(getTestDataFn).toBeCalledTimes(2)
    expect(getTestDataFn).toBeCalledWith('value1')
    expect(getTestDataFn).toBeCalledWith('value2')
  })

  test('always calls update function if maxAge is zero', async () => {
    await cache.get('test-entry', 0, 'value1')

    await cache.get('test-entry', 0, 'value2')

    expect(getTestDataFn).toBeCalledTimes(2)
    expect(getTestDataFn).toBeCalledWith('value1')
    expect(getTestDataFn).toBeCalledWith('value2')
  })
})
