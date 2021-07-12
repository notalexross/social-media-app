type CacheEntry<T> = T & { lastUpdated: number }

type CacheStructure<T> = Record<string, Promise<CacheEntry<T> | undefined> | undefined>

export default class SelfUpdatingCache<T extends Record<string, unknown>> {
  private indexedDB: IDBFactory = window.indexedDB
  private db: IDBDatabase | undefined
  private cache: CacheStructure<T> = {}

  constructor(public name: string, private updater: (key: string) => Promise<T>) {
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

  private async getEntry(key: string, maxAge: number): Promise<CacheEntry<T> | undefined> {
    const cacheEntry = await this.cache[key]
    let entry: CacheEntry<T> | undefined

    if (cacheEntry) {
      entry = cacheEntry
    } else {
      entry = await this.getDBEntry(key)
    }

    if (!entry || entry.lastUpdated + maxAge <= Date.now()) {
      const data = await this.updater(key)
      const lastUpdated = Date.now()
      entry = { ...data, lastUpdated }
      await this.updateDBEntry(key, entry)
    }

    return entry
  }

  async get(key: string, maxAge: number): Promise<CacheEntry<T> | undefined> {
    this.cache[key] = new Promise<CacheEntry<T> | undefined>(resolve => {
      this.getEntry(key, maxAge)
        .then(resolve)
        .catch(error => {
          console.error(error)
          resolve(undefined)
        })
    })

    const entry = await this.cache[key]

    return entry
  }
}
