import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { UserContextProvider } from './context/user'
import * as ROUTES from './constants/routes'

const SignUpPage = lazy(() => import('./pages/sign-up'))
const SignInPage = lazy(() => import('./pages/sign-in'))
const ProfilePage = lazy(() => import('./pages/profile'))
const PostPage = lazy(() => import('./pages/post'))
const DashboardPage = lazy(() => import('./pages/dashboard'))
const NotFoundPage = lazy(() => import('./pages/not-found'))

export default function App(): JSX.Element {
  return (
    <Router>
      <UserContextProvider>
        <Suspense fallback={<h1>Loading...</h1>}>
          <Switch>
            <Route path={ROUTES.SIGN_UP}>
              <SignUpPage />
            </Route>
            <Route path={ROUTES.SIGN_IN}>
              <SignInPage />
            </Route>
            <Route path={`${ROUTES.PROFILES}/:username`}>
              <ProfilePage />
            </Route>
            <Route exact path={`${ROUTES.POSTS}/:postId`}>
              <PostPage />
            </Route>
            <Route exact path={`${ROUTES.POSTS}/:postId${ROUTES.COMPOSE}`}>
              <PostPage compose />
            </Route>
            <Route exact path={ROUTES.DASHBOARD}>
              <DashboardPage />
            </Route>
            <Route path="*">
              <NotFoundPage />
            </Route>
          </Switch>
        </Suspense>
      </UserContextProvider>
    </Router>
  )
}
