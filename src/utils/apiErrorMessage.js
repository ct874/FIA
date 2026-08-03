export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return 'Network error. Please check your connection and try again.'
  }

  const { status, data } = error.response
  if (status === 401) {
    return data?.message || 'Session expired. Please log in again.'
  }
  if (status === 409) {
    return data?.message || 'This has already been submitted.'
  }
  return data?.message || fallback
}
