import { useEffect, useState } from 'react'
import type {
  PostPublicWithId,
  PostContentWithId,
  PostWithId,
  PostWithUserDetails
} from '../services/firebase'
import { getPosts, onPostsUpdated } from '../services/firebase'
import { stringifyError } from '../utils'
import useUser from './use-user'

type UsePostOptions = {
  subscribe?: boolean
  errorCallback?: (error: string) => void
}

function usePost(
  postOrId?: string | PostPublicWithId | PostContentWithId | PostWithId | PostWithUserDetails,
  { subscribe = false, errorCallback }: UsePostOptions = {}
): PostWithUserDetails | undefined {
  const isPost = postOrId !== undefined && typeof postOrId !== 'string'
  const hasDetails = isPost && 'createdAt' in postOrId
  const hasContent = isPost && 'message' in postOrId
  const hasUser = isPost && 'ownerDetails' in postOrId
  const hasReplyUser = isPost && 'replyToOwnerDetails' in postOrId
  const postId = isPost ? postOrId.id : postOrId
  const shouldUpdatePost = postId !== undefined && (!hasDetails || !hasContent || subscribe)

  const postState = hasDetails && hasContent ? postOrId : undefined
  const postWithUsersState =
    hasDetails && hasContent && hasUser && hasReplyUser ? postOrId : undefined
  const [post, setPost] = useState<PostWithId | undefined>(postState)
  const [postWithUsers, setPostWithUsers] = useState<PostWithUserDetails | undefined>(
    postWithUsersState
  )

  const userState = hasUser ? postOrId.ownerDetails : post?.owner
  const replyUserState = hasReplyUser ? postOrId.replyToOwnerDetails : post?.replyTo?.owner
  const ownerDetails = useUser(userState, { passthrough: hasUser, maxAge: 10000 })
  const replyToOwnerDetails = useUser(replyUserState, { passthrough: hasReplyUser, maxAge: 10000 })

  useEffect(() => {
    setPost(postState)
  }, [postOrId, postState])

  useEffect(() => {
    let isCurrent = true

    if (shouldUpdatePost) {
      const handleError = (error: unknown) => {
        if (isCurrent && errorCallback) {
          errorCallback(stringifyError(error))
        }
      }

      if (subscribe) {
        return onPostsUpdated(
          [postId],
          changes => setPost(state => ({ ...state, ...changes })),
          handleError
        )
      }

      getPosts([postId])
        .then(data => isCurrent && setPost(data[0]))
        .catch(handleError)
    }

    return () => {
      isCurrent = false
    }
  }, [errorCallback, postId, shouldUpdatePost, subscribe])

  useEffect(() => {
    if (post && ownerDetails) {
      if (replyToOwnerDetails) {
        setPostWithUsers({ ...post, ownerDetails, replyToOwnerDetails })
      } else {
        setPostWithUsers({ ...post, ownerDetails })
      }
    } else {
      setPostWithUsers(postWithUsersState)
    }
  }, [post, ownerDetails, replyToOwnerDetails, postWithUsersState])

  return postWithUsers
}

export default usePost
