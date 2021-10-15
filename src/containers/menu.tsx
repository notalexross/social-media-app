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
import type { PostWithUserDetails } from '../services/firebase'
import { UserContext } from '../context/user'
import { Menu } from '../components'
import * as ROUTES from '../constants/routes'
import { useProtectedFunctions } from '../hooks'

type MenuContainerProps = {
  post: PostWithUserDetails
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
  const { username, deleted: ownerDeleted } = ownerDetails
  const isOwner = uid && owner === uid
  const isLiked = likedPosts?.includes(id)
  const isFollowing = following?.includes(owner)
  const itemClassName = 'flex items-center px-5 py-4 w-full hover:bg-gray-100 hover:opacity-70'
  const iconClassName = 'w-6 mr-2'

  const openMenu = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleFollow = () => {
    if (!isFollowing) {
      followUser(owner).catch(console.error)
    } else {
      unfollowUser(owner).catch(console.error)
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
        <Menu.Open className="block w-5 text-gray-500 sm:w-6 hover:opacity-70">
          <DotsHorizontalIcon className={horizontalDotsClassName} />
          <DotsVerticalIcon className={verticalDotsClassName} />
        </Menu.Open>
        <Menu.Items className="mb-4 w-screen max-w-max border rounded bg-white sm:max-w-xs">
          {!isOwner && !ownerDeleted ? (
            <Menu.Item className={itemClassName} type="button" onClick={toggleFollow}>
              <UserAddIcon className={iconClassName} />
              <span>
                {isFollowing ? 'Unfollow' : 'Follow'}
                {username ? ` ${username}` : ''}
              </span>
            </Menu.Item>
          ) : null}
          <Menu.Item className={itemClassName} type="button" onClick={toggleLike}>
            <HeartIcon className={iconClassName} />
            <span>
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
            <span>Reply</span>
          </Menu.Item>
          <Menu.Item className={itemClassName} type="button" onClick={copyLinkToClipboard}>
            <DuplicateIcon className={iconClassName} />
            <span>Copy Link</span>
          </Menu.Item>
          <Menu.Item className={itemClassName} type="link" to={`${ROUTES.POSTS}/${id}`}>
            <ArrowsExpandIcon className={iconClassName} />
            <span>View Post</span>
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
              <span>Edit</span>
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
              <span>Delete</span>
              {confirmDeletion ? (
                <span className="text-red-500">&nbsp;Confirm Deletion?</span>
              ) : null}
            </Menu.Item>
          ) : null}
          {isOwner && deleted ? (
            <Menu.Item className={itemClassName} type="button" onClick={handleUndoDelete}>
              <TrashIcon className={iconClassName} />
              <span>Undo Delete</span>
            </Menu.Item>
          ) : null}
        </Menu.Items>
      </Menu>
    </div>
  )
}
