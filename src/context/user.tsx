import type firebase from 'firebase'
import { createContext } from 'react'
import type { User } from '../services/firebase'
import useAuthListener from '../hooks/use-auth-listener'
import useUser from '../hooks/use-user'

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
