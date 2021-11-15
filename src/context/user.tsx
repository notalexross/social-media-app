import type firebase from 'firebase'
import { createContext } from 'react'
import type { User } from '../services/firebase'
import useAuthListener from '../hooks/use-auth-listener'
import useUser from '../hooks/use-user'

type UserContextValue = {
  user: Partial<firebase.User>
  isLoadingAuth: boolean
  isLoadingUser: boolean
} & Partial<User>

const UserContext = createContext<UserContextValue>({
  user: {},
  isLoadingAuth: true,
  isLoadingUser: true
})

function UserContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, isLoading: isLoadingAuth } = useAuthListener()
  const userDetails = useUser(user.uid, {
    subscribe: true,
    includePrivate: true,
    includeFollowing: true,
    includeLikedPosts: true
  })

  const isLoadingUser = isLoadingAuth || (user.uid !== undefined && !userDetails)

  return (
    <UserContext.Provider value={{ user, ...userDetails, isLoadingAuth, isLoadingUser }}>
      {children}
    </UserContext.Provider>
  )
}

export { UserContext, UserContextProvider }
