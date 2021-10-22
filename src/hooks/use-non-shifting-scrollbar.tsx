import { useEffect, useMemo } from 'react'

export default function useNonShiftingScrollbar(): number {
  const scrollbarWidth = useMemo(() => {
    const measure = document.createElement('div')
    measure.style.overflow = 'scroll'
    measure.style.height = '0'
    measure.style.visibility = 'hidden'

    document.body.appendChild(measure)

    const width = measure.offsetWidth - measure.clientWidth

    document.body.removeChild(measure)

    return width
  }, [])

  useEffect(() => {
    const initialOverflowX = document.body.style.overflowX
    const initialWidth = document.body.style.width
    const initialPaddingRight = document.body.style.paddingRight
    const bodyPaddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight)

    document.body.style.overflowX = 'hidden'
    document.body.style.width = '100vw'
    document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`

    return () => {
      document.body.style.overflowX = initialOverflowX
      document.body.style.width = initialWidth
      document.body.style.paddingRight = initialPaddingRight
    }
  }, [scrollbarWidth])

  return scrollbarWidth
}
