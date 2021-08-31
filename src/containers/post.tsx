import { useEffect, useState } from 'react'
import type { PostWithUserDetails } from '../services/firebase'
import ComposeContainer from './compose'
import MenuContainer from './menu'
import { Post, StatefulLink, UserProfile } from '../components'
import { usePosts, usePostsLive } from '../hooks'
import * as ROUTES from '../constants/routes'

let WrappedPostContainer: (props: WrappedPostContainerProps) => JSX.Element = () => <></>
let Comments: (props: CommentsProps) => JSX.Element = () => <></>

type PostContainerProps = {
  post?: PostWithUserDetails | string
  commentsLimit?: number
  maxDepth?: number
  currentDepth?: number
  compose?: boolean
  hideAttachment?: boolean
  isComment?: boolean
  isPostPage?: boolean
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
  ...restProps
}: PostContainerProps): JSX.Element {
  return typeof post === 'string' ? (
    <WrappedPostContainer
      postId={post}
      commentsLimit={commentsLimit}
      maxDepth={maxDepth}
      currentDepth={currentDepth}
      compose={compose}
      hideAttachment={hideAttachment}
      isPostPage={isPostPage}
      {...restProps}
    />
  ) : (
    <Post
      className="border rounded bg-white"
      post={post}
      hideAttachment={hideAttachment}
      isComment={isComment}
      isPostPage={isPostPage}
      {...restProps}
    >
      <div className="flex justify-between items-center p-3 border-b lg:p-4">
        <UserProfile className="flex items-center" user={post?.ownerDetails || {}}>
          <UserProfile.Avatar className="mr-4 w-12" linkClassName="hover:opacity-70" />
          <div className="flex flex-col">
            <div>
              <UserProfile.Username
                className="font-bold"
                linkClassName="hover:underline"
                deletedTextContent="[Deleted]"
              />
              <Post.DateCreated className="text-sm text-gray-500" linkClassName="hover:underline" />
            </div>
            <UserProfile.FollowButton className="w-min text-sm text-gray-500 hover:underline" />
          </div>
        </UserProfile>
        {post ? <MenuContainer className="pr-4" post={post} /> : null}
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
        {compose && post ? (
          <ComposeContainer className="mt-4" replyTo={{ id: post.id, owner: post.owner }} />
        ) : null}
        {post ? (
          <Comments
            post={post}
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

type WrappedPostContainerProps = Omit<PostContainerProps, 'post'> & { postId: string }

WrappedPostContainer = ({ postId, ...restProps }: WrappedPostContainerProps) => {
  const post = usePosts(postId)

  return post ? <PostContainer post={post} {...restProps} /> : <PostContainer {...restProps} />
}

type CommentProps = {
  id: string
  limit?: number
  maxDepth?: number
  currentDepth?: number
  hideAttachment?: boolean
  isPostPage?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

function Comment({
  id,
  limit = Infinity,
  maxDepth = Infinity,
  currentDepth = 0,
  hideAttachment = false,
  isPostPage = false,
  ...restProps
}: CommentProps) {
  const postSnaphot = usePosts(id)
  const comment = usePostsLive(postSnaphot || null)

  return comment ? (
    <PostContainer
      post={comment}
      commentsLimit={limit}
      maxDepth={maxDepth}
      currentDepth={currentDepth}
      hideAttachment={hideAttachment}
      isPostPage={isPostPage}
      isComment
      {...restProps}
    />
  ) : (
    <PostContainer
      hideAttachment={hideAttachment}
      isPostPage={isPostPage}
      isComment
      {...restProps}
    />
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

Comments = ({
  post,
  limit = Infinity,
  maxDepth = Infinity,
  currentDepth = 0,
  isPostPage = false,
  ...restProps
}: CommentsProps) => {
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
        <Comment
          className="mt-4 border rounded bg-white"
          key={reply}
          id={reply}
          limit={limit}
          maxDepth={maxDepth}
          currentDepth={currentDepth}
          isPostPage={isPostPage}
          hideAttachment
        />
      ))}
      {after}
    </div>
  )
}
