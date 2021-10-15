import { useEffect, useState } from 'react'
import type {
  PostPublicWithId,
  PostContentWithId,
  PostWithId,
  PostWithUserDetails
} from '../services/firebase'
import ComposeContainer from './compose'
import MenuContainer from './menu'
import { Post, StatefulLink, UserProfile } from '../components'
import { usePost } from '../hooks'
import * as ROUTES from '../constants/routes'

let Comments: (props: CommentsProps) => JSX.Element = () => <></>

type PostContainerProps = {
  post?: string | PostPublicWithId | PostContentWithId | PostWithId | PostWithUserDetails
  commentsLimit?: number
  maxDepth?: number
  currentDepth?: number
  compose?: boolean
  hideAttachment?: boolean
  isComment?: boolean
  isPostPage?: boolean
  subscribe?: boolean
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
  subscribe = true,
  errorHandler,
  ...restProps
}: PostContainerProps): JSX.Element {
  const postLive = usePost(post, { subscribe, errorCallback: errorHandler })

  return (
    <Post
      className="border rounded bg-white"
      post={postLive}
      hideAttachment={hideAttachment}
      isComment={isComment}
      isPostPage={isPostPage}
      {...restProps}
    >
      <div
        className={`flex justify-between items-center p-3 sm:p-3 lg:p-4 ${
          isComment ? 'pb-0 sm:border-b' : 'border-b'
        }`}
      >
        <UserProfile className="flex items-center min-w-0" user={postLive?.ownerDetails || {}}>
          <UserProfile.Avatar
            className={`flex-shrink-0 mr-3 lg:mr-4 ${isComment ? 'w-8 sm:w-12' : 'w-12'}`}
            linkClassName="hover:opacity-70"
          />
          <div className="flex flex-col overflow-hidden break-words">
            <div className="leading-none">
              <UserProfile.Username
                className={`font-bold ${isComment ? 'text-sm sm:text-base' : 'text-base'}`}
                linkClassName="hover:underline"
                deletedTextContent="[Deleted]"
              />
              <Post.DateCreated
                className={`text-gray-500 ${isComment ? 'text-xs sm:text-sm' : 'text-sm'}`}
                linkClassName="hover:underline"
              />
            </div>
            <UserProfile.FollowButton
              className={`w-min text-sm text-gray-500 hover:underline ${
                isComment ? 'hidden sm:block' : ''
              }`}
            />
          </div>
        </UserProfile>
        {postLive ? (
          <MenuContainer
            className="flex-shrink-0 pr-1 sm:pr-4"
            horizontalDotsClassName="hidden sm:block"
            verticalDotsClassName="block sm:hidden"
            post={postLive}
          />
        ) : null}
      </div>
      <Post.Attachment className="border-b bg-gray-200" aspectRatio={16 / 9} />
      <div className="flex flex-col p-3 lg:p-4 lg:pb-3">
        <Post.ReplyingTo className="self-start text-sm text-gray-500 hover:underline" />
        <Post.ViewAttachment className="self-start text-sm text-gray-500 hover:underline" />
        <Post.Message
          className="mt-1 whitespace-pre-wrap"
          readMoreClassName="text-sm text-gray-500 hover:underline"
          readMoreTextContent="Read more"
          deletedTextContent="[Deleted]"
          lineClamp={isComment ? 4 : Infinity}
          fadeLines={2}
        />
        <div className="flex items-center mt-2 text-gray-500">
          <Post.ReplyButton className="mr-2 w-6 hover:opacity-70" />
          <Post.RepliesCount className="mr-3 text-sm" linkClassName="hover:underline" />
          <Post.LikeButton className="mr-2 w-6 hover:opacity-70" likedClassName="text-red-600" />
          <Post.LikesCount className="text-sm" />
        </div>
        {compose && postLive ? (
          <ComposeContainer className="mt-2" replyTo={{ id: postLive.id, owner: postLive.owner }} />
        ) : null}
        {postLive ? (
          <Comments
            className="-mr-3 -ml-1 sm:mr-0 sm:ml-0"
            post={postLive}
            limit={commentsLimit}
            maxDepth={maxDepth}
            currentDepth={currentDepth + 1}
            isPostPage={isPostPage}
          />
        ) : null}
      </div>
    </Post>
  )
}

type CommentsProps = {
  post: PostWithUserDetails
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
  const { replies } = post
  const [repliesPool, setRepliesPool] = useState(replies.slice().reverse())
  const [maxReplies, setMaxReplies] = useState(currentDepth > maxDepth ? 0 : limit)
  const repliesShown = repliesPool.slice(0, maxReplies)
  const totalReplies = replies.length
  const totalShowableReplies = repliesPool.length
  const totalRepliesShown = repliesShown.length
  const numNewReplies = totalReplies - totalShowableReplies
  const hasMoreReplies = totalReplies > totalRepliesShown

  const updateRepliesPool = () => setRepliesPool(replies.slice().reverse())

  const loadNewRepliesbutton = (
    <button type="button" onClick={updateRepliesPool}>
      {`Load ${numNewReplies} new repl${numNewReplies === 1 ? 'y' : 'ies'}`}
    </button>
  )

  const viewSomeRepliesButton = (
    <button type="button" onClick={() => setMaxReplies(state => state + limit)}>
      {maxReplies === 0 ? 'View replies' : 'View more replies'}
    </button>
  )

  const viewAllRepliesButton = (
    <StatefulLink to={`${ROUTES.POSTS}/${post.id}`}>
      {`View all ${totalReplies} replies`}
    </StatefulLink>
  )

  let after: JSX.Element | null = null
  let before: JSX.Element | null = null

  if (hasMoreReplies) {
    if (!isPostPage) {
      if (numNewReplies > 0 && maxReplies > 0) {
        before = loadNewRepliesbutton
      }

      if (!(numNewReplies > 0 && maxReplies > 0) || totalRepliesShown > 0) {
        after = viewAllRepliesButton
      }
    } else {
      if (numNewReplies > 0) {
        before = loadNewRepliesbutton
      }

      if (!(numNewReplies > 0) || totalRepliesShown > 0) {
        after = viewSomeRepliesButton
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => updateRepliesPool(), [post.id])

  return (
    <div {...restProps}>
      {before && (
        <div className="mt-2 ml-2 sm:ml-0 text-sm text-gray-500 w-max hover:underline">
          {before}
        </div>
      )}
      {repliesShown.length ? <div className="mt-3" /> : null}
      {repliesShown.map(reply => (
        <PostContainer
          className="mt-1 border-t border-b border-l rounded-l bg-white sm:mt-3 sm:border sm:rounded"
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
        <div className="mt-2 ml-2 sm:ml-0 text-sm text-gray-500 w-max hover:underline">{after}</div>
      ) : (
        <div className="-mb-1 sm:mb-0" />
      )}
    </div>
  )
}
