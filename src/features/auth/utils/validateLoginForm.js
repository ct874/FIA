export function validateLoginForm({ loginId, password }, t) {
  const errors = {}

  if (!loginId || !loginId.trim()) {
    errors.loginId = t('validation.loginIdRequired')
  }

  if (!password) {
    errors.password = t('validation.passwordRequired')
  }

  return errors
}
