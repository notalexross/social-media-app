import { useEffect, useState } from 'react'
import type { PostWithUserDetails } from '../services/firebase'
import { getPosts, onPostsUpdated } from '../services/firebase'

function usePost(
  postOrId?: string | PostWithUserDetails,
  { subscribe = false }: { subscribe?: boolean } = {}
): PostWithUserDetails | undefined {
  const initialPost = postOrId && typeof postOrId !== 'string' ? postOrId : undefined
  const hasInitialPost = initialPost !== undefined
  const [post, setPost] = useState<PostWithUserDetails | undefined>(initialPost)

  useEffect(() => {
    let isCurrent = true
    const id = typeof postOrId !== 'string' ? postOrId?.id : postOrId

    if (id && subscribe) {
      return onPostsUpdated([id], changes => {
        setPost(state => ({ ...state, ...changes }))
      })
    }

    if (id && !hasInitialPost) {
      getPosts([id])
        .then(data => isCurrent && setPost(data[0]))
        .catch(console.error)
    }

    return () => {
      isCurrent = false
    }
  }, [hasInitialPost, postOrId, subscribe])

  return post
}

export default usePost
