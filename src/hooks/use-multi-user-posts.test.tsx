import { render, screen, waitFor } from '@testing-library/react'
import useMultiUserPosts from './use-multi-user-posts'

function Component({ uids }: { uids: string[] | null }) {
  const { posts } = useMultiUserPosts(uids)

  return <p>{JSON.stringify(posts)}</p>
}

test('given uids supplied, gets posts by given users ordered by creation date', async () => {
  render(<Component uids={['user1']} />)

  await waitFor(() => {
    expect(
      screen.getByText(
        '[{"createdAt":{"seconds":1,"nanoseconds":0},"deleted":false,"owner":"user1","replies":["post2"],"replyTo":null,"likesCount":2,"attachment":"","message":"mock message","id":"post1","ownerDetails":{"avatar":"","createdAt":{"seconds":0,"nanoseconds":0},"lastPostedAt":{"seconds":1,"nanoseconds":0},"deleted":false,"followersCount":2,"username":"Username","usernameLowerCase":"username","uid":"user1"}}]'
      )
    ).toBeInTheDocument()
  })
})

test('given null supplied to uids, gets posts from all users ordered by creation dates', async () => {
  render(<Component uids={null} />)

  await waitFor(() => {
    expect(
      screen.getByText(
        '[{"createdAt":{"seconds":2,"nanoseconds":0},"deleted":false,"owner":"user2","replies":[],"replyTo":{"id":"post1","owner":"user1"},"likesCount":1,"attachment":"","message":"mock message","id":"post2","ownerDetails":{"avatar":"","createdAt":{"seconds":1,"nanoseconds":0},"lastPostedAt":{"seconds":3,"nanoseconds":0},"deleted":false,"followersCount":0,"username":"Username2","usernameLowerCase":"username2","uid":"user2"},"replyToOwnerDetails":{"avatar":"","createdAt":{"seconds":0,"nanoseconds":0},"lastPostedAt":{"seconds":1,"nanoseconds":0},"deleted":false,"followersCount":2,"username":"Username","usernameLowerCase":"username","uid":"user1"}},{"createdAt":{"seconds":1,"nanoseconds":0},"deleted":false,"owner":"user1","replies":["post2"],"replyTo":null,"likesCount":2,"attachment":"","message":"mock message","id":"post1","ownerDetails":{"avatar":"","createdAt":{"seconds":0,"nanoseconds":0},"lastPostedAt":{"seconds":1,"nanoseconds":0},"deleted":false,"followersCount":2,"username":"Username","usernameLowerCase":"username","uid":"user1"}}]'
      )
    ).toBeInTheDocument()
  })
})
