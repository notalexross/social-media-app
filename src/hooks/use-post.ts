import { useEffect, useRef, useState } from 'react'
import type {
  PostOrPostId,
  PostPiece,
  PostWithUserDetails,
  PostWithReplyTo
} from '../services/firebase'
import { fetchPost } from '../services/firebase'
import { stringifyError } from '../utils'

type UsePostOptions = {
  fetchPublic?: 'get' | 'subscribe'
  fetchContent?: 'get' | 'subscribe' | 'subscribeIfOwner' | 'none'
  fetchReplyTo?: 'get' | 'none'
  errorCallback?: (error: string) => void
  onRequestMade?: (...args: unknown[]) => unknown
}

export default function usePost(
  postOrId?: PostOrPostId,
  {
    fetchPublic = 'get',
    fetchContent = 'none',
    fetchReplyTo = 'none',
    errorCallback,
    onRequestMade
  }: UsePostOptions = {}
): PostWithUserDetails | PostWithReplyTo | undefined {
  const isPostObject = postOrId !== undefined && typeof postOrId !== 'string'
  const [post, setPost] = useState<PostPiece | undefined>(isPostObject ? postOrId : undefined)
  const prevPostId = useRef(isPostObject ? postOrId.id : postOrId)
  const deletedOnLoad = useRef<boolean | null>(null)

  const isDefined = post !== undefined
  const hasPublic = isDefined && 'createdAt' in post
  const hasOwnerDetails = isDefined && 'ownerDetails' in post
  const hasContent = isDefined && 'message' in post
  const hasReplyToPost = isDefined && 'replyToPost' in post
  const needReplyToPost = fetchReplyTo !== 'none'

  if (deletedOnLoad.current === null && hasPublic) {
    deletedOnLoad.current = post.deleted
  }

  const needContent =
    fetchContent !== 'none' && (!hasPublic || (!post.deleted && !deletedOnLoad.current))
  const postIsComplete =
    hasPublic &&
    hasOwnerDetails &&
    (hasReplyToPost || !needReplyToPost) &&
    (hasContent || !needContent)

  useEffect(() => {
    const handleError = (error: unknown) => {
      if (errorCallback) {
        errorCallback(stringifyError(error))
      }
    }

    const isPost = postOrId !== undefined && typeof postOrId !== 'string'
    const postId = isPost ? postOrId.id : postOrId

    let existingPost: PostPiece | undefined
    if (prevPostId.current === postId) {
      if (isPost) {
        existingPost = { ...post, ...postOrId }
      } else {
        existingPost = post
      }
    } else {
      if (isPost) {
        existingPost = postOrId
      } else {
        existingPost = undefined
      }

      setPost(existingPost)
    }

    prevPostId.current = postId

    if (postId) {
      return fetchPost(postId, data => setPost(state => ({ ...state, ...data })), {
        existingPost,
        fetchPublic,
        fetchContent,
        fetchReplyTo,
        errorCallback: handleError,
        onRequestMade
      })
    }

    return () => {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCallback, fetchContent, fetchPublic, fetchReplyTo, postOrId, onRequestMade])

  return postIsComplete ? post : undefined
}
