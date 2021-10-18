import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, LogoutIcon, MenuIcon } from '@heroicons/react/outline'
import { signOut } from '../services/firebase'
import { UserContext } from '../context/user'
import * as ROUTES from '../constants/routes'
import logo from '../images/logo.png'
import { Dropdown, StatefulLink, UserProfile } from '../components'

export default function HeaderContainer(): JSX.Element {
  const { pathname } = useLocation()
  const currentUser = useContext(UserContext)
  const { user, username } = currentUser
  const dropdownItemClassName =
    'block p-4 w-full font-bold hover:bg-clr-accent hover:text-clr-secondary focus:bg-clr-accent focus:text-clr-secondary'

  return (
    <Dropdown closeAfterClick>
      <Dropdown.Overlay />
      <header className="relative mb-2 py-4 border-b bg-clr-secondary z-10 shadow lg:mb-8">
        <div className="mx-4">
          <div className="flex items-center justify-between mx-auto max-w-screen-lg">
            <h1 className="flex-shrink-0 mt-1">
              <Link to={ROUTES.DASHBOARD} aria-label="home">
                <img className="h-7" src={logo} alt="Logo" />
              </Link>
            </h1>
            <div className="flex items-center justify-between w-full">
              <nav className="hidden ml-8 font-bold sm:block">
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
              <div className="hidden items-center text-sm sm:flex">
                {user.uid !== undefined && (
                  <Link
                    className="h-8 w-8 hover:text-clr-link-hover focus:text-clr-link-hover"
                    to={ROUTES.DASHBOARD}
                    aria-label="home"
                  >
                    <HomeIcon />
                  </Link>
                )}
                {user.uid !== undefined && (
                  <button
                    className="ml-3 h-8 w-8 font-bold hover:text-clr-link-hover focus:text-clr-link-hover"
                    type="button"
                    aria-label="sign out"
                    onClick={signOut}
                  >
                    <LogoutIcon />
                  </button>
                )}
                {user.uid !== undefined && (
                  <UserProfile className="ml-3" user={currentUser}>
                    <UserProfile.Avatar className="w-8" linkClassName="hover:opacity-70" />
                  </UserProfile>
                )}
                {user.uid === undefined && (
                  <Link
                    className="ml-3 px-5 py-1 rounded bg-clr-accent font-bold text-clr-secondary hover:bg-clr-accent-hover focus:bg-clr-accent-hover"
                    to={ROUTES.SIGN_IN}
                    aria-label="sign in"
                  >
                    Log In
                  </Link>
                )}
                {user.uid === undefined && (
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
              className="sm:hidden hover:text-clr-link-hover focus:text-clr-link-hover"
              aria-label="menu"
            >
              <MenuIcon className="w-8" />
            </Dropdown.Toggle>
          </div>
        </div>
      </header>
      <nav className="absolute z-30 inset-x-0 -mt-2 text-lg text-center sm:hidden">
        <Dropdown.Items
          className="py-2 border-b bg-clr-secondary shadow-xl outline-none"
          role="menu"
        >
          <Dropdown.Item className={dropdownItemClassName} modal to={ROUTES.COMPOSE}>
            New Post
          </Dropdown.Item>
          <Dropdown.Item className={dropdownItemClassName} to={ROUTES.DASHBOARD}>
            Home
          </Dropdown.Item>
          <Dropdown.Item className={dropdownItemClassName} type="link" to={ROUTES.DASHBOARD}>
            Following
          </Dropdown.Item>
          <Dropdown.Item className={dropdownItemClassName} type="link" to={ROUTES.EXPLORE}>
            Explore
          </Dropdown.Item>
          {username !== undefined ? (
            <Dropdown.Item className={dropdownItemClassName} to={`${ROUTES.PROFILES}/${username}`}>
              Profile
            </Dropdown.Item>
          ) : null}
          {user.uid !== undefined && (
            <Dropdown.Item className={dropdownItemClassName} onClick={signOut}>
              Sign Out
            </Dropdown.Item>
          )}
          {user.uid === undefined && (
            <Dropdown.Item className={dropdownItemClassName} type="link" to={ROUTES.SIGN_IN}>
              Log In
            </Dropdown.Item>
          )}
          {user.uid === undefined && (
            <Dropdown.Item className={dropdownItemClassName} type="link" to={ROUTES.SIGN_UP}>
              Sign Up
            </Dropdown.Item>
          )}
        </Dropdown.Items>
      </nav>
    </Dropdown>
  )
}
