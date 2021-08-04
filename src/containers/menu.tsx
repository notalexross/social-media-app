import { useCallback, useContext, useState } from 'react'
import {
  ArrowsExpandIcon,
  ChatAlt2Icon,
  DotsHorizontalIcon,
  DuplicateIcon,
  HeartIcon,
  PencilIcon,
  UserAddIcon
} from '@heroicons/react/outline'
import {
  followUser,
  likePost,
  PostWithUserDetails,
  unfollowUser,
  unlikePost
} from '../services/firebase'
import { UserContext } from '../context/user'
import { Menu } from '../components'
import * as ROUTES from '../constants/routes'

type MenuContainerProps = {
  post: PostWithUserDetails
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function MenuContainer({ post, ...restProps }: MenuContainerProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const { following, likedPosts, uid } = useContext(UserContext)
  const { deleted, id, owner, ownerDetails } = post
  const { username } = ownerDetails
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

  return (
    <div>
      <Menu
        isOpen={isOpen}
        onRequestOpen={openMenu}
        onRequestClose={closeMenu}
        requestCloseOnItemClick
        {...restProps}
      >
        <Menu.Open className="block w-6 text-gray-500 hover:opacity-70">
          <DotsHorizontalIcon />
        </Menu.Open>
        <Menu.Items className="mb-4 w-screen max-w-xs border rounded bg-white">
          {!isOwner && !deleted ? (
            <Menu.Item className={itemClassName} type="button" onClick={toggleFollow}>
              <UserAddIcon className={iconClassName} />
              {isFollowing ? 'Unfollow' : 'Follow'}
              {username ? ` ${username}` : ''}
            </Menu.Item>
          ) : null}
          <Menu.Item className={itemClassName} type="button" onClick={toggleLike}>
            <HeartIcon className={iconClassName} />
            {isLiked ? 'Unlike' : 'Like'}
            {' Post'}
          </Menu.Item>
          <Menu.Item
            className={itemClassName}
            type="link"
            to={`${ROUTES.POSTS}/${id}${ROUTES.COMPOSE}`}
            post={post}
            modal
          >
            <ChatAlt2Icon className={iconClassName} />
            Reply
          </Menu.Item>
          <Menu.Item className={itemClassName} type="button" onClick={copyLinkToClipboard}>
            <DuplicateIcon className={iconClassName} />
            Copy Link
          </Menu.Item>
          <Menu.Item className={itemClassName} type="link" to={`${ROUTES.POSTS}/${id}`}>
            <ArrowsExpandIcon className={iconClassName} />
            View Post
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
              Edit
            </Menu.Item>
          ) : null}
        </Menu.Items>
      </Menu>
    </div>
  )
}
