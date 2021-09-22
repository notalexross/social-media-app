import { useCallback, useEffect, useRef, useState } from 'react'
import type { PostsStatus, PostWithUserDetails } from '../services/firebase'
import { getAllUserPosts, getMultiUserPosts } from '../services/firebase'

type MultiUserPosts = {
  posts: PostWithUserDetails[] | null
  loadNextPage: () => Promise<void>
  isComplete: boolean
  isLoadingPosts: boolean
  error: string
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
  const [error, setError] = useState('')
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

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message)
    } else if (typeof err === 'string') {
      setError(err)
    } else {
      setError(JSON.stringify(err))
    }
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
    if (!isInitiated.current && (uids || uids === null)) {
      const statusCallback = (data: PostsStatus) => isMounted.current && setStatus(data)
      const loadingCallback = (data: boolean) => isMounted.current && setIsLoadingPosts(data)
      const errorCallback = (data: unknown) => isMounted.current && handleError(data)
      const options = { postsPerPage, loadingCallback, errorCallback }
      let loadNextPageFunction: () => Promise<void>

      if (uids) {
        loadNextPageFunction = getMultiUserPosts(uids, statusCallback, options)
      } else {
        loadNextPageFunction = getAllUserPosts(statusCallback, options)
      }

      setLoadNextPage(() => async () => {
        setError('')

        return loadNextPageFunction()
      })
      loadNextPageFunction().catch(console.error)
      isInitiated.current = true
    }

    return () => {
      isMounted.current = false
    }
  }, [id, handleError, postsPerPage, uids])

  return { posts, loadNextPage, isComplete, isLoadingPosts, error }
}
