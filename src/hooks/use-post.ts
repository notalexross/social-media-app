import { useEffect, useState } from 'react'
import type {
  PostPublicWithId,
  PostContentWithId,
  PostWithId,
  PostWithUserDetails,
  User
} from '../services/firebase'
import { getPost, onPostUpdated } from '../services/firebase'
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
  const [post, setPost] = useState<PostWithId | PostPublicWithId | PostContentWithId | undefined>(
    postState
  )
  const [postWithUsers, setPostWithUsers] = useState<PostWithUserDetails | undefined>(
    postWithUsersState
  )

  let userState: string | User | undefined
  if (hasUser) {
    userState = postOrId.ownerDetails
  } else if (post && 'owner' in post) {
    userState = post.owner
  }

  let replyUserState: string | User | undefined
  if (hasReplyUser) {
    replyUserState = postOrId.replyToOwnerDetails
  } else if (post && 'replyTo' in post) {
    replyUserState = post.replyTo?.owner
  }

  const ownerDetails = useUser(userState, { passthrough: hasUser, maxAge: 10000 })
  const replyToOwnerDetails = useUser(replyUserState, { passthrough: hasReplyUser, maxAge: 10000 })

  useEffect(() => {
    setPost(postState)
  }, [postId, postState])

  useEffect(() => {
    let isCurrent = true

    if (shouldUpdatePost) {
      const handleError = (error: unknown) => {
        if (isCurrent && errorCallback) {
          errorCallback(stringifyError(error))
        }
      }

      if (subscribe) {
        return onPostUpdated(
          postId,
          changes => {
            if (isCurrent) {
              setPost(state => ({ ...state, ...changes }))
            }
          },
          {
            includePublic: true,
            includeContent: true,
            errorCallback: handleError
          }
        )
      }

      getPost(postId, { includeContent: true })
        .then(data => {
          if (isCurrent) {
            setPost(state => ({ ...state, ...data }))
          }
        })
        .catch(handleError)
    }

    return () => {
      isCurrent = false
    }
  }, [errorCallback, postId, shouldUpdatePost, subscribe])

  useEffect(() => {
    if (post && ownerDetails && 'createdAt' in post && 'message' in post) {
      if (replyToOwnerDetails) {
        setPostWithUsers({ ...post, ownerDetails, replyToOwnerDetails })
      } else {
        setPostWithUsers({ ...post, ownerDetails })
      }
    } else {
      setPostWithUsers(postWithUsersState)
    }
  }, [post, ownerDetails, replyToOwnerDetails, postWithUsersState])

  return postWithUsers && postWithUsers.id === postId ? postWithUsers : postWithUsersState
}

export default usePost
