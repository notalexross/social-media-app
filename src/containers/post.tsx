import { useContext, useEffect, useMemo, useState } from 'react'
import type { PostOrPostId, PostWithReplyTo, PostWithUserDetails } from '../services/firebase'
import ComposeContainer from './compose'
import MenuContainer from './menu'
import { UserContext } from '../context/user'
import { Post, StatefulLink, UserProfile } from '../components'
import { usePost } from '../hooks'
import * as ROUTES from '../constants/routes'

let Comments: (props: CommentsProps) => JSX.Element = () => <></>

type PostContainerProps = {
  post?: PostOrPostId
  commentsLimit?: number
  maxDepth?: number
  currentDepth?: number
  compose?: boolean
  hideAttachment?: boolean
  isComment?: boolean
  isPostPage?: boolean
  errorHandler?: (error: string) => void
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function PostContainer({
  post,
  commentsLimit = Infinity,
  maxDepth = Infinity,
  currentDepth = 0,
  compose = false,
  hideAttachment = false,
  isComment = false,
  isPostPage = false,
  errorHandler,
  ...restProps
}: PostContainerProps): JSX.Element {
  const { uid } = useContext(UserContext)
  const postWithReplyTo = usePost(post, {
    fetchPublic: 'subscribe',
    fetchContent: 'subscribeIfOwner',
    fetchReplyTo: isComment ? 'none' : 'get',
    errorCallback: errorHandler
  })

  const isOwner = uid !== undefined && postWithReplyTo?.owner === uid

  return (
    <Post
      post={postWithReplyTo}
      hideAttachment={hideAttachment}
      isComment={isComment}
      isPostPage={isPostPage}
      {...restProps}
    >
      <div className="overflow-hidden">
        <div
          className={`flex justify-between items-center p-3 sm:p-3 lg:p-4 ${
            isComment ? 'pb-0 sm:border-b' : 'border-b'
          }`}
        >
          <UserProfile
            className="flex items-center min-w-0"
            user={isOwner && postWithReplyTo?.deleted ? null : postWithReplyTo?.ownerDetails}
          >
            <UserProfile.Avatar
              className={`flex-shrink-0 mr-2 lg:mr-3 ${isComment ? 'w-8 sm:w-12' : 'w-12'}`}
              linkClassName="hover:opacity-70"
            />
            <div className="flex flex-col p-1 overflow-hidden break-words">
              <div className="leading-none">
                <UserProfile.Username
                  className={`font-bold ${isComment ? 'text-sm sm:text-base' : 'text-base'}`}
                  linkClassName="hover:underline focus:underline"
                />
                <Post.DateCreated
                  className={`text-clr-primary text-opacity-75 ${
                    isComment ? 'text-xs sm:text-sm' : 'text-sm'
                  }`}
                  linkClassName="hover:underline focus:underline"
                />
              </div>
              <UserProfile.FollowButton
                className={`w-min text-sm text-clr-primary text-opacity-75 hover:underline focus:underline ${
                  isComment ? 'hidden sm:block' : ''
                }`}
              />
            </div>
          </UserProfile>
          {postWithReplyTo ? (
            <MenuContainer
              className="flex-shrink-0 pr-1 sm:pr-4"
              horizontalDotsClassName="hidden sm:block"
              verticalDotsClassName="block sm:hidden"
              post={postWithReplyTo}
            />
          ) : null}
        </div>
        <Post.Attachment className="border-b bg-clr-attachment-background" aspectRatio={16 / 9} />
        <div className="flex flex-col p-3 lg:p-4 lg:pb-3">
          <Post.ReplyingTo className="self-start text-sm text-clr-primary text-opacity-75 hover:underline focus:underline" />
          <Post.ViewAttachment className="self-start text-sm text-clr-primary text-opacity-75 hover:underline focus:underline" />
          <Post.Message
            className="mt-1 whitespace-pre-wrap break-words"
            readMoreClassName="text-sm text-clr-primary text-opacity-75 hover:underline focus:underline"
            readMoreTextContent="Read more"
            lineClamp={isComment ? 4 : Infinity}
            fadeLines={2}
          />
          <div className="flex items-center mt-2">
            <Post.ReplyButton className="mr-2 w-6 text-clr-primary text-opacity-75 hover:text-opacity-100 hover:text-clr-link-hover focus:text-opacity-100 focus:text-clr-link-hover" />
            <Post.RepliesCount
              className="mr-3 text-sm text-clr-primary text-opacity-75"
              linkClassName="hover:underline focus:underline"
            />
            <Post.LikeButton
              className="mr-2 w-6 text-clr-primary text-opacity-75 hover:text-opacity-100 hover:text-clr-link-hover focus:text-opacity-100 focus:text-clr-link-hover"
              likedClassName="mr-2 w-6 text-clr-heart hover:text-clr-link-hover focus:text-clr-link-hover"
              likedFill="rgb(var(--clr-heart))"
            />
            <Post.LikesCount className="text-sm text-clr-primary text-opacity-75" />
          </div>
          {compose && postWithReplyTo ? (
            <ComposeContainer className="mt-2" replyTo={postWithReplyTo.id} />
          ) : null}
          {postWithReplyTo ? (
            <Comments
              className="-mr-3 -ml-1 sm:mr-0 sm:ml-0"
              post={postWithReplyTo}
              limit={commentsLimit}
              maxDepth={maxDepth}
              currentDepth={currentDepth + 1}
              isPostPage={isPostPage}
            />
          ) : null}
        </div>
      </div>
    </Post>
  )
}

type CommentsProps = {
  post: PostWithReplyTo | PostWithUserDetails
  limit?: number
  maxDepth?: number
  currentDepth?: number
  compose?: boolean
  hideAttachment?: boolean
  isPostPage?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Comments = function CommentsContainer({
  post,
  limit = Infinity,
  maxDepth = Infinity,
  currentDepth = 0,
  isPostPage = false,
  ...restProps
}: CommentsProps) {
  const { replies: repliesUnfiltered, deletedReplies } = post
  const replies = useMemo(
    () => repliesUnfiltered.filter(reply => !deletedReplies.includes(reply)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repliesUnfiltered.length]
  )
  const [repliesPool, setRepliesPool] = useState(replies.slice().reverse())
  const [maxReplies, setMaxReplies] = useState(currentDepth > maxDepth ? 0 : limit)
  const repliesShown = repliesPool.slice(0, maxReplies)
  const numNewReplies = replies.filter(reply => !repliesPool.includes(reply)).length
  const hasMoreReplies = replies.filter(reply => !repliesShown.includes(reply)).length > 0

  const updateRepliesPool = () => setRepliesPool(replies.slice().reverse())

  const showLatestRepliesbutton = (
    <button type="button" onClick={updateRepliesPool}>
      {`Show latest repl${maxReplies > 1 || isPostPage ? 'ies' : 'y'}`}
    </button>
  )

  const viewSomeRepliesButton = (
    <button
      type="button"
      onClick={() => {
        if (numNewReplies > 0 && repliesShown.length === 0) {
          updateRepliesPool()
          if (maxReplies === 0) {
            setMaxReplies(state => state + limit)
          }
        } else {
          setMaxReplies(state => state + limit)
        }
      }}
    >
      {repliesShown.length === 0 ? 'View replies' : 'View more replies'}
    </button>
  )

  const viewAllRepliesButton = (
    <StatefulLink to={`${ROUTES.POSTS}/${post.id}`}>
      {`View all ${replies.length} replies`}
    </StatefulLink>
  )

  let after: JSX.Element | null = null
  let before: JSX.Element | null = null

  if (hasMoreReplies) {
    if (isPostPage) {
      if (numNewReplies > 0 && repliesShown.length > 0) {
        before = showLatestRepliesbutton
      }

      if (numNewReplies > 0 && repliesShown.length === 0) {
        before = viewSomeRepliesButton
      } else if (numNewReplies === 0 || repliesPool.length > repliesShown.length) {
        after = viewSomeRepliesButton
      }
    } else {
      if (numNewReplies > 0 && maxReplies > 0) {
        before = showLatestRepliesbutton
      }

      if (numNewReplies === 0 || maxReplies === 0 || repliesShown.length > 0) {
        after = viewAllRepliesButton
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => updateRepliesPool(), [post.id])

  return (
    <div {...restProps}>
      {before && (
        <div className="mt-2 ml-2 sm:ml-0 text-sm text-clr-primary text-opacity-75 w-max hover:underline">
          {before}
        </div>
      )}
      {repliesShown.length ? <div className="mt-3" /> : null}
      {repliesShown.map(reply => (
        <PostContainer
          className="mt-1 border-t border-b border-l rounded-l bg-clr-secondary shadow sm:mt-3 sm:border sm:rounded"
          key={reply}
          post={reply}
          commentsLimit={limit}
          maxDepth={maxDepth}
          currentDepth={currentDepth}
          isPostPage={isPostPage}
          hideAttachment
          isComment
        />
      ))}
      {after ? (
        <div className="mt-2 ml-2 sm:ml-0 text-sm text-clr-primary text-opacity-75 w-max hover:underline">
          {after}
        </div>
      ) : (
        <div className="-mb-1 sm:mb-0" />
      )}
    </div>
  )
}
