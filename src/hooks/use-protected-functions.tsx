import { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { UserContext } from '../context/user'
import {
  addPost,
  editPost,
  followUser,
  likePost,
  unfollowUser,
  unlikePost
} from '../services/firebase'
import { LocationState } from '../types'

type ProtectedFunctions = {
  addPost: typeof addPost
  editPost: typeof editPost
  followUser: typeof followUser
  likePost: typeof likePost
  unfollowUser: typeof unfollowUser
  unlikePost: typeof unlikePost
}

export default function useProtectedFunctions(): ProtectedFunctions {
  const history = useHistory<LocationState>()
  const { location: back } = history
  const { pathname, state: backState } = back
  const { uid } = useContext(UserContext)
  const modal = 'signInPrompt' as const

  const protect = <T extends unknown[], U>(
    fn: (...args: T) => Promise<U>,
    textContent = 'Unable to complete action as user not logged in.'
  ) => {
    const protectedFn = async (...args: T): Promise<U> => {
      if (!uid) {
        history.push(pathname, {
          ...backState,
          back,
          modal,
          props: { textContent }
        })
        throw new Error(textContent)
      }

      return fn(...args)
    }

    return protectedFn
  }

  return {
    addPost: protect(addPost, 'You must be signed in to create a post.'),
    editPost: protect(editPost, 'You must be signed in to create a post.'),
    followUser: protect(followUser, 'You must be signed in to follow other user.'),
    likePost: protect(likePost, 'You must be signed in to like posts.'),
    unfollowUser: protect(unfollowUser, 'You must be signed in to follow other user.'),
    unlikePost: protect(unlikePost, 'You must be signed in to like posts.')
  }
}
