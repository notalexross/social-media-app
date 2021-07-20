import { useTitle } from '../hooks'
import { Header } from '../components'

export default function DashboardPage(): JSX.Element {
  useTitle('Dashboard')

  return <Header />
}
