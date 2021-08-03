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
  const hasValidEmail = !!(email?.match(/.@./g)?.length === 1)

  return hasUsername && hasFullName && hasPassword && hasValidEmail
}

export function isValidSignInInputs({
  email,
  password
}: {
  email?: string
  password?: string
}): boolean {
  const hasPassword = !!password
  const hasValidEmail = !!(email?.match(/.@./g)?.length === 1)

  return hasPassword && hasValidEmail
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

export function chunkArray<T>(array: T[], numPerChunk = 10): T[][] {
  const tempArray = [...array]
  const chunked: T[][] = []
  while (tempArray.length) {
    chunked.push(tempArray.splice(0, numPerChunk))
  }

  return chunked
}

export function formatDateTime(date: Date): [string, string] {
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

  const dateFull = `${hours12}:${minutes} ${amPm} · ${month} ${day}, ${year}`

  return [timeElapsed, dateFull]
}

export function modulo(numerator: number, denominator: number): number {
  return ((numerator % denominator) + denominator) % denominator
}
