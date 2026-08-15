import { translations, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../locales'

// Called from plain catch blocks (not always inside a component render), so
// it can't use the useLanguage() hook — it reads the same persisted choice
// LanguageProvider does instead.
function getActiveCommonDictionary() {
  let language = DEFAULT_LANGUAGE
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (translations[stored]) language = stored
  } catch {
    // localStorage unavailable — fall back to the default language.
  }
  return translations[language].common
}

export function getApiErrorMessage(error, fallback) {
  const common = getActiveCommonDictionary()
  const resolvedFallback = fallback ?? common.genericError

  if (!error?.response) {
    return common.networkError
  }

  const { status, data } = error.response
  if (status === 401) {
    return data?.message || common.sessionExpired
  }
  if (status === 409) {
    return data?.message || common.alreadySubmitted
  }
  return data?.message || resolvedFallback
}
