import { Link } from 'react-router-dom'
import * as ROUTES from '../constants/routes'

type SignInPromptContainerProps = {
  textContent?: string
} & React.ComponentPropsWithoutRef<'div'>

export default function SignInPromptContainer({
  textContent = 'You must be signed in to perform this action.',
  ...restProps
}: SignInPromptContainerProps): JSX.Element {
  return (
    <div className="m-4 text-center" {...restProps}>
      <p>{textContent}</p>
      <div className="flex mt-4 justify-center font-bold text-white text-sm">
        <Link className="px-5 py-1 rounded bg-blue-500" to={ROUTES.SIGN_IN}>
          Sign In
        </Link>
        <Link className="ml-4 px-5 py-1 rounded bg-blue-500" to={ROUTES.SIGN_UP}>
          Sign Up
        </Link>
      </div>
    </div>
  )
}
