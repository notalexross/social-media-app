import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import useMultiUserPosts from './use-multi-user-posts'

function Component() {
  const uid = 'user3'
  const [uids] = useState(['user1', 'user2'])
  const { posts } = useMultiUserPosts(uid, uids)

  return posts ? (
    <>
      {posts.map(post => (
        Object.entries(post).map(([key, value]) => (
          <p key={key}>
            {key}
            {': '}
            {JSON.stringify(value)}
          </p>
        ))
      ))}
    </>
  ) : null
}

test('gets posts', async () => {
  render(<Component />)

  await waitFor(() => {
    expect(screen.getByText('createdAt: "2"')).toBeInTheDocument()
    expect(screen.getByText('owner: "user2"')).toBeInTheDocument()
    expect(screen.getByText('createdAt: "1"')).toBeInTheDocument()
    expect(screen.getByText('owner: "user1"')).toBeInTheDocument()
  })
})
