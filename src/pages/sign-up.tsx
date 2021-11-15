import { useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { signUp } from '../services/firebase'
import { isValidSignUpInputs } from '../utils'
import { useTitle } from '../hooks'
import * as ROUTES from '../constants/routes'
import logo from '../images/logo.png'
import { USER_FULL_NAME_CHARACTER_LIMIT, USER_USERNAME_CHARACTER_LIMIT } from '../constants/config'

export default function SignUpPage(): JSX.Element {
  useTitle('Sign Up')
  const history = useHistory()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const isValidInputs = isValidSignUpInputs({ username, fullName, email, password })

  const handleSignUp: React.FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault()

    signUp({ username, fullName, email, password })
      .then(() => {
        history.push(ROUTES.DASHBOARD)
      })
      .catch((err: Error) => {
        setPassword('')
        setError(err.message)
      })
  }

  const handleUsernameChange: React.ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    const { value } = target
    if (value.length <= USER_USERNAME_CHARACTER_LIMIT) {
      setUsername(target.value)
    }
  }

  const handleFullNameChange: React.ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    const { value } = target
    if (value.length <= USER_FULL_NAME_CHARACTER_LIMIT) {
      setFullName(target.value)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-xs">
        <div className="mb-4 p-4 border rounded bg-clr-secondary">
          <h1 className="mt-2 mb-4">
            <img className="mx-auto w-36" src={logo} alt="Logo" />
          </h1>
          {error && (
            <p
              className="mb-4 text-center text-xs text-clr-error"
              role="alert"
              aria-label="error message"
            >
              {error}
            </p>
          )}
          <form className="flex flex-col" onSubmit={handleSignUp}>
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-clr-input text-sm"
              type="text"
              placeholder="Username"
              aria-label="enter your username"
              value={username}
              onChange={handleUsernameChange}
            />
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-clr-input text-sm"
              type="text"
              placeholder="Full name"
              aria-label="enter your full name"
              value={fullName}
              onChange={handleFullNameChange}
            />
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-clr-input text-sm"
              type="text"
              placeholder="Email address"
              aria-label="enter your email address"
              value={email}
              onChange={({ target }) => setEmail(target.value)}
            />
            <input
              className="mb-2 px-4 py-2.5 border rounded bg-clr-input text-sm"
              type="password"
              placeholder="Password"
              aria-label="enter your password"
              value={password}
              onChange={({ target }) => setPassword(target.value)}
            />
            <button
              className="p-1 rounded bg-clr-accent font-bold text-clr-secondary hover:bg-clr-accent-hover focus:bg-clr-accent-hover disabled:bg-clr-accent disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              aria-label="sign up"
              disabled={!isValidInputs}
            >
              Sign Up
            </button>
          </form>
        </div>
        <div className="p-4 border rounded bg-clr-secondary text-center text-sm">
          <p>
            {'Have an account? '}
            <Link
              className="font-bold text-clr-accent hover:text-clr-accent-hover focus:text-clr-accent-hover"
              to={ROUTES.SIGN_IN}
              aria-label="sign in"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
