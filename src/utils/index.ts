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
