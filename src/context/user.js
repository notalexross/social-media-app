import { createContext } from 'react'
import { useAuthListener, useUser } from '../hooks'

const UserContext = createContext()

function UserContextProvider({ children }) {
  const { user } = useAuthListener()
  const userDetails = useUser(user.uid, {
    subscribe: true,
    includePrivate: true,
    includeFollowing: true,
    includeLikedPosts: true
  })

  return <UserContext.Provider value={{ user, ...userDetails }}>{children}</UserContext.Provider>
}

export { UserContext, UserContextProvider }
