export function isValidSignUpInputs({ username, fullName, email, password } = {}) {
  const hasUsername = !!username
  const hasFullName = !!fullName
  const hasEmail = !!email
  const hasPassword = !!password
  const hasValidEmail = hasEmail && !!email.match(/.@./)

  return hasUsername && hasFullName && hasPassword && hasValidEmail
}

export function isValidSignInInputs({ email, password } = {}) {
  const hasEmail = !!email
  const hasPassword = !!password
  const hasValidEmail = hasEmail && !!email.match(/.@./)

  return hasPassword && hasValidEmail
}
