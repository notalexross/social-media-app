import { useParams } from 'react-router-dom'
import { PostContainer } from '../containers'
import { Header } from '../components'
import { usePosts, usePostsLive } from '../hooks'

type PostPageProps = {
  compose?: boolean
}

export default function PostPage({ compose = false }: PostPageProps): JSX.Element {
  const { postId } = useParams<{ postId: string }>()
  const postSnaphot = usePosts(postId)
  const post = usePostsLive(postSnaphot || null)

  return (
    <>
      <Header />
      <main className="mx-4">
        <div className="grid grid-cols-3 gap-4 mx-auto max-w-screen-lg">
          <div className="col-span-2">
            <PostContainer
              post={post || undefined}
              commentsLimit={3}
              maxDepth={1}
              compose={compose}
              isPostPage
            />
          </div>
        </div>
      </main>
    </>
  )
}
