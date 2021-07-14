import { useEffect, useState } from 'react'
import type { PostWithId } from '../services/firebase'
import { getPosts, onPostsUpdated } from '../services/firebase'

function usePosts(postId: string, options?: { subscribe?: boolean }): PostWithId | undefined
function usePosts(postIds: string[], options?: { subscribe?: boolean }): PostWithId[]
function usePosts(
  postIdOrIds: string | string[],
  { subscribe = false }: { subscribe?: boolean } = {}
): PostWithId | PostWithId[] | undefined {
  const [posts, setPosts] = useState<PostWithId[]>([])

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

    getPosts(postIds).then(setPosts).catch(console.error)

    return () => {}
  }, [postIdOrIds, subscribe])

  return Array.isArray(postIdOrIds) ? posts : posts[0]
}

export default usePosts
