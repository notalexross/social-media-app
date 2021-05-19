import { useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { signIn } from '../services/firebase'
import { isValidSignInInputs } from '../utils'
import { useTitle } from '../hooks'
import * as ROUTES from '../constants/routes'
import logo from '../images/logo.png'

export default function SignIn() {
  useTitle('Login')
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const isValidInputs = isValidSignInInputs({ email, password })

  const handleSignIn = event => {
    event.preventDefault()

    signIn({ email, password })
      .then(() => {
        history.push(ROUTES.DASHBOARD)
      })
      .catch(err => {
        setPassword('')
        setError(err.message)
      })
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-xs">
        <div className="mb-4 p-4 border rounded bg-white">
          <h1 className="mt-2 mb-4">
            <img className="mx-auto w-36" src={logo} alt="Logo" />
          </h1>
          {error && (
            <p
              className="mb-4 text-center text-xs text-red-500"
              role="alert"
              aria-label="error message"
            >
              {error}
            </p>
          )}
          <form className="flex flex-col" onSubmit={handleSignIn}>
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-gray-50 text-sm"
              type="text"
              placeholder="Email address"
              aria-label="enter your email address"
              value={email}
              onChange={({ target }) => setEmail(target.value)}
            />
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-gray-50 text-sm"
              type="password"
              placeholder="Password"
              aria-label="enter your password"
              value={password}
              onChange={({ target }) => setPassword(target.value)}
            />
            <button
              className="p-1 rounded bg-blue-500 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              aria-label="sign in"
              disabled={!isValidInputs}
            >
              Log In
            </button>
          </form>
        </div>
        <div className="p-4 border rounded bg-white text-center text-sm">
          <p>
            {"Don't have an account? "}
            <Link className="font-bold text-blue-500" to={ROUTES.SIGN_UP} aria-label="sign up">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
