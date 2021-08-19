import { useEffect, useRef } from 'react'
import { modulo } from '../../utils'

type FocusTrapProps = {
  overlayClassName?: string
  previousKey?: string
  nextKey?: string
  onRequestClose?: () => void
  noAutoFocus?: boolean
  ignoreNav?: boolean
} & React.ComponentPropsWithoutRef<'div'>

export default function FocusTrap({
  children,
  overlayClassName = '',
  previousKey = 'ArrowUp',
  nextKey = 'ArrowDown',
  onRequestClose = () => {},
  noAutoFocus = false,
  ignoreNav = false,
  ...restProps
}: FocusTrapProps): JSX.Element {
  const focusRef = useRef<HTMLDivElement>(null)
  const initialFocusedElementRef = useRef(document.activeElement)

  useEffect(() => {
    const initialFocusedElement = initialFocusedElementRef.current
    const interactiveElements =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'

    if (focusRef.current) {
      const container = focusRef.current
      let shiftTabLastPressedKey = false
      if (!noAutoFocus) {
        container.focus()
      }

      const moveFocusBy = (direction: number) => {
        const focusable: NodeListOf<HTMLElement> = container.querySelectorAll(interactiveElements)
        const { activeElement } = document
        const startIndex = direction > 0 ? -1 : 0
        const activeElementIndex = Array.from(focusable).findIndex(el => el === activeElement)
        const currentFocusIndex = activeElementIndex >= 0 ? activeElementIndex : startIndex
        const nextFocusIndex = modulo(currentFocusIndex + direction, focusable.length)
        focusable[nextFocusIndex].focus()
      }

      const trapKeyboardNavigation = (event: KeyboardEvent) => {
        if ((event.key === 'Tab' && event.shiftKey === true) || event.key === previousKey) {
          event.preventDefault()
          moveFocusBy(-1)
        } else if (event.key === 'Tab' || event.key === nextKey) {
          event.preventDefault()
          moveFocusBy(1)
        } else if (event.key === 'Escape') {
          onRequestClose()
        }
      }

      const handleFocusIn = () => {
        const { activeElement } = document
        if (!container.contains(activeElement)) {
          const focusable = container.querySelectorAll(interactiveElements)
          const numFocusable = focusable.length
          const nextFocusable = shiftTabLastPressedKey ? focusable[numFocusable - 1] : focusable[0]

          if (nextFocusable instanceof HTMLElement) {
            nextFocusable.focus()
          } else {
            container.focus()
          }
        }
      }

      const handleKeyPress = (event: KeyboardEvent) => {
        shiftTabLastPressedKey = event.shiftKey && event.key === 'Tab'
        if (event.key === 'Escape') {
          onRequestClose()
        }
      }

      if (ignoreNav) {
        document.addEventListener('focusin', handleFocusIn, true)
        container.addEventListener('keydown', handleKeyPress)
      } else {
        container.addEventListener('keydown', trapKeyboardNavigation)
      }

      return () => {
        if (ignoreNav) {
          document.removeEventListener('focusin', handleFocusIn, true)
          container.removeEventListener('keydown', handleKeyPress)
        } else {
          container.removeEventListener('keydown', trapKeyboardNavigation)
        }

        if (initialFocusedElement instanceof HTMLElement) {
          initialFocusedElement.focus()
        }
      }
    }

    return () => {}
  }, [ignoreNav, nextKey, noAutoFocus, onRequestClose, previousKey])

  return (
    <div>
      <div
        className={overlayClassName || 'fixed inset-0'}
        role="presentation"
        onClick={onRequestClose}
      />
      <div ref={focusRef} tabIndex={-1} {...restProps}>
        {children}
      </div>
    </div>
  )
}
