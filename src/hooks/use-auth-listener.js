import { useEffect, useState } from 'react'
import { onAuthStateChanged } from '../services/firebase'

export default function useAuthListener() {
  const [user, setUser] = useState({})

  useEffect(() => onAuthStateChanged(setUser), [])

  return { user }
}
