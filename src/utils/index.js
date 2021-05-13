// eslint-disable-next-line import/prefer-default-export
export function isValidSignInInputs({ email, password } = {}) {
  const hasEmail = !!email
  const hasPassword = !!password
  const hasValidEmail = hasEmail && !!email.match(/.@./)

  return hasPassword && hasValidEmail
}
