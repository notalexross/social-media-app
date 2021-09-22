import { useParams } from 'react-router-dom'
import { PostContainer, SidebarContainer } from '../containers'
import { usePosts } from '../hooks'

type PostPageProps = {
  compose?: boolean
}

export default function PostPage({ compose = false }: PostPageProps): JSX.Element {
  const { postId } = useParams<{ postId: string }>()
  const post = usePosts(postId, { subscribe: true })

  return (
    <main className="mx-2 lg:mx-4">
      <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
        <div className="col-span-3 lg:col-span-2">
          <PostContainer
            post={post || undefined}
            commentsLimit={3}
            maxDepth={1}
            compose={compose}
            isPostPage
          />
        </div>
        <SidebarContainer className="self-start order-first col-span-3 mb-2 lg:sticky lg:top-4 lg:order-1 lg:col-span-1" />
      </div>
    </main>
  )
}
