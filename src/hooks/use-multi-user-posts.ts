import { useEffect, useRef, useState } from 'react'
import type { PostsStatus, PostWithUserDetails } from '../services/firebase'
import { getMultiUserPosts } from '../services/firebase'

type MultiUserPosts = {
  posts: PostWithUserDetails[] | null
  loadNextPage: () => Promise<void>
  isComplete: boolean
  isLoadingPosts: boolean
}

export default function useMultiUserPosts(
  uids: string[] | undefined,
  postsPerPage = 10
): MultiUserPosts {
  const [status, setStatus] = useState<PostsStatus>({
    posts: null,
    isComplete: true,
    page: 0,
    stats: { fetchCount: 0, docsFetchedCount: 0, docReadCount: 0, chunks: 0, users: 0 }
  })
  const isMounted = useRef(true)
  const isInitiated = useRef(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [loadNextPage, setLoadNextPage] = useState<() => Promise<void>>(() => Promise.resolve())
  const { posts, isComplete } = status

  useEffect(() => {
    isMounted.current = true
    if (uids && !isInitiated.current) {
      const loadNextPageFunction = getMultiUserPosts(
        uids,
        data => isMounted.current && setStatus(data),
        data => isMounted.current && setIsLoadingPosts(data),
        postsPerPage
      )
      setLoadNextPage(() => loadNextPageFunction)
      loadNextPageFunction().catch(console.error)
      isInitiated.current = true
    }

    return () => {
      isMounted.current = false
    }
  }, [postsPerPage, uids])

  return { posts, loadNextPage, isComplete, isLoadingPosts }
}
