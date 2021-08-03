import { useEffect, useRef } from 'react'
import { modulo } from '../../utils'

type FocusTrapProps = {
  children: React.ReactNode
  overlayClassName?: string
  previousKey?: string
  nextKey?: string
  onRequestClose?: () => void
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function FocusTrap({
  children,
  overlayClassName = '',
  previousKey = 'ArrowUp',
  nextKey = 'ArrowDown',
  onRequestClose = () => {},
  ...restProps
}: FocusTrapProps): JSX.Element {
  const focusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusRef.current) {
      const container = focusRef.current
      const initialFocusedElement = document.activeElement
      let focusableElements: NodeListOf<HTMLElement>
      container.focus()

      const updateFocusableElements = () => {
        const interactiveElementsString =
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        focusableElements = container.querySelectorAll(interactiveElementsString)
      }

      const moveFocusBy = (direction: number) => {
        const startIndex = direction > 0 ? -1 : 0
        const activeElementIndex = Array.from(focusableElements).findIndex(
          el => el === document.activeElement
        )
        const currentFocusIndex = activeElementIndex >= 0 ? activeElementIndex : startIndex
        const nextFocusIndex = modulo(currentFocusIndex + direction, focusableElements.length)
        focusableElements[nextFocusIndex].focus()
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

      const observer = new MutationObserver(updateFocusableElements)

      updateFocusableElements()
      observer.observe(container, { attributes: true, childList: true, subtree: true })
      container.addEventListener('keydown', trapKeyboardNavigation)

      return () => {
        observer.disconnect()
        container.removeEventListener('keydown', trapKeyboardNavigation)
        if (initialFocusedElement instanceof HTMLElement) {
          initialFocusedElement.focus()
        }
      }
    }

    return () => {}
  }, [nextKey, onRequestClose, previousKey])

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
