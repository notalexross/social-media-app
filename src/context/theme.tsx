import { createContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: React.Dispatch<React.SetStateAction<Theme>>
}

const ThemeContext = createContext({} as ThemeContextValue)

function ThemeContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const mediaQuery = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), [])
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = window.localStorage.getItem('theme')

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }

    return mediaQuery.matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mediaQuery])

  useEffect(() => {
    document.body.dataset.theme = theme
    window.localStorage.setItem('theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export { ThemeContext, ThemeContextProvider }
