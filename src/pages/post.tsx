import { useCallback } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { PostContainer, SidebarContainer } from '../containers'
import * as ROUTES from '../constants/routes'

type PostPageProps = {
  compose?: boolean
}

export default function PostPage({ compose = false }: PostPageProps): JSX.Element {
  const { postId } = useParams<{ postId: string }>()
  const history = useHistory()

  const handleError = useCallback(() => {
    history.replace(ROUTES.NOT_FOUND)
  }, [history])

  return (
    <main className="mx-2 lg:mx-4">
      <div className="grid grid-cols-3 gap-x-4 mx-auto max-w-screen-lg">
        <div className="col-span-3 lg:col-span-2">
          <PostContainer
            post={postId}
            commentsLimit={3}
            maxDepth={1}
            compose={compose}
            isPostPage
            errorHandler={handleError}
          />
        </div>
        <SidebarContainer className="self-start order-first col-span-3 mb-2 lg:sticky lg:top-4 lg:order-1 lg:col-span-1" />
      </div>
    </main>
  )
}
