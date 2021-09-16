import { useTitle } from '../hooks'

export default function NotFoundPage(): JSX.Element {
  useTitle('404')

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <p className="text-center text-5xl">404</p>
      <p className="text-center text-5xl">Page Not Found</p>
    </div>
  )
}
