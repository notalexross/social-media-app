import { useCallback, useEffect, useRef, useState } from 'react'
import type { PostsStatus, PostWithUserDetails } from '../services/firebase'
import { getAllUserPosts, getMultiUserPosts } from '../services/firebase'

type MultiUserPosts = {
  posts: PostWithUserDetails[] | null
  loadNextPage: () => Promise<void>
  isComplete: boolean
  isLoadingPosts: boolean
}

const initialIsLoadingPosts = true
const initialLoadNextPage = () => () => Promise.resolve()
const initialStatus = {
  posts: null,
  isComplete: true,
  page: 0,
  stats: { fetchCount: 0, docsFetchedCount: 0, docReadCount: 0, chunks: 0, users: 0 }
}

export default function useMultiUserPosts(
  id: string | undefined,
  uids: string[] | undefined | null,
  postsPerPage = 10
): MultiUserPosts {
  const [isLoadingPosts, setIsLoadingPosts] = useState(initialIsLoadingPosts)
  const [loadNextPage, setLoadNextPage] = useState<() => Promise<void>>(initialLoadNextPage)
  const [status, setStatus] = useState<PostsStatus>(initialStatus)
  const isMounted = useRef(true)
  const isInitiated = useRef(false)
  const { posts, isComplete } = status
  const previousUids = useRef(uids)

  const reinitialiseState = useCallback(() => {
    isInitiated.current = false
    setIsLoadingPosts(initialIsLoadingPosts)
    setLoadNextPage(initialLoadNextPage)
    setStatus(initialStatus)
  }, [])

  useEffect(() => {
    if (Array.isArray(previousUids.current) !== Array.isArray(uids)) {
      reinitialiseState()
    }

    previousUids.current = uids
  }, [uids, reinitialiseState])

  useEffect(() => {
    if (id) {
      reinitialiseState()
    }
  }, [id, reinitialiseState])

  useEffect(() => {
    isMounted.current = true
    if (!isInitiated.current) {
      if (uids) {
        const loadNextPageFunction = getMultiUserPosts(
          uids,
          data => isMounted.current && setStatus(data),
          data => isMounted.current && setIsLoadingPosts(data),
          postsPerPage
        )
        setLoadNextPage(() => loadNextPageFunction)
        loadNextPageFunction().catch(console.error)
        isInitiated.current = true
      } else if (uids === null) {
        const loadNextPageFunction = getAllUserPosts(
          data => isMounted.current && setStatus(data),
          data => isMounted.current && setIsLoadingPosts(data),
          postsPerPage
        )
        setLoadNextPage(() => loadNextPageFunction)
        loadNextPageFunction().catch(console.error)
        isInitiated.current = true
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [id, postsPerPage, uids])

  return { posts, loadNextPage, isComplete, isLoadingPosts }
}
