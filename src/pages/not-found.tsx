import { useTitle, useWindowDimensions } from '../hooks'

export default function NotFoundPage(): JSX.Element {
  useTitle('404')
  const [, windowHeight] = useWindowDimensions()
  const minHeight = windowHeight - 73

  return (
    <div className="flex flex-col justify-center items-center" style={{ minHeight }}>
      <p className="text-center text-5xl">404</p>
      <p className="text-center text-5xl">Page Not Found</p>
    </div>
  )
}
