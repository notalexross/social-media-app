import { BrowserRouter as Router } from 'react-router-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// eslint-disable-next-line jest/no-mocks-import
import { mockFunctions } from '../__mocks__/firebase/app'
import { signIn } from '../services/firebase'
import { UserContextProvider } from '../context/user'
import HeaderContainer from './header'

const component = (
  <Router>
    <UserContextProvider>
      <HeaderContainer />
    </UserContextProvider>
  </Router>
)

test('renders', () => {
  render(component)
})

test('given user is not signed in, renders sign-in button', () => {
  render(component)

  expect(screen.getByRole('link', { name: 'sign in' })).toBeInTheDocument()
})

describe('given user is already signed in', () => {
  beforeEach(async () => {
    render(component)
    await act(async () => {
      await signIn({ email: 'email@email.com', password: 'password' })
    })
  })

  test('renders sign-out button', () => {
    expect(screen.getByRole('button', { name: 'sign out' })).toBeInTheDocument()
  })

  test('renders sign-in button after sign-out button clicked', () => {
    userEvent.click(screen.getByRole('button', { name: 'sign out' }))

    expect(screen.getByRole('link', { name: 'sign in' })).toBeInTheDocument()
    expect(mockFunctions.handleAuthStateChanged).toBeCalledTimes(2)
  })
})
