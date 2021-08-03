import React, { createContext, useContext } from 'react'
import type { PostWithUserDetails } from '../../services/firebase'
import FocusTrap from '../focus-trap'
import StatefulLink from '../stateful-link'

type MenuContextValue = {
  isOpen: boolean
  requestCloseOnItemClick: boolean
  onRequestOpen: () => void
  onRequestClose: () => void
}

const MenuContext = createContext({} as MenuContextValue)

type MenuProps = {
  isOpen?: boolean
  requestCloseOnItemClick?: boolean
  onRequestOpen?: () => void
  onRequestClose?: () => void
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function Menu({
  children,
  isOpen = false,
  requestCloseOnItemClick = false,
  onRequestOpen = () => {},
  onRequestClose = () => {},
  ...restProps
}: MenuProps): JSX.Element {
  return (
    <MenuContext.Provider
      value={{
        isOpen,
        requestCloseOnItemClick,
        onRequestOpen,
        onRequestClose
      }}
    >
      <div {...restProps}>
        <div className="relative">{children}</div>
      </div>
    </MenuContext.Provider>
  )
}

Menu.Open = function MenuOpen({
  children,
  ...restProps
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  const { onRequestOpen } = useContext(MenuContext)

  const handleMouseUp = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  return (
    <button type="button" onMouseUp={handleMouseUp} onClick={onRequestOpen} {...restProps}>
      {children}
    </button>
  )
}

Menu.Items = function MenuItems({
  children,
  ...restProps
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>) {
  const { isOpen, onRequestClose } = useContext(MenuContext)

  return isOpen ? (
    <FocusTrap
      className="absolute top-0 right-0 z-30 outline-none"
      overlayClassName="fixed inset-0 z-30"
      role="menu"
      onRequestClose={onRequestClose}
    >
      <ul {...restProps}>{children}</ul>
    </FocusTrap>
  ) : null
}

type MenuItemButtonProps = {
  type: 'button'
  ignoreRequestCloseOnItemClick?: boolean
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

type MenuItemLinkProps = {
  type: 'link'
  to: string
  post?: PostWithUserDetails | string
  modal?: boolean
  ignoreRequestCloseOnItemClick?: boolean
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

type MenuItemProps = MenuItemButtonProps | MenuItemLinkProps

Menu.Item = function MenuItem(props: MenuItemProps) {
  const { requestCloseOnItemClick, onRequestClose } = useContext(MenuContext)

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement, MouseEvent>
  ) => {
    const { ignoreRequestCloseOnItemClick = false, onClick } = props
    onClick?.(event)

    if (requestCloseOnItemClick && !ignoreRequestCloseOnItemClick) {
      onRequestClose()
    }
  }

  let itemInner: JSX.Element
  // eslint-disable-next-line react/destructuring-assignment
  if (props.type === 'link') {
    const { children, type, to, ...restProps } = props
    itemInner = (
      <StatefulLink tabIndex={0} to={to} onClick={handleClick} {...restProps}>
        {children}
      </StatefulLink>
    )
  } else {
    const { children, type, ignoreRequestCloseOnItemClick, onClick, ...restProps } = props
    itemInner = (
      <button type="button" onClick={handleClick} {...restProps}>
        {children}
      </button>
    )
  }

  return <li>{itemInner}</li>
}
