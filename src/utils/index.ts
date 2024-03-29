import { USER_FULL_NAME_CHARACTER_LIMIT, USER_USERNAME_CHARACTER_LIMIT } from '../constants/config'

export function isValidEmail(email: string | undefined): boolean {
  return !!(email?.match(/.@./g)?.length === 1)
}

export function isValidSignUpInputs({
  username,
  fullName,
  email,
  password
}: {
  username?: string
  fullName?: string
  email?: string
  password?: string
}): boolean {
  const hasUsername = !!username
  const hasFullName = !!fullName
  const hasPassword = !!password
  const hasValidEmail = isValidEmail(email)
  const hasValidUsername = hasUsername && username.length <= USER_USERNAME_CHARACTER_LIMIT
  const hasValidFullName = hasFullName && fullName.length <= USER_FULL_NAME_CHARACTER_LIMIT

  return hasValidUsername && hasValidFullName && hasPassword && hasValidEmail
}

export function isValidSignInInputs({
  email,
  password
}: {
  email?: string
  password?: string
}): boolean {
  const hasPassword = !!password
  const hasValidEmail = isValidEmail(email)

  return hasPassword && hasValidEmail
}

export function buildCooldownEnforcer<T extends Record<string, number>>(
  cooldowns: T
): (action: keyof T) => void {
  const keys = Object.keys(cooldowns) as (keyof T)[]
  const recentActions = keys.reduce((acc, key) => {
    acc[key] = {
      cooldown: cooldowns[key],
      last: 0
    }

    return acc
  }, {} as { [action in keyof T]: { cooldown: number; last: number } })

  return (action: keyof typeof cooldowns): void => {
    const { cooldown, last } = recentActions[action]
    const now = Date.now()
    const timeRemaining = Math.max(Math.ceil((last + cooldown - now) / 1000), 0)
    const units = `second${timeRemaining > 1 ? 's' : ''}`

    if (timeRemaining > 0) {
      const errorMessage = `You are going too fast. Please try again in ${timeRemaining} ${units}.`
      alert(errorMessage)
      throw new Error(errorMessage)
    }

    recentActions[action].last = now
  }
}

export function sortBy<T extends Record<string, unknown>>(
  array: T[],
  property: keyof T,
  direction?: 'desc' | 'asc'
): T[] {
  const newArray = [...array]
  newArray.sort((a, b) => {
    if (a[property] < b[property]) return -1
    if (a[property] > b[property]) return 1

    return 0
  })

  if (direction === 'desc') {
    newArray.reverse()
  }

  return newArray
}

type Timestamp = {
  seconds: number
  nanoseconds: number
}

export function timestampToMillis(timestamp: Timestamp): number {
  return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000)
}

export function sortByTimestamp<T extends Record<string, unknown>, U extends keyof T>(
  array: T[],
  property: T[U] extends Timestamp | undefined ? U : never,
  direction?: 'desc' | 'asc'
): T[] {
  const newArray = [...array]
  newArray.sort((a, b) => {
    const aValue = timestampToMillis((a[property] || { seconds: 0, nanoseconds: 0 }) as Timestamp)
    const bValue = timestampToMillis((b[property] || { seconds: 0, nanoseconds: 0 }) as Timestamp)

    if (aValue < bValue) return -1
    if (aValue > bValue) return 1

    return 0
  })

  if (direction === 'desc') {
    newArray.reverse()
  }

  return newArray
}

export function chunkArray<T>(array: T[], numPerChunk = 10): T[][] {
  const tempArray = [...array]
  const chunked: T[][] = []
  while (tempArray.length) {
    chunked.push(tempArray.splice(0, numPerChunk))
  }

  return chunked
}

export function formatDateTime(date: Date): [string, string, string] {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  const year = date.getFullYear()
  const month = months[date.getMonth()]
  const day = date.getDate()
  const hours24 = date.getHours()
  const hours12 = (hours24 > 12 ? hours24 - 12 : hours24) || 12
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const amPm = hours24 >= 12 ? 'pm' : 'am'
  const dateNow = new Date()
  const yearNow = dateNow.getFullYear()
  const elapsedMillis = dateNow.getTime() - date.getTime()
  const millisPerSecond = 1000
  const millisPerMinute = 60 * millisPerSecond
  const millisPerHour = 60 * millisPerMinute
  const millisPer24Hour = 24 * millisPerHour

  let timeElapsed: string
  if (yearNow !== year) {
    timeElapsed = `${month} ${day}, ${year}`
  } else if (elapsedMillis >= millisPer24Hour) {
    timeElapsed = `${month} ${day}`
  } else if (elapsedMillis >= millisPerHour) {
    timeElapsed = `${Math.floor(elapsedMillis / millisPerHour)}h`
  } else if (elapsedMillis >= millisPerMinute) {
    timeElapsed = `${Math.floor(elapsedMillis / millisPerMinute)}m`
  } else {
    timeElapsed = `${Math.floor(elapsedMillis / millisPerSecond)}s`
  }

  const datePartial = `${month} ${day}, ${year}`
  const dateFull = `${hours12}:${minutes} ${amPm} · ${datePartial}`

  return [timeElapsed, dateFull, datePartial]
}

export function modulo(numerator: number, denominator: number): number {
  return ((numerator % denominator) + denominator) % denominator
}

export function onIntervalAfter(
  startTimeMillis: number,
  intervalMillis: number,
  callback: (...args: unknown[]) => void
): () => void {
  const timeDifference = Date.now() - startTimeMillis
  const startsInFuture = timeDifference < 0

  let timeUntilFirst: number
  if (startsInFuture) {
    timeUntilFirst = -timeDifference
  } else {
    timeUntilFirst = intervalMillis - (timeDifference % intervalMillis)
  }

  let intervalId: NodeJS.Timeout
  const timeoutId = setTimeout(() => {
    intervalId = setInterval(callback, intervalMillis)
    callback()
  }, timeUntilFirst)

  return () => {
    clearTimeout(timeoutId)
    clearInterval(intervalId)
  }
}

export function stringifyError(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  } else if (typeof err === 'string') {
    return err
  }

  return JSON.stringify(err)
}

export function paginateArray<T extends unknown>(
  array: T[],
  callback: (status: { entries: T[]; isComplete: boolean; page: number }) => void,
  entriesPerPage = 10
): () => void {
  const paginated: T[][] = chunkArray(array, entriesPerPage)
  let page = 0
  let isComplete = paginated.length === 0

  const loadNextPage: () => void = () => {
    if (!isComplete) {
      page += 1
      const entries = paginated.slice(0, page).flat(1)
      isComplete = paginated.length === page
      callback({ entries, isComplete, page })
    } else if (page === 0) {
      callback({ entries: [], isComplete, page })
    }
  }

  return loadNextPage
}

export function disableElements(elements: Element[]): void {
  elements.forEach(element => {
    element.setAttribute('disabled', '')
  })
}

export function enableElements(elements: Element[]): void {
  elements.forEach(element => {
    element.removeAttribute('disabled')
  })
}

export function disableForm(form: HTMLFormElement): Element[] {
  const elements: Element[] = []
  Array.from(form.elements).forEach(element => {
    if (element.getAttribute('disabled') === null) {
      elements.push(element)
    }
  })

  disableElements(elements)

  return elements
}

export function deepCloneObject<T extends unknown>(obj: T): T {
  if (!(obj instanceof Object)) {
    return obj
  }

  if (obj instanceof Array) {
    return obj.map((el: unknown) => deepCloneObject(el)) as T
  }

  const newObj = {} as typeof obj
  const keys = Object.keys(obj) as (keyof T)[]
  keys.forEach(key => {
    newObj[key] = deepCloneObject(obj[key])
  })

  return newObj
}

export function resizeImage(image: File, maxPixels = Infinity, quality = 0.92): Promise<Blob> {
  const img = document.createElement('img')
  img.src = URL.createObjectURL(image)
  img.crossOrigin = 'anonymous'

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const { width, height } = img
      const pixels = width * height
      const scale = Math.min(Math.sqrt(maxPixels / pixels), 1)
      const newWidth = Math.floor(scale * width)
      const newHeight = Math.floor(scale * height)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = newWidth
      canvas.height = newHeight

      ctx?.drawImage(img, 0, 0, newWidth, newHeight)
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(blob)
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = error => {
      reject(error)
    }
  })
}
