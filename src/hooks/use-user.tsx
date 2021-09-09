import { useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import { getCachedUserById, onUserUpdated } from '../services/firebase'

export default function useUser(
  uid: string | undefined,
  {
    subscribe = false,
    includePrivate = false,
    includeFollowing = false,
    includeLikedPosts = false
  } = {}
): Partial<User> {
  const [userDetails, setUserDetails] = useState<Partial<User>>({})

  useEffect(() => {
    let isCurrent = true

    if (uid) {
      if (subscribe) {
        return onUserUpdated(uid, changes => setUserDetails(state => ({ ...state, ...changes })), {
          includePrivate,
          includeFollowing,
          includeLikedPosts
        })
      }

      getCachedUserById(uid, 0, { includePrivate, includeFollowing, includeLikedPosts })
        .then(data => isCurrent && setUserDetails(data))
        .catch(console.error)
    } else {
      setUserDetails({})
    }

    return () => {
      isCurrent = false
    }
  }, [includeFollowing, includeLikedPosts, includePrivate, subscribe, uid])

  return userDetails
}
