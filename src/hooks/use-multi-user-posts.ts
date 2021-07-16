import { useEffect, useState } from 'react'
import type { PostsStatus, PostWithId } from '../services/firebase'
import { getMultiUserPosts } from '../services/firebase'

export default function useMultiUserPosts(uids: string[] | undefined): {
  posts: PostWithId[] | null
  loadNextPage: () => Promise<void>
  isComplete: boolean
  isLoadingPosts: boolean
} {
  const [status, setStatus] = useState<PostsStatus>({
    posts: null,
    isComplete: true,
    currentPage: 0,
    statistics: { fetchCount: 0, docReadCount: 0, chunks: 0, users: 0 }
  })
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [loadNextPage, setLoadNextPage] = useState<() => Promise<void>>(() => Promise.resolve())
  const { posts, isComplete } = status

  useEffect(() => {
    let isCurrent = true

    if (uids) {
      const loadNextPageFunction = getMultiUserPosts(
        uids,
        data => isCurrent && setStatus(data),
        data => isCurrent && setIsLoadingPosts(data),
        10
      )
      setLoadNextPage(() => loadNextPageFunction)
      loadNextPageFunction().catch(console.error)
    }

    return () => {
      isCurrent = false
    }
  }, [uids])

  return { posts, loadNextPage, isComplete, isLoadingPosts }
}
