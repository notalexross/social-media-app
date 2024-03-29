import { Link, useLocation } from 'react-router-dom'
import type { Location } from 'history'
import type { LocationState } from '../../types'
import type { PostWithReplyTo, PostWithUserDetails } from '../../services/firebase'

type StatefulLinkProps = {
  to: string
  post?: PostWithReplyTo | PostWithUserDetails | string
  modal?: boolean
  nestModal?: boolean
} & Parameters<Link>[0]

export default function StatefulLink({
  children,
  to,
  post = '',
  modal = false,
  nestModal = false,
  ...restProps
}: StatefulLinkProps): JSX.Element {
  const location = useLocation<LocationState>()
  const modalOpen = !!location.state?.modal
  const replace = to === location.pathname || (modalOpen && !nestModal)

  let back: Location<LocationState> | undefined
  if (modal) {
    if (nestModal) {
      back = location
    } else {
      back = location.state?.back || location
    }
  }

  const state: LocationState = { back, post, modal }

  return (
    <Link<LocationState> to={{ pathname: to, state }} replace={replace} {...restProps}>
      {children}
    </Link>
  )
}
