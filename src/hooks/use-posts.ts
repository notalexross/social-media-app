import { useEffect, useState } from 'react'
import type { PostWithId, PostRepliesWithId } from '../services/firebase'
import { getPosts } from '../services/firebase'

export default function usePosts(
  postIds: string[]
): (PostWithId | PostRepliesWithId)[] {
  const [posts, setPosts] = useState<(PostWithId | PostRepliesWithId)[]>([])

  useEffect(() => {
    getPosts(postIds).then(setPosts).catch(console.error)
  }, [postIds])

  return posts
}
