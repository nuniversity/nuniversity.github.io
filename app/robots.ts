import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/seo/site'

/**
 * robots.txt
 *
 * Generated at build time so the sitemap URL and the disallow rules stay in
 * step with the site's structure. The localised 404 routes are excluded —
 * they are reachable but have no value in an index.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/404/', '/*/404'],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
