import type firebase from 'firebase'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from '../services/firebase'

export default function useAuthListener(): Partial<firebase.User> {
  const [user, setUser] = useState<Partial<firebase.User>>({})

  useEffect(() => onAuthStateChanged(setUser), [])

  return user
}
