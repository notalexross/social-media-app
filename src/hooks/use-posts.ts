import { useEffect, useState } from 'react'
import type { PostWithUserDetails } from '../services/firebase'
import { getPosts, onPostsUpdated } from '../services/firebase'

function usePosts(
  postId: string,
  options?: { subscribe?: boolean }
): PostWithUserDetails | undefined
function usePosts(
  postIds: string[],
  options?: { subscribe?: boolean }
): (PostWithUserDetails | undefined)[]
function usePosts(
  postIdOrIds: string | string[],
  { subscribe = false }: { subscribe?: boolean } = {}
): PostWithUserDetails | undefined | (PostWithUserDetails | undefined)[] {
  const [posts, setPosts] = useState<(PostWithUserDetails | undefined)[]>([])

  useEffect(() => {
    const postIds = Array.isArray(postIdOrIds) ? postIdOrIds : [postIdOrIds]
    if (subscribe) {
      return onPostsUpdated(postIds, changes => {
        setPosts(state => {
          const index = postIds.indexOf(changes.id)

          return [
            ...state.slice(0, index),
            { ...state[index], ...changes },
            ...state.slice(index + 1)
          ]
        })
      })
    }

    let isCurrent = true

    getPosts(postIds)
      .then(data => isCurrent && setPosts(data))
      .catch(console.error)

    return () => {
      isCurrent = false
    }
  }, [postIdOrIds, subscribe])

  return Array.isArray(postIdOrIds) ? posts : posts[0]
}

export default usePosts
