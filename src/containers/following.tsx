import { useContext, useEffect, useState } from 'react'
import { UserContext } from '../context/user'
import UserListContainer from './user-list'
import { useInfiniteScrolling, usePagination } from '../hooks'

export default function FollowingContainer(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
): JSX.Element {
  const { following } = useContext(UserContext)
  const [renderedFollowing, setRenderedFollowing] = useState<string[]>()
  const loadedFollowing = following !== undefined
  const [entries, loadNextPage, isComplete] = usePagination(renderedFollowing, 10)
  const [intersectRef, loader] = useInfiniteScrolling(entries, loadNextPage, isComplete)

  useEffect(() => {
    if (loadedFollowing && following) {
      setRenderedFollowing(following)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedFollowing])

  if (!renderedFollowing || !entries) {
    return <></>
  }

  return renderedFollowing.length ? (
    <div {...props}>
      <UserListContainer users={entries} />
      <div ref={intersectRef} />
      {loader}
    </div>
  ) : (
    <p className="text-2xl text-center">You aren&apos;t following anyone yet.</p>
  )
}
