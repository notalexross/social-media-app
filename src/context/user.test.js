import { useContext } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { signIn, signOut } from '../services/firebase'
import { UserContext, UserContextProvider } from './user'

function Component() {
  const data = useContext(UserContext)
  const { user, ...details } = data

  return Object.entries(details).map(([key, value]) => (
    <p key={key}>{`${key}: ${value}`}</p>
  ))
}

test('on sign in, user details are provided', async () => {
  render(
    <UserContextProvider>
      <Component />
    </UserContextProvider>
  )

  await waitFor(() => {
    signIn({ email: 'email@email.com', password: 'password' })
  })

  expect(await screen.findByText('fullName: Forename Surname')).toBeInTheDocument()
})

test('on sign out, no details are provided', async () => {
  render(
    <UserContextProvider>
      <Component />
    </UserContextProvider>
  )

  await waitFor(() => {
    signIn({ email: 'email@email.com', password: 'password' })
  })

  expect(await screen.findByText('fullName: Forename Surname')).toBeInTheDocument()

  await waitFor(() => {
    signOut()
  })

  expect(screen.queryByText('fullName: Forename Surname')).not.toBeInTheDocument()
})
