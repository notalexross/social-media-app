import { useEffect, useRef } from 'react'
import type { PostWithUserDetails } from '../services/firebase'
import PostContainer from './post'
import { Spinner } from '../components'

type TimelineContainerProps = {
  posts: PostWithUserDetails[] | null
  loadNextPage: () => Promise<void>
  isComplete: boolean
  isLoadingPosts: boolean
  error: string
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function TimelineContainer({
  posts,
  loadNextPage,
  isComplete,
  isLoadingPosts,
  error,
  ...restProps
}: TimelineContainerProps): JSX.Element {
  const intersectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!intersectRef.current || isLoadingPosts || error) {
      return () => {}
    }

    const ref = intersectRef.current
    let observer: IntersectionObserver

    const observerCallback: IntersectionObserverCallback = entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadNextPage().catch(console.error)
          observer.unobserve(ref)
        }
      })
    }

    observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px 0px 200px 0px',
      threshold: 0
    })

    observer.observe(ref)

    return () => observer.unobserve(ref)
  }, [loadNextPage, isLoadingPosts, error])

  let loader = <></>
  if (!isComplete) {
    if (error) {
      loader = (
        <button
          className="block px-6 py-2 w-full border rounded bg-blue-500 font-bold text-white hover:opacity-70"
          type="button"
          onClick={loadNextPage}
        >
          Load More
        </button>
      )
    } else {
      loader = (
        <Spinner
          className="mx-auto w-min"
          foregroundClassName="text-blue-300"
          backgroundClassName="opacity-0"
          widthRem={2.5}
          thicknessRem={0.35}
        />
      )
    }
  }

  let timelineInner: JSX.Element
  if (!posts) {
    timelineInner = <PostContainer className="mb-2 border rounded bg-white lg:mb-8" />
  } else if (!posts.length) {
    timelineInner = <p className="text-2xl text-center">There are no posts to show here.</p>
  } else {
    timelineInner = (
      <>
        {posts.map(post => (
          <PostContainer
            className="mb-2 border rounded bg-white lg:mb-8"
            key={post.id}
            post={post}
            commentsLimit={1}
            maxDepth={1}
          />
        ))}
        <div ref={intersectRef} />
        <div className="mb-2 lg:mb-8">{loader}</div>
      </>
    )
  }

  return <div {...restProps}>{timelineInner}</div>
}
