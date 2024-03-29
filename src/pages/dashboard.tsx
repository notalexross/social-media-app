import { useContext } from 'react'
import { UserContext } from '../context/user'
import { TimelineContainer, SidebarContainer } from '../containers'
import { useMultiUserPosts, useTitle } from '../hooks'

type DashboardPageProps = {
  timeline: 'master' | 'following'
}

export default function DashboardPage({ timeline }: DashboardPageProps): JSX.Element {
  useTitle('Dashboard')
  const { user, following, isLoadingAuth } = useContext(UserContext)
  const { posts, loadNextPage, isComplete, isLoadingPosts, error } = useMultiUserPosts(
    timeline === 'master' ? null : following,
    2
  )
  const { uid } = user
  const showTimeline = timeline === 'master' || (timeline === 'following' && uid !== undefined)
  const hideSkeleton = timeline === 'following' && (uid === undefined || !following?.length)

  let inner: JSX.Element
  if (showTimeline) {
    inner = (
      <TimelineContainer
        className="col-span-3 lg:col-span-2"
        posts={posts}
        loadNextPage={loadNextPage}
        isComplete={isComplete}
        isLoadingPosts={isLoadingPosts}
        error={error}
        showSkeletonWhenPostsNull={!hideSkeleton}
      />
    )
  } else if (!isLoadingAuth) {
    inner = (
      <div className="col-span-3 lg:col-span-2">
        <p className="text-2xl text-center">Sign in to follow other users.</p>
      </div>
    )
  } else {
    inner = <div className="col-span-3 lg:col-span-2" />
  }

  return (
    <main className="mx-2 lg:mx-4">
      <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
        {inner}
        <SidebarContainer className="self-start order-first col-span-3 mb-2 lg:sticky lg:top-4 lg:order-1 lg:col-span-1 hidden lg:block" />
      </div>
    </main>
  )
}
