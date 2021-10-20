import { createContext, useContext } from 'react'
import Skeleton from 'react-loading-skeleton'
import type { User } from '../../services/firebase'
import { UserContext } from '../../context/user'
import Avatar from '../avatar'
import StatefulLink from '../stateful-link'
import * as ROUTES from '../../constants/routes'
import { useProtectedFunctions } from '../../hooks'

type UserProfileContextValue = {
  user: Partial<User> | undefined
  noLinks: boolean
}

const UserProfileContext = createContext({} as UserProfileContextValue)

type UserProfileProps = {
  user?: Partial<User>
  noLinks?: boolean
} & React.ComponentPropsWithoutRef<'div'>

export default function UserProfile({
  children,
  user,
  noLinks = false,
  ...restProps
}: UserProfileProps): JSX.Element {
  return (
    <UserProfileContext.Provider value={{ user, noLinks }}>
      <div {...restProps}>{children}</div>
    </UserProfileContext.Provider>
  )
}

type UserProfileAvatarProps = {
  linkClassName?: string
  updatable?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

UserProfile.Avatar = function UserProfileAvatar({
  linkClassName,
  updatable = false,
  ...restProps
}: UserProfileAvatarProps) {
  const { uid } = useContext(UserContext)
  const { user, noLinks } = useContext(UserProfileContext)
  const { avatar, username } = user || {}
  const isSelf = uid === user?.uid

  if (!isSelf && user?.deleted) {
    return (
      <div {...restProps}>
        <Avatar src={null} alt="Deleted user avatar" />
      </div>
    )
  }

  if (!username) {
    return (
      <div {...restProps}>
        <Avatar />
      </div>
    )
  }

  const inner = (
    <Avatar
      className={linkClassName}
      src={avatar}
      alt={isSelf ? 'Your avatar' : `${username}'s avatar`}
      uid={user?.uid}
      updatable={updatable}
    />
  )

  return (
    <div {...restProps}>
      {updatable || noLinks ? (
        inner
      ) : (
        <StatefulLink
          to={`${ROUTES.PROFILES}/${username}${ROUTES.PROFILE_POSTS}`}
          aria-label={isSelf ? 'Your profile' : `${username}'s profile`}
        >
          {inner}
        </StatefulLink>
      )}
    </div>
  )
}

type UserProfileUsernameProps = {
  linkClassName?: string
  deletedTextContent?: string
} & Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>

UserProfile.Username = function UserProfileUsername({
  linkClassName,
  deletedTextContent = '[Deleted]',
  ...restProps
}: UserProfileUsernameProps) {
  const { uid } = useContext(UserContext)
  const { user, noLinks } = useContext(UserProfileContext)
  const { username } = user || {}
  const isSelf = user?.uid === uid

  if (!isSelf && user?.deleted) {
    return <span {...restProps}>{deletedTextContent}</span>
  }

  if (!username) {
    return <Skeleton width="15ch" {...restProps} />
  }

  return (
    <span {...restProps}>
      {noLinks ? (
        username
      ) : (
        <StatefulLink className={linkClassName} to={`${ROUTES.PROFILES}/${username}`}>
          {username}
        </StatefulLink>
      )}
    </span>
  )
}

UserProfile.FullName = function UserProfileFullName(
  props: Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>
) {
  const { user } = useContext(UserProfileContext)
  const { fullName } = user || {}

  if (!fullName) {
    return <Skeleton width="15ch" {...props} />
  }

  return <span {...props}>{fullName}</span>
}

UserProfile.FollowButton = function UserProfileFollowButton(
  props: Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>
) {
  const { followUser, unfollowUser } = useProtectedFunctions()
  const { following, uid } = useContext(UserContext)
  const { user } = useContext(UserProfileContext)
  const isSelf = user?.uid === uid
  const isFollowing = !isSelf && user?.uid && following?.includes(user.uid)

  if (!user?.uid) {
    return <Skeleton width="6ch" />
  }

  if (isSelf || user.deleted) {
    return null
  }

  const toggleFollow = () => {
    if (user.uid) {
      if (!isFollowing) {
        followUser(user.uid).catch(console.error)
      } else {
        unfollowUser(user.uid).catch(console.error)
      }
    }
  }

  return (
    <button type="button" onClick={toggleFollow} {...props}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  )
}
