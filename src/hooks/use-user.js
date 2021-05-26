import { useEffect, useState } from 'react'
import { getUserById, onUserUpdated } from '../services/firebase'

export default function useUser(
  uid,
  {
    subscribe = false,
    includePrivate = false,
    includeFollowing = false,
    includeLikedPosts = false
  } = {}
) {
  const [userDetails, setUserDetails] = useState({})

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

      getUserById(uid, { includePrivate, includeFollowing, includeLikedPosts })
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
