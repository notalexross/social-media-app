import type firebase from 'firebase'
import React, { createContext } from 'react'
import type { User } from '../services/firebase'
import { useAuthListener, useUser } from '../hooks'

type UserContextValue = {
  user: Partial<firebase.User>
} & Partial<User>

const UserContext = createContext<UserContextValue>({ user: {} })

function UserContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const user = useAuthListener()
  const userDetails = useUser(user.uid, {
    subscribe: true,
    includePrivate: true,
    includeFollowing: true,
    includeLikedPosts: true
  })

  return <UserContext.Provider value={{ user, ...userDetails }}>{children}</UserContext.Provider>
}

export { UserContext, UserContextProvider }
