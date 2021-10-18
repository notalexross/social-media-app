import type { User } from '../services/firebase'
import { UserProfile } from '../components'
import { useUser } from '../hooks'

type UserListItemProps = {
  user: User | string
  maxAge?: number
} & Omit<React.ComponentPropsWithoutRef<'li'>, 'children'>

function UserListItem({ user, maxAge = 0, ...restProps }: UserListItemProps) {
  const userLive = useUser(user, { maxAge })

  return (
    <li {...restProps}>
      <UserProfile
        className="flex justify-between items-center mt-3 px-3 text-sm lg:mt-4 lg:px-4"
        user={userLive}
      >
        <div className="flex items-center overflow-hidden">
          <UserProfile.Avatar className="flex-shrink-0 w-8 mr-3" linkClassName="hover:opacity-70" />
          <UserProfile.Username
            className="overflow-hidden break-words"
            linkClassName="hover:underline focus:underline"
          />
        </div>
        <UserProfile.FollowButton className="ml-4 text-clr-primary text-opacity-75 hover:underline focus:underline" />
      </UserProfile>
    </li>
  )
}

type UserListProps = {
  users: (User | string)[]
} & Omit<React.ComponentPropsWithoutRef<'ul'>, 'children'>

export default function UserListContainer({ users, ...restProps }: UserListProps): JSX.Element {
  return (
    <ul {...restProps}>
      {users.map(user => (
        <UserListItem key={typeof user === 'string' ? user : user.uid} user={user} />
      ))}
    </ul>
  )
}
