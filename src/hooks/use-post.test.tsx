import firebase from 'firebase'
import { useEffect, useState } from 'react'
import { render, waitFor } from '@testing-library/react'
import usePost from './use-post'

type UsePostOptions = Parameters<typeof usePost>[1]

type ComponentProps = {
  postOrId: Parameters<typeof usePost>[0]
  callback?: (post: ReturnType<typeof usePost>) => void
  options?: UsePostOptions
  changeTo?: Parameters<typeof usePost>[0]
}

function Component({ postOrId, callback, options, changeTo }: ComponentProps) {
  const [currentPostOrId, setCurrentPostOrId] = useState(postOrId)
  const post = usePost(currentPostOrId, options)

  if (callback) {
    callback(post)
  }

  useEffect(() => {
    if (changeTo) {
      setTimeout(() => {
        setCurrentPostOrId(changeTo)
      }, 10)
    }
  }, [changeTo])

  return <p>{JSON.stringify(post)}</p>
}

const user1 = {
  avatar: '',
  createdAt: { nanoseconds: 0, seconds: 0 } as firebase.firestore.Timestamp,
  deleted: false,
  followersCount: 2,
  lastPostedAt: { nanoseconds: 0, seconds: 1 } as firebase.firestore.Timestamp,
  uid: 'user1',
  username: 'Username',
  usernameLowerCase: 'username'
}

const user2 = {
  avatar: '',
  createdAt: { seconds: 1, nanoseconds: 0 } as firebase.firestore.Timestamp,
  deleted: false,
  followersCount: 0,
  lastPostedAt: { seconds: 3, nanoseconds: 0 } as firebase.firestore.Timestamp,
  uid: 'user2',
  username: 'Username2',
  usernameLowerCase: 'username2'
}

const post = {
  id: 'post1',
  public: {
    createdAt: { seconds: 1, nanoseconds: 0 } as firebase.firestore.Timestamp,
    deleted: false,
    deletedReplies: [],
    likesCount: 2,
    owner: 'user1',
    replies: ['post2'],
    replyTo: null
  },
  content: {
    attachment: '',
    message: 'mock message'
  },
  ownerDetails: user1
}

const reply = {
  id: 'post2',
  public: {
    createdAt: { seconds: 2, nanoseconds: 0 } as firebase.firestore.Timestamp,
    deleted: false,
    deletedReplies: [],
    likesCount: 1,
    owner: 'user2',
    replies: [],
    replyTo: 'post1'
  },
  content: {
    attachment: '',
    message: 'mock message'
  },
  ownerDetails: user2
}

describe('given post does not exist', () => {
  const postId = 'nonExistentPostId'

  test('calls error callback', async () => {
    const callback = jest.fn()
    const errorCallback = jest.fn()
    const options: UsePostOptions = { errorCallback }

    render(<Component postOrId={postId} options={options} callback={callback} />)

    await waitFor(() => {
      expect(errorCallback).toHaveBeenCalledWith('Post with id "nonExistentPostId" does not exist')
    })
  })
})

describe('given no existing post', () => {
  const postId = 'post2'
  const options: UsePostOptions = {
    fetchPublic: 'get',
    fetchContent: 'get',
    fetchReplyTo: 'get'
  }

  test('returns undefined, followed by complete post', async () => {
    const callback = jest.fn()

    render(<Component postOrId={postId} options={options} callback={callback} />)

    await waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(1, undefined)
      expect(callback).toHaveBeenNthCalledWith(2, {
        id: reply.id,
        ...reply.public,
        ...reply.content,
        ownerDetails: reply.ownerDetails,
        replyToPost: {
          id: post.id,
          ...post.public,
          ownerDetails: post.ownerDetails
        }
      })
    })
  })
})

describe('given existing post is incomplete', () => {
  const postOrId = {
    id: reply.id,
    ...reply.public,
    ...reply.content,
    message: 'out-of-date message'
  }

  const options: UsePostOptions = {
    fetchPublic: 'get',
    fetchContent: 'get',
    fetchReplyTo: 'get'
  }

  test('returns undefined, followed by existing post including missing data', async () => {
    const callback = jest.fn()
    const completePost = {
      id: reply.id,
      ...reply.public,
      ...reply.content,
      message: 'out-of-date message',
      ownerDetails: reply.ownerDetails,
      replyToPost: {
        id: post.id,
        ...post.public,
        ownerDetails: post.ownerDetails
      }
    }

    render(<Component postOrId={postOrId} options={options} callback={callback} />)

    await waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(1, undefined)
      expect(callback).toHaveBeenNthCalledWith(2, completePost)
    })
  })
})

describe('given existing post is complete', () => {
  const postOrId = {
    id: reply.id,
    ...reply.public,
    ...reply.content,
    message: 'out-of-date message',
    ownerDetails: reply.ownerDetails
  }

  const options: UsePostOptions = {
    fetchPublic: 'get',
    fetchContent: 'get'
  }

  test('returns existing post', async () => {
    const callback = jest.fn()

    render(<Component postOrId={postOrId} options={options} callback={callback} />)

    await waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(1, postOrId)
      expect(callback).toHaveBeenNthCalledWith(2, postOrId)
    })
  })
})

describe('given existing post is complete and subscribe option passed', () => {
  const postOrId = {
    id: reply.id,
    ...reply.public,
    ...reply.content,
    message: 'out-of-date message'
  }

  const options: UsePostOptions = {
    fetchPublic: 'get',
    fetchContent: 'subscribe'
  }

  test('returns undefined, followed by existing post with up-to-date data', async () => {
    const callback = jest.fn()
    const completePost = {
      id: reply.id,
      ...reply.public,
      ...reply.content,
      ownerDetails: reply.ownerDetails
    }

    render(<Component postOrId={postOrId} options={options} callback={callback} />)

    await waitFor(() => {
      expect(callback).toHaveBeenNthCalledWith(1, undefined)
      expect(callback).toHaveBeenNthCalledWith(2, completePost)
    })
  })
})

describe('if postOrId changes', () => {
  describe('from complete post to complete post with additional data', () => {
    describe('given postId remains the same', () => {
      const postOrId1 = {
        id: reply.id,
        ...reply.public,
        ownerDetails: reply.ownerDetails
      }
      const postOrId2 = {
        id: reply.id,
        ...reply.public,
        message: 'different message'
      }

      test('returns the first existing post, overwritten with data from second existing post', async () => {
        const callback = jest.fn()

        render(<Component postOrId={postOrId1} changeTo={postOrId2} callback={callback} />)

        await waitFor(() => {
          expect(callback).toHaveBeenNthCalledWith(1, postOrId1)
          expect(callback).toHaveBeenNthCalledWith(2, postOrId1)
          expect(callback).toHaveBeenNthCalledWith(3, postOrId1)
          expect(callback).toHaveBeenNthCalledWith(4, { ...postOrId1, ...postOrId2 })
        })
      })

      test('makes no requests to firebase', async () => {
        const callback = jest.fn()
        const onRequestMade = jest.fn()
        const options: UsePostOptions = { onRequestMade }

        render(
          <Component
            postOrId={postOrId1}
            changeTo={postOrId2}
            options={options}
            callback={callback}
          />
        )
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(4))

        expect(onRequestMade).toHaveBeenCalledTimes(0)
      })
    })

    describe('given postId changes', () => {
      const postOrId1 = {
        id: reply.id,
        ...reply.public,
        ownerDetails: reply.ownerDetails
      }
      const postOrId12 = {
        id: post.id,
        ...post.public,
        ownerDetails: post.ownerDetails
      }

      test('returns first existing post followed by the second existing post', async () => {
        const callback = jest.fn()

        render(<Component postOrId={postOrId1} changeTo={postOrId12} callback={callback} />)

        await waitFor(() => {
          expect(callback).toHaveBeenNthCalledWith(1, postOrId1)
          expect(callback).toHaveBeenNthCalledWith(2, postOrId1)
          expect(callback).toHaveBeenNthCalledWith(3, postOrId1)
          expect(callback).toHaveBeenNthCalledWith(4, postOrId12)
        })
      })

      test('makes no requests to firebase', async () => {
        const callback = jest.fn()
        const onRequestMade = jest.fn()
        const options: UsePostOptions = { onRequestMade }

        render(
          <Component
            postOrId={postOrId1}
            changeTo={postOrId12}
            options={options}
            callback={callback}
          />
        )
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(4))

        expect(onRequestMade).toHaveBeenCalledTimes(0)
      })
    })
  })

  describe('from object to string', () => {
    describe('given postId remains the same', () => {
      const postOrId1 = {
        id: reply.id,
        ...reply.public
      }
      const postOrId2 = postOrId1.id

      test('returns a complete post', async () => {
        const callback = jest.fn()
        const completePost = {
          id: reply.id,
          ...reply.public,
          ownerDetails: reply.ownerDetails
        }

        render(<Component postOrId={postOrId1} changeTo={postOrId2} callback={callback} />)

        await waitFor(() => {
          expect(callback).toHaveBeenNthCalledWith(1, undefined)
          expect(callback).toHaveBeenNthCalledWith(2, completePost)
          expect(callback).toHaveBeenNthCalledWith(3, completePost)
          expect(callback).toHaveBeenNthCalledWith(4, completePost)
        })
      })

      test('makes two requests to firebase (ownerDetails)', async () => {
        const callback = jest.fn()
        const onRequestMade = jest.fn()
        const options: UsePostOptions = { onRequestMade }

        render(
          <Component
            postOrId={postOrId1}
            changeTo={postOrId2}
            options={options}
            callback={callback}
          />
        )
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(4))

        expect(onRequestMade).toHaveBeenCalledTimes(1)
      })
    })

    describe('given postId changes', () => {
      const postOrId1 = {
        id: reply.id,
        ...reply.public
      }
      const postOrId2 = post.id

      test('returns a complete post, followed by the undefined, followed by post matching new postId', async () => {
        const callback = jest.fn()
        const completePost1 = {
          id: reply.id,
          ...reply.public,
          ownerDetails: reply.ownerDetails
        }
        const completePost2 = {
          id: post.id,
          ...post.public,
          ownerDetails: post.ownerDetails
        }

        render(<Component postOrId={postOrId1} changeTo={postOrId2} callback={callback} />)

        await waitFor(() => {
          expect(callback).toHaveBeenNthCalledWith(1, undefined)
          expect(callback).toHaveBeenNthCalledWith(2, completePost1)
          expect(callback).toHaveBeenNthCalledWith(3, completePost1)
          expect(callback).toHaveBeenNthCalledWith(4, undefined)
          expect(callback).toHaveBeenNthCalledWith(5, completePost2)
        })
      })

      test('makes three requests to firebase (ownerDetails, then public and ownerDetails)', async () => {
        const callback = jest.fn()
        const onRequestMade = jest.fn()
        const options: UsePostOptions = { onRequestMade }

        render(
          <Component
            postOrId={postOrId1}
            changeTo={postOrId2}
            options={options}
            callback={callback}
          />
        )
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(5))

        expect(onRequestMade).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('from string to object', () => {
    describe('given postId remains the same', () => {
      const postOrId1 = reply.id
      const postOrId2 = {
        id: reply.id,
        ...reply.public
      }

      test('returns the same complete post', async () => {
        const callback = jest.fn()
        const completePost = {
          id: reply.id,
          ...reply.public,
          ownerDetails: reply.ownerDetails
        }

        render(<Component postOrId={postOrId1} changeTo={postOrId2} callback={callback} />)

        await waitFor(() => {
          expect(callback).toHaveBeenNthCalledWith(1, undefined)
          expect(callback).toHaveBeenNthCalledWith(2, completePost)
          expect(callback).toHaveBeenNthCalledWith(3, completePost)
          expect(callback).toHaveBeenNthCalledWith(4, completePost)
        })
      })

      test('makes two requests to firebase (public and ownerDetails)', async () => {
        const callback = jest.fn()
        const onRequestMade = jest.fn()
        const options: UsePostOptions = { onRequestMade }

        render(
          <Component
            postOrId={postOrId1}
            changeTo={postOrId2}
            options={options}
            callback={callback}
          />
        )
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(4))

        expect(onRequestMade).toHaveBeenCalledTimes(2)
      })
    })

    describe('given postId changes', () => {
      const postOrId1 = post.id
      const postOrId2 = {
        id: reply.id,
        ...reply.public
      }

      test('returns a complete post, followed by the undefined, followed by post matching new postId', async () => {
        const callback = jest.fn()
        const completePost1 = {
          id: post.id,
          ...post.public,
          ownerDetails: post.ownerDetails
        }
        const completePost2 = {
          id: reply.id,
          ...reply.public,
          ownerDetails: reply.ownerDetails
        }

        render(<Component postOrId={postOrId1} changeTo={postOrId2} callback={callback} />)

        await waitFor(() => {
          expect(callback).toHaveBeenNthCalledWith(1, undefined)
          expect(callback).toHaveBeenNthCalledWith(2, completePost1)
          expect(callback).toHaveBeenNthCalledWith(3, completePost1)
          expect(callback).toHaveBeenNthCalledWith(4, undefined)
          expect(callback).toHaveBeenNthCalledWith(5, completePost2)
        })
      })

      test('makes three requests to firebase (public and ownerDetails, then ownerDetails)', async () => {
        const callback = jest.fn()
        const onRequestMade = jest.fn()
        const options: UsePostOptions = { onRequestMade }

        render(
          <Component
            postOrId={postOrId1}
            changeTo={postOrId2}
            options={options}
            callback={callback}
          />
        )
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(5))

        expect(onRequestMade).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('from string to string', () => {
    const postOrId1 = post.id
    const postOrId2 = reply.id

    test('returns a complete post, followed by the undefined, followed by post matching new postId', async () => {
      const callback = jest.fn()
      const completePost1 = {
        id: post.id,
        ...post.public,
        ownerDetails: post.ownerDetails
      }
      const completePost2 = {
        id: reply.id,
        ...reply.public,
        ownerDetails: reply.ownerDetails
      }

      render(<Component postOrId={postOrId1} changeTo={postOrId2} callback={callback} />)

      await waitFor(() => {
        expect(callback).toHaveBeenNthCalledWith(1, undefined)
        expect(callback).toHaveBeenNthCalledWith(2, completePost1)
        expect(callback).toHaveBeenNthCalledWith(3, completePost1)
        expect(callback).toHaveBeenNthCalledWith(4, undefined)
        expect(callback).toHaveBeenNthCalledWith(5, completePost2)
      })
    })

    test('makes four requests to firebase (public and ownerDetails, twice)', async () => {
      const callback = jest.fn()
      const onRequestMade = jest.fn()
      const options: UsePostOptions = { onRequestMade }

      render(
        <Component
          postOrId={postOrId1}
          changeTo={postOrId2}
          options={options}
          callback={callback}
        />
      )
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(5))

      expect(onRequestMade).toHaveBeenCalledTimes(4)
    })
  })
})
