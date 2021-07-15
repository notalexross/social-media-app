import { useEffect, useMemo, useState } from 'react'
import type { PostWithId } from '../services/firebase'
import usePosts from './use-posts'

function usePostsLive(post: PostWithId | null): PostWithId | null
function usePostsLive(posts: PostWithId[] | null): PostWithId[] | null
function usePostsLive(
  postOrPosts: PostWithId | PostWithId[] | null
): PostWithId | PostWithId[] | null {
  const posts = useMemo(() => {
    if (postOrPosts) {
      return Array.isArray(postOrPosts) ? postOrPosts : [postOrPosts]
    }

    return null
  }, [postOrPosts])
  const postIds: string[] = useMemo(() => posts?.map(post => post.id) || [], [posts])
  const [livePosts, setLivePosts] = useState(posts)
  const updatedPosts = usePosts(postIds, { subscribe: true })

  useEffect(() => {
    if (posts) {
      setLivePosts(posts.map((post, idx) => updatedPosts[idx] || post))
    }
  }, [posts, updatedPosts])

  return Array.isArray(postOrPosts) ? livePosts : livePosts && livePosts[0]
}

export default usePostsLive
