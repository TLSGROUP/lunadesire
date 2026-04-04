import 'server-only'
import type { Locale } from './config'

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  es: () => import('./dictionaries/es.json').then((m) => m.default),
  fr: () => import('./dictionaries/fr.json').then((m) => m.default),
  de: () => import('./dictionaries/de.json').then((m) => m.default),
  it: () => import('./dictionaries/it.json').then((m) => m.default),
  pt: () => import('./dictionaries/pt.json').then((m) => m.default),
  pl: () => import('./dictionaries/pl.json').then((m) => m.default),
  nl: () => import('./dictionaries/nl.json').then((m) => m.default),
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
