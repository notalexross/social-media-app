import { useTitle } from '../hooks'
import { Header } from '../components'

export default function Dashboard(): JSX.Element {
  useTitle('Dashboard')

  return <Header />
}
