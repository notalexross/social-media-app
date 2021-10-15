import type firebase from 'firebase'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { HeartIcon, ChatAlt2Icon } from '@heroicons/react/outline'
import type { PostWithUserDetails } from '../../services/firebase'
import { UserContext } from '../../context/user'
import { useLineHeight, useProtectedFunctions, useTimeAgo } from '../../hooks'
import StatefulLink from '../stateful-link'
import * as ROUTES from '../../constants/routes'

type PostContextValue = {
  post: PostWithUserDetails | undefined
  hideAttachment: boolean
  isComment: boolean
  isPostPage: boolean
}

const PostContext = createContext<PostContextValue>({} as PostContextValue)

type PostProps = {
  post?: PostWithUserDetails
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
  return (
    <PostContext.Provider value={{ post, hideAttachment, isComment, isPostPage }}>
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

  const { id, createdAt, updatedAt } = post

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

Post.ReplyingTo = function PostReplyingTo(
  props: Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>
) {
  const { post, isComment } = useContext(PostContext)
  const { replyTo, replyToOwnerDetails } = post || {}

  if (
    !post ||
    !replyTo ||
    !replyTo?.id ||
    !replyToOwnerDetails?.username ||
    isComment ||
    post.deleted
  ) {
    return null
  }

  return (
    <StatefulLink to={`${ROUTES.POSTS}/${replyTo?.id}`} post={replyTo.id} modal {...props}>
      {`Replying to ${replyToOwnerDetails?.username}`}
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
  const { post } = useContext(PostContext)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [lineHeight, LineHeightComponent] = useLineHeight()
  const overflowRef = useRef<HTMLDivElement | null>(null)
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

  let fade: JSX.Element | null = null
  if (isOverflowing) {
    fade = (
      <div className="absolute bottom-0 left-0 right-0">
        <div
          className="bg-gradient-to-t from-white pointer-events-none"
          style={{ height: fadeHeight }}
        />
        <div className="bg-white">
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
        <p>{post.deleted ? deletedTextContent : post.message}</p>
        {fade}
      </div>
    </div>
  )
}

type PostAttachmentProps = {
  aspectRatio: number
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Post.Attachment = function PostAttachment({ aspectRatio, ...restProps }: PostAttachmentProps) {
  const { post, hideAttachment } = useContext(PostContext)

  if (hideAttachment || (post && !post.attachment) || post?.deleted) {
    return null
  }

  const imgClassName = 'absolute inset-0 w-full h-full w-full object-contain'

  return (
    <div {...restProps}>
      <div className="relative" style={{ paddingTop: `${100 / aspectRatio}%` }}>
        {post ? (
          <img className={imgClassName} src={post.attachment} alt="" />
        ) : (
          <Skeleton className={imgClassName} />
        )}
      </div>
    </div>
  )
}

Post.ViewAttachment = function PostAttachment(
  props: Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>
) {
  const { post, hideAttachment } = useContext(PostContext)

  if (!post || !hideAttachment || !post.attachment || post.deleted) {
    return null
  }

  return (
    <StatefulLink to={`${ROUTES.POSTS}/${post.id}`} post={post} modal {...props}>
      View attachment
    </StatefulLink>
  )
}

type PostLikeButtonProps = {
  likedClassName: string
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>

Post.LikeButton = function PostLikeButton({ likedClassName, ...restProps }: PostLikeButtonProps) {
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
    <button type="button" onClick={toggleLike} {...restProps}>
      <span className={isLiked ? likedClassName : ''}>
        <HeartIcon className={`${isLiked ? 'fill-current' : ''}`} />
      </span>
    </button>
  )
}

Post.ReplyButton = function PostReplyButton(
  props: Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>
) {
  const { post, isPostPage, isComment } = useContext(PostContext)

  if (!post) {
    return (
      <span {...props}>
        <Skeleton />
      </span>
    )
  }

  return (
    <StatefulLink
      to={`${ROUTES.POSTS}/${post.id}${ROUTES.COMPOSE}`}
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

  if (!post) {
    return (
      <div {...restProps}>
        <Skeleton width="9ch" />
      </div>
    )
  }

  const { replies, id } = post
  const repliesCount = replies.length

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
