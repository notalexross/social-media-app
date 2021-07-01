import { useEffect } from 'react'

export default function useTitle(subtitle?: string): string {
  const siteTitle = process.env.REACT_APP_SITE_TITLE || ''

  let title: string
  if (siteTitle) {
    if (subtitle) {
      title = `${subtitle} - ${siteTitle}`
    } else {
      title = siteTitle
    }
  } else {
    title = subtitle || ''
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = siteTitle
    }
  }, [siteTitle, title])

  return title
}
