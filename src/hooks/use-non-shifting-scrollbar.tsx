import { useEffect } from 'react'

let scrollbarWidth: number
let initialOverflowX: string
let initialWidth: string
let initialPaddingRight: string
let instances = 0

function updateInitialStyles() {
  initialOverflowX = document.body.style.overflowX
  initialWidth = document.body.style.width
  initialPaddingRight = document.body.style.paddingRight
}

function resetStyles() {
  document.body.style.overflowX = initialOverflowX
  document.body.style.width = initialWidth
  document.body.style.paddingRight = initialPaddingRight
}

function updateStyles() {
  const bodyPaddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight)

  document.body.style.overflowX = 'hidden'
  document.body.style.width = '100vw'
  document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`
}

function getScrollbarWidth() {
  const measure = document.createElement('div')

  measure.style.overflow = 'scroll'
  measure.style.height = '0'
  measure.style.visibility = 'hidden'

  document.body.appendChild(measure)
  scrollbarWidth = measure.offsetWidth - measure.clientWidth
  document.body.removeChild(measure)
}

export default function useNonShiftingScrollbar(): number {
  if (!instances) {
    getScrollbarWidth()
  }

  useEffect(() => {
    instances += 1

    if (instances === 1) {
      updateInitialStyles()
      updateStyles()
    }

    return () => {
      if (instances === 1) {
        resetStyles()
      }

      instances -= 1
    }
  }, [])

  return scrollbarWidth
}
