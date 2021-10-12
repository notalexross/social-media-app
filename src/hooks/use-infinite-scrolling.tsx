import { useEffect, useRef } from 'react'
import { Spinner } from '../components'

export default function useInfiniteScrolling<T extends unknown>(
  paginatedArray: T[] | null,
  loadNextPage: () => Promise<void>,
  isComplete: boolean,
  isLoading = false,
  isError = false
): [React.RefObject<HTMLDivElement>, JSX.Element] {
  const intersectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!intersectRef.current || !paginatedArray || isLoading || isError) {
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
  }, [loadNextPage, paginatedArray, isLoading, isError])

  let loader = <></>
  if (!isComplete) {
    if (isError) {
      loader = (
        <button
          className="block px-6 py-2 w-full rounded bg-blue-500 font-bold text-white hover:opacity-70"
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

  return [intersectRef, loader]
}
