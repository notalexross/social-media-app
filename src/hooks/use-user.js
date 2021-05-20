import { useEffect, useState } from 'react'
import { getUserById, onUserUpdated } from '../services/firebase'

export default function useUser(uid, { includePrivate = false, subscribe = false } = {}) {
  const [userDetails, setUserDetails] = useState({})

  useEffect(() => {
    let isCurrent = true

    if (uid) {
      if (subscribe) {
        return onUserUpdated(uid, changes => setUserDetails(state => ({ ...state, ...changes })), {
          includePrivate
        })
      }

      getUserById(uid, { includePrivate }).then(data => isCurrent && setUserDetails(data))
    } else {
      setUserDetails({})
    }

    return () => {
      isCurrent = false
    }
  }, [includePrivate, subscribe, uid])

  return userDetails
}
