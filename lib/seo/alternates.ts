import { i18n, type Locale } from '@/lib/i18n/config'

/**
 * Builds the `alternates` block for a page.
 *
 * Next.js does **not** inherit `alternates` from a layout, so every page has
 * to declare its own canonical URL and its own `hreflang` links. Without
 * this, a lesson that exists in three locales has no canonical and search
 * engines see three near-duplicate pages.
 *
 * @param lang  The locale of the page being rendered.
 * @param path  The locale-relative path, e.g. `courses/aws-aif-c01`.
 *              Omit for the locale home page.
 */
export function buildAlternates(
  lang: Locale,
  path = ''
): {
  canonical: string
  languages: Record<string, string>
} {
  const suffix = path ? `/${path.replace(/^\/+|\/+$/g, '')}` : ''
  const languages: Record<string, string> = {}
  for (const locale of i18n.locales) {
    languages[locale] = `/${locale}${suffix}`
  }
  languages['x-default'] = `/${i18n.defaultLocale}${suffix}`

  return {
    canonical: `/${lang}${suffix}`,
    languages,
  }
}

/** Normalises a slug segment so it cannot escape its path. */
export function safeSegment(value: string | undefined): string {
  return (value ?? '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    // Collapse `..` so the segment cannot express a parent-directory hop.
    .replace(/\.{2,}/g, '')
    .replace(/^\.+/, '')
}
