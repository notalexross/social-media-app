import { useContext, useEffect, useState } from 'react'
import type { User } from '../services/firebase'
import { getSuggestedUsers } from '../services/firebase'
import { UserContext } from '../context/user'
import { useInfiniteScrolling, usePagination } from '../hooks'
import UserListContainer from './user-list'

type RecommendationsContainerProps = {
  emptyText?: string
  max?: number
  infiniteScroll?: boolean
} & React.ComponentPropsWithoutRef<'div'>

export default function RecommendationsContainer({
  children,
  emptyText,
  max = 10,
  infiniteScroll = false,
  ...restProps
}: RecommendationsContainerProps): JSX.Element {
  const user = useContext(UserContext)
  const { uid, following } = user
  const [suggestions, setSuggestions] = useState<User[]>()
  const loadedFollowing = following !== undefined
  const [entries, loadNextPage, isComplete] = usePagination(suggestions, 10)
  const [intersectRef, loader] = useInfiniteScrolling(entries, loadNextPage, isComplete)

  useEffect(() => {
    if (loadedFollowing) {
      getSuggestedUsers(uid || 'signed-out', {
        exclude: uid ? [uid, ...(following || [])] : following || [],
        max,
        fractionLatestPosters: 0.5
      })
        .then(setSuggestions)
        .catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedFollowing, max, uid])

  if (!entries || !suggestions) {
    return <></>
  }

  if (!suggestions.length) {
    if (emptyText) {
      return <p className="text-2xl text-center">{emptyText}</p>
    }

    return <></>
  }

  return (
    <div {...restProps}>
      {children}
      <UserListContainer users={infiniteScroll ? entries : suggestions} />
      {infiniteScroll ? (
        <>
          <div ref={intersectRef} />
          {loader}
        </>
      ) : null}
    </div>
  )
}
