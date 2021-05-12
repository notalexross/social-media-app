import { Link } from 'react-router-dom'
import useTitle from '../hooks/use-title'
import * as ROUTES from '../constants/routes'
import logo from '../images/logo.png'

export default function SignIn() {
  useTitle('Login')

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-xs">
        <div className="mb-4 p-4 border rounded bg-white">
          <h1 className="mt-2 mb-4">
            <img className="mx-auto w-1/2" src={logo} alt="Logo" />
          </h1>
          <form className="flex flex-col">
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-gray-50 text-sm"
              type="text"
              placeholder="Email address"
              aria-label="enter your email address"
            />
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-gray-50 text-sm"
              type="password"
              placeholder="Password"
              aria-label="enter your password"
            />
            <button className="p-1 rounded bg-blue-500 font-bold text-white" type="submit">
              Log In
            </button>
          </form>
        </div>
        <div className="p-4 border rounded bg-white text-center text-sm">
          <p>
            {"Don't have an account? "}
            <Link className="font-bold text-blue-500" to={ROUTES.SIGN_UP}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
