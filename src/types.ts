import type { Location } from 'history'
import type { PostWithReplyTo, PostWithUserDetails } from './services/firebase'

// prettier-ignore
export type LocationState = {
  back?: Location<LocationState>
  modal?: boolean | 'signInPrompt'
  props?: Record<string, unknown>
  post?: PostWithReplyTo | PostWithUserDetails | string
} | undefined
