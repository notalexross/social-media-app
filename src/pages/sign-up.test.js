import { BrowserRouter as Router, mockFunctions } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUp from './sign-up'

beforeEach(() => {
  render(
    <Router>
      <SignUp />
    </Router>
  )
})

test('render', () => {
  expect(screen.getByRole('textbox', { name: 'enter your username' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'enter your full name' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'enter your email address' })).toBeInTheDocument()
  expect(screen.getByLabelText('enter your password')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'sign up' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'sign up' })).toBeDisabled()
  expect(screen.getByRole('link', { name: 'sign in' })).toBeInTheDocument()
})

test('given invalid email, button is disabled', () => {
  userEvent.type(screen.getByRole('textbox', { name: 'enter your username' }), 'username')
  userEvent.type(screen.getByRole('textbox', { name: 'enter your full name' }), 'full name')
  userEvent.type(screen.getByRole('textbox', { name: 'enter your email address' }), 'email@')
  userEvent.type(screen.getByLabelText('enter your password'), 'password')

  expect(screen.getByRole('button', { name: 'sign up' })).toBeDisabled()
})

test('given correct inputs, button is enabled', () => {
  userEvent.type(screen.getByRole('textbox', { name: 'enter your username' }), 'username')
  userEvent.type(screen.getByRole('textbox', { name: 'enter your full name' }), 'full name')
  userEvent.type(
    screen.getByRole('textbox', { name: 'enter your email address' }),
    'email@email.com'
  )
  userEvent.type(screen.getByLabelText('enter your password'), 'password')

  expect(screen.getByRole('button', { name: 'sign up' })).toBeEnabled()
})

test('given username taken, error is displayed on button click', async () => {
  userEvent.type(screen.getByRole('textbox', { name: 'enter your username' }), 'username')
  userEvent.type(screen.getByRole('textbox', { name: 'enter your full name' }), 'full name')
  userEvent.type(
    screen.getByRole('textbox', { name: 'enter your email address' }),
    'email@email.com'
  )
  userEvent.type(screen.getByLabelText('enter your password'), 'password')
  userEvent.click(screen.getByRole('button', { name: 'sign up' }))

  expect(await screen.findByRole('alert', { name: 'error message' })).toHaveTextContent(
    'The username "username" is already taken.'
  )
})

test('given correct inputs, calls history.push', async () => {
  userEvent.type(screen.getByRole('textbox', { name: 'enter your username' }), 'untakenUsername')
  userEvent.type(screen.getByRole('textbox', { name: 'enter your full name' }), 'full name')
  userEvent.type(
    screen.getByRole('textbox', { name: 'enter your email address' }),
    'email@email.com'
  )
  userEvent.type(screen.getByLabelText('enter your password'), 'password')
  userEvent.click(screen.getByRole('button', { name: 'sign up' }))

  await waitFor(() => {
    expect(mockFunctions.history.push).toHaveBeenCalledTimes(1)
  })
})
