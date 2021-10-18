import { useCallback, useContext } from 'react'
import { Link, Redirect, useHistory, useLocation, useParams } from 'react-router-dom'
import { useTitle, useUser } from '../hooks'
import { StatefulLink, UserProfile } from '../components'
import {
  SidebarContainer,
  RecommendationsContainer,
  FollowingContainer,
  UserPostsTimelineContainer,
  PaginatedPostsTimelineContainer
} from '../containers'
import { formatDateTime, timestampToMillis } from '../utils'
import * as ROUTES from '../constants/routes'
import { UserContext } from '../context/user'

export default function ProfilePage(): JSX.Element {
  useTitle('Profile')
  const { pathname } = useLocation()
  const { username } = useParams<{ username: string }>()
  const currentUser = useContext(UserContext)
  const history = useHistory()
  const handleError = useCallback(() => history.replace(ROUTES.NOT_FOUND), [history])
  const user = useUser(username, {
    by: 'username',
    subscribe: true,
    includeLikedPosts: true,
    errorCallback: handleError
  })
  const { uid, likedPosts } = user || {}
  const currentUsername = user?.username || username
  const linkClassName =
    'text-clr-primary hover:underline hover:text-clr-link-hover focus:text-clr-link-hover'

  if (!uid) {
    return <></>
  }

  const { createdAt, lastPostedAt, followersCount } = user || {}
  const created = createdAt && formatDateTime(new Date(timestampToMillis(createdAt)))[2]
  const lastPosted = lastPostedAt && formatDateTime(new Date(timestampToMillis(lastPostedAt)))[2]
  const isCurrentUser = uid === currentUser.uid
  const likes = likedPosts?.slice().reverse()

  const isPostsPath = pathname === `${ROUTES.PROFILES}/${username}${ROUTES.PROFILE_POSTS}`
  const isLikesPath = pathname === `${ROUTES.PROFILES}/${username}${ROUTES.PROFILE_LIKES}`
  const isFollowingPath = pathname === `${ROUTES.PROFILES}/${username}${ROUTES.PROFILE_FOLLOWING}`
  const isRecomPath = pathname === `${ROUTES.PROFILES}/${username}${ROUTES.PROFILE_RECOMMENDATIONS}`

  const isCurrentUserOnlyPath = isFollowingPath || isRecomPath
  const existsPath = isPostsPath || isLikesPath || isFollowingPath || isRecomPath
  const isValidPath = existsPath && (isCurrentUser || !isCurrentUserOnlyPath)

  if (!isValidPath) {
    return <Redirect to={`${ROUTES.PROFILES}/${currentUsername}`} />
  }

  return (
    <main className="mx-4 lg:mx-4">
      <div className="mx-auto max-w-screen-lg">
        <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
          <div className="col-span-3 flex justify-center mb-2 border rounded bg-clr-secondary shadow sm:justify-start lg:mb-8">
            <UserProfile
              className="flex flex-col items-center p-4 text-center sm:flex-row lg:p-8 sm:text-left"
              user={isCurrentUser ? currentUser : user}
              noLinks
            >
              <UserProfile.Avatar className="mb-3 w-40 sm:mb-0 sm:mr-8" updatable={isCurrentUser} />
              <div>
                <div className="flex flex-col mb-2">
                  <UserProfile.Username className="font-bold text-lg sm:text-xl lg:text-2xl" />
                  <div className="w-max mx-auto text-clr-primary text-opacity-75 sm:mx-0">
                    {isCurrentUser ? (
                      <UserProfile.FullName
                        className="hover:underline"
                        title="Not visible to other users"
                      />
                    ) : (
                      <UserProfile.FollowButton className="hover:underline" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-center mb-2 sm:justify-start sm:mb-0">
                    <p>
                      <span className="font-bold">{followersCount}</span>
                      <span>{` follower${followersCount === 1 ? '' : 's'}`}</span>
                    </p>
                    {isCurrentUser ? (
                      <p className="ml-4 hover:underline" title="Not visible to other users">
                        <span className="font-bold">{currentUser.following?.length || 0}</span>
                        <span>{' following'}</span>
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p>
                      <span className="font-bold">Created: </span>
                      <span>{created}</span>
                    </p>
                    <p>
                      <span className="font-bold">Last Posted: </span>
                      <span>{lastPosted}</span>
                    </p>
                  </div>
                </div>
                {isCurrentUser ? (
                  <StatefulLink
                    className="block mt-2 mx-auto w-max py-1 px-5 rounded bg-clr-accent font-bold text-sm text-clr-secondary sm:mx-0 hover:bg-clr-accent-hover focus:bg-clr-accent-hover"
                    to={`${ROUTES.PROFILES}/${currentUsername}${ROUTES.PROFILE_EDIT}`}
                    modal
                  >
                    Edit Details
                  </StatefulLink>
                ) : null}
              </div>
            </UserProfile>
          </div>
          <div className="col-span-3 lg:col-span-2">
            <div className="overflow-hidden mb-2 p-3 bg-clr-secondary border rounded font-bold shadow lg:mb-8 lg:p-4">
              <ul
                className="flex flex-wrap justify-center -mt-1 -ml-4 sm:justify-start"
                style={{ width: 'calc(100% + 1rem)' }}
              >
                <li className="mt-1 ml-4">
                  <Link
                    className={linkClassName}
                    to={`${ROUTES.PROFILES}/${currentUsername}${ROUTES.PROFILE_POSTS}`}
                  >
                    <span className={isPostsPath ? 'underline' : ''}>Posts</span>
                  </Link>
                </li>
                <li className="mt-1 ml-4">
                  <Link
                    className={linkClassName}
                    to={`${ROUTES.PROFILES}/${currentUsername}${ROUTES.PROFILE_LIKES}`}
                  >
                    <span className={isLikesPath ? 'underline' : ''}>Likes</span>
                  </Link>
                </li>
                {isCurrentUser ? (
                  <li className="mt-1 ml-4">
                    <Link
                      className={linkClassName}
                      to={`${ROUTES.PROFILES}/${currentUsername}${ROUTES.PROFILE_FOLLOWING}`}
                    >
                      <span className={isFollowingPath ? 'underline' : ''}>Following</span>
                    </Link>
                  </li>
                ) : null}
                {isCurrentUser ? (
                  <li className="mt-1 ml-4">
                    <Link
                      className={linkClassName}
                      to={`${ROUTES.PROFILES}/${currentUsername}${ROUTES.PROFILE_RECOMMENDATIONS}`}
                    >
                      <span className={isRecomPath ? 'underline' : ''}>Recommendations</span>
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
            {isPostsPath && <UserPostsTimelineContainer uid={uid} postsPerPage={2} />}
            {isLikesPath && <PaginatedPostsTimelineContainer postIds={likes} postsPerPage={2} />}
            {isFollowingPath && (
              <FollowingContainer className="mb-2 pb-3 border rounded bg-clr-secondary lg:mb-8 lg:pb-4" />
            )}
            {isRecomPath && (
              <RecommendationsContainer
                className="mb-2 pb-3 border rounded bg-clr-secondary lg:mb-8 lg:pb-4"
                emptyText="You don't currently have any recommendations."
                max={20}
                infiniteScroll
              />
            )}
          </div>
          <SidebarContainer className="hidden self-start col-span-3 mb-2 lg:block lg:sticky lg:top-4 lg:col-span-1" />
        </div>
      </div>
    </main>
  )
}
