import { useContext } from 'react'
import { EmojiHappyIcon, PaperClipIcon } from '@heroicons/react/outline'
import type { PostWithUserDetails, ReplyTo } from '../services/firebase'
import { Compose } from '../components'
import { UserContext } from '../context/user'
import { useResponsivePopper } from '../hooks'

type ComposeContainerProps = {
  replyTo?: ReplyTo
  originalPost?: PostWithUserDetails
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function ComposeContainer({
  originalPost,
  replyTo,
  ...restProps
}: ComposeContainerProps): JSX.Element {
  const { avatar, username } = useContext(UserContext)
  const [popperRef, popperRelativeRef] = useResponsivePopper<HTMLDivElement, HTMLDivElement>({
    offsetY: -0.5
  })
  const replyToPost = replyTo || originalPost?.replyTo

  if (!avatar || !username) {
    return <></>
  }

  let submitButtonContent = originalPost ? 'Update ' : ''
  submitButtonContent += replyToPost ? 'Reply' : 'Post'

  return (
    <div {...restProps}>
      <Compose
        className="border rounded"
        replyTo={replyToPost}
        originalPost={originalPost}
        softCharacterLimit={2000}
        hardCharacterLimit={3000}
      >
        <div className="w-full bg-gray-50">
          <Compose.AttachmentPreview
            className="mx-auto w-2/3 bg-gray-200 border"
            aspectRatio={16 / 9}
          />
        </div>
        <div>
          <Compose.MessageInput
            className="p-4"
            containerClassName="relative whitespace-pre-wrap min-h-28"
            overLimitClassName="text-white bg-pink-500"
            placeholder={replyToPost ? 'Enter your reply...' : 'Enter your message...'}
            aria-label="Reply to post"
            autoComplete="off"
          />
          <Compose.ErrorMessage className="px-4 py-2 border-t text-sm text-white bg-red-500" />
          <div className="flex justify-between items-center py-2 px-4 border-t">
            <div className="flex items-center text-gray-500">
              <Compose.AttachButton className="mr-2 w-6 hover:opacity-70">
                <PaperClipIcon />
              </Compose.AttachButton>
              <div ref={popperRelativeRef}>
                <Compose.EmojiButton className="block w-6 hover:opacity-70">
                  <EmojiHappyIcon />
                </Compose.EmojiButton>
              </div>
            </div>
            <div className="flex items-center">
              <Compose.ProgressBar
                className="mr-4 text-blue-500 text-sm font-bold"
                nearLimitClassName="text-yellow-500"
                overLimitClassName="text-red-500"
                backgroundClassName="text-gray-200"
                widthRem={1.75}
                thicknessRem={0.25}
                nearLimitFraction={0.75}
                showTextBelowValue={30}
                showCircleAboveValue={-9}
              />
              <Compose.SubmitButton
                className="py-1 px-5 bg-blue-500 font-bold text-sm text-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-70"
                aria-label="Send message"
              >
                {submitButtonContent}
              </Compose.SubmitButton>
            </div>
          </div>
        </div>
        <div className="z-10" ref={popperRef}>
          <Compose.EmojiSelect
            className="w-80 h-96 bg-white text-gray-500 border rounded shadow-md"
            style={{
              margin: '0.5rem',
              maxWidth: 'calc(100vw - 2 * 0.5rem)',
              maxHeight: 'calc(100vh - 2 * 0.5rem)'
            }}
          />
        </div>
      </Compose>
    </div>
  )
}
