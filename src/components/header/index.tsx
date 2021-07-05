import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon, LogoutIcon } from '@heroicons/react/outline'
import { signOut } from '../../services/firebase'
import { UserContext } from '../../context/user'
import Avatar from '../avatar'
import * as ROUTES from '../../constants/routes'
import logo from '../../images/logo.png'

export default function Header(): JSX.Element {
  const { user, avatar, username } = useContext(UserContext)

  return (
    <div className="mx-4 mb-8 py-4 border-b bg-white">
      <div className="flex justify-between items-center mx-auto max-w-screen-lg">
        <h1 className="mt-1">
          <Link to={ROUTES.DASHBOARD} aria-label="home">
            <img className="h-7" src={logo} alt="Logo" />
          </Link>
        </h1>
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
              <Link className="ml-3" to={`${ROUTES.PROFILES}/${username || ''}`} aria-label="profile">
                <Avatar className="w-8" uid={user.uid} src={avatar} alt="" />
              </Link>
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
  )
}
