import { useEffect, useState } from 'react'
import { getUserById, onUserUpdated } from '../services/firebase'

export default function useUser(uid, { includePrivate = false, subscribe = false } = {}) {
  const [userDetails, setUserDetails] = useState({})

  useEffect(() => {
    if (uid) {
      if (subscribe) {
        return onUserUpdated(uid, changes => setUserDetails(state => ({ ...state, ...changes })), {
          includePrivate
        })
      }

      getUserById(uid, { includePrivate }).then(setUserDetails)
    }

    return () => {}
  }, [includePrivate, subscribe, uid])

  return userDetails
}
