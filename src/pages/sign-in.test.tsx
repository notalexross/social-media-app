import { BrowserRouter as Router } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// eslint-disable-next-line jest/no-mocks-import
import { mockFunctions } from '../__mocks__/react-router-dom'
import SignInPage from './sign-in'

beforeEach(() => {
  render(
    <Router>
      <SignInPage />
    </Router>
  )
})

test('render', () => {
  expect(screen.getByRole('textbox', { name: 'enter your email address' })).toBeInTheDocument()
  expect(screen.getByLabelText('enter your password')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'sign in' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'sign in' })).toBeDisabled()
  expect(screen.getByRole('link', { name: 'sign up' })).toBeInTheDocument()
})

test('given invalid email, button is disabled', () => {
  userEvent.type(screen.getByRole('textbox', { name: 'enter your email address' }), 'email@')
  userEvent.type(screen.getByLabelText('enter your password'), 'password')

  expect(screen.getByRole('button', { name: 'sign in' })).toBeDisabled()
})

test('given correct inputs, button is enabled', () => {
  userEvent.type(
    screen.getByRole('textbox', { name: 'enter your email address' }),
    'email@email.com'
  )
  userEvent.type(screen.getByLabelText('enter your password'), 'password')

  expect(screen.getByRole('button', { name: 'sign in' })).toBeEnabled()
})

test('given non-existent email, error is displayed on button click', async () => {
  userEvent.type(
    screen.getByRole('textbox', { name: 'enter your email address' }),
    'wrongemail@email.com'
  )
  userEvent.type(screen.getByLabelText('enter your password'), 'password')
  userEvent.click(screen.getByRole('button', { name: 'sign in' }))

  expect(await screen.findByRole('alert', { name: 'error message' })).toHaveTextContent(
    'There is no user record corresponding to this identifier. The user may have been deleted.'
  )
})

test('given incorrect password, error is displayed on button click', async () => {
  userEvent.type(
    screen.getByRole('textbox', { name: 'enter your email address' }),
    'email@email.com'
  )
  userEvent.type(screen.getByLabelText('enter your password'), 'wrongpassword')
  userEvent.click(screen.getByRole('button', { name: 'sign in' }))

  expect(await screen.findByRole('alert', { name: 'error message' })).toHaveTextContent(
    'The password is invalid or the user does not have a password.'
  )
})

test('given correct inputs, calls history.push', async () => {
  userEvent.type(
    screen.getByRole('textbox', { name: 'enter your email address' }),
    'email@email.com'
  )
  userEvent.type(screen.getByLabelText('enter your password'), 'password')
  userEvent.click(screen.getByRole('button', { name: 'sign in' }))

  await waitFor(() => {
    expect(mockFunctions.history.push).toHaveBeenCalledTimes(1)
  })
})
