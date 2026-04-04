export const LOCALES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl'] as const
export type Locale = typeof LOCALES[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  pl: 'Polski',
  nl: 'Nederlands',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  pl: '🇵🇱',
  nl: '🇳🇱',
}

export function isValidLocale(locale: string): locale is Locale {
  return LOCALES.includes(locale as Locale)
}
