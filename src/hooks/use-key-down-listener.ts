import { useEffect } from 'react'

function useKeyDownListener(key: string, callback: () => void): void
function useKeyDownListener(keys: string[], callback: () => void): void
function useKeyDownListener(keyOrKeys: string | string[], callback: () => void): void {
  useEffect(() => {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [callback, keyOrKeys])
}

export default useKeyDownListener
