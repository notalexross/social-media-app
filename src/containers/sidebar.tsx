import { useContext, useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import { getSuggestedUsers } from '../services/firebase'
import { UserContext } from '../context/user'
import { UserProfile } from '../components'

export default function SidebarContainer(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
): JSX.Element {
  const user = useContext(UserContext)
  const { uid, following } = user
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
        <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 2 * 1rem)' }}>
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
              {suggestions.map(suggestion => (
                <UserProfile
                  className="flex justify-between items-center mt-3 px-3 text-sm min-w-min lg:mt-4 lg:px-4"
                  key={suggestion.uid}
                  user={suggestion}
                >
                  <div className="flex items-center">
                    <UserProfile.Avatar className="w-8 mr-3" linkClassName="hover:opacity-70" />
                    <UserProfile.Username linkClassName="hover:underline" />
                  </div>
                  <UserProfile.FollowButton className="ml-4 text-gray-500 hover:underline" />
                </UserProfile>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
