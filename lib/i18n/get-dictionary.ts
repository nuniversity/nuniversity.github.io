import en from '@/dictionaries/en.json'
import pt from '@/dictionaries/pt.json'
import es from '@/dictionaries/es.json'
import type { Locale } from './config'

const dictionaries = { en, pt, es }

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale] || dictionaries.en
}

export type Dictionary = ReturnType<typeof getDictionary>

// import 'server-only'
// import type { Locale } from './config'

// const dictionaries = {
//   en: () => import('@/dictionaries/en.json').then((module) => module.default),
//   pt: () => import('@/dictionaries/pt.json').then((module) => module.default),
//   es: () => import('@/dictionaries/es.json').then((module) => module.default),
// }

// export const getDictionary = async (locale: Locale) => {
//   return dictionaries[locale]?.() ?? dictionaries.en()
// }

// export type Dictionary = Awaited<ReturnType<typeof getDictionary>>