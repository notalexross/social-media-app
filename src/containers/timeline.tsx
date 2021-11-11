import type { PostOrPostId } from '../services/firebase'
import PostContainer from './post'
import { useInfiniteScrolling } from '../hooks'

type TimelineContainerProps = {
  posts: PostOrPostId[] | null
  loadNextPage: () => Promise<void>
  isComplete: boolean
  isLoadingPosts?: boolean
  error?: string
  showSkeletonWhenPostsNull?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function TimelineContainer({
  posts,
  loadNextPage,
  isComplete,
  isLoadingPosts = false,
  error = '',
  showSkeletonWhenPostsNull = false,
  ...restProps
}: TimelineContainerProps): JSX.Element {
  const [intersectRef, loader] = useInfiniteScrolling(
    posts,
    loadNextPage,
    isComplete,
    isLoadingPosts,
    !!error
  )

  let timelineInner: JSX.Element
  if (posts === null && showSkeletonWhenPostsNull) {
    timelineInner = <PostContainer className="mb-2 border rounded bg-clr-secondary lg:mb-8" />
  } else if (!posts) {
    timelineInner = <></>
  } else if (!posts.length) {
    timelineInner = <p className="text-2xl text-center">There are no posts to show here.</p>
  } else {
    timelineInner = (
      <>
        {posts.map(post => (
          <PostContainer
            className="mb-2 border rounded bg-clr-secondary shadow lg:mb-8"
            key={typeof post === 'string' ? post : post.id}
            post={post}
            commentsLimit={1}
            maxDepth={1}
          />
        ))}
        <div ref={intersectRef} />
        <div className="mb-2 lg:mb-8">{loader}</div>
      </>
    )
  }

  return <div {...restProps}>{timelineInner}</div>
}
