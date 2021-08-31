import { useContext } from 'react'
import { UserContext } from '../context/user'
import { TimelineContainer, SidebarContainer } from '../containers'
import { Header } from '../components'
import { useMultiUserPosts, usePostsLive, useTitle } from '../hooks'

export default function DashboardPage(): JSX.Element {
  useTitle('Dashboard')
  const { following } = useContext(UserContext)
  const { posts, loadNextPage, isComplete, isLoadingPosts } = useMultiUserPosts(following, 2)
  const postsLive = usePostsLive(posts)

  return (
    <>
      <Header />
      <main className="mx-2 lg:mx-4">
        <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
          <TimelineContainer
            className="col-span-3 lg:col-span-2"
            posts={postsLive}
            loadNextPage={loadNextPage}
            isComplete={isComplete}
            isLoadingPosts={isLoadingPosts}
          />
          <SidebarContainer className="self-start order-first col-span-3 mb-2 lg:sticky lg:top-4 lg:order-1 lg:col-span-1" />
        </div>
      </main>
    </>
  )
}
