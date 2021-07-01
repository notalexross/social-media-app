import { act, render } from '@testing-library/react'
// eslint-disable-next-line jest/no-mocks-import
import { mockFunctions } from '../__mocks__/firebase/app'
import { signIn, signOut } from '../services/firebase'
import useAuthListener from './use-auth-listener'

function Component() {
  useAuthListener()

  return null
}

test("calls onAuthStateChanged's callback on sign-in", async () => {
  render(<Component />)

  await act(async () => {
    await signIn({ email: 'email@email.com', password: 'password' })
  })

  expect(mockFunctions.handleAuthStateChanged).toHaveBeenCalledTimes(1)
})

describe('given user is already signed in', () => {
  beforeEach(async () => {
    render(<Component />)

    await act(async () => {
      await signIn({ email: 'email@email.com', password: 'password' })
    })
  })

  test("calls onAuthStateChanged's callback on sign-out", async () => {
    await act(async () => signOut())

    expect(mockFunctions.handleAuthStateChanged).toHaveBeenCalledTimes(2)
  })
})
