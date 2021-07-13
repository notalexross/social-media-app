import { useEffect, useState } from 'react'
import type { PostWithId, PostRepliesWithId } from '../services/firebase'
import { getPosts } from '../services/firebase'

export default function usePosts(
  postIds: string[] | string
): (PostWithId | PostRepliesWithId | undefined)[] | PostWithId | PostRepliesWithId | undefined {
  const [posts, setPosts] = useState<(PostWithId | PostRepliesWithId | undefined)[]>([])

  useEffect(() => {
    getPosts(Array.isArray(postIds) ? postIds : [postIds])
      .then(setPosts)
      .catch(console.error)
  }, [postIds])

  return Array.isArray(postIds) ? posts : posts[0]
}
