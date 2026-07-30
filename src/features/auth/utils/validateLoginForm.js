export function validateLoginForm({ loginId, password }) {
  const errors = {}

  if (!loginId || !loginId.trim()) {
    errors.loginId = 'Login ID is required'
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return errors
}
