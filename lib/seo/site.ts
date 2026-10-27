/**
 * Site-wide SEO constants.
 *
 * Centralised so the canonical origin, the organisation identity and the
 * default social image are defined once and reused by every page's metadata
 * and structured data.
 */

export const SITE_ORIGIN = 'https://nuniversity.github.io'
export const SITE_NAME = 'NUniversity'
export const SITE_TAGLINE = 'Learn, Code, and Grow'
export const DEFAULT_OG_IMAGE = '/og-image.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

/** Social profiles, used in the organisation's `sameAs`. */
export const SOCIAL_PROFILES = [
  'https://github.com/nuniversity',
  'https://www.youtube.com/@nuniversity',
  'https://www.linkedin.com/company/nuniversity/',
  'https://www.instagram.com/nuniversityedu/',
]

/** Open Graph locale codes. */
export const OG_LOCALES: Record<string, string> = {
  en: 'en_US',
  pt: 'pt_BR',
  es: 'es_ES',
}
