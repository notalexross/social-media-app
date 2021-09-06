import { useEffect, useMemo, useState } from 'react'
import type { PostWithUserDetails } from '../services/firebase'
import usePosts from './use-posts'

function usePostsLive(post: PostWithUserDetails | null): PostWithUserDetails[] | null
function usePostsLive(posts: PostWithUserDetails[] | null): PostWithUserDetails[] | null
function usePostsLive(
  postOrPosts: PostWithUserDetails | PostWithUserDetails[] | null
): PostWithUserDetails[] | null {
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
      setLivePosts(
        posts.map(post => updatedPosts.find(updatedPost => updatedPost?.id === post.id) || post)
      )
    } else {
      setLivePosts(null)
    }
  }, [posts, updatedPosts])

  return livePosts
}

export default usePostsLive
