import TimelineContainer from './timeline'
import { usePagination } from '../hooks'

type PaginatedPostsTimelineContainerProps = {
  postIds: string[] | undefined
  postsPerPage?: number
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function PaginatedPostsTimelineContainer({
  postIds,
  postsPerPage = 10,
  ...restProps
}: PaginatedPostsTimelineContainerProps): JSX.Element {
  const [entries, loadNextPage, isComplete] = usePagination(postIds, postsPerPage)

  if (!postIds) {
    return <></>
  }

  return (
    <TimelineContainer
      posts={entries}
      loadNextPage={loadNextPage}
      isComplete={isComplete}
      {...restProps}
    />
  )
}
