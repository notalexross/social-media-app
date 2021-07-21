import type { PostWithUserDetails } from '../services/firebase'
import { Post } from '../components'
import { usePosts } from '../hooks'

let WrappedPostContainer: (props: WrappedPostContainerProps) => JSX.Element = () => <></>

type PostContainerProps = {
  post: PostWithUserDetails | string
  hideAttachment?: boolean
  isComment?: boolean
  isPostPage?: boolean
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function PostContainer({
  post,
  hideAttachment = false,
  isComment = false,
  isPostPage = false,
  ...restProps
}: PostContainerProps): JSX.Element {
  return typeof post === 'string' ? (
    <WrappedPostContainer
      postId={post}
      hideAttachment={hideAttachment}
      isPostPage={isPostPage}
      {...restProps}
    />
  ) : (
    <div {...restProps}>
      <Post
        className="border rounded bg-white"
        post={post}
        hideAttachment={hideAttachment}
        isComment={isComment}
        isPostPage={isPostPage}
      >
        <div className="flex items-center p-4 border-b">
          <Post.OwnerAvatar className="block mr-4 w-12 hover:opacity-70" />
          <div className="flex flex-col">
            <Post.OwnerUsername className="font-bold hover:underline" />
            <Post.OwnerFollowButton className="mb-1 w-min text-sm text-gray-500 hover:underline" />
          </div>
        </div>
        <Post.Attachment className="border-b bg-gray-200" aspectRatio="16/9" />
        <div className="flex flex-col p-4 border-b">
          <Post.ReplyingTo className="mb-1 text-sm text-gray-500 hover:underline" />
          <Post.ViewAttachment className="mb-1 text-sm text-gray-500 hover:underline" />
          <Post.Message className="mb-1" />
          <div className="flex items-center mt-1 text-gray-500">
            <Post.ReplyButton className="mr-2 w-6 hover:opacity-70" />
            <Post.RepliesCount className="mr-2 text-sm" linkClassName="hover:underline" />
            <Post.LikeButton className="mr-2 w-6 hover:opacity-70" activeColor="red-600" />
            <Post.LikesCount className="text-sm" />
          </div>
        </div>
      </Post>
    </div>
  )
}

type WrappedPostContainerProps = Omit<PostContainerProps, 'post'> & { postId: string }

WrappedPostContainer = ({ postId, ...restProps }: WrappedPostContainerProps) => {
  const post = usePosts(postId)

  return post ? <PostContainer post={post} {...restProps} /> : <></>
}
