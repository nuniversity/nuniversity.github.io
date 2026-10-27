import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { buildAlternates } from './alternates'
import {
  DEFAULT_OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_LOCALES,
  SITE_NAME,
} from './site'

interface PageMetadataInput {
  lang: Locale
  /** Locale-relative path, e.g. `courses/aws-aif-c01`. */
  path: string
  title: string
  description: string
  /** Optional per-page social image. */
  image?: string
  type?: 'website' | 'article'
}

/**
 * Builds the metadata block for a content page.
 *
 * A layout-level `openGraph` is inherited wholesale, which means every page
 * would otherwise advertise the *home page's* title and URL to social
 * crawlers. This helper produces a per-page canonical, hreflang set, Open
 * Graph block and Twitter card from the page's own values.
 */
export function pageMetadata({
  lang,
  path,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  type = 'article',
}: PageMetadataInput): Metadata {
  const alternates = buildAlternates(lang, path)
  return {
    title,
    description,
    alternates,
    openGraph: {
      type,
      locale: OG_LOCALES[lang] ?? 'en_US',
      url: `/${lang}/${path.replace(/^\/+|\/+$/g, '')}${path ? '/' : ''}`,
      title,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}
