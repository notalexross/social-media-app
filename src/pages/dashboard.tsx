import { useContext } from 'react'
import { UserContext } from '../context/user'
import { TimelineContainer, SidebarContainer } from '../containers'
import { useMultiUserPosts, usePostsLive, useTitle } from '../hooks'

type DashboardPageProps = {
  timeline: 'master' | 'following'
}

export default function DashboardPage({ timeline }: DashboardPageProps): JSX.Element {
  useTitle('Dashboard')
  const { uid, following } = useContext(UserContext)
  const { posts, loadNextPage, isComplete, isLoadingPosts, error } = useMultiUserPosts(
    uid,
    timeline === 'master' ? null : following,
    2
  )
  const postsLive = usePostsLive(posts)

  return (
    <main className="mx-2 lg:mx-4">
      <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
        <div className="col-span-3 lg:col-span-2">
          <TimelineContainer
            posts={postsLive}
            loadNextPage={loadNextPage}
            isComplete={isComplete}
            isLoadingPosts={isLoadingPosts}
            error={error}
          />
        </div>
        <SidebarContainer className="self-start order-first col-span-3 mb-2 lg:sticky lg:top-4 lg:order-1 lg:col-span-1" />
      </div>
    </main>
  )
}
