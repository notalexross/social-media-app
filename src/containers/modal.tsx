import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { SkeletonTheme } from 'react-loading-skeleton'
import Modal from 'react-modal'
import { XIcon } from '@heroicons/react/outline'
import type { LocationState } from '../types'
import type { PostWithUserDetails } from '../services/firebase'
import ComposeContainer from './compose'
import PostContainer from './post'
import { useLockBody, usePost, useWindowDimensions } from '../hooks'
import * as ROUTES from '../constants/routes'

if (process.env.NODE_ENV !== 'test') {
  Modal.setAppElement('#root')
}

type ModalContainerProps = {
  children?: React.ReactNode
  post?: PostWithUserDetails | string
  offsetTopSm?: number
  offsetTopMd?: number
  compose?: boolean
  edit?: boolean
} & Partial<Modal['props']>

export default function ModalContainer({
  children,
  post,
  offsetTopSm = 0,
  offsetTopMd = 0.05,
  compose = false,
  edit = false,
  ...restProps
}: ModalContainerProps): JSX.Element {
  useLockBody()
  const mediaQuery = useMemo(() => window.matchMedia('(min-width: 768px)'), [])
  const [headerHeight, setHeaderHeight] = useState(0)
  const [offsetTop, setOffsetTop] = useState(mediaQuery.matches ? offsetTopMd : offsetTopSm)
  const [isLargeScreen, setIsLargeScreen] = useState(mediaQuery.matches)
  const overlayRef = useRef<HTMLDivElement>(null)
  const history = useHistory<LocationState>()
  const { postId } = useParams<{ postId: string | undefined }>()
  const back = history.location.state?.back
  const postObject = usePost(post || postId)
  const [, windowHeight] = useWindowDimensions()
  const maxHeight = `${windowHeight * (1 - offsetTop) - headerHeight}px`

  const measuredHeaderRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      setTimeout(() => {
        setHeaderHeight(node.offsetHeight)
      }, 0)
    }
  }, [])

  const exit = () => {
    if (back) {
      history.go(-1)
      history.replace(back)
    } else {
      history.replace(ROUTES.DASHBOARD)
    }
  }

  let modalInner: React.ReactNode | null = null
  if (children) {
    modalInner = <div className="p-4">{children}</div>
  } else if (post && !edit) {
    modalInner = <PostContainer post={postObject} commentsLimit={0} compose={compose} />
  } else if (compose || edit) {
    modalInner = <ComposeContainer className="p-4" originalPost={postObject} />
  }

  useEffect(() => {
    const handleResize = (event: MediaQueryListEvent) => {
      setOffsetTop(event.matches ? offsetTopMd : offsetTopSm)
      setIsLargeScreen(event.matches)
    }

    mediaQuery.addEventListener('change', handleResize)

    return () => mediaQuery.removeEventListener('change', handleResize)
  }, [mediaQuery, offsetTopMd, offsetTopSm])

  const OverlayElement = ({ ref, ...props }: Record<string, unknown>, content: JSX.Element) => (
    <div ref={overlayRef} {...props}>
      {content}
    </div>
  )

  return (
    <Modal
      className="relative mx-auto max-w-2xl rounded outline-none md:shadow-md"
      overlayClassName="fixed inset-0 bg-clr-secondary z-40 md:bg-opacity-70"
      style={{ content: { top: `${offsetTop * 100}%` } }}
      contentLabel="Current Post Modal"
      onRequestClose={exit}
      shouldCloseOnOverlayClick={isLargeScreen}
      overlayElement={OverlayElement}
      isOpen
      {...restProps}
    >
      <div className="px-4 py-3 border rounded-t bg-clr-secondary" ref={measuredHeaderRef}>
        <button
          className="block ml-auto text-clr-primary hover:text-clr-link-hover focus:text-clr-link-hover"
          type="button"
          onClick={exit}
          aria-label="close"
        >
          <XIcon className="w-6" />
        </button>
      </div>
      <div
        className="border-l border-r border-b rounded-b bg-clr-secondary overflow-y-auto"
        style={{ maxHeight }}
      >
        <SkeletonTheme
          color="rgb(var(--clr-skeleton))"
          highlightColor="rgb(var(--clr-skeleton-highlight))"
        >
          {modalInner}
        </SkeletonTheme>
      </div>
    </Modal>
  )
}
