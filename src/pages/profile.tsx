import { useContext } from 'react'
import { Redirect, useParams } from 'react-router-dom'
import { useTitle, useMultiUserPosts, usePostsLive, useUser } from '../hooks'
import { UserProfile } from '../components'
import { TimelineContainer, SidebarContainer } from '../containers'
import { formatDateTime, timestampToMillis } from '../utils'
import * as ROUTES from '../constants/routes'
import { UserContext } from '../context/user'

export default function ProfilePage(): JSX.Element {
  useTitle('Profile')
  const params = useParams<{ username: string }>()
  const currentUser = useContext(UserContext)
  const user = useUser(params.username, { by: 'username', subscribe: true })
  const uid = !('error' in user) && user.uid ? user.uid : undefined
  const { posts, loadNextPage, isComplete, isLoadingPosts } = useMultiUserPosts(
    uid,
    uid ? [uid] : undefined,
    2
  )
  const isCurrentUser = uid === currentUser.uid
  const postsLive = usePostsLive(posts)

  if ('error' in user) {
    return <Redirect to={ROUTES.NOT_FOUND} />
  } else if (!uid) {
    return <></>
  }

  const { createdAt, lastPostedAt, followersCount } = user
  const created = createdAt && formatDateTime(new Date(timestampToMillis(createdAt)))[2]
  const lastPosted = lastPostedAt && formatDateTime(new Date(timestampToMillis(lastPostedAt)))[2]
  const avatar = isCurrentUser ? currentUser.avatar : user.avatar
  const username = isCurrentUser ? currentUser.username : user.username
  const timelinePosts =
    postsLive?.map(postLive => ({
      ...postLive,
      ownerDetails: {
        ...postLive.ownerDetails,
        avatar,
        username
      }
    })) || null

  return (
    <main className="mx-4 lg:mx-4">
      <div className="mx-auto max-w-screen-lg">
        <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
          <div className="col-span-3">
            <UserProfile
              className="flex mb-2 p-4 border rounded bg-white lg:mb-8 lg:p-8"
              user={isCurrentUser ? currentUser : user}
              noLinks
            >
              <UserProfile.Avatar className="flex-shrink-0 w-20 mr-8 lg:w-40" updatable={isCurrentUser} />
              <div className="flex-grow">
                <div className="flex flex-col mb-3">
                  <UserProfile.Username className="font-bold text-xl lg:text-2xl" />
                  <div className="w-max text-gray-500 hover:underline">
                    {isCurrentUser ? (
                      <UserProfile.FullName title="Not visible to other users" />
                    ) : (
                      <UserProfile.FollowButton />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex mb-3">
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
            </UserProfile>
          </div>
          <TimelineContainer
            className="col-span-3 lg:col-span-2"
            posts={timelinePosts}
            loadNextPage={loadNextPage}
            isComplete={isComplete}
            isLoadingPosts={isLoadingPosts}
          />
          <SidebarContainer className="hidden self-start col-span-3 mb-2 lg:block lg:sticky lg:top-4 lg:col-span-1" />
        </div>
      </div>
    </main>
  )
}
