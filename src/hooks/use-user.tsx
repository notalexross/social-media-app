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
  by?: 'uid' | 'username'
  maxAge?: number
  passthrough?: boolean
  subscribe?: boolean
  includePrivate?: boolean
  includeFollowing?: boolean
  includeLikedPosts?: boolean
  errorCallback?: (error: string) => void
}

export default function useUser(
  userOrUidOrUsername: string | User | undefined,
  {
    by = 'uid',
    maxAge = 0,
    passthrough = false,
    subscribe = false,
    includePrivate = false,
    includeFollowing = false,
    includeLikedPosts = false,
    errorCallback
  }: UseUserOptions = {}
): User | undefined {
  const isUser = userOrUidOrUsername !== undefined && typeof userOrUidOrUsername !== 'string'
  const hasPublic = isUser && 'createdAt' in userOrUidOrUsername
  const hasPrivate = isUser && 'email' in userOrUidOrUsername
  const hasFollowing = isUser && 'following' in userOrUidOrUsername
  const hasLikes = isUser && 'likedPosts' in userOrUidOrUsername
  const uidOrUsername = isUser ? userOrUidOrUsername.uid : userOrUidOrUsername
  const missingPublic = !hasPublic
  const missingPrivate = includePrivate && !hasPrivate
  const missingFollowing = includeFollowing && !hasFollowing
  const missingLikes = includeLikedPosts && !hasLikes
  const shouldUpdateUser =
    !passthrough &&
    uidOrUsername !== undefined &&
    (missingPublic || missingPrivate || missingFollowing || missingLikes || subscribe)

  const userState = isUser ? userOrUidOrUsername : undefined
  const [user, setUser] = useState<User | undefined>(userState)

  useEffect(() => {
    if (!userOrUidOrUsername) {
      setUser(undefined)
    }
  }, [userOrUidOrUsername])

  useEffect(() => {
    if (userState) {
      setUser(state => ({ ...state, ...userState }))
    }
  }, [userState])

  useEffect(() => {
    let isCurrent = true

    if (!passthrough) {
      if (shouldUpdateUser) {
        const handleError = (error: unknown) => {
          if (isCurrent && errorCallback) {
            errorCallback(stringifyError(error))
          }
        }

        const getOptions = { includePrivate, includeFollowing, includeLikedPosts }

        if (by === 'uid') {
          if (subscribe) {
            return onUserByIdUpdated(
              uidOrUsername,
              changes => setUser(state => ({ ...state, ...changes })),
              {
                ...getOptions,
                errorCallback: handleError
              }
            )
          }

          getCachedUserById(uidOrUsername, maxAge, getOptions)
            .then(data => isCurrent && setUser(data))
            .catch(handleError)
        } else {
          if (subscribe) {
            return onUserByUsernameUpdated(
              uidOrUsername,
              changes => setUser(state => ({ ...state, ...changes })),
              {
                ...getOptions,
                errorCallback: handleError
              }
            )
          }

          getCachedUserByUsername(uidOrUsername, maxAge, getOptions)
            .then(data => isCurrent && setUser(data))
            .catch(handleError)
        }
      }
    }

    return () => {
      isCurrent = false
    }
  }, [
    by,
    errorCallback,
    includePrivate,
    includeFollowing,
    includeLikedPosts,
    maxAge,
    passthrough,
    shouldUpdateUser,
    subscribe,
    uidOrUsername
  ])

  return user
}
