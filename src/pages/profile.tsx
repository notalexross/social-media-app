import { useContext, useState } from 'react'
import { Redirect, useParams } from 'react-router-dom'
import { useTitle, useMultiUserPosts, useUser } from '../hooks'
import { UserProfile } from '../components'
import { TimelineContainer, SidebarContainer } from '../containers'
import { formatDateTime, timestampToMillis } from '../utils'
import * as ROUTES from '../constants/routes'
import { UserContext } from '../context/user'

export default function ProfilePage(): JSX.Element {
  useTitle('Profile')
  const params = useParams<{ username: string }>()
  const currentUser = useContext(UserContext)
  const [userError, setUserError] = useState<string>()
  const user = useUser(params.username, { by: 'username', subscribe: true, errorCallback: setUserError })
  const { uid } = user
  const { posts, loadNextPage, isComplete, isLoadingPosts, error } = useMultiUserPosts(
    uid,
    uid ? [uid] : undefined,
    2
  )

  if (userError) {
    return <Redirect to={ROUTES.NOT_FOUND} />
  } else if (!uid) {
    return <></>
  }

  const { createdAt, lastPostedAt, followersCount } = user
  const created = createdAt && formatDateTime(new Date(timestampToMillis(createdAt)))[2]
  const lastPosted = lastPostedAt && formatDateTime(new Date(timestampToMillis(lastPostedAt)))[2]
  const isCurrentUser = uid === currentUser.uid
  const avatar = isCurrentUser ? currentUser.avatar : user.avatar
  const username = isCurrentUser ? currentUser.username : user.username
  const timelinePosts = posts?.map(post => ({
    ...post,
    ownerDetails: {
      ...post.ownerDetails,
      avatar,
      username
    }
  })) || null

  return (
    <main className="mx-4 lg:mx-4">
      <div className="mx-auto max-w-screen-lg">
        <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
          <div className="col-span-3 flex justify-center mb-2 border rounded bg-white sm:justify-start lg:mb-8">
            <UserProfile
              className="flex flex-col items-center p-4 text-center sm:flex-row lg:p-8 sm:text-left"
              user={isCurrentUser ? currentUser : user}
              noLinks
            >
              <UserProfile.Avatar className="mb-3 w-40 sm:mb-0 sm:mr-8" updatable={isCurrentUser} />
              <div>
                <div className="flex flex-col mb-2">
                  <UserProfile.Username className="font-bold text-lg sm:text-xl lg:text-2xl" />
                  <div className="w-max mx-auto text-gray-500 sm:mx-0">
                    {isCurrentUser ? (
                      <UserProfile.FullName className="hover:underline" title="Not visible to other users" />
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
              </div>
            </UserProfile>
          </div>
          <TimelineContainer
            className="col-span-3 lg:col-span-2"
            posts={timelinePosts}
            loadNextPage={loadNextPage}
            isComplete={isComplete}
            isLoadingPosts={isLoadingPosts}
            error={error}
          />
          <SidebarContainer className="hidden self-start col-span-3 mb-2 lg:block lg:sticky lg:top-4 lg:col-span-1" />
        </div>
      </div>
    </main>
  )
}
