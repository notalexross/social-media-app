import { createPortal } from 'react-dom'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { PostWithUserDetails } from '../../services/firebase'
import FocusTrap from '../focus-trap'
import StatefulLink from '../stateful-link'

type MenuContextValue = {
  getPosition: () => [number, number, number, number]
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
} & React.ComponentPropsWithoutRef<'div'>

export default function Menu({
  children,
  isOpen = false,
  requestCloseOnItemClick = false,
  onRequestOpen = () => {},
  onRequestClose = () => {},
  ...restProps
}: MenuProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const getPosition = useCallback((): [number, number, number, number] => {
    const node = ref.current
    let posRight = 0
    let posTop = 0
    let maxHeight = 0
    let maxWidth = 0

    if (node !== null) {
      const { right, top } = node.getBoundingClientRect()
      const { innerHeight } = window
      const { clientWidth } = document.documentElement || document.body
      const { scrollX, scrollY } = window
      posRight = clientWidth - right - scrollX
      posTop = top + scrollY
      maxWidth = Math.max(right - scrollX, 0)
      maxHeight = Math.max(innerHeight - top, 0)
    }

    return [posRight, posTop, maxWidth, maxHeight]
  }, [])

  return (
    <MenuContext.Provider
      value={{
        getPosition,
        isOpen,
        requestCloseOnItemClick,
        onRequestOpen,
        onRequestClose
      }}
    >
      <div {...restProps}>
        <div ref={ref}>{children}</div>
      </div>
    </MenuContext.Provider>
  )
}

Menu.Open = function MenuOpen({
  children,
  ...restProps
}: React.ComponentPropsWithoutRef<'button'>) {
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

function MenuItemsInner({ children, ...restProps }: React.ComponentPropsWithoutRef<'ul'>) {
  const { getPosition, onRequestClose } = useContext(MenuContext)
  const [position, setPosition] = useState<[number, number, number, number] | undefined>()

  const updatePosition = useCallback(() => {
    setPosition(getPosition())
  }, [getPosition])

  useEffect(() => {
    const observer = new MutationObserver(updatePosition)
    observer.observe(document, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    })
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('resize', updatePosition)
    updatePosition()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [updatePosition])

  if (!position) {
    return <></>
  }

  const [right, top, maxWidth, maxHeight] = position

  return createPortal(
    <FocusTrap
      className="absolute z-40 outline-none h-0"
      overlayClassName="fixed inset-0 z-40"
      role="menu"
      onRequestClose={onRequestClose}
      style={{ right, top }}
    >
      <ul {...restProps} style={{ maxHeight, maxWidth, overflow: 'auto' }}>
        {children}
      </ul>
    </FocusTrap>,
    document.body
  )
}

Menu.Items = function MenuItems(props: React.ComponentPropsWithoutRef<'ul'>) {
  const { isOpen } = useContext(MenuContext)

  return isOpen ? <MenuItemsInner {...props} /> : <></>
}

type MenuItemButtonProps = {
  type: 'button'
  ignoreRequestCloseOnItemClick?: boolean
} & React.ComponentPropsWithoutRef<'button'>

type MenuItemLinkProps = {
  type: 'link'
  to: string
  post?: PostWithUserDetails | string
  modal?: boolean
  ignoreRequestCloseOnItemClick?: boolean
} & React.ComponentPropsWithoutRef<'a'>

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
