import { useEffect } from 'react'

export default function useLockBody(): void {
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const initialOverflow = document.body.style.overflow
    const initialOverflowX = document.body.style.overflowX
    const initialOverflowY = document.body.style.overflowY
    const initialMarginRight = document.body.style.marginRight
    const bodyMarginRight = parseFloat(window.getComputedStyle(document.body).marginRight)

    document.body.style.overflow = 'hidden'
    document.body.style.marginRight = `${bodyMarginRight + scrollbarWidth}px`

    return () => {
      document.body.style.overflow = initialOverflow
      document.body.style.overflowX = initialOverflowX
      document.body.style.overflowY = initialOverflowY
      document.body.style.marginRight = initialMarginRight
    }
  }, [])
}
