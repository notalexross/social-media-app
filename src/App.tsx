import { lazy, Suspense } from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'
import type { LocationState } from './types'
import { UserContextProvider } from './context/user'
import * as ROUTES from './constants/routes'

const SignUpPage = lazy(() => import('./pages/sign-up'))
const SignInPage = lazy(() => import('./pages/sign-in'))
const ProfilePage = lazy(() => import('./pages/profile'))
const PostPage = lazy(() => import('./pages/post'))
const DashboardPage = lazy(() => import('./pages/dashboard'))
const NotFoundPage = lazy(() => import('./pages/not-found'))
const ModalContainer = lazy(() => import('./containers/modal'))

export default function App(): JSX.Element {
  const location = useLocation<LocationState>()
  const isModal = (location.state?.modalDepth || 0) > 0
  const back = location.state?.back
  const post = location.state?.post

  return (
    <UserContextProvider>
      <Suspense fallback={<h1>Loading...</h1>}>
        <Switch location={isModal ? back : location}>
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
          <Route exact path={[ROUTES.DASHBOARD, ROUTES.COMPOSE]}>
            <DashboardPage />
          </Route>
          <Route path="*">
            <NotFoundPage />
          </Route>
        </Switch>
      </Suspense>
      {isModal || location.pathname === ROUTES.COMPOSE ? (
        <Suspense fallback={null}>
          <Switch>
            <Route exact path={`${ROUTES.POSTS}/:postId`}>
              <ModalContainer post={post} />
            </Route>
            <Route exact path={`${ROUTES.POSTS}/:postId${ROUTES.COMPOSE}`}>
              <ModalContainer post={post} compose />
            </Route>
            <Route exact path={ROUTES.COMPOSE}>
              <ModalContainer compose />
            </Route>
          </Switch>
        </Suspense>
      ) : null}
    </UserContextProvider>
  )
}
