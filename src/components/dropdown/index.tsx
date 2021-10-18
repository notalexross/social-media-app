import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import FocusTrap from '../focus-trap'
import StatefulLink from '../stateful-link'

type DropdownContextValue = {
  closeAfterClick: boolean
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const DropdownContext = createContext({} as DropdownContextValue)

export default function Dropdown({
  children,
  closeAfterClick = false
}: {
  children: React.ReactNode
  closeAfterClick?: boolean
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen(state => !state)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close, closeAfterClick }}>
      {children}
    </DropdownContext.Provider>
  )
}

Dropdown.Overlay = function DropdownOverlay(
  props: React.ComponentPropsWithoutRef<'div'>
): JSX.Element {
  const { isOpen, close } = useContext(DropdownContext)

  if (!isOpen) {
    return <></>
  }

  return (
    <div
      className="fixed inset-x-0 top-0 -bottom-20 z-10 bg-clr-secondary opacity-70"
      role="presentation"
      onMouseDown={close}
      {...props}
    />
  )
}

Dropdown.Toggle = function DropdownToggle(
  props: React.ComponentPropsWithoutRef<'button'>
): JSX.Element {
  const { toggle } = useContext(DropdownContext)

  return <button type="button" onClick={toggle} {...props} />
}

Dropdown.Items = function DropdownItems({
  children,
  ...restProps
}: React.ComponentPropsWithoutRef<'div'>): JSX.Element {
  const { isOpen, close } = useContext(DropdownContext)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [close])

  if (!isOpen) {
    return <></>
  }

  return (
    <FocusTrap overlayClassName="hidden" role="menu" {...restProps}>
      <ul className="flex flex-col">{children}</ul>
    </FocusTrap>
  )
}

Dropdown.Item = function DropdownItem(
  props: Parameters<typeof StatefulLink>[0] | React.ComponentPropsWithoutRef<'button'>
): JSX.Element {
  const { closeAfterClick, close } = useContext(DropdownContext)

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement, MouseEvent>
  ) => {
    props.onClick?.(event)

    if (closeAfterClick) {
      close()
    }
  }

  let inner = <></>
  if ('to' in props) {
    const { type, onClick, ...restProps } = props
    inner = <StatefulLink tabIndex={0} onClick={handleClick} {...restProps} />
  } else {
    const { type, onClick, ...restProps } = props
    inner = <button type="button" onClick={handleClick} {...restProps} />
  }

  return <li>{inner}</li>
}
