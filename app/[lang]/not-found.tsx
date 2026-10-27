import NotFoundClient from './404/not-found-client'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { i18n, type Locale } from '@/lib/i18n/config'

/**
 * The Next.js not-found boundary for the `[lang]` segment.
 *
 * Every `notFound()` call in the app (18 of them) renders this instead of
 * Next's default unstyled page. It reuses the same component as the
 * navigable `/[lang]/404/` route so both paths look identical.
 */
export default async function NotFound({ params }: { params?: { lang?: string } }) {
  const requested = params?.lang
  const lang = (i18n.locales as readonly string[]).includes(requested ?? '')
    ? (requested as Locale)
    : i18n.defaultLocale
  const dict = await getDictionary(lang)
  const all: Record<string, ReturnType<typeof getDictionary>['notFound']> = {}
  for (const locale of i18n.locales) {
    all[locale] = getDictionary(locale).notFound
  }
  return <NotFoundClient lang={lang} dict={{ notFound: dict.notFound, all }} />
}
