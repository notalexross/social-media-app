import { EmojiHappyIcon, PaperClipIcon } from '@heroicons/react/outline'
import type { PostWithReplyTo, PostWithUserDetails } from '../services/firebase'
import { Compose } from '../components'
import { useResponsivePopper, useWindowDimensions } from '../hooks'

type ComposeContainerProps = {
  replyTo?: string | null
  originalPost?: PostWithReplyTo | PostWithUserDetails
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function ComposeContainer({
  originalPost,
  replyTo,
  ...restProps
}: ComposeContainerProps): JSX.Element {
  const [windowWidth, windowHeight] = useWindowDimensions()
  const [popperRef, popperRelativeRef] = useResponsivePopper<HTMLDivElement, HTMLDivElement>({
    offsetY: -0.5
  })
  const replyToPost = replyTo || originalPost?.replyTo
  const submitButtonContent = `${originalPost ? 'Update ' : ''}${replyToPost ? 'Reply' : 'Post'}`

  return (
    <div {...restProps}>
      <Compose
        className="border rounded"
        replyTo={replyToPost}
        originalPost={originalPost}
        softCharacterLimit={2000}
        hardCharacterLimit={3000}
      >
        <div className="w-full bg-clr-background">
          <Compose.AttachmentPreview
            className="mx-auto w-2/3 bg-clr-attachment-background border"
            aspectRatio={16 / 9}
          />
        </div>
        <div>
          <Compose.MessageInput
            className="p-4"
            containerClassName="relative whitespace-pre-wrap min-h-28"
            overLimitClassName="text-clr-highlight-foreground bg-clr-highlight-background"
            placeholder={replyToPost ? 'Enter your reply...' : 'Enter your message...'}
            aria-label="Reply to post"
            autoComplete="off"
          />
          <Compose.ErrorMessage className="px-4 py-2 border-t font-bold text-sm text-clr-secondary bg-clr-error" />
          <Compose.Success className="px-4 py-2 border-t font-bold text-sm text-clr-secondary bg-clr-success">
            {`Post ${originalPost ? 'Updated' : 'Created'} Successfully (`}
            <Compose.PostLink className="hover:underline hover:text-clr-link-hover focus:underline focus:text-clr-link-hover">
              View Post
            </Compose.PostLink>
            )
          </Compose.Success>
          <div className="flex justify-between items-center py-2 px-4 border-t">
            <div className="flex items-center">
              <Compose.AttachButton className="mr-2 w-6 text-clr-primary text-opacity-75 hover:text-clr-link-hover focus:text-clr-link-hover">
                <PaperClipIcon />
              </Compose.AttachButton>
              <div ref={popperRelativeRef}>
                <Compose.EmojiButton className="block w-6 text-clr-primary text-opacity-75 hover:text-clr-link-hover focus:text-clr-link-hover">
                  <EmojiHappyIcon />
                </Compose.EmojiButton>
              </div>
            </div>
            <div className="flex items-center ml-2">
              <Compose.ProgressBar
                className="mr-4 text-clr-accent text-sm font-bold"
                nearLimitClassName="text-clr-warning"
                overLimitClassName="text-clr-error"
                backgroundClassName="text-clr-primary text-opacity-10"
                widthRem={1.75}
                thicknessRem={0.25}
                nearLimitFraction={0.75}
                showTextBelowValue={30}
                showCircleAboveValue={-9}
              />
              <Compose.SubmitButton
                className="py-1 px-5 bg-clr-accent font-bold text-sm text-clr-secondary border rounded hover:bg-clr-accent-hover focus:bg-clr-accent-hover disabled:bg-clr-accent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {submitButtonContent}
              </Compose.SubmitButton>
            </div>
          </div>
        </div>
        <div className="z-10" ref={popperRef}>
          <Compose.EmojiSelect
            className="w-80 h-96 bg-clr-secondary border rounded shadow-md"
            style={{
              margin: '0.5rem',
              maxWidth: `calc(${windowWidth}px - 2 * 0.5rem)`,
              maxHeight: `calc(${windowHeight}px - 2 * 0.5rem)`
            }}
          />
        </div>
      </Compose>
    </div>
  )
}
