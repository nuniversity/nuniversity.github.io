import type { MetadataRoute } from 'next'

// Static export requires the manifest route to opt into static generation.
export const dynamic = 'force-static'
export const revalidate = false

/**
 * Web app manifest.
 *
 * Next emits this at `/manifest.webmanifest` and links it from every page that
 * uses the locale layout. Android/Chrome use these icons for the home-screen
 * shortcut and for tab icons in some contexts; the maskable variant keeps the
 * "NU" glyph inside the safe zone when the system crops it to a circle.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nuniversity',
    short_name: 'Nuniversity',
    description:
      'Interactive courses, coding tools, and study games across technology, engineering, and sciences.',
    start_url: '/en/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1d4ed8',
    icons: [
      {
        src: '/icons/icon-192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
