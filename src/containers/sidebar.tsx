import { useContext } from 'react'
import { UserContext } from '../context/user'
import { UserProfile } from '../components'
import { useWindowDimensions } from '../hooks'
import RecommendationsContainer from './recommendations'

export default function SidebarContainer(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
): JSX.Element {
  const user = useContext(UserContext)
  const [, windowHeight] = useWindowDimensions()

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
          <RecommendationsContainer
            className="py-3 border-t flex-grow-1 overflow-auto lg:py-4"
            max={10}
          >
            <h3 className="px-3 lg:px-4">Recommendations</h3>
          </RecommendationsContainer>
        </div>
      </div>
    </div>
  )
}
