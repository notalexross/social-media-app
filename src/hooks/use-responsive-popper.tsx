import { useEffect, useRef } from 'react'

type Direction =
  | 'top'
  | 'left'
  | 'bottom'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

type UseResponsivePopperProps = {
  elementSide?: Direction
  relativeSide?: Direction
  offsetX?: number
  offsetY?: number
  offsetXPx?: number
  offsetYPx?: number
}

export default function useResponsivePopper<T extends HTMLElement, U extends HTMLElement>({
  elementSide = 'top-left',
  relativeSide = 'top-right',
  offsetX = 0,
  offsetY = 0,
  offsetXPx = 0,
  offsetYPx = 0
}: UseResponsivePopperProps = {}): [React.RefObject<T>, React.RefObject<U>] {
  const popperRef = useRef<T>(null)
  const relativeRef = useRef<U>(null)

  useEffect(() => {
    const directionToCoords = (
      dir: Direction,
      rect: DOMRect,
      offset: [number, number] = [0, 0]
    ): [number, number] => {
      const { height, width } = rect
      switch (dir) {
        case 'top':
          return [width / 2, -offset[1]]
        case 'left':
          return [-offset[0], height / 2]
        case 'bottom':
          return [width / 2, height + offset[1]]
        case 'right':
          return [width + offset[0], height / 2]
        case 'top-left':
          return [-offset[0], -offset[1]]
        case 'top-right':
          return [width + offset[0], -offset[1]]
        case 'bottom-left':
          return [-offset[0], height + offset[1]]
        case 'bottom-right':
          return [width + offset[0], height + offset[1]]
        default:
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw new Error(`${dir} is not a valid direction`)
      }
    }

    const getIdealPosition = (): [number, number] => {
      if (popperRef.current && relativeRef.current) {
        const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const offset: [number, number] = [
          offsetXPx || remToPx * offsetX,
          offsetYPx || remToPx * offsetY
        ]
        const pageWidth = window.innerWidth
        const pageHeight = window.innerHeight
        const element = popperRef.current
        const relative = relativeRef.current
        const elementRect = element.getBoundingClientRect()
        const relativeRect = relative.getBoundingClientRect()
        const elementAnchorPoint = directionToCoords(elementSide, elementRect, offset)
        const relativeAnchorPoint = directionToCoords(relativeSide, relativeRect)
        const idealX = relativeRect.left + relativeAnchorPoint[0] - elementAnchorPoint[0]
        const idealY = relativeRect.top + relativeAnchorPoint[1] - elementAnchorPoint[1]
        const x = Math.max(Math.min(idealX, pageWidth - elementRect.width), 0)
        const y = Math.max(Math.min(idealY, pageHeight - elementRect.height), 0)

        return [x, y]
      }

      return [0, 0]
    }

    const updatePopperPosition = () => {
      if (popperRef.current && relativeRef.current) {
        const [x, y] = getIdealPosition()
        const element = popperRef.current
        element.style.position = 'fixed'
        element.style.left = `${x}px`
        element.style.top = `${y}px`
      }
    }

    const observer = new MutationObserver(updatePopperPosition)
    observer.observe(document, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    })
    window.addEventListener('resize', updatePopperPosition)
    document.addEventListener('scroll', updatePopperPosition)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePopperPosition)
      document.removeEventListener('scroll', updatePopperPosition)
    }
  }, [elementSide, relativeSide, offsetX, offsetY, offsetXPx, offsetYPx])

  return [popperRef, relativeRef]
}
