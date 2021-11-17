function BrowserRouter({ children }) {
  return children
}

function Switch({ children }) {
  return children
}

function Route({ children }) {
  return children
}

function Link({ children, to, replace, ...restProps }) {
  return (
    <a href={to} {...restProps}>
      {children}
    </a>
  )
}

function Redirect() {
  return null
}

const push = jest.fn(() => {})
const history = {
  push
}
const useHistory = jest.fn(() => history)

const location = {}
const useLocation = jest.fn(() => location)
const useParams = jest.fn(() => ({ postId: '', username: '' }))

const mockFunctions = {
  history,
  useHistory,
  useLocation,
  useParams
}

export {
  BrowserRouter,
  Switch,
  Route,
  Link,
  Redirect,
  useHistory,
  useLocation,
  useParams,
  mockFunctions
}
