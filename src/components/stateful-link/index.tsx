import { Link, useLocation } from 'react-router-dom'
import type React from 'react'
import type { LocationState } from '../../types'
import type { PostWithUserDetails } from '../../services/firebase'

type StatefulLinkProps = {
  children: React.ReactNode
  to: string
  post?: PostWithUserDetails | string
  modal?: boolean
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

export default function StatefulLink({
  children,
  to,
  post = '',
  modal = false,
  ...restProps
}: StatefulLinkProps): JSX.Element {
  const location = useLocation<LocationState>()
  const back = modal ? location.state?.back || location : undefined
  const modalDepth = location.state?.modalDepth || 0

  return (
    <Link<LocationState>
      to={{
        pathname: to,
        state: {
          back,
          post,
          modalDepth: modal ? modalDepth + 1 : 0
        }
      }}
      replace={to === location.pathname || modalDepth > 0}
      {...restProps}
    >
      {children}
    </Link>
  )
}
