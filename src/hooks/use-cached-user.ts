import { useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import { getCachedUser } from '../services/firebase'

export default function useCachedUser(uid: string | null, maxAge = 10000): Partial<User> {
  const [user, setUser] = useState<Partial<User>>({})

  useEffect(() => {
    let isCurrent = true

    if (uid) {
      getCachedUser(uid, maxAge)
        .then(data => isCurrent && setUser(data))
        .catch(console.error)
    } else {
      setUser({})
    }

    return () => {
      isCurrent = false
    }
  }, [uid, maxAge])

  return user
}
