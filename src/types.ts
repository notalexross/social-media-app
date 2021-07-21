import type { Location } from 'history'
import type { PostWithUserDetails } from './services/firebase'

export type LocationState = {
  back?: Location<LocationState>
  modalDepth?: number
  post?: PostWithUserDetails | string
} | undefined
