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
      <div className="flex justify-between items-center p-3 border-b lg:p-4">
        <UserProfile className="flex items-center" user={postLive?.ownerDetails || {}}>
          <UserProfile.Avatar
            className="flex-shrink-0 mr-4 w-12"
            linkClassName="hover:opacity-70"
          />
          <div className="flex flex-col">
            <div>
              <UserProfile.Username
                className="font-bold"
                linkClassName="hover:underline"
                deletedTextContent="[Deleted]"
              />
              <Post.DateCreated
                className="inline-block text-sm text-gray-500"
                linkClassName="hover:underline"
              />
            </div>
            <UserProfile.FollowButton className="w-min text-sm text-gray-500 hover:underline" />
          </div>
        </UserProfile>
        {postLive ? (
          <MenuContainer
            className="pr-4"
            horizontalDotsClassName="hidden sm:block"
            verticalDotsClassName="block sm:hidden"
            post={postLive}
          />
        ) : null}
      </div>
      <Post.Attachment className="border-b bg-gray-200" aspectRatio={16 / 9} />
      <div className="flex flex-col p-3 lg:p-4">
        <Post.ReplyingTo className="self-start mb-1 text-sm text-gray-500 hover:underline" />
        <Post.ViewAttachment className="self-start mb-1 text-sm text-gray-500 hover:underline" />
        <Post.Message
          className="mb-1 whitespace-pre-wrap"
          readMoreClassName="text-gray-500 hover:underline"
          readMoreTextContent="Read more"
          deletedTextContent="[Deleted]"
          lineClamp={isComment ? 4 : Infinity}
          fadeLines={2}
        />
        <div className="flex items-center mt-1 text-gray-500">
          <Post.ReplyButton className="mr-2 w-6 hover:opacity-70" />
          <Post.RepliesCount className="mr-2 text-sm" linkClassName="hover:underline" />
          <Post.LikeButton className="mr-2 w-6 hover:opacity-70" likedClassName="text-red-600" />
          <Post.LikesCount className="text-sm" />
        </div>
        {compose && postLive ? (
          <ComposeContainer className="mt-4" replyTo={{ id: postLive.id, owner: postLive.owner }} />
        ) : null}
        {postLive ? (
          <Comments
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
    <button
      className="block mt-4 text-sm text-gray-500 hover:underline"
      type="button"
      onClick={updateRepliesPool}
    >
      {`Load ${numNewReplies} new repl${numNewReplies === 1 ? 'y' : 'ies'}`}
    </button>
  )

  const viewSomeRepliesButton = (
    <button
      className="mt-4 text-sm text-gray-500 hover:underline"
      type="button"
      onClick={() => setMaxReplies(state => state + limit)}
    >
      {maxReplies === 0 ? 'View replies' : 'View more replies'}
    </button>
  )

  const viewAllRepliesButton = (
    <StatefulLink
      className="inline-block mt-4 text-sm text-gray-500 hover:underline"
      to={`${ROUTES.POSTS}/${post.id}`}
    >
      {`View all ${totalReplies} replies`}
    </StatefulLink>
  )

  let after: JSX.Element = <></>
  let before: JSX.Element = <></>

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
      {before}
      {repliesShown.map(reply => (
        <PostContainer
          className="mt-3 border rounded bg-white lg:mt-4"
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
      {after}
    </div>
  )
}
