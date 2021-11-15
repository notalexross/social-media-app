import type firebase from 'firebase'
import { createContext, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import type { User } from '../services/firebase'
import useAuthListener from '../hooks/use-auth-listener'
import useUser from '../hooks/use-user'
import * as ROUTES from '../constants/routes'

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
  const history = useHistory()
  const isLoggedIn = useRef(false)
  const { user, isLoading: isLoadingAuth } = useAuthListener()
  const userDetails = useUser(user.uid, {
    subscribe: true,
    includePrivate: true,
    includeFollowing: true,
    includeLikedPosts: true
  })

  const isLoadingUser = isLoadingAuth || (user.uid !== undefined && !userDetails)

  useEffect(() => {
    if (isLoggedIn.current) {
      history.push(ROUTES.SIGN_IN)
    }

    isLoggedIn.current = user.uid !== undefined
  }, [history, user])

  return (
    <UserContext.Provider value={{ user, ...userDetails, isLoadingAuth, isLoadingUser }}>
      {children}
    </UserContext.Provider>
  )
}

export { UserContext, UserContextProvider }
