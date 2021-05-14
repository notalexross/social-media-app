function BrowserRouter({ children }) {
  return children
}

function Switch({ children }) {
  return children
}

function Route({ children }) {
  return children
}

function Link({ children, to, ...restProps }) {
  return <a href={to} {...restProps}>{children}</a>
}

const push = jest.fn(() => {})
const history = {
  push
}
const useHistory = jest.fn(() => history)

const mockFunctions = {
  history
}

export { BrowserRouter, Switch, Route, Link, useHistory, mockFunctions }
