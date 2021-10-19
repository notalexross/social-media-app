import { useContext } from 'react'
import { ThemeContext } from '../../context/theme'

export default function ThemeSwitcher(
  props: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>
): JSX.Element {
  const { theme, setTheme } = useContext(ThemeContext)
  const buttonClassName = 'leading-7 hover:text-clr-link-hover focus:text-clr-link-hover'

  return (
    <div {...props}>
      <button
        className={`w-11 pr-2 text-right ${buttonClassName} ${theme === 'dark' ? 'font-bold' : ''}`}
        type="button"
        onClick={() => setTheme('dark')}
      >
        dark
      </button>
      <span>|</span>
      <button
        className={`w-11 pl-2 text-left ${buttonClassName} ${theme === 'light' ? 'font-bold' : ''}`}
        type="button"
        onClick={() => setTheme('light')}
      >
        light
      </button>
    </div>
  )
}
