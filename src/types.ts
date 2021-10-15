import type { Location } from 'history'
import type { PostWithUserDetails } from './services/firebase'

// prettier-ignore
export type LocationState = {
  back?: Location<LocationState>
  modal?: boolean | 'signInPrompt'
  props?: Record<string, unknown>
  post?: PostWithUserDetails | string
} | undefined
