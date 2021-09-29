import { render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import type { User } from '../services/firebase'
import useUser from './use-user'

function Component({
  arg1,
  options = {}
}: {
  arg1?: string | User
  options?: Parameters<typeof useUser>[1]
}) {
  const user = useUser(arg1, options)

  return (
    <>
      {user && Object.entries(user).map(([key, value]) => (
        <p key={key}>{`${key}: ${JSON.stringify(value)}`}</p>
      ))}
    </>
  )
}

test('given undefined uid, after having already passed a uid, returns empty data', async () => {
  function Wrapper() {
    const [uid, setUid] = useState<string | undefined>('user1')

    return (
      <>
        <button type="button" onClick={() => setUid(undefined)}>
          unset
        </button>
        <Component arg1={uid} />
      </>
    )
  }

  render(<Wrapper />)
  expect(await screen.findByText('username: "Username"')).toBeInTheDocument()

  screen.getByRole('button', { name: 'unset' }).click()

  await waitFor(() => {
    expect(screen.queryByText('username: "Username"')).not.toBeInTheDocument()
  })
})

describe('with default inclusions', () => {
  describe('without subscribe', () => {
    test('returns correct data', async () => {
      const uid = 'user1'

      render(<Component arg1={uid} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
      expect(screen.queryByText('email: "email@email.com"')).not.toBeInTheDocument()
    })
  })

  describe('with subscribe', () => {
    test('returns correct data', async () => {
      const uid = 'user1'
      const options = { subscribe: true }

      render(<Component arg1={uid} options={options} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
      expect(screen.queryByText('email: "email@email.com"')).not.toBeInTheDocument()
    })
  })
})

describe('with private data included', () => {
  describe('without subscribe', () => {
    test('returns correct data', async () => {
      const uid = 'user1'
      const options = { includePrivate: true }

      render(<Component arg1={uid} options={options} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
      expect(await screen.findByText('fullName: "Forename Surname"')).toBeInTheDocument()
      expect(await screen.findByText('email: "email@email.com"')).toBeInTheDocument()
    })
  })

  describe('with subscribe', () => {
    test('returns correct data', async () => {
      const uid = 'user1'
      const options = { includePrivate: true, subscribe: true }

      render(<Component arg1={uid} options={options} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
      expect(await screen.findByText('fullName: "Forename Surname"')).toBeInTheDocument()
      expect(await screen.findByText('email: "email@email.com"')).toBeInTheDocument()
    })
  })
})

describe('with following and likedPosts included', () => {
  describe('without subscribe', () => {
    test('returns correct data', async () => {
      const uid = 'user1'
      const options = { includeFollowing: true, includeLikedPosts: true }

      render(<Component arg1={uid} options={options} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
      expect(await screen.findByText('following: ["user3","user4"]')).toBeInTheDocument()
      expect(await screen.findByText('likedPosts: ["post1","post2"]')).toBeInTheDocument()
      expect(screen.queryByText('email: "email@email.com"')).not.toBeInTheDocument()
    })
  })

  describe('with subscribe', () => {
    test('returns correct data', async () => {
      const uid = 'user1'
      const options = { includeFollowing: true, includeLikedPosts: true, subscribe: true }

      render(<Component arg1={uid} options={options} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
      expect(await screen.findByText('following: ["user3","user4"]')).toBeInTheDocument()
      expect(await screen.findByText('likedPosts: ["post1","post2"]')).toBeInTheDocument()
      expect(screen.queryByText('email: "email@email.com"')).not.toBeInTheDocument()
    })
  })
})

describe('by username', () => {
  describe('without subscribe', () => {
    test('returns correct data', async () => {
      const username = 'Username'
      const options = { by: 'username' as const }

      render(<Component arg1={username} options={options} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
    })
  })

  describe('with subscribe', () => {
    test('returns correct data', async () => {
      const username = 'Username'
      const options = { by: 'username' as const, subscribe: true }

      render(<Component arg1={username} options={options} />)

      expect(await screen.findByText('uid: "user1"')).toBeInTheDocument()
      expect(await screen.findByText('username: "Username"')).toBeInTheDocument()
    })
  })
})
