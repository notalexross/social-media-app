import { useCallback, useContext, useEffect, useState } from 'react'
import {
  ArrowsExpandIcon,
  ChatAlt2Icon,
  DotsHorizontalIcon,
  DotsVerticalIcon,
  DuplicateIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
  UserAddIcon
} from '@heroicons/react/outline'
import type { PostWithReplyTo, PostWithUserDetails } from '../services/firebase'
import { UserContext } from '../context/user'
import { Menu } from '../components'
import * as ROUTES from '../constants/routes'
import { useProtectedFunctions } from '../hooks'

type MenuContainerProps = {
  post: PostWithReplyTo | PostWithUserDetails
  horizontalDotsClassName?: string
  verticalDotsClassName?: string
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function MenuContainer({
  post,
  horizontalDotsClassName = 'block',
  verticalDotsClassName = 'hidden',
  ...restProps
}: MenuContainerProps): JSX.Element {
  const { editPost, followUser, likePost, unfollowUser, unlikePost } = useProtectedFunctions()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmDeletion, setConfirmDeletion] = useState(false)
  const { following, likedPosts, uid } = useContext(UserContext)
  const { deleted, id, owner, ownerDetails } = post
  const { username, deleted: ownerDeleted } = ownerDetails || {}
  const isOwner = uid !== undefined && owner === uid
  const isLiked = likedPosts?.includes(id)
  const isFollowing = owner && following?.includes(owner)
  const itemClassName =
    'flex items-center px-5 py-4 w-full text-left hover:bg-clr-accent hover:text-clr-secondary focus:bg-clr-accent focus:text-clr-secondary'
  const iconClassName = 'flex-shrink-0 w-6 mr-2'
  const itemTextClassName = 'min-w-0'

  const openMenu = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleFollow = () => {
    if (owner) {
      if (!isFollowing) {
        followUser(owner).catch(console.error)
      } else {
        unfollowUser(owner).catch(console.error)
      }
    }
  }

  const toggleLike = () => {
    if (!isLiked) {
      likePost(id).catch(console.error)
    } else {
      unlikePost(id).catch(console.error)
    }
  }

  const handleConfirmDelete = () => {
    if (confirmDeletion) {
      editPost(post, { deleted: true }).catch(console.error)
      setConfirmDeletion(false)
      closeMenu()
    } else {
      setConfirmDeletion(true)
    }
  }

  const handleUndoDelete = () => {
    editPost(post, { deleted: false }).catch(console.error)
  }

  const copyLinkToClipboard = () => {
    const { activeElement } = document
    const textArea = document.createElement('textarea')
    textArea.value = `${window.location.origin}${ROUTES.POSTS}/${id}`
    textArea.style.position = 'fixed'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    if (activeElement instanceof HTMLElement) {
      activeElement.focus()
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setConfirmDeletion(false)
    }
  }, [isOpen])

  return (
    <div>
      <Menu
        isOpen={isOpen}
        onRequestOpen={openMenu}
        onRequestClose={closeMenu}
        requestCloseOnItemClick
        {...restProps}
      >
        <Menu.Open className="block w-5 text-clr-primary text-opacity-75 sm:w-6 hover:text-clr-link-hover focus:text-clr-link-hover">
          <DotsHorizontalIcon className={horizontalDotsClassName} />
          <DotsVerticalIcon className={verticalDotsClassName} />
        </Menu.Open>
        <Menu.Items className="mb-4 w-96 p-1 border rounded bg-clr-secondary shadow-md overflow-hidden break-words">
          {!deleted && !isOwner && !ownerDeleted ? (
            <Menu.Item className={itemClassName} type="button" onClick={toggleFollow}>
              <UserAddIcon className={iconClassName} />
              <span className={itemTextClassName}>
                {isFollowing ? 'Unfollow' : 'Follow'}
                {username ? ` ${username}` : ''}
              </span>
            </Menu.Item>
          ) : null}
          <Menu.Item className={itemClassName} type="button" onClick={toggleLike}>
            <HeartIcon className={iconClassName} />
            <span className={itemTextClassName}>
              {isLiked ? 'Unlike' : 'Like'}
              {' Post'}
            </span>
          </Menu.Item>
          <Menu.Item
            className={itemClassName}
            type="link"
            to={`${ROUTES.POSTS}/${id}${ROUTES.COMPOSE}`}
            post={post}
            modal
          >
            <ChatAlt2Icon className={iconClassName} />
            <span className={itemTextClassName}>Reply</span>
          </Menu.Item>
          <Menu.Item className={itemClassName} type="button" onClick={copyLinkToClipboard}>
            <DuplicateIcon className={iconClassName} />
            <span className={itemTextClassName}>Copy Link</span>
          </Menu.Item>
          <Menu.Item className={itemClassName} type="link" to={`${ROUTES.POSTS}/${id}`}>
            <ArrowsExpandIcon className={iconClassName} />
            <span className={itemTextClassName}>View Post</span>
          </Menu.Item>
          {isOwner && !deleted ? (
            <Menu.Item
              className={itemClassName}
              type="link"
              to={`${ROUTES.POSTS}/${id}${ROUTES.EDIT}`}
              post={post}
              modal
            >
              <PencilIcon className={iconClassName} />
              <span className={itemTextClassName}>Edit</span>
            </Menu.Item>
          ) : null}
          {isOwner && !deleted ? (
            <Menu.Item
              className={itemClassName}
              type="button"
              onClick={handleConfirmDelete}
              ignoreRequestCloseOnItemClick
            >
              <TrashIcon className={iconClassName} />
              <span className={itemTextClassName}>Delete</span>
              {confirmDeletion ? (
                <span className="text-clr-error">&nbsp;Confirm Deletion?</span>
              ) : null}
            </Menu.Item>
          ) : null}
          {isOwner && deleted ? (
            <Menu.Item className={itemClassName} type="button" onClick={handleUndoDelete}>
              <TrashIcon className={iconClassName} />
              <span className={itemTextClassName}>Undo Delete</span>
            </Menu.Item>
          ) : null}
        </Menu.Items>
      </Menu>
    </div>
  )
}
