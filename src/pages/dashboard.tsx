import { useContext } from 'react'
import { UserContext } from '../context/user'
import { TimelineContainer } from '../containers'
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
      <main className="mx-4">
        <div className="grid grid-cols-3 gap-4 mx-auto max-w-screen-lg">
          <TimelineContainer
            className="col-span-2"
            posts={postsLive}
            loadNextPage={loadNextPage}
            isComplete={isComplete}
            isLoadingPosts={isLoadingPosts}
          />
        </div>
      </main>
    </>
  )
}
