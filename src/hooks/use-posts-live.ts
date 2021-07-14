import { useEffect, useMemo, useState } from 'react'
import type { PostWithId } from '../services/firebase'
import usePosts from './use-posts'

export default function usePostsLive(posts: PostWithId[] | null): PostWithId[] | null {
  const postIds: string[] = useMemo(() => posts?.map(post => post.id) || [], [posts])
  const [livePosts, setLivePosts] = useState(posts)
  const updatedPosts = usePosts(postIds, { subscribe: true })

  useEffect(() => {
    if (posts) {
      setLivePosts(posts.map((post, idx) => updatedPosts[idx] || post))
    }
  }, [posts, updatedPosts])

  return livePosts
}
