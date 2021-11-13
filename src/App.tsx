import { lazy, Suspense } from 'react'
import { Switch, Route, useLocation, Redirect } from 'react-router-dom'
import { SkeletonTheme } from 'react-loading-skeleton'
import type { Location } from 'history'
import type { LocationState } from './types'
import { UserContextProvider } from './context/user'
import { ThemeContextProvider } from './context/theme'
import * as ROUTES from './constants/routes'
import { useKeyboardOutlineOnly } from './hooks'
import { DemoBannerContainer } from './containers'

const HeaderContainer = lazy(() => import('./containers/header'))
const SignUpPage = lazy(() => import('./pages/sign-up'))
const SignInPage = lazy(() => import('./pages/sign-in'))
const ProfilePage = lazy(() => import('./pages/profile'))
const PostPage = lazy(() => import('./pages/post'))
const DashboardPage = lazy(() => import('./pages/dashboard'))
const NotFoundPage = lazy(() => import('./pages/not-found'))
const ModalContainer = lazy(() => import('./containers/modal'))
const EditUserContainer = lazy(() => import('./containers/edit-user'))
const SignInPromptContainer = lazy(() => import('./containers/sign-in-prompt'))

const buildDOMTree = (location: Location<LocationState>) => {
  const { pathname } = location
  const { back, modal, props, post } = location.state || {}
  const isModal = !!modal
  const isSignInPromptModal = modal === 'signInPrompt'
  const elements: React.ReactNode[] = []

  if (back) {
    elements.push(...buildDOMTree(back))
  }

  if (!isModal) {
    elements.push(
      <Suspense key={elements.length} fallback={<h1>Loading...</h1>}>
        <Switch location={location}>
          <Redirect
            from={`${ROUTES.POSTS}/:postId/${ROUTES.EDIT}`}
            to={`${ROUTES.POSTS}/:postId`}
          />
          <Redirect
            exact
            from={`${ROUTES.PROFILES}/:username`}
            to={`${ROUTES.PROFILES}/:username${ROUTES.PROFILE_POSTS}`}
          />
          <Route path={ROUTES.SIGN_UP}>
            <SignUpPage />
          </Route>
          <Route path={ROUTES.SIGN_IN}>
            <SignInPage />
          </Route>
          <Route path="*">
            <HeaderContainer />
            <Suspense fallback={null}>
              <Switch>
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
                  <DashboardPage timeline="following" />
                </Route>
                <Route exact path={ROUTES.EXPLORE}>
                  <DashboardPage timeline="master" />
                </Route>
                <Route exact path="/">
                  <Redirect to={ROUTES.DASHBOARD} />
                </Route>
                <Route path="*">
                  <NotFoundPage />
                </Route>
              </Switch>
            </Suspense>
          </Route>
        </Switch>
      </Suspense>
    )
  }

  // Note: Keys added to force remounts between repeated post edits.
  if (isModal || pathname === ROUTES.COMPOSE) {
    elements.push(
      <Suspense key={elements.length} fallback={null}>
        {isSignInPromptModal ? (
          <ModalContainer>
            <SignInPromptContainer {...props} />
          </ModalContainer>
        ) : (
          <Switch location={location}>
            <Route exact path={`${ROUTES.POSTS}/:postId`}>
              <ModalContainer post={post} key="post-modal" />
            </Route>
            <Route exact path={`${ROUTES.POSTS}/:postId${ROUTES.COMPOSE}`}>
              <ModalContainer post={post} compose key="post-modal" />
            </Route>
            <Route exact path={`${ROUTES.POSTS}/:postId${ROUTES.EDIT}`}>
              <ModalContainer post={post} edit />
            </Route>
            <Route exact path={ROUTES.COMPOSE}>
              <ModalContainer compose />
            </Route>
            <Route exact path={`${ROUTES.PROFILES}/:username${ROUTES.PROFILE_EDIT}`}>
              <ModalContainer>
                <EditUserContainer />
              </ModalContainer>
            </Route>
          </Switch>
        )}
      </Suspense>
    )
  }

  return elements
}

export default function App(): JSX.Element {
  useKeyboardOutlineOnly('button', 'a')
  const location = useLocation<LocationState>()
  const tree = buildDOMTree(location)

  return (
    <UserContextProvider>
      <ThemeContextProvider>
        <SkeletonTheme
          color="rgb(var(--clr-skeleton))"
          highlightColor="rgb(var(--clr-skeleton-highlight))"
        >
          {tree}
        </SkeletonTheme>
        <DemoBannerContainer />
      </ThemeContextProvider>
    </UserContextProvider>
  )
}
