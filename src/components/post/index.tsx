import type firebase from 'firebase'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import { HeartIcon, ChatAlt2Icon } from '@heroicons/react/outline'
import type { PostWithReplyTo, PostWithUserDetails } from '../../services/firebase'
import { UserContext } from '../../context/user'
import { useLineHeight, useProtectedFunctions, useTimeAgo } from '../../hooks'
import StatefulLink from '../stateful-link'
import * as ROUTES from '../../constants/routes'
import { LocationState } from '../../types'

type PostContextValue = {
  post: PostWithReplyTo | PostWithUserDetails | undefined
  replyToPost: PostWithUserDetails | null | undefined
  hideAttachment: boolean
  isComment: boolean
  isPostPage: boolean
}

const PostContext = createContext<PostContextValue>({} as PostContextValue)

type PostProps = {
  post?: PostWithReplyTo | PostWithUserDetails
  hideAttachment?: boolean
  isComment?: boolean
  isPostPage?: boolean
} & React.ComponentPropsWithoutRef<'div'>

export default function Post({
  children,
  post,
  hideAttachment = false,
  isComment = false,
  isPostPage = false,
  ...restProps
}: PostProps): JSX.Element {
  const replyToPost = post && 'replyToPost' in post ? post.replyToPost : undefined

  return (
    <PostContext.Provider value={{ post, replyToPost, hideAttachment, isComment, isPostPage }}>
      <div {...restProps}>{children}</div>
    </PostContext.Provider>
  )
}

type TimeAgoProps = {
  timestamp: firebase.firestore.Timestamp | null
} & Omit<React.ComponentPropsWithoutRef<'time'>, 'children'>

function TimeAgo({ timestamp, ...restProps }: TimeAgoProps) {
  const [timeElapsed, dateFull, dateISO] = useTimeAgo(timestamp)

  return (
    <time dateTime={dateISO} title={dateFull} {...restProps}>
      {timeElapsed}
    </time>
  )
}

type PostDateCreatedProps = {
  linkClassName?: string
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Post.DateCreated = function PostDateCreated({ linkClassName, ...restProps }: PostDateCreatedProps) {
  const { post } = useContext(PostContext)

  if (!post || !post.id) {
    return null
  }

  const { id, createdAt } = post

  let updatedAt: firebase.firestore.Timestamp | null | undefined
  if ('updatedAt' in post) {
    updatedAt = post.updatedAt
  }

  const createdAtSpan = (
    <span className="inline-block">
      <span>&nbsp;·&nbsp;</span>
      {createdAt !== undefined ? (
        <StatefulLink className={linkClassName} to={`${ROUTES.POSTS}/${id}`}>
          <TimeAgo timestamp={createdAt} />
        </StatefulLink>
      ) : null}
    </span>
  )

  const updatedAtSpan =
    updatedAt !== undefined ? (
      <span className="inline-block">
        <span>&nbsp;·&nbsp;edited (</span>
        <StatefulLink className={linkClassName} to={`${ROUTES.POSTS}/${id}`}>
          <TimeAgo timestamp={updatedAt} />
        </StatefulLink>
        <span>)</span>
      </span>
    ) : null

  return (
    <span {...restProps}>
      {createdAtSpan}
      {updatedAtSpan}
    </span>
  )
}

type PostReplyingToProps = {
  unknownTextContent?: string
} & Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>

Post.ReplyingTo = function PostReplyingTo({
  unknownTextContent = 'Unknown User',
  ...restProps
}: PostReplyingToProps) {
  const { post, replyToPost, isComment } = useContext(PostContext)

  if (isComment || !post || !post.replyTo) {
    return null
  }

  let replyingTo: string | undefined
  if (replyToPost?.ownerDetails === null) {
    replyingTo = unknownTextContent
  } else {
    replyingTo = replyToPost?.ownerDetails?.username
  }

  return (
    <StatefulLink
      to={`${ROUTES.POSTS}/${post.replyTo}`}
      post={replyToPost || post.replyTo}
      modal
      {...restProps}
    >
      Replying to&nbsp;
      {replyingTo || (
        <span {...restProps}>
          <Skeleton width="15ch" />
        </span>
      )}
    </StatefulLink>
  )
}

type PostMessageProps = {
  lineClamp?: number
  fadeLines?: number
  readMoreClassName?: string
  readMoreTextContent?: string
  deletedTextContent?: string
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Post.Message = function PostMessage({
  lineClamp = Infinity,
  fadeLines = 0,
  readMoreClassName = '',
  readMoreTextContent = '',
  deletedTextContent = '[Deleted]',
  ...restProps
}: PostMessageProps) {
  const { uid } = useContext(UserContext)
  const { post } = useContext(PostContext)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [lineHeight, LineHeightComponent] = useLineHeight()
  const overflowRef = useRef<HTMLDivElement | null>(null)
  const hasContent = post !== undefined && 'message' in post
  const maxHeight = lineClamp === Infinity ? 'auto' : lineClamp * (lineHeight || 0)
  const fadeHeight = fadeLines === Infinity ? 0 : fadeLines * (lineHeight || 0)

  useEffect(() => {
    const callback = () => {
      if (overflowRef.current) {
        setIsOverflowing(overflowRef.current.clientHeight < overflowRef.current.scrollHeight)
      }
    }

    const observer = new MutationObserver(callback)
    observer.observe(document, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    })
    window.addEventListener('resize', callback)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', callback)
    }
  }, [post])

  if (!post) {
    return (
      <div {...restProps}>
        <Skeleton count={3} />
      </div>
    )
  }

  const isOwner = uid !== undefined && post?.owner === uid

  let inner: string
  if (hasContent) {
    if (isOwner && post.deleted) {
      inner = deletedTextContent
    } else {
      inner = post.message
    }
  } else {
    inner = deletedTextContent
  }

  let fade: JSX.Element | null = null
  if (isOverflowing) {
    fade = (
      <div className="absolute bottom-0 left-0 right-0">
        <div
          className="bg-gradient-to-t from-clr-secondary pointer-events-none"
          style={{ height: fadeHeight }}
        />
        <div className="bg-clr-secondary">
          <StatefulLink
            className={readMoreClassName}
            to={`${ROUTES.POSTS}/${post.id}`}
            post={post}
            modal
          >
            {readMoreTextContent}
          </StatefulLink>
        </div>
      </div>
    )
  }

  return (
    <div {...restProps}>
      <div className="relative overflow-hidden" style={{ maxHeight }} ref={overflowRef}>
        <LineHeightComponent />
        <p>{inner}</p>
        {fade}
      </div>
    </div>
  )
}

type PostAttachmentProps = {
  aspectRatio: number
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Post.Attachment = function PostAttachment({ aspectRatio, ...restProps }: PostAttachmentProps) {
  const { uid } = useContext(UserContext)
  const { post, hideAttachment } = useContext(PostContext)
  const imgClassName = 'absolute inset-0 w-full h-full w-full object-contain'
  const isOwner = uid !== undefined && post?.owner === uid
  const hasContent = post !== undefined && 'message' in post
  const hasNoContent = post && !hasContent
  const hasNoAttachment = post && hasContent && !post.attachment
  const isDeletedAndIsOwner = isOwner && post.deleted

  if (hideAttachment || hasNoContent || hasNoAttachment || isDeletedAndIsOwner) {
    return null
  }

  let inner: JSX.Element
  if (!post) {
    inner = <Skeleton className={imgClassName} />
  } else {
    inner = <img className={imgClassName} src={post.attachment} alt="" />
  }

  return (
    <div {...restProps}>
      <div className="relative" style={{ paddingTop: `${100 / aspectRatio}%` }}>
        {inner}
      </div>
    </div>
  )
}

Post.ViewAttachment = function PostAttachment(
  props: Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>
) {
  const { uid } = useContext(UserContext)
  const { post, hideAttachment } = useContext(PostContext)
  const isOwner = uid !== undefined && post?.owner === uid
  const hasContent = post !== undefined && 'message' in post
  const isDeletedAndIsOwner = isOwner && post.deleted

  if (!hideAttachment || !hasContent || !post.attachment || isDeletedAndIsOwner) {
    return null
  }

  return (
    <StatefulLink to={`${ROUTES.POSTS}/${post.id}`} post={post} modal {...props}>
      View attachment
    </StatefulLink>
  )
}

type PostLikeButtonProps = {
  likedClassName?: string
  likedFill?: string
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>

Post.LikeButton = function PostLikeButton({
  className,
  likedClassName,
  likedFill,
  ...restProps
}: PostLikeButtonProps) {
  const { likePost, unlikePost } = useProtectedFunctions()
  const { likedPosts } = useContext(UserContext)
  const { post } = useContext(PostContext)

  if (!post) {
    return (
      <span {...restProps}>
        <Skeleton />
      </span>
    )
  }

  const { id } = post
  const isLiked = likedPosts?.includes(id)

  const toggleLike = () => {
    if (!isLiked) {
      likePost(id).catch(console.error)
    } else {
      unlikePost(id).catch(console.error)
    }
  }

  return (
    <button
      className={isLiked ? likedClassName : className}
      type="button"
      onClick={toggleLike}
      {...restProps}
    >
      <HeartIcon fill={`${isLiked && likedFill ? likedFill : 'none'}`} />
    </button>
  )
}

Post.ReplyButton = function PostReplyButton(
  props: Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>
) {
  const { post, isPostPage, isComment } = useContext(PostContext)
  const { pathname, state } = useLocation<LocationState>()

  if (!post) {
    return (
      <span {...props}>
        <Skeleton />
      </span>
    )
  }

  return (
    <StatefulLink
      to={`${ROUTES.POSTS}/${post.id}${
        pathname.endsWith(`${post.id}${ROUTES.COMPOSE}`) ? '' : ROUTES.COMPOSE
      }`}
      replace={!!state?.modal || (isPostPage && !isComment)}
      post={post}
      modal={!isPostPage || isComment}
      {...props}
    >
      <ChatAlt2Icon />
    </StatefulLink>
  )
}

Post.LikesCount = function PostLikesCount(
  props: Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>
) {
  const { post } = useContext(PostContext)

  if (!post) {
    return (
      <span {...props}>
        <Skeleton width="8ch" />
      </span>
    )
  }

  const { likesCount } = post

  return <span {...props}>{`${likesCount} like${likesCount === 1 ? '' : 's'}`}</span>
}

type PostRepliesCountProps = {
  linkClassName: string
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Post.RepliesCount = function PostRepliesCount({
  linkClassName,
  ...restProps
}: PostRepliesCountProps) {
  const { post, isComment, isPostPage } = useContext(PostContext)
  const { replies: repliesUnfiltered, deletedReplies, id } = post || {}
  const replies = useMemo(
    () => repliesUnfiltered?.filter(reply => !deletedReplies?.includes(reply)) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repliesUnfiltered?.length]
  )
  const repliesCount = replies.length

  if (!id) {
    return (
      <div {...restProps}>
        <Skeleton width="9ch" />
      </div>
    )
  }

  return (
    <div {...restProps}>
      {isPostPage && !isComment ? (
        <span>{`${repliesCount} repl${repliesCount === 1 ? 'y' : 'ies'}`}</span>
      ) : (
        <StatefulLink className={linkClassName} to={`${ROUTES.POSTS}/${id}`}>
          {`${repliesCount} repl${repliesCount === 1 ? 'y' : 'ies'}`}
        </StatefulLink>
      )}
    </div>
  )
}
