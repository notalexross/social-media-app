import { useEffect, useState } from 'react'
import { getMultiUserPosts } from '../services/firebase'
import type { PostsStatus, PostWithId } from '../services/firebase'

export default function usePosts(uids: string[] | undefined): {
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
    if (uids) {
      const loadNextPageFunction = getMultiUserPosts(uids, setStatus, setIsLoadingPosts, 10)
      setLoadNextPage(() => loadNextPageFunction)
      loadNextPageFunction().catch(console.error)
    }
  }, [uids])

  return { posts, loadNextPage, isComplete, isLoadingPosts }
}
