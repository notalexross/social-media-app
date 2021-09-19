import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, LogoutIcon } from '@heroicons/react/outline'
import { signOut } from '../../services/firebase'
import { UserContext } from '../../context/user'
import * as ROUTES from '../../constants/routes'
import logo from '../../images/logo.png'
import UserProfile from '../user-profile'

export default function Header(): JSX.Element {
  const { pathname } = useLocation()
  const currentUser = useContext(UserContext)
  const { user } = currentUser

  return (
    <header className="mb-2 py-4 border-b bg-white lg:mb-8">
      <div className="mx-4">
        <div className="flex justify-between items-center mx-auto max-w-screen-lg">
          <div className="flex items-center">
            <h1 className="flex-shrink-0 mt-1">
              <Link to={ROUTES.DASHBOARD} aria-label="home">
                <img className="h-7" src={logo} alt="Logo" />
              </Link>
            </h1>
            <nav className="ml-8 font-bold text-gray-800">
              <Link className="hover:underline hover:opacity-70" to={ROUTES.DASHBOARD}>
                <span className={pathname === ROUTES.DASHBOARD ? 'underline' : ''}>Following</span>
              </Link>
              <Link className="ml-4 hover:underline hover:opacity-70" to={ROUTES.EXPLORE}>
                <span className={pathname === ROUTES.EXPLORE ? 'underline' : ''}>Explore</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center text-sm">
            {user.uid !== undefined ? (
              <>
                <Link to={ROUTES.DASHBOARD} aria-label="home">
                  <HomeIcon className="h-8 w-8" />
                </Link>
                <button
                  className="ml-3 font-bold"
                  type="button"
                  aria-label="sign out"
                  onClick={signOut}
                >
                  <LogoutIcon className="h-8 w-8" />
                </button>
                <UserProfile className="ml-3" user={currentUser}>
                  <UserProfile.Avatar
                    className="w-8"
                    linkClassName="hover:opacity-70"
                  />
                </UserProfile>
              </>
            ) : (
              <>
                <Link
                  className="ml-3 px-5 py-1 rounded bg-blue-500 font-bold text-white"
                  to={ROUTES.SIGN_IN}
                  aria-label="sign in"
                >
                  Log In
                </Link>
                <Link className="ml-3 px-5 py-1 font-bold" to={ROUTES.SIGN_UP} aria-label="sign up">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
