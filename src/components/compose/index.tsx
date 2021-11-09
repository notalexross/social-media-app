import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { PostWithReplyTo, PostWithUserDetails } from '../../services/firebase'
import type { IEmojiData } from '../emoji-picker'
import EmojiPicker from '../emoji-picker'
import FocusTrap from '../focus-trap'
import { disableForm, enableElements, stringifyError } from '../../utils'
import { useProtectedFunctions } from '../../hooks'
import * as ROUTES from '../../constants/routes'
import StatefulLink from '../stateful-link'

type ComposeContextValue = {
  error: string
  didSend: boolean
  postId: string | undefined
  message: string
  setMessage: React.Dispatch<React.SetStateAction<string>>
  attachment: File | string | undefined
  setAttachment: React.Dispatch<React.SetStateAction<File | string | undefined>>
  previewSrc: string | undefined
  setPreviewSrc: React.Dispatch<React.SetStateAction<string | undefined>>
  showEmojiSelect: boolean
  setShowEmojiSelect: React.Dispatch<React.SetStateAction<boolean>>
  hasChanges: boolean
  softCharacterLimit: number
}

const ComposeContext = createContext({} as ComposeContextValue)

type ComposeProps = {
  replyTo?: string | null
  originalPost?: PostWithReplyTo | PostWithUserDetails
  softCharacterLimit?: number
  hardCharacterLimit?: number
} & React.ComponentPropsWithoutRef<'form'>

export default function Compose({
  children,
  replyTo,
  originalPost,
  softCharacterLimit = 150,
  hardCharacterLimit = 1150,
  ...restProps
}: ComposeProps): JSX.Element {
  const { addPost, editPost } = useProtectedFunctions()

  const hasContent = originalPost && 'message' in originalPost
  const initialMessage = hasContent ? originalPost.message : ''
  const initialAttachment = hasContent ? originalPost.attachment : undefined

  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState(initialMessage)
  const [savedAttachment, setSavedAttachment] = useState<File | string | undefined>(initialMessage)
  const [message, setMessage] = useState(initialMessage)
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(initialAttachment)
  const [attachment, setAttachment] = useState<File | string | undefined>(initialAttachment)
  const [showEmojiSelect, setShowEmojiSelect] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [didSend, setDidSend] = useState(false)
  const [postId, setPostId] = useState<string | undefined>(originalPost?.id)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async event => {
    setDidSend(false)
    event.preventDefault()
    const disabledElements = disableForm(event.currentTarget)

    try {
      if (originalPost) {
        await editPost(originalPost, { message, attachment })
      } else {
        setPostId(undefined)
        setPostId(await addPost({ message, replyTo, attachment }))
      }

      setDidSend(true)
      enableElements(disabledElements)
    } catch (err) {
      setError(stringifyError(err))
      enableElements(disabledElements)
    }
  }

  useEffect(() => {
    const isSameMessage = message === savedMessage
    const isSameAttachment = attachment === savedAttachment
    setHasChanges(!isSameMessage || !isSameAttachment)
  }, [attachment, message, savedAttachment, savedMessage])

  useEffect(() => {
    if (message.length > hardCharacterLimit) {
      setMessage(m => m.slice(0, hardCharacterLimit))
    }
  }, [hardCharacterLimit, message])

  useEffect(() => {
    if (didSend) {
      if (originalPost) {
        setSavedMessage(message)
        setSavedAttachment(attachment)
      } else {
        setMessage('')
        setAttachment(undefined)
        setPreviewSrc(undefined)
      }

      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didSend, originalPost])

  return (
    <ComposeContext.Provider
      value={{
        error,
        didSend,
        postId,
        message,
        setMessage,
        attachment,
        setAttachment,
        previewSrc,
        setPreviewSrc,
        showEmojiSelect,
        setShowEmojiSelect,
        hasChanges,
        softCharacterLimit
      }}
    >
      <form onSubmit={handleSubmit} {...restProps}>
        {children}
      </form>
    </ComposeContext.Provider>
  )
}

type ComposeMessageInput = {
  containerClassName?: string
  overLimitClassName?: string
} & Omit<React.ComponentPropsWithoutRef<'textarea'>, 'children'>

Compose.MessageInput = function ComposeMessageInput({
  className,
  containerClassName,
  overLimitClassName,
  ...restProps
}: ComposeMessageInput) {
  const { message, setMessage, softCharacterLimit } = useContext(ComposeContext)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className={containerClassName || 'relative whitespace-pre-wrap'}>
      <div className={className}>
        <div className="break-words" style={{ height: '100%', width: '100%' }} aria-hidden>
          <span>{`${message.slice(0, softCharacterLimit)}`}</span>
          <span className={overLimitClassName}>{`${message.slice(softCharacterLimit)}`}</span>
          <span>&nbsp;</span>
        </div>
      </div>
      <div className="absolute inset-0 h-full w-full">
        <textarea
          className={className}
          ref={inputRef}
          value={message}
          onChange={({ target: { value } }) => setMessage(value)}
          style={{
            height: '100%',
            width: '100%',
            resize: 'none',
            color: 'transparent',
            backgroundColor: 'transparent',
            caretColor: 'rgb(var(--clr-primary))',
            overflow: 'hidden'
          }}
          {...restProps}
        />
      </div>
    </div>
  )
}

type ComposeProgressBarProps = {
  widthPx?: number
  thicknessPx?: number
  widthRem?: number
  thicknessRem?: number
  nearLimitFraction?: number
  nearLimitClassName?: string
  overLimitClassName?: string
  backgroundClassName?: string
  showTextBelowValue?: number
  showCircleAboveValue?: number
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Compose.ProgressBar = function ComposeProgressBar({
  widthPx,
  thicknessPx,
  widthRem = 1.75,
  thicknessRem = 0.25,
  nearLimitFraction = 0.75,
  nearLimitClassName = 'text-red-500',
  overLimitClassName = 'text-yellow-500',
  backgroundClassName = 'text-gray-200',
  showTextBelowValue = 99,
  showCircleAboveValue = -9,
  ...restProps
}: ComposeProgressBarProps) {
  const { message, softCharacterLimit } = useContext(ComposeContext)
  const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const width = widthPx || remToPx * widthRem
  const thickness = thicknessPx || remToPx * thicknessRem
  const outerRadius = width / 2
  const remainingCharacters = softCharacterLimit - message.length
  const progress = Math.min(message.length / softCharacterLimit, 1)
  const circumference = (outerRadius - thickness / 2) * 2 * Math.PI
  const isNearLimit = progress > nearLimitFraction
  const isOverLimit = message.length > softCharacterLimit
  const circleProps = {
    stroke: 'currentColor',
    fill: 'transparent',
    strokeWidth: thickness,
    r: outerRadius - thickness / 2,
    cx: outerRadius,
    cy: outerRadius
  }

  let circleClassName = ''
  if (isOverLimit) {
    circleClassName = overLimitClassName
  } else if (isNearLimit) {
    circleClassName = nearLimitClassName
  }

  return (
    <div
      {...restProps}
      role="progressbar"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
    >
      <div className="relative" style={{ minWidth: `${width}px`, minHeight: `${width}px` }}>
        {remainingCharacters >= showCircleAboveValue ? (
          <svg className="transform -rotate-90" width={outerRadius * 2} height={outerRadius * 2}>
            <circle className={backgroundClassName} {...circleProps} />
            <circle
              className={circleClassName}
              style={{
                strokeDasharray: `${circumference} ${circumference}`,
                strokeDashoffset: circumference - circumference * progress
              }}
              {...circleProps}
            />
          </svg>
        ) : null}
        {remainingCharacters <= showTextBelowValue ? (
          <div className="absolute top-1/2 left-0 right-0 text-center transform -translate-y-1/2">
            <span className={circleClassName}>{remainingCharacters}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

Compose.ErrorMessage = function ComposeErrorMessage(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
) {
  const { error } = useContext(ComposeContext)

  return error ? <div {...props}>{error}</div> : null
}

Compose.Success = function ComposeUserSuccess(props: React.ComponentPropsWithoutRef<'p'>) {
  const { didSend } = useContext(ComposeContext)

  return didSend ? <p {...props} /> : <></>
}

Compose.PostLink = function ComposeUserPostLink(
  props: Omit<Parameters<typeof StatefulLink>[0], 'to'>
) {
  const { postId } = useContext(ComposeContext)

  return postId ? (
    <StatefulLink to={`${ROUTES.POSTS}/${postId}`} post={postId} modal {...props} />
  ) : null
}

type ComposeAttachmentPreviewProps = {
  aspectRatio: number
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

Compose.AttachmentPreview = function ComposeAttachmentPreview({
  aspectRatio,
  ...restProps
}: ComposeAttachmentPreviewProps) {
  const { previewSrc, setAttachment, setPreviewSrc } = useContext(ComposeContext)

  const removeAttachment = () => {
    setAttachment(undefined)
    setPreviewSrc(undefined)
  }

  return previewSrc ? (
    <div {...restProps}>
      <div className="relative" style={{ paddingTop: `${100 / aspectRatio}%` }}>
        <img
          className="absolute inset-0 w-full h-full object-contain"
          src={previewSrc}
          alt="attached file preview"
        />
        <button
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-clr-secondary font-bold text-gray-600 text-4xl opacity-0 bg-opacity-70 hover:opacity-100 focus:opacity-100"
          type="button"
          onClick={removeAttachment}
        >
          <span>Remove Attachment</span>
        </button>
      </div>
    </div>
  ) : null
}

Compose.SubmitButton = function ComposeSubmitButton({
  children,
  ...restProps
}: React.ComponentPropsWithoutRef<'button'>) {
  const { message, attachment, hasChanges, softCharacterLimit } = useContext(ComposeContext)
  const disabled = !(hasChanges && (message || attachment) && message.length <= softCharacterLimit)

  return (
    <button type="submit" disabled={disabled} {...restProps}>
      {children}
    </button>
  )
}

Compose.AttachButton = function ComposeAttachButton({
  children,
  ...restProps
}: React.ComponentPropsWithoutRef<'button'>) {
  const { setAttachment, setPreviewSrc } = useContext(ComposeContext)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    if (target.files?.length) {
      const file = target.files[0]
      setAttachment(file)
      setPreviewSrc(URL.createObjectURL(file))
    } else {
      setAttachment(undefined)
      setPreviewSrc(undefined)
    }
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    inputRef.current?.click()
  }

  return (
    <button type="button" onClick={handleClick} aria-label="upload image" {...restProps}>
      {children}
      <input
        className="hidden"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        value=""
      />
    </button>
  )
}

Compose.EmojiButton = function ComposeEmojiButton({
  children,
  ...restProps
}: React.ComponentPropsWithoutRef<'button'>) {
  const { setShowEmojiSelect } = useContext(ComposeContext)

  const handleClick = () => {
    setShowEmojiSelect(state => !state)
  }

  return (
    <button type="button" onClick={handleClick} {...restProps}>
      {children}
    </button>
  )
}

Compose.EmojiSelect = function ComposeEmojiSelect(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
) {
  const { setMessage, showEmojiSelect, setShowEmojiSelect } = useContext(ComposeContext)

  const handleClick = (event: React.MouseEvent<Element, MouseEvent>, { emoji }: IEmojiData) => {
    setMessage(state => state + emoji)
  }

  const onRequestClose = useCallback(() => {
    setShowEmojiSelect(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return showEmojiSelect ? (
    <FocusTrap onRequestClose={onRequestClose} ignoreNav>
      <EmojiPicker {...props} native disableAutoFocus onEmojiClick={handleClick} />
    </FocusTrap>
  ) : null
}
