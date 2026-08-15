import { en } from './en'
import { hi } from './hi'

// Add another locale later by dropping in a new file here and adding one
// entry — LanguageProvider/useLanguage need no changes.
export const translations = { en, hi }

export const SUPPORTED_LANGUAGES = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'hi', labelKey: 'language.hindi' },
]

export const DEFAULT_LANGUAGE = 'en'

export const LANGUAGE_STORAGE_KEY = 'fia_language'
