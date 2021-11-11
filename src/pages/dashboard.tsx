import { useContext } from 'react'
import { UserContext } from '../context/user'
import { TimelineContainer, SidebarContainer } from '../containers'
import { useMultiUserPosts, useTitle } from '../hooks'

type DashboardPageProps = {
  timeline: 'master' | 'following'
}

export default function DashboardPage({ timeline }: DashboardPageProps): JSX.Element {
  useTitle('Dashboard')
  const { uid, following } = useContext(UserContext)
  const { posts, loadNextPage, isComplete, isLoadingPosts, error } = useMultiUserPosts(
    timeline === 'master' ? null : following,
    2
  )
  const showTimeline = timeline === 'master' || (timeline === 'following' && uid)

  return (
    <main className="mx-2 lg:mx-4">
      <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
        {showTimeline ? (
          <TimelineContainer
            className="col-span-3 lg:col-span-2"
            posts={posts}
            loadNextPage={loadNextPage}
            isComplete={isComplete}
            isLoadingPosts={isLoadingPosts}
            error={error}
            showSkeletonWhenPostsNull
          />
        ) : (
          <div className="hidden col-span-3 lg:col-span-2 lg:block">
            <p className="text-2xl text-center">Sign in to follow other users.</p>
          </div>
        )}
        <SidebarContainer
          className={`self-start order-first col-span-3 mb-2 lg:sticky lg:top-4 lg:order-1 lg:col-span-1 ${
            showTimeline ? 'hidden lg:block' : ''
          }`}
        />
      </div>
    </main>
  )
}
