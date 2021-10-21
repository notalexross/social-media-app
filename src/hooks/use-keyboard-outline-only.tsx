import { useEffect } from 'react'

export default function useKeyboardOutlineOnly(...tagNames: string[]): void {
  useEffect(() => {
    const addStyleElement = () => {
      const selectors = tagNames.reduce((string, tagName, idx) => {
        const lineEnd = idx < tagNames.length - 1 ? ',\n' : ''

        return `${string}body:not(.using-keys) ${tagName}${lineEnd}`
      }, '')

      const style = document.createElement('style')
      style.textContent = `${selectors} {\n  outline: none !important;\n}`
      document.head.appendChild(style)

      return () => document.head.removeChild(style)
    }

    const handleKeyDown = ({ key }: WindowEventMap['keydown']) => {
      if (['Tab', 'Enter'].includes(key)) {
        document.body.classList.add('using-keys')
      }
    }

    const handleKeyUp = ({ key }: WindowEventMap['keyup']) => {
      if ([' '].includes(key)) {
        document.body.classList.add('using-keys')
      }
    }

    const handleMouseDown = () => {
      document.body.classList.remove('using-keys')
    }

    const removeStyleElement = addStyleElement()
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keydown', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
      removeStyleElement()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keydown', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
