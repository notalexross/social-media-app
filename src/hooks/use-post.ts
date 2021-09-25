import { useEffect, useState } from 'react'
import type { PostWithUserDetails } from '../services/firebase'
import { getPosts, onPostsUpdated } from '../services/firebase'
import { stringifyError } from '../utils'

type UsePostOptions = {
  subscribe?: boolean
  errorCallback?: (error: string) => void
}

function usePost(
  postOrId?: string | PostWithUserDetails,
  { subscribe = false, errorCallback }: UsePostOptions = {}
): PostWithUserDetails | undefined {
  const initialPost = postOrId && typeof postOrId !== 'string' ? postOrId : undefined
  const hasInitialPost = initialPost !== undefined
  const [post, setPost] = useState<PostWithUserDetails | undefined>(initialPost)

  useEffect(() => {
    let isCurrent = true
    const id = typeof postOrId !== 'string' ? postOrId?.id : postOrId

    const handleError = (error: unknown) => {
      if (isCurrent && errorCallback) {
        errorCallback(stringifyError(error))
      }
    }

    if (id && subscribe) {
      console.log('called on post')
      console.log(id)

      return onPostsUpdated(
        [id],
        changes => setPost(state => ({ ...state, ...changes })),
        handleError
      )
    }

    if (id && !hasInitialPost) {
      console.log('called get post')

      getPosts([id])
        .then(data => isCurrent && setPost(data[0]))
        .catch(handleError)
    }

    return () => {
      isCurrent = false
    }
  }, [errorCallback, hasInitialPost, postOrId, subscribe])

  return post
}

export default usePost
