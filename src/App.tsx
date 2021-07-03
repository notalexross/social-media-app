import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { UserContextProvider } from './context/user'
import * as ROUTES from './constants/routes'

const SignUp = lazy(() => import('./pages/sign-up'))
const SignIn = lazy(() => import('./pages/sign-in'))
const Profile = lazy(() => import('./pages/profile'))
const Dashboard = lazy(() => import('./pages/dashboard'))
const NotFound = lazy(() => import('./pages/not-found'))

export default function App(): JSX.Element {
  return (
    <Router>
      <UserContextProvider>
        <Suspense fallback={<h1>Loading...</h1>}>
          <Switch>
            <Route path={ROUTES.SIGN_UP}>
              <SignUp />
            </Route>
            <Route path={ROUTES.SIGN_IN}>
              <SignIn />
            </Route>
            <Route path={`${ROUTES.PROFILES}/:username`}>
              <Profile />
            </Route>
            <Route exact path={ROUTES.DASHBOARD}>
              <Dashboard />
            </Route>
            <Route path="*">
              <NotFound />
            </Route>
          </Switch>
        </Suspense>
      </UserContextProvider>
    </Router>
  )
}
