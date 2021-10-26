import { useEffect, useState } from 'react'
import type {
  PostOrPostId,
  PostPublicWithId,
  PostContentWithId,
  PostWithUserDetails,
  PostWithReplyTo,
  User
} from '../services/firebase'
import { getPost, onPostUpdated } from '../services/firebase'
import { stringifyError } from '../utils'
import useUser from './use-user'

type UsePostPartialOptions = {
  includeContent?: boolean
  subscribePublic?: boolean
  subscribeContent?: boolean
  errorCallback?: (error: string) => void
}

function usePostPartial(
  postOrId?: PostOrPostId,
  {
    includeContent = false,
    subscribePublic = false,
    subscribeContent = false,
    errorCallback
  }: UsePostPartialOptions = {}
): PostWithUserDetails | undefined {
  const isPost = postOrId !== undefined && typeof postOrId !== 'string'
  const postId = isPost ? postOrId.id : postOrId
  const hasContent = isPost && 'message' in postOrId
  const hasUser = isPost && 'ownerDetails' in postOrId
  const shouldGetPublic = !isPost && !subscribePublic
  const shouldGetContent = includeContent && !hasContent && !subscribeContent
  const shouldSubscribeContent = includeContent && subscribeContent

  const postState = isPost ? postOrId : undefined
  const postWithUserState = hasUser && (!includeContent || hasContent) ? postOrId : undefined

  const [post, setPost] = useState<PostPublicWithId | PostContentWithId | undefined>(postState)
  const [postWithUser, setPostWithUser] = useState<PostWithUserDetails | undefined>(
    postWithUserState
  )

  let userState: string | User | undefined
  if (hasUser) {
    userState = postOrId.ownerDetails
  } else if (post && 'owner' in post) {
    userState = post.owner
  }

  const ownerDetails = useUser(userState, { passthrough: hasUser, maxAge: 10000 })

  useEffect(() => {
    setPost(postState)
  }, [postId, postState])

  useEffect(() => {
    let isCurrent = true
    let cleanup = () => {}

    const handleError = (error: unknown) => {
      if (isCurrent && errorCallback) {
        errorCallback(stringifyError(error))
      }
    }

    if (postId) {
      if (shouldGetPublic || shouldGetContent) {
        getPost(postId, { includeContent: shouldGetContent })
          .then(data => {
            if (isCurrent) {
              setPost(state => ({ ...state, ...data }))
            }
          })
          .catch(handleError)
      }

      if (subscribePublic || shouldSubscribeContent) {
        cleanup = onPostUpdated(
          postId,
          changes => {
            if (isCurrent) {
              setPost(state => ({ ...state, ...changes }))
            }
          },
          {
            includePublic: subscribePublic,
            includeContent: shouldSubscribeContent,
            errorCallback: handleError
          }
        )
      }
    }

    return () => {
      isCurrent = false
      cleanup()
    }
  }, [
    errorCallback,
    shouldGetContent,
    shouldGetPublic,
    includeContent,
    postId,
    subscribePublic,
    shouldSubscribeContent
  ])

  useEffect(() => {
    if (
      post &&
      postId &&
      (ownerDetails || !('owner' in post)) &&
      'createdAt' in post &&
      (!(includeContent || subscribeContent) || 'message' in post)
    ) {
      setPostWithUser({ ...post, id: postId, ownerDetails })
    } else {
      setPostWithUser(postWithUserState)
    }
  }, [post, ownerDetails, postWithUserState, includeContent, subscribeContent, postId])

  return postWithUser && postWithUser.id === postId ? postWithUser : postWithUserState
}

type UsePostOptions = {
  includeContent?: boolean
  subscribePublic?: boolean
  subscribeContent?: boolean
  includeReplyTo?: boolean
  includeReplyToContent?: boolean
  errorCallback?: (error: string) => void
}

export default function usePost(
  post?: PostOrPostId,
  {
    includeContent = false,
    subscribePublic = false,
    subscribeContent = false,
    includeReplyTo = false,
    includeReplyToContent = false,
    errorCallback
  }: UsePostOptions = {}
): PostWithReplyTo | undefined {
  const postLive = usePostPartial(post, {
    includeContent,
    subscribePublic,
    subscribeContent,
    errorCallback
  })

  const isPost = post !== undefined && typeof post !== 'string'
  const postId = isPost ? post.id : post

  let postWithUserDetails: PostWithUserDetails | PostWithReplyTo | undefined
  if (postLive) {
    postWithUserDetails = postLive
  } else if (
    isPost &&
    'ownerDetails' in post &&
    (!includeContent || 'message' in post)
  ) {
    postWithUserDetails = post
  }

  let replyToPostOrId: string | PostWithUserDetails | undefined
  if (isPost && 'replyToPost' in post && post.replyToPost) {
    replyToPostOrId = post.replyToPost
  } else if (includeReplyTo) {
    replyToPostOrId = isPost ? post.replyTo || undefined : postLive?.replyTo || undefined
  }

  const replyToPost = usePostPartial(replyToPostOrId, {
    includeContent: includeReplyToContent,
    errorCallback
  })
  const [postWithReplyTo, setPostWithReplyTo] = useState<PostWithReplyTo | undefined>(
    postWithUserDetails ? { ...postWithUserDetails, replyToPost } : undefined
  )

  useEffect(() => {
    if (postLive) {
      setPostWithReplyTo({ ...postLive, replyToPost })
    }
  }, [postLive, replyToPost])

  return postId && postWithReplyTo?.id === postId ? postWithReplyTo : undefined
}
