import type firebase from 'firebase'
import { createContext, useContext } from 'react'
import Skeleton from 'react-loading-skeleton'
import { HeartIcon, ChatAlt2Icon } from '@heroicons/react/outline'
import type { PostWithUserDetails } from '../../services/firebase'
import { likePost, unlikePost, followUser, unfollowUser } from '../../services/firebase'
import { UserContext } from '../../context/user'
import { useTimeAgo } from '../../hooks'
import Avatar from '../avatar'
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

type PostOwnerAvatarProps = {
  linkClassName?: string
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Post.OwnerAvatar = function PostOwnerAvatar({ linkClassName, ...restProps }: PostOwnerAvatarProps) {
  const { post } = useContext(PostContext)
  const { ownerDetails } = post || {}
  const { avatar, username } = ownerDetails || {}

  if (!post) {
    return (
      <div {...restProps}>
        <Avatar />
      </div>
    )
  }

  return (
    <div {...restProps}>
      {username && !post?.deleted ? (
        <StatefulLink to={`${ROUTES.PROFILES}/${username}`}>
          <Avatar className={linkClassName} src={avatar} alt={`${username}'s avatar`} />
        </StatefulLink>
      ) : (
        <Avatar src={null} alt="avatar" />
      )}
    </div>
  )
}

type PostOwnerUsernameProps = {
  linkClassName?: string
  deletedTextContent?: string
} & Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>

Post.OwnerUsername = function PostOwnerUsername({
  linkClassName,
  deletedTextContent = '[Deleted]',
  ...restProps
}: PostOwnerUsernameProps) {
  const { post } = useContext(PostContext)

  if (!post) {
    return <Skeleton width="20ch" />
  }

  const { ownerDetails } = post
  const { username } = ownerDetails

  return username && !post.deleted ? (
    <span {...restProps}>
      <StatefulLink className={linkClassName} to={`${ROUTES.PROFILES}/${username}`}>
        {username}
      </StatefulLink>
    </span>
  ) : (
    <span {...restProps}>{deletedTextContent}</span>
  )
}

Post.OwnerFollowButton = function PostOwnerFollowButton(
  props: Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>
) {
  const { following, uid } = useContext(UserContext)
  const { post } = useContext(PostContext)

  if (!post) {
    return (
      <span {...props}>
        <Skeleton width="8ch" />
      </span>
    )
  }

  const { owner } = post
  const isFollowing = following?.includes(owner)

  const toggleFollow = () => {
    if (!isFollowing) {
      followUser(owner).catch(console.error)
    } else {
      unfollowUser(owner).catch(console.error)
    }
  }

  return uid && owner !== uid && !post.deleted ? (
    <button type="button" onClick={toggleFollow} {...props}>
      {isFollowing ? 'Unfollow' : 'follow'}
    </button>
  ) : null
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

  return (
    <span {...restProps}>
      {' · '}
      {createdAt !== undefined ? (
        <StatefulLink className={linkClassName} to={`${ROUTES.POSTS}/${id}`}>
          <TimeAgo timestamp={createdAt} />
        </StatefulLink>
      ) : null}
      {updatedAt !== undefined ? (
        <>
          <span> · edited (</span>
          <StatefulLink className={linkClassName} to={`${ROUTES.POSTS}/${id}`}>
            <TimeAgo timestamp={updatedAt} />
          </StatefulLink>
          <span>)</span>
        </>
      ) : null}
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
  deletedTextContent?: string
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Post.Message = function PostMessage({
  deletedTextContent = '[Deleted]',
  ...restProps
}: PostMessageProps) {
  const { post } = useContext(PostContext)

  if (!post) {
    return (
      <div {...restProps}>
        <Skeleton count={3} />
      </div>
    )
  }

  return (
    <div {...restProps}>
      <p>{post.deleted ? deletedTextContent : post.message}</p>
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
  const { post, isPostPage } = useContext(PostContext)

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
      {isPostPage ? (
        <span>{`${repliesCount} repl${repliesCount === 1 ? 'y' : 'ies'}`}</span>
      ) : (
        <StatefulLink className={linkClassName} to={`${ROUTES.POSTS}/${id}`}>
          {`${repliesCount} repl${repliesCount === 1 ? 'y' : 'ies'}`}
        </StatefulLink>
      )}
    </div>
  )
}
