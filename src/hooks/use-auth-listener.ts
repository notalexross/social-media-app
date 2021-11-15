import type firebase from 'firebase'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from '../services/firebase'

export default function useAuthListener(): { user: Partial<firebase.User>; isLoading: boolean } {
  const [user, setUser] = useState<Partial<firebase.User>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const callback = (response: Partial<firebase.User>) => {
      setUser(response)
      setIsLoading(false)
    }

    return onAuthStateChanged(callback)
  }, [])

  return { user, isLoading }
}
