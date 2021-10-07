import TimelineContainer from './timeline'
import { useMultiUserPosts } from '../hooks'

type UserPostsTimelineContainerProps = {
  uid: string
  postsPerPage?: number
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function UserPostsTimelineContainer({
  uid,
  postsPerPage = 10,
  ...restProps
}: UserPostsTimelineContainerProps): JSX.Element {
  const { posts, loadNextPage, isComplete, isLoadingPosts, error } = useMultiUserPosts(
    uid ? [uid] : undefined,
    postsPerPage
  )

  return (
    <TimelineContainer
      posts={posts}
      loadNextPage={loadNextPage}
      isComplete={isComplete}
      isLoadingPosts={isLoadingPosts}
      error={error}
      {...restProps}
    />
  )
}
