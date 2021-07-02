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
