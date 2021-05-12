import { useEffect } from 'react'

export default function useTitle(subtitle) {
  const siteTitle = process.env.REACT_APP_SITE_TITLE
  const title = subtitle ? `${subtitle} - ${siteTitle}` : siteTitle

  useEffect(() => {
    document.title = title

    return () => {
      document.title = process.env.REACT_APP_SITE_TITLE
    }
  }, [title])

  return title
}
