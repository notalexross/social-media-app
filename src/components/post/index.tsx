import React, { createContext, useContext } from 'react'
import Skeleton from 'react-loading-skeleton'
import { HeartIcon, ChatAlt2Icon } from '@heroicons/react/outline'
import type { PostWithUserDetails } from '../../services/firebase'
import { likePost, unlikePost, followUser, unfollowUser } from '../../services/firebase'
import { UserContext } from '../../context/user'
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
  children: React.ReactNode
  post?: PostWithUserDetails
  hideAttachment?: boolean
  isComment?: boolean
  isPostPage?: boolean
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

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
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

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
      {username ? (
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
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

Post.OwnerUsername = function PostOwnerUsername({
  linkClassName,
  ...restProps
}: PostOwnerUsernameProps) {
  const { post } = useContext(PostContext)

  if (!post) {
    return <Skeleton width="20ch" />
  }

  const { ownerDetails } = post
  const { username } = ownerDetails

  return username ? (
    <StatefulLink className={linkClassName} to={`${ROUTES.PROFILES}/${username}`} {...restProps}>
      {username}
    </StatefulLink>
  ) : null
}

Post.OwnerFollowButton = function PostOwnerFollowButton(
  props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
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

  return uid && owner !== uid ? (
    <button type="button" onClick={toggleFollow} {...props}>
      {isFollowing ? 'Unfollow' : 'follow'}
    </button>
  ) : null
}

Post.ReplyingTo = function PostReplyingTo(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { post, isComment } = useContext(PostContext)
  const { replyTo, replyToOwnerDetails } = post || {}

  if (!post || !replyTo || !replyTo?.id || !replyToOwnerDetails?.username || isComment) {
    return null
  }

  return (
    <StatefulLink to={`${ROUTES.POSTS}/${replyTo?.id}`} post={replyTo.id} modal {...props}>
      {`Replying to ${replyToOwnerDetails?.username}`}
    </StatefulLink>
  )
}

Post.Message = function PostMessage(
  props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) {
  const { post } = useContext(PostContext)

  return <div {...props}>{post ? <p>{post.message}</p> : <Skeleton count={3} />}</div>
}

type PostAttachmentProps = {
  aspectRatio: '16/9' | '3/2' | '1/1'
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

Post.Attachment = function PostAttachment({ aspectRatio, ...restProps }: PostAttachmentProps) {
  const { post, hideAttachment } = useContext(PostContext)

  if (hideAttachment || (post && !post.attachment)) {
    return null
  }

  const imgClassName = 'absolute inset-0 w-full h-full w-full object-contain'

  return (
    <div {...restProps}>
      <div className={`relative pt-${aspectRatio}`}>
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
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  const { post, hideAttachment } = useContext(PostContext)

  if (!post || !hideAttachment || !post.attachment) {
    return null
  }

  return (
    <StatefulLink to={`${ROUTES.POSTS}/${post.id}`} post={post} modal {...props}>
      View attachment
    </StatefulLink>
  )
}

type PostLikeButtonProps = {
  activeColor: string
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

Post.LikeButton = function PostLikeButton({ activeColor, ...restProps }: PostLikeButtonProps) {
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

  const toggleLike: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (!isLiked) {
      likePost(id).catch(console.error)
    } else {
      unlikePost(id).catch(console.error)
    }
  }

  return (
    <button type="button" onClick={toggleLike} {...restProps}>
      <HeartIcon className={`${isLiked ? `fill-current text-${activeColor}` : ''}`} />
    </button>
  )
}

Post.ReplyButton = function PostReplyButton(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
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
  props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
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
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

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
