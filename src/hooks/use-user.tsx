import { useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import {
  getCachedUserById,
  getCachedUserByUsername,
  onUserByIdUpdated,
  onUserByUsernameUpdated
} from '../services/firebase'

export default function useUser(
  uidOrUsername: string | undefined,
  {
    by = 'uid',
    maxAge = 0,
    subscribe = false,
    includePrivate = false,
    includeFollowing = false,
    includeLikedPosts = false
  } = {}
): Partial<User> {
  const [userDetails, setUserDetails] = useState<Partial<User>>({})

  useEffect(() => {
    let isCurrent = true

    if (uidOrUsername) {
      if (by === 'uid') {
        const uid = uidOrUsername

        if (subscribe) {
          return onUserByIdUpdated(
            uid,
            changes => setUserDetails(state => ({ ...state, ...changes })),
            {
              includePrivate,
              includeFollowing,
              includeLikedPosts
            }
          )
        }

        getCachedUserById(uid, maxAge, {
          includePrivate,
          includeFollowing,
          includeLikedPosts
        })
          .then(data => isCurrent && setUserDetails(data))
          .catch(console.error)
      } else {
        const username = uidOrUsername

        if (subscribe) {
          return onUserByUsernameUpdated(
            username,
            changes => setUserDetails(state => ({ ...state, ...changes })),
            {
              includePrivate,
              includeFollowing,
              includeLikedPosts
            }
          )
        }

        getCachedUserByUsername(username, maxAge, {
          includePrivate,
          includeFollowing,
          includeLikedPosts
        })
          .then(data => isCurrent && setUserDetails(data))
          .catch(console.error)
      }
    } else {
      setUserDetails({})
    }

    return () => {
      isCurrent = false
    }
  }, [by, includeFollowing, includeLikedPosts, includePrivate, maxAge, subscribe, uidOrUsername])

  return userDetails
}
