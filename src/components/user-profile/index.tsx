import { createContext, useContext } from 'react'
import Skeleton from 'react-loading-skeleton'
import type { User } from '../../services/firebase'
import { UserContext } from '../../context/user'
import Avatar from '../avatar'
import StatefulLink from '../stateful-link'
import * as ROUTES from '../../constants/routes'
import { useProtectedFunctions } from '../../hooks'

type UserProfileContextValue = {
  user: Partial<User> | null | undefined
  noLinks: boolean
}

const UserProfileContext = createContext({} as UserProfileContextValue)

type UserProfileProps = {
  user?: Partial<User> | null
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
  const isSelf = uid !== undefined && uid === user?.uid

  if (user === null || (!isSelf && user?.deleted)) {
    return (
      <div {...restProps}>
        <Avatar src={null} alt="Default avatar" />
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
  unknownTextContent?: string
} & Omit<React.ComponentPropsWithoutRef<'a'>, 'children'>

UserProfile.Username = function UserProfileUsername({
  linkClassName,
  deletedTextContent = 'Deleted User',
  unknownTextContent = 'Unknown User',
  ...restProps
}: UserProfileUsernameProps) {
  const { uid } = useContext(UserContext)
  const { user, noLinks } = useContext(UserProfileContext)
  const { username } = user || {}
  const isSelf = uid !== undefined && uid === user?.uid

  if (!isSelf && user?.deleted) {
    return <span {...restProps}>{deletedTextContent}</span>
  }

  if (user === null) {
    return <span {...restProps}>{unknownTextContent}</span>
  }

  if (!username) {
    return (
      <span {...restProps}>
        <Skeleton width="15ch" />
      </span>
    )
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

type UserProfileFullNameProps = {
  deletedTextContent?: string
  unknownTextContent?: string
} & Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>

UserProfile.FullName = function UserProfileFullName({
  deletedTextContent = 'Deleted User',
  unknownTextContent = 'Unknown User',
  ...restProps
}: UserProfileFullNameProps) {
  const { uid } = useContext(UserContext)
  const { user } = useContext(UserProfileContext)
  const { fullName } = user || {}
  const isSelf = uid !== undefined && uid === user?.uid

  if (!isSelf && user?.deleted) {
    return <span {...restProps}>{deletedTextContent}</span>
  }

  if (user === null) {
    return <span {...restProps}>{unknownTextContent}</span>
  }

  if (!fullName) {
    return (
      <span {...restProps}>
        <Skeleton width="15ch" />
      </span>
    )
  }

  return <span {...restProps}>{fullName}</span>
}

UserProfile.FollowButton = function UserProfileFollowButton(
  props: Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>
) {
  const { followUser, unfollowUser } = useProtectedFunctions()
  const { following, uid } = useContext(UserContext)
  const { user } = useContext(UserProfileContext)

  if (user === undefined) {
    return (
      <span {...props}>
        <Skeleton width="6ch" />
      </span>
    )
  }

  const isSelf = user && uid !== undefined && uid === user.uid

  if (user === null || isSelf || user.deleted || !user.uid) {
    return null
  }

  const isFollowing = following?.includes(user.uid)

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
