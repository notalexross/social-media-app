import { useContext, useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import { getSuggestedUsers } from '../services/firebase'
import { UserContext } from '../context/user'
import { UserProfile } from '../components'
import { useWindowDimensions } from '../hooks'
import UserListContainer from './user-list'

export default function SidebarContainer(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
): JSX.Element {
  const user = useContext(UserContext)
  const { uid, following } = user
  const [, windowHeight] = useWindowDimensions()
  const [suggestions, setSuggestions] = useState<User[]>([])
  const loadedFollowing = following !== undefined

  useEffect(() => {
    if (uid && loadedFollowing && following) {
      getSuggestedUsers(uid, {
        exclude: [uid, ...following],
        max: 10,
        fractionLatestPosters: 0.5
      })
        .then(setSuggestions)
        .catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedFollowing, uid])

  return (
    <div {...props}>
      <div className="border rounded bg-white">
        <div className="flex flex-col" style={{ maxHeight: `calc(${windowHeight}px - 2 * 1rem)` }}>
          <UserProfile className="flex items-center p-4" user={user}>
            <UserProfile.Avatar className="mr-4 w-12" linkClassName="hover:opacity-70" />
            <div className="flex flex-col">
              <UserProfile.Username className="font-bold" linkClassName="hover:underline" />
              <UserProfile.FullName className="text-sm" />
            </div>
          </UserProfile>
          {suggestions.length ? (
            <div className="py-3 border-t flex-grow-1 overflow-auto lg:py-4">
              <h3 className="px-3 lg:px-4">Recommendations</h3>
              <UserListContainer users={suggestions} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
