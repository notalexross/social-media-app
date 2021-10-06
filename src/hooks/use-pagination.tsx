import { useEffect, useRef, useState } from 'react'
import { paginateArray } from '../utils'

type PaginationStatus<T extends unknown> = {
  entries: null | T[]
  isComplete: boolean
  page: number
}

export default function usePagination<T extends unknown>(
  array: T[] | undefined,
  entriesPerPage = 10
): [T[] | null, () => Promise<void>, boolean] {
  const isInitiated = useRef(false)
  const [loadNextPage, setLoadNextPage] = useState(() => () => Promise.resolve())
  const [status, setStatus] = useState<PaginationStatus<T>>({
    entries: null,
    isComplete: true,
    page: 0
  })
  const { entries, isComplete } = status

  useEffect(() => {
    if (!isInitiated.current && array && entriesPerPage > 0) {
      const loadNextPageFunction = paginateArray(array, setStatus, entriesPerPage)
      setLoadNextPage(() => () => Promise.resolve(loadNextPageFunction()))
      loadNextPageFunction()
      isInitiated.current = true
    }
  }, [array, entriesPerPage])

  return [entries, loadNextPage, isComplete]
}
