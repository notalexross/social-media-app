import type { Location } from 'history'
import type { PostWithReplyTo, PostWithUserDetails } from './services/firebase'

// prettier-ignore
export type LocationState = {
  back?: Location<LocationState>
  modal?: boolean | 'signInPrompt'
  props?: Record<string, unknown>
  post?: PostWithReplyTo | PostWithUserDetails | string
} | undefined

type AnyOf2<A, B> = A | B | (A & B)

export type CombinationOf<
  A = never,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never
> = AnyOf2<A, AnyOf2<B, AnyOf2<C, AnyOf2<D, AnyOf2<E, F>>>>>
