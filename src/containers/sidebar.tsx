import { useContext } from 'react'
import { UserContext } from '../context/user'
import { Avatar, StatefulLink, UserProfile } from '../components'
import { useWindowDimensions } from '../hooks'
import RecommendationsContainer from './recommendations'
import * as ROUTES from '../constants/routes'

export default function SidebarContainer(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
): JSX.Element {
  const user = useContext(UserContext)
  const { uid } = user
  const [, windowHeight] = useWindowDimensions()

  return (
    <div {...props}>
      <div className="border rounded bg-clr-secondary shadow">
        <div className="flex flex-col" style={{ maxHeight: `calc(${windowHeight}px - 2 * 1rem)` }}>
          {uid ? (
            <UserProfile className="flex items-center p-4" user={user}>
              <UserProfile.Avatar className="mr-4 w-12" linkClassName="hover:opacity-70" />
              <div className="flex flex-col">
                <UserProfile.Username
                  className="font-bold"
                  linkClassName="hover:underline focus:underline"
                />
                <UserProfile.FullName className="text-sm" />
              </div>
            </UserProfile>
          ) : (
            <div className="flex items-center p-4">
              <StatefulLink
                className="mr-4 w-12 hover:opacity-70 focus:opacity-70"
                to={ROUTES.SIGN_IN}
                aria-label="Sign in"
              >
                <Avatar src={null} alt="Anonymous user avatar" />
              </StatefulLink>
              <div className="flex flex-col items-start">
                <StatefulLink
                  className="font-bold hover:underline focus:underline"
                  to={ROUTES.SIGN_IN}
                >
                  Anonymous User
                </StatefulLink>
                <StatefulLink
                  className="text-sm hover:underline focus:underline"
                  to={ROUTES.SIGN_IN}
                >
                  Sign in
                </StatefulLink>
              </div>
            </div>
          )}
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
