import { useEffect, useState } from 'react'

function getWindowDimensions(): [number, number] {
  return [window.innerWidth, window.innerHeight]
}

export default function useWindowDimensions(): [number, number] {
  const [dimensions, setDimensions] = useState(getWindowDimensions())

  useEffect(() => {
    const handleResize = () => {
      setDimensions(getWindowDimensions())
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return dimensions
}
