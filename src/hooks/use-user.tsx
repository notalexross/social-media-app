import { useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import {
  getCachedUserById,
  getCachedUserByUsername,
  onUserByIdUpdated,
  onUserByUsernameUpdated
} from '../services/firebase'
import { stringifyError } from '../utils'

type UseUserOptions = {
  by?: string
  maxAge?: number
  subscribe?: boolean
  includePrivate?: boolean
  includeFollowing?: boolean
  includeLikedPosts?: boolean
  errorCallback?: (error: string) => void
}

export default function useUser(
  uidOrUsername: string | undefined,
  {
    by = 'uid',
    maxAge = 0,
    subscribe = false,
    includePrivate = false,
    includeFollowing = false,
    includeLikedPosts = false,
    errorCallback
  }: UseUserOptions = {}
): Partial<User> {
  const [userDetails, setUserDetails] = useState<Partial<User>>({})

  useEffect(() => {
    let isCurrent = true

    if (uidOrUsername) {
      const handleError = (error: unknown) => {
        if (isCurrent && errorCallback) {
          errorCallback(stringifyError(error))
        }
      }

      if (by === 'uid') {
        const uid = uidOrUsername

        if (subscribe) {
          return onUserByIdUpdated(
            uid,
            changes => setUserDetails(state => ({ ...state, ...changes })),
            {
              includePrivate,
              includeFollowing,
              includeLikedPosts,
              errorCallback: handleError
            }
          )
        }

        getCachedUserById(uid, maxAge, {
          includePrivate,
          includeFollowing,
          includeLikedPosts
        })
          .then(data => isCurrent && setUserDetails(data))
          .catch(handleError)
      } else {
        const username = uidOrUsername

        if (subscribe) {
          return onUserByUsernameUpdated(
            username,
            changes => setUserDetails(state => ({ ...state, ...changes })),
            {
              includePrivate,
              includeFollowing,
              includeLikedPosts,
              errorCallback: handleError
            }
          )
        }

        getCachedUserByUsername(username, maxAge, {
          includePrivate,
          includeFollowing,
          includeLikedPosts
        })
          .then(data => isCurrent && setUserDetails(data))
          .catch(handleError)
      }
    } else {
      setUserDetails({})
    }

    return () => {
      isCurrent = false
    }
  }, [
    by,
    errorCallback,
    includeFollowing,
    includeLikedPosts,
    includePrivate,
    maxAge,
    subscribe,
    uidOrUsername
  ])

  return userDetails
}
