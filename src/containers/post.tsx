import { useEffect, useState } from 'react'
import type { PostWithUserDetails } from '../services/firebase'
import { Post, StatefulLink } from '../components'
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
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

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
      <div className="flex items-center p-4 border-b">
        <Post.OwnerAvatar className="block mr-4 w-12" linkClassName="hover:opacity-70" />
        <div className="flex flex-col">
          <div>
            <Post.OwnerUsername
              className="font-bold"
              linkClassName="hover:underline"
              deletedTextContent="[Deleted]"
            />
            <Post.DateCreated className="text-sm text-gray-500" linkClassName="hover:underline" />
          </div>
          <Post.OwnerFollowButton className="mb-1 w-min text-sm text-gray-500 hover:underline" />
        </div>
      </div>
      <Post.Attachment className="border-b bg-gray-200" aspectRatio="16/9" />
      <div className="flex flex-col p-4">
        <Post.ReplyingTo className="mb-1 text-sm text-gray-500 hover:underline" />
        <Post.ViewAttachment className="mb-1 text-sm text-gray-500 hover:underline" />
        <Post.Message className="mb-1" deletedTextContent="[Deleted]" />
        <div className="flex items-center mt-1 text-gray-500">
          <Post.ReplyButton className="mr-2 w-6 hover:opacity-70" />
          <Post.RepliesCount className="mr-2 text-sm" linkClassName="hover:underline" />
          <Post.LikeButton className="mr-2 w-6 hover:opacity-70" activeColor="red-600" />
          <Post.LikesCount className="text-sm" />
        </div>
        {compose ? <p className="mt-4 p-4 border rounded">Compose Post Placeholder</p> : null}
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
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

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
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => updateRepliesPool(), [post.id])

  if (!totalReplies) {
    return <></>
  }

  let viewRepliesButton: JSX.Element
  if (!isPostPage) {
    viewRepliesButton = (
      <StatefulLink
        className="block mt-4 text-sm text-gray-500 hover:underline"
        to={`${ROUTES.POSTS}/${post.id}`}
      >
        {`View all ${totalReplies} replies`}
      </StatefulLink>
    )
  } else if (
    totalReplies > 0 &&
    numNewReplies === 0 &&
    (totalShowableReplies > maxReplies || totalShowableReplies === 0)
  ) {
    viewRepliesButton = (
      <button
        className="mt-4 text-sm text-gray-500 hover:underline"
        type="button"
        onClick={() => setMaxReplies(state => state + limit)}
      >
        {maxReplies === 0 ? 'View replies' : 'View more replies'}
      </button>
    )
  } else {
    viewRepliesButton = <></>
  }

  return (
    <div {...restProps}>
      {numNewReplies > 0 ? (
        <button
          className="block mt-4 text-sm text-gray-500 hover:underline"
          type="button"
          onClick={updateRepliesPool}
        >
          {`Load ${numNewReplies} new repl${numNewReplies === 1 ? 'y' : 'ies'}`}
        </button>
      ) : null}
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
      {hasMoreReplies ? viewRepliesButton : null}
    </div>
  )
}
