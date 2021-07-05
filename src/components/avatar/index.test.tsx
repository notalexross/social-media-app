import { useContext } from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from '../../services/firebase'
import Avatar from '.'
import { UserContext, UserContextProvider } from '../../context/user'

test('given src, renders image', () => {
  render(<Avatar src="https://example.com" alt="example" />)

  expect(screen.getByRole('img', { name: 'example' })).toBeInTheDocument()
  expect(screen.getByTestId('image')).toBeInTheDocument()
  expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
})

test('given src null, renders default icon', () => {
  render(<Avatar src={null} alt="example" />)

  expect(screen.getByRole('img', { name: 'example' })).toBeInTheDocument()
  expect(screen.getByTestId('icon')).toBeInTheDocument()
  expect(screen.queryByTestId('image')).not.toBeInTheDocument()
})

test('given no src, no image rendered', () => {
  render(<Avatar alt="example" />)

  expect(screen.queryByRole('img', { name: 'example' })).not.toBeInTheDocument()
})

describe('with updatable true', () => {
  test('given uid not supplied, does not render upload button', () => {
    render(<Avatar updatable />)

    expect(screen.queryByRole('button', { name: 'upload new avatar' })).not.toBeInTheDocument()
  })

  describe('with uid supplied', () => {
    test('renders upload button', () => {
      render(<Avatar updatable uid="1" />)

      expect(screen.getByRole('button', { name: 'upload new avatar' })).toBeInTheDocument()
    })

    test('on file upload, indicates updating', async () => {
      const Component = () => {
        const user = useContext(UserContext)

        return <Avatar updatable uid="1" src={user.avatar} alt="example" />
      }

      render(
        <UserContextProvider>
          <Component />
        </UserContextProvider>
      )

      await act(async () => {
        await signIn({ email: 'email@email.com', password: 'password' })
      })

      userEvent.click(screen.getByRole('button', { name: 'upload new avatar' }))

      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

      userEvent.upload(screen.getByTestId('upload'), file)

      await waitFor(() => expect(screen.getByTestId('updating')).toBeInTheDocument())
    })
  })
})
