import type firebase from 'firebase'
import { useEffect, useState } from 'react'
import { formatDateTime, onIntervalAfter } from '../utils'

export default function useTimeAgo(
  timestamp: firebase.firestore.Timestamp | null
): [string, string, string] {
  const [timeElapsed, setTimeElapsed] = useState('')
  const [dateFull, setDateFull] = useState('')
  const [dateISO, setDateISO] = useState('')

  useEffect(() => {
    if (timestamp) {
      const millis = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000

      const updateTimes = () => {
        const date = new Date(millis)
        const formattedDateTime = formatDateTime(date)
        setTimeElapsed(formattedDateTime[0])
        setDateFull(formattedDateTime[1])
        setDateISO(date.toISOString())
      }

      updateTimes()

      return onIntervalAfter(millis, 60 * 1000, updateTimes)
    }

    return () => {}
  }, [timestamp])

  return [timeElapsed, dateFull, dateISO]
}
