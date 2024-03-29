type CacheEntry<T> = { data: T } & { lastUpdated: number }

type CacheStructure<T> = Record<string, Promise<CacheEntry<T> | undefined> | undefined>

export default class SelfUpdatingCache<T, U extends unknown[]> {
  private indexedDB: IDBFactory = window.indexedDB
  private db: IDBDatabase | undefined
  private cache: CacheStructure<T> = {}

  constructor(public name: string, private updater: (...args: U) => Promise<T>) {
    this.initDB().catch(console.error)
  }

  private async getDB() {
    if (this.db) {
      return this.db
    }

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.indexedDB.open(this.name, 1)

      request.onsuccess = () => {
        const db = request.result
        db.onerror = event => {
          console.error(((event.target as unknown) as { error: Error })?.error)
        }

        resolve(db)
      }

      request.onerror = () => {
        reject(request.error)
      }

      request.onupgradeneeded = () => {
        const db = request.result
        db.createObjectStore(this.name)
      }
    })
  }

  private async initDB() {
    this.db = await this.getDB()
  }

  private async updateDBEntry(key: string, value: CacheEntry<T>) {
    const db = await this.getDB()
    const transaction = db.transaction(this.name, 'readwrite')
    const objectStore = transaction.objectStore(this.name)
    objectStore.put(value, key)
  }

  private getDBEntry(key: string) {
    return new Promise<CacheEntry<T> | undefined>((resolve, reject) => {
      this.getDB()
        .then(db => {
          const transaction = db.transaction(this.name)
          const objectStore = transaction.objectStore(this.name)
          const request = objectStore.get(key)

          request.onsuccess = () => {
            resolve(request.result)
          }

          request.onerror = () => {
            reject(request.error)
          }
        })
        .catch(reject)
    })
  }

  private async getEntry(key: string, maxAge: number, ...args: U): Promise<CacheEntry<T>> {
    const cacheEntry = await this.cache[key]
    let entry: CacheEntry<T> | undefined

    if (cacheEntry) {
      entry = cacheEntry
    } else {
      entry = await this.getDBEntry(key)
    }

    if (!entry || entry.lastUpdated + maxAge <= Date.now()) {
      const data = await this.updater(...args)
      const lastUpdated = Date.now()
      entry = { data, lastUpdated }
      await this.updateDBEntry(key, entry)
    }

    return entry
  }

  async get(key: string, maxAge: number, ...args: U): Promise<CacheEntry<T> | undefined> {
    this.cache[key] = new Promise<CacheEntry<T>>((resolve, reject) => {
      this.getEntry(key, maxAge, ...args)
        .then(resolve)
        .catch(error => {
          reject(error)
        })
    })

    const entry = await this.cache[key]

    return entry
  }

  getAll(): Promise<CacheEntry<T>[]> {
    return new Promise<CacheEntry<T>[]>((resolve, reject) => {
      this.getDB()
        .then(db => {
          const transaction = db.transaction(this.name)
          const objectStore = transaction.objectStore(this.name)
          const request = objectStore.getAll()

          request.onsuccess = () => {
            resolve(request.result)
          }

          request.onerror = () => {
            reject(request.error)
          }
        })
        .catch(reject)
    })
  }

  async set(key: string, data: T): Promise<CacheEntry<T> | undefined> {
    const lastUpdated = Date.now()
    const entry = { data, lastUpdated }

    this.cache[key] = new Promise<CacheEntry<T>>((resolve, reject) => {
      this.updateDBEntry(key, entry)
        .then(() => resolve(entry))
        .catch(error => {
          reject(error)
        })
    })

    return this.cache[key]
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB()
        .then(db => {
          const transaction = db.transaction(this.name, 'readwrite')
          const objectStore = transaction.objectStore(this.name)
          const request = objectStore.clear()

          request.onsuccess = () => {
            resolve(request.result)
          }

          request.onerror = () => {
            reject(request.error)
          }
        })
        .then(() => {
          this.cache = {}
        })
        .catch(reject)
    })
  }
}
