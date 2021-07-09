import { useEffect } from 'react'

export default function useLockBody(): void {
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const initialOverflow = document.body.style.overflow
    const bodyMarginRight = parseFloat(window.getComputedStyle(document.body).marginRight)

    document.body.style.overflow = 'hidden'
    document.body.style.marginRight = `${bodyMarginRight + scrollbarWidth}px`

    return () => {
      document.body.style.overflow = initialOverflow
      document.body.style.marginRight = ''
    }
  }, [])
}
