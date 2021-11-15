import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, LogoutIcon, MenuIcon } from '@heroicons/react/outline'
import { signOut } from '../services/firebase'
import { UserContext } from '../context/user'
import * as ROUTES from '../constants/routes'
import logo from '../images/logo.png'
import { Dropdown, StatefulLink, ThemeSwitcher, UserProfile } from '../components'
import { ThemeContext } from '../context/theme'
import { useNonShiftingScrollbar } from '../hooks'

export default function HeaderContainer(): JSX.Element {
  const scrollbarWidth = useNonShiftingScrollbar()
  const { pathname } = useLocation()
  const { theme, setTheme } = useContext(ThemeContext)
  const currentUser = useContext(UserContext)
  const { user, username, isLoadingAuth } = currentUser
  const dropdownItemClassName =
    'block p-4 w-full font-bold hover:bg-clr-accent hover:text-clr-secondary focus:bg-clr-accent focus:text-clr-secondary'

  return (
    <Dropdown closeAfterClick>
      <Dropdown.Overlay />
      <header
        className="relative mb-2 py-4 border-b bg-clr-secondary z-10 shadow lg:mb-8"
        style={{
          paddingRight: `${scrollbarWidth}px`,
          marginRight: `-${scrollbarWidth}px`
        }}
      >
        <div className="mx-4">
          <div className="flex items-center justify-between mx-auto max-w-screen-lg">
            <h1 className="flex-shrink-0 mt-1">
              <Link to={ROUTES.DASHBOARD} aria-label="home">
                <img className="h-7" src={logo} alt="Logo" />
              </Link>
            </h1>
            <div className="flex items-center justify-between w-full">
              <nav className="hidden ml-8 font-bold md:block">
                <ul className="flex">
                  <li>
                    <Link
                      className="text-clr-primary hover:underline hover:text-clr-link-hover focus:underline focus:text-clr-link-hover"
                      to={ROUTES.DASHBOARD}
                    >
                      <span className={pathname === ROUTES.DASHBOARD ? 'underline' : ''}>
                        Following
                      </span>
                    </Link>
                  </li>
                  <li className="ml-4">
                    <Link
                      className="text-clr-primary hover:underline hover:text-clr-link-hover focus:underline focus:text-clr-link-hover"
                      to={ROUTES.EXPLORE}
                    >
                      <span className={pathname === ROUTES.EXPLORE ? 'underline' : ''}>
                        Explore
                      </span>
                    </Link>
                  </li>
                </ul>
              </nav>
              <StatefulLink
                className="block ml-4 mr-auto w-max py-1 px-5 rounded bg-clr-accent font-bold text-sm text-clr-secondary hover:bg-clr-accent-hover focus:bg-clr-accent-hover"
                to={`${ROUTES.COMPOSE}`}
                modal
              >
                New Post
              </StatefulLink>
              <div className="hidden items-center text-sm md:flex">
                {!isLoadingAuth && <ThemeSwitcher className="text-base" />}
                {!isLoadingAuth && user.uid !== undefined && (
                  <Link
                    className="ml-3 h-8 w-8 hover:text-clr-link-hover focus:text-clr-link-hover"
                    to={ROUTES.DASHBOARD}
                    aria-label="home"
                  >
                    <HomeIcon />
                  </Link>
                )}
                {!isLoadingAuth && user.uid !== undefined && (
                  <button
                    className="ml-3 h-8 w-8 font-bold hover:text-clr-link-hover focus:text-clr-link-hover"
                    type="button"
                    aria-label="sign out"
                    onClick={signOut}
                  >
                    <LogoutIcon />
                  </button>
                )}
                {!isLoadingAuth && user.uid !== undefined && (
                  <UserProfile className="ml-3" user={currentUser}>
                    <UserProfile.Avatar className="w-8" linkClassName="hover:opacity-70" />
                  </UserProfile>
                )}
                {!isLoadingAuth && user.uid === undefined && (
                  <Link
                    className="ml-6 px-5 py-1 rounded bg-clr-accent font-bold text-clr-secondary hover:bg-clr-accent-hover focus:bg-clr-accent-hover"
                    to={ROUTES.SIGN_IN}
                    aria-label="sign in"
                  >
                    Log In
                  </Link>
                )}
                {!isLoadingAuth && user.uid === undefined && (
                  <Link
                    className="ml-3 px-5 py-1 font-bold"
                    to={ROUTES.SIGN_UP}
                    aria-label="sign up"
                  >
                    Sign Up
                  </Link>
                )}
              </div>
            </div>
            <Dropdown.Toggle
              className="md:hidden hover:text-clr-link-hover focus:text-clr-link-hover"
              aria-label="menu"
            >
              <MenuIcon className="w-8" />
            </Dropdown.Toggle>
          </div>
        </div>
      </header>
      <nav className="absolute z-30 inset-x-0 -mt-2 text-lg text-center md:hidden">
        <Dropdown.Items
          className="p-1 border-b bg-clr-secondary shadow-xl outline-none"
          role="menu"
        >
          <Dropdown.Item className={dropdownItemClassName} modal to={ROUTES.COMPOSE}>
            New Post
          </Dropdown.Item>
          <Dropdown.Item className={dropdownItemClassName} to={ROUTES.DASHBOARD}>
            Home
          </Dropdown.Item>
          <Dropdown.Item className={dropdownItemClassName} to={ROUTES.DASHBOARD}>
            Following
          </Dropdown.Item>
          <Dropdown.Item className={dropdownItemClassName} to={ROUTES.EXPLORE}>
            Explore
          </Dropdown.Item>
          {!isLoadingAuth && username !== undefined ? (
            <Dropdown.Item
              className={dropdownItemClassName}
              to={`${ROUTES.PROFILES}/${username}${ROUTES.PROFILE_POSTS}`}
            >
              Profile
            </Dropdown.Item>
          ) : null}
          {!isLoadingAuth && user.uid !== undefined && (
            <Dropdown.Item className={dropdownItemClassName} onClick={signOut}>
              Sign Out
            </Dropdown.Item>
          )}
          {!isLoadingAuth && user.uid === undefined && (
            <Dropdown.Item className={dropdownItemClassName} to={ROUTES.SIGN_IN}>
              Log In
            </Dropdown.Item>
          )}
          {!isLoadingAuth && user.uid === undefined && (
            <Dropdown.Item className={dropdownItemClassName} to={ROUTES.SIGN_UP}>
              Sign Up
            </Dropdown.Item>
          )}
          <Dropdown.Item
            className={dropdownItemClassName}
            onClick={() => setTheme(state => (state === 'dark' ? 'light' : 'dark'))}
            closeAfterClickOverride={false}
          >
            {`${theme === 'dark' ? 'Disable' : 'Enable'} Dark Mode`}
          </Dropdown.Item>
        </Dropdown.Items>
      </nav>
    </Dropdown>
  )
}
