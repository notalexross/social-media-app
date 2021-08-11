import { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Modal from 'react-modal'
import { XIcon } from '@heroicons/react/outline'
import type { LocationState } from '../types'
import type { PostWithUserDetails } from '../services/firebase'
import PostContainer from './post'
import { useLockBody, usePosts, usePostsLive } from '../hooks'
import * as ROUTES from '../constants/routes'

if (process.env.NODE_ENV !== 'test') {
  Modal.setAppElement('#root')
}

type ModalContainerProps = {
  post?: PostWithUserDetails | string
  offsetTopSm?: number
  offsetTopMd?: number
  compose?: boolean
}

export default function ModalContainer({
  post,
  offsetTopSm = 0,
  offsetTopMd = 0.05,
  compose = false
}: ModalContainerProps): JSX.Element {
  useLockBody()
  const mediaQuery = window.matchMedia('(min-width: 768px)')
  const [headerHeight, setHeaderHeight] = useState(0)
  const [offsetTop, setOffsetTop] = useState(mediaQuery.matches ? offsetTopMd : offsetTopSm)
  const [isLargeScreen, setIsLargeScreen] = useState(mediaQuery.matches)
  const overlayRef = useRef<HTMLDivElement>(null)
  const history = useHistory<LocationState>()
  const back = history.location.state?.back
  const postId = typeof post === 'string' ? post : post?.id
  const postObject = usePosts(postId || '')
  const postLive = usePostsLive(postObject || null) || (typeof post === 'string' ? undefined : post)

  const measuredHeaderRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      setHeaderHeight(node.offsetHeight)
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

  let modalInner: JSX.Element | null = null
  if (post) {
    modalInner = (
      <PostContainer
        className="border-l border-r border-b rounded-b bg-white"
        post={postLive}
        commentsLimit={0}
        compose={compose}
      />
    )
  } else if (compose) {
    modalInner = (
      <div className="border-l border-r border-b rounded-b bg-white">
        <div className="flex flex-col p-4">
          <p className="p-4 border rounded">Compose Post Placeholder</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const handleResize = (event: MediaQueryListEvent) => {
      setOffsetTop(event.matches ? offsetTopMd : offsetTopSm)
      setIsLargeScreen(event.matches)
    }

    mediaQuery.addEventListener('change', handleResize)

    return () => mediaQuery.removeEventListener('change', handleResize)
  }, [mediaQuery, offsetTopMd, offsetTopSm])

  const handleClick: React.MouseEventHandler = event => {
    if (event.target === event.currentTarget) {
      setTimeout(() => {
        overlayRef.current?.click()
      }, 0)
    }
  }

  const OverlayElement = ({ ref, ...props }: Record<string, unknown>, content: JSX.Element) => (
    <div ref={overlayRef} {...props}>
      {content}
    </div>
  )

  return (
    <Modal
      className="relative mx-auto max-w-2xl outline-none"
      overlayClassName="fixed inset-0 bg-white z-40 md:bg-opacity-75"
      style={{ content: { top: `${offsetTop * 100}%` } }}
      key={postId}
      contentLabel="Current Post Modal"
      onRequestClose={exit}
      shouldCloseOnOverlayClick={isLargeScreen}
      overlayElement={OverlayElement}
      isOpen
    >
      <div className="top-0 px-4 py-3 border rounded-t bg-white" ref={measuredHeaderRef}>
        <button className="block hover:opacity-70" type="button" onClick={exit} aria-label="close">
          <XIcon className="w-6" />
        </button>
      </div>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        onClick={handleClick}
        className="overflow-y-auto h-screen"
        style={{ maxHeight: `calc(100vh - ${offsetTop} * 100vh - ${headerHeight}px)` }}
      >
        {modalInner}
      </div>
    </Modal>
  )
}
