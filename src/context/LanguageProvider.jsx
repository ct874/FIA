import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './languageContext'
import { translations, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../locales'

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return translations[stored] ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function resolvePath(dictionary, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), dictionary)
}

function interpolate(template, vars) {
  if (typeof template !== 'string' || !vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (vars[key] !== undefined ? vars[key] : match))
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next) => {
    if (!translations[next]) return
    setLanguageState(next)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    } catch {
      // localStorage unavailable (private browsing, quota) — the choice
      // just won't persist across reloads, switching itself still works.
    }
  }, [])

  // Pure lookup + string interpolation only — no re-render beyond the
  // language value itself changing, and no network/API involvement.
  const t = useCallback(
    (key, vars) => {
      const value = resolvePath(translations[language], key)
      if (value !== undefined) return interpolate(value, vars)

      const fallback = resolvePath(translations[DEFAULT_LANGUAGE], key)
      return fallback !== undefined ? interpolate(fallback, vars) : key
    },
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
