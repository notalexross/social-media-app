import { render, screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import useUser from './use-user'

function Component({ uid, options }) {
  const user = useUser(uid, options)

  return Object.entries(user).map(([key, value]) => (
    <p key={key}>{`${key}: ${value}`}</p>
  ))
}

test('given null uid, after having already passed a uid, returns empty data', async () => {
  function Wrapper() {
    const [uid, setUid] = useState('1')

    useEffect(() => {
      setTimeout(() => {
        setUid(null)
      }, 0)
    }, [])

    return <Component uid={uid} />
  }

  render(<Wrapper />)

  expect(await screen.findByText('username: Username')).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.queryByText('username: Username')).not.toBeInTheDocument()
  })
})

describe('without including private data', () => {
  describe('without subscribe', () => {
    test('returns correct data', async () => {
      const uid = '1'
      const options = { includePrivate: false, subscribe: false }

      render(<Component uid={uid} options={options} />)

      expect(await screen.findByText('uid: 1')).toBeInTheDocument()
      expect(await screen.findByText('username: Username')).toBeInTheDocument()
      expect(screen.queryByText('email: email@email.com')).not.toBeInTheDocument()
    })
  })

  describe('with subscribe', () => {
    test('returns correct data', async () => {
      const uid = '1'
      const options = { includePrivate: false, subscribe: true }

      render(<Component uid={uid} options={options} />)

      expect(await screen.findByText('uid: 1')).toBeInTheDocument()
      expect(await screen.findByText('username: Username')).toBeInTheDocument()
      expect(screen.queryByText('email: email@email.com')).not.toBeInTheDocument()
    })
  })
})

describe('with private data', () => {
  describe('without subscribe', () => {
    test('returns correct data', async () => {
      const uid = '1'
      const options = { includePrivate: true, subscribe: false }

      render(<Component uid={uid} options={options} />)

      expect(await screen.findByText('uid: 1')).toBeInTheDocument()
      expect(await screen.findByText('username: Username')).toBeInTheDocument()
      expect(await screen.findByText('fullName: Forename Surname')).toBeInTheDocument()
      expect(await screen.findByText('email: email@email.com')).toBeInTheDocument()
    })
  })

  describe('with subscribe', () => {
    test('returns correct data', async () => {
      const uid = '1'
      const options = { includePrivate: true, subscribe: true }

      render(<Component uid={uid} options={options} />)

      expect(await screen.findByText('uid: 1')).toBeInTheDocument()
      expect(await screen.findByText('username: Username')).toBeInTheDocument()
      expect(await screen.findByText('fullName: Forename Surname')).toBeInTheDocument()
      expect(await screen.findByText('email: email@email.com')).toBeInTheDocument()
    })
  })
})
