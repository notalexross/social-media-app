import { useEffect, useState } from 'react'
import type { PostWithId, PostRepliesWithId } from '../services/firebase'
import { getPosts, onPostsUpdated } from '../services/firebase'

function usePosts<T extends boolean>(
  postId: string,
  options?: { subscribe?: T }
): T extends true ? PostWithId | undefined : PostWithId | PostRepliesWithId | undefined
function usePosts<T extends boolean>(
  postIds: string[],
  options?: { subscribe?: T }
): T extends true ? PostWithId[] : (PostWithId | PostRepliesWithId)[]
function usePosts(
  postIdOrIds: string | string[],
  { subscribe = false }: { subscribe?: boolean } = {}
): PostWithId | PostRepliesWithId | undefined | (PostWithId | PostRepliesWithId)[] {
  const [posts, setPosts] = useState<(PostWithId | PostRepliesWithId)[]>([])

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
