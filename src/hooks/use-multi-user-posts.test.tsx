import { render, screen, waitFor } from '@testing-library/react'
import useMultiUserPosts from './use-multi-user-posts'

function Component({ uids }: { uids: string[] | null }) {
  const { posts } = useMultiUserPosts(uids)

  return <p>{JSON.stringify(posts)}</p>
}

test('given uids supplied, gets non-deleted posts by given users ordered by creation date', async () => {
  render(<Component uids={['user1']} />)

  await waitFor(() => {
    expect(
      screen.getByText(
        '[{"createdAt":{"seconds":1,"nanoseconds":0},"deleted":false,"deletedReplies":[],"replies":["post2"],"replyTo":null,"owner":"user1","likesCount":2,"id":"post1"}]'
      )
    ).toBeInTheDocument()
  })
})

test('given null supplied to uids, gets non-deleted posts from all users ordered by creation dates', async () => {
  render(<Component uids={null} />)

  await waitFor(() => {
    expect(
      screen.getByText(
        '[{"createdAt":{"seconds":2,"nanoseconds":0},"deleted":false,"deletedReplies":[],"replies":[],"replyTo":"post1","owner":"user2","likesCount":1,"id":"post2"},{"createdAt":{"seconds":1,"nanoseconds":0},"deleted":false,"deletedReplies":[],"replies":["post2"],"replyTo":null,"owner":"user1","likesCount":2,"id":"post1"}]'
      )
    ).toBeInTheDocument()
  })
})
