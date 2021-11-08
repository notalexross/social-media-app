import type firebase from 'firebase'
import { useEffect, useRef, useState } from 'react'
import { formatDateTime, onIntervalAfter } from '../utils'

const updateTimes = (timestamp: firebase.firestore.Timestamp | null): [string, string, string] => {
  if (timestamp) {
    const millis = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    const date = new Date(millis)
    const [timeElapsed, dateFull] = formatDateTime(date)
    const dateISO = date.toISOString()

    return [timeElapsed, dateFull, dateISO]
  }

  return ['', '', '']
}

export default function useTimeAgo(
  timestamp: firebase.firestore.Timestamp | null,
  intervalMillis = 60 * 1000
): [string, string, string] {
  const [timeAgo, setTimeAgo] = useState<[string, string, string]>(updateTimes(timestamp))
  const prevTimestamp = useRef(timestamp)

  useEffect(() => {
    if (timestamp) {
      const startTimeMillis = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
      const isUnchanged =
        prevTimestamp.current?.seconds !== timestamp.seconds &&
        prevTimestamp.current?.nanoseconds !== timestamp.nanoseconds

      if (isUnchanged) {
        setTimeAgo(updateTimes(timestamp))
        prevTimestamp.current = timestamp
      }

      return onIntervalAfter(startTimeMillis, intervalMillis, () => {
        setTimeAgo(updateTimes(timestamp))
      })
    }

    return () => {}
  }, [intervalMillis, timestamp])

  return timeAgo
}
