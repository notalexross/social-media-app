import type { PostWithUserDetails } from '../services/firebase'
import PostContainer from './post'

type TimelineContainerProps = {
  posts: PostWithUserDetails[] | null
  loadNextPage: () => Promise<void>
  isComplete: boolean
  isLoadingPosts: boolean
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function TimelineContainer({
  posts,
  loadNextPage,
  isComplete,
  isLoadingPosts,
  ...restProps
}: TimelineContainerProps): JSX.Element {
  let timelineInner: JSX.Element
  if (!posts) {
    timelineInner = <PostContainer className="mb-8 border rounded bg-white" />
  } else if (!posts.length) {
    timelineInner = <p className="text-2xl text-center">There are no posts to show here.</p>
  } else {
    timelineInner = (
      <>
        {posts.map(post => (
          <PostContainer
            className="mb-8 border rounded bg-white"
            key={post.id}
            post={post}
            commentsLimit={1}
            maxDepth={1}
          />
        ))}
        {!isComplete ? (
          <button
            className="block mx-auto mb-8 px-6 py-2 w-full border rounded bg-white hover:opacity-70"
            type="button"
            disabled={isLoadingPosts}
            onClick={loadNextPage}
          >
            Load More
          </button>
        ) : null}
      </>
    )
  }

  return <div {...restProps}>{timelineInner}</div>
}
