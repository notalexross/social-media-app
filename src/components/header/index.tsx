import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, LogoutIcon, MenuIcon } from '@heroicons/react/outline'
import { signOut } from '../../services/firebase'
import { UserContext } from '../../context/user'
import * as ROUTES from '../../constants/routes'
import logo from '../../images/logo.png'
import UserProfile from '../user-profile'
import Dropdown from '../dropdown'

export default function Header(): JSX.Element {
  const { pathname } = useLocation()
  const currentUser = useContext(UserContext)
  const { user, username } = currentUser

  return (
    <Dropdown closeAfterClick>
      <Dropdown.Overlay />
      <header className="relative mb-2 py-4 border-b bg-white z-10 lg:mb-8">
        <div className="mx-4">
          <div className="flex items-center justify-between mx-auto max-w-screen-lg">
            <h1 className="flex-shrink-0 mt-1">
              <Link to={ROUTES.DASHBOARD} aria-label="home">
                <img className="h-7" src={logo} alt="Logo" />
              </Link>
            </h1>
            <div className="hidden items-center justify-between w-full sm:flex">
              <nav className="ml-8 font-bold">
                <ul className="flex">
                  <li>
                    <Link className="hover:underline hover:opacity-70" to={ROUTES.DASHBOARD}>
                      <span className={pathname === ROUTES.DASHBOARD ? 'underline' : ''}>
                        Following
                      </span>
                    </Link>
                  </li>
                  <li className="ml-4">
                    <Link className="hover:underline hover:opacity-70" to={ROUTES.EXPLORE}>
                      <span className={pathname === ROUTES.EXPLORE ? 'underline' : ''}>
                        Explore
                      </span>
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className="flex items-center text-sm">
                {user.uid !== undefined && (
                  <Link to={ROUTES.DASHBOARD} aria-label="home">
                    <HomeIcon className="h-8 w-8" />
                  </Link>
                )}
                {user.uid !== undefined && (
                  <button
                    className="ml-3 font-bold"
                    type="button"
                    aria-label="sign out"
                    onClick={signOut}
                  >
                    <LogoutIcon className="h-8 w-8" />
                  </button>
                )}
                {user.uid !== undefined && (
                  <UserProfile className="ml-3" user={currentUser}>
                    <UserProfile.Avatar className="w-8" linkClassName="hover:opacity-70" />
                  </UserProfile>
                )}
                {user.uid === undefined && (
                  <Link
                    className="ml-3 px-5 py-1 rounded bg-blue-500 font-bold text-white"
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
            <Dropdown.Toggle className="hover:opacity-70 sm:hidden" aria-label="menu">
              <MenuIcon className="w-8" />
            </Dropdown.Toggle>
          </div>
        </div>
      </header>
      <nav className="absolute z-30 inset-x-0 -mt-2 text-lg text-center sm:hidden">
        <Dropdown.Items className="py-2 border-b bg-white shadow-xl outline-none" role="menu">
          <Dropdown.Item className="block p-4 font-bold" to={ROUTES.DASHBOARD}>
            Home
          </Dropdown.Item>
          <Dropdown.Item className="block p-4 font-bold" type="link" to={ROUTES.DASHBOARD}>
            Following
          </Dropdown.Item>
          <Dropdown.Item className="block p-4 font-bold" type="link" to={ROUTES.EXPLORE}>
            Explore
          </Dropdown.Item>
          {username !== undefined ? (
            <Dropdown.Item className="block p-4 font-bold" to={`${ROUTES.PROFILES}/${username}`}>
              Profile
            </Dropdown.Item>
          ) : null}
          {user.uid !== undefined && (
            <Dropdown.Item className="w-full p-4 font-bold" onClick={signOut}>
              Sign Out
            </Dropdown.Item>
          )}
          {user.uid === undefined && (
            <Dropdown.Item className="block p-4 font-bold" type="link" to={ROUTES.SIGN_IN}>
              Log In
            </Dropdown.Item>
          )}
          {user.uid === undefined && (
            <Dropdown.Item className="block p-4 font-bold" type="link" to={ROUTES.SIGN_UP}>
              Sign Up
            </Dropdown.Item>
          )}
        </Dropdown.Items>
      </nav>
    </Dropdown>
  )
}
