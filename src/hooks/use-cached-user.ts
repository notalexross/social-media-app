import { useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import { getCachedUser } from '../services/firebase'

export default function useCachedUser(
  uid: string | null,
  maxAge: number
): Partial<User> {
  const [user, setUser] = useState<Partial<User>>({})

  useEffect(() => {
    if (uid) {
      getCachedUser(uid, maxAge).then(setUser).catch(console.error)
    } else {
      setUser({})
    }
  }, [uid, maxAge])

  return user
}
