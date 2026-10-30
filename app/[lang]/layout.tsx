// app/[lang]/layout.tsx
import '../globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Providers } from '@/components/providers/Providers'
import { i18n, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/seo/json-ld'
import { buildAlternates } from '@/lib/seo/alternates'
import { SITE_ORIGIN, SITE_NAME } from '@/lib/seo/site'
import { CSP_POLICY } from '@/lib/security/csp.mjs'
import { THEME_INIT_SCRIPT } from '@/lib/theme/theme'

const inter = Inter({ subsets: ['latin'] })


/**
 * Browser chrome colour, matched to the brand gradient's endpoints so the
 * address bar blends with the icon in both themes.
 */
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1d4ed8' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
  colorScheme: 'light dark',
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: string }>
  }
): Promise<Metadata> {
  const { lang } = await props.params;
  const dict = await getDictionary(lang as Locale)
  const site = dict.metadata?.site
  const siteTitle = site?.title || 'Nuniversity - Learn, Code, and Grow'
  const siteDescription = site?.description || 'A comprehensive educational platform offering interactive courses, coding tools, and study games across technology, engineering, and sciences.'
  const siteOgDescription = site?.og_description || 'A comprehensive educational platform offering interactive courses, coding tools, and study games.'

  return {
    title: {
      default: siteTitle,
      template: '%s | Nuniversity'
    },
    description: siteDescription,
    keywords: site?.keywords || ['education', 'online courses', 'programming', 'engineering', 'science', 'interactive learning', 'coding tools'],
    authors: [{ name: 'Nuniversity Team' }],
    creator: 'Nuniversity',
    publisher: 'Nuniversity',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_ORIGIN),
    // Icons are declared explicitly (they live in `public/`, not `app/`):
    // file-convention icons would take priority over this block, which made
    // the old tab icon impossible to refresh for browsers that had cached it.
    // The `?v=` suffix is the cache-buster — bump it when the artwork changes.
    icons: {
      icon: [
        { url: '/icons/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
        { url: '/icons/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
        { url: '/icons/favicon-48x48.png?v=2', sizes: '48x48', type: 'image/png' },
        { url: '/favicon.ico?v=2', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
        { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      ],
      shortcut: ['/favicon.ico?v=2'],
      apple: [{ url: '/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
    },
    alternates: buildAlternates(lang as Locale),
    openGraph: {
      type: 'website',
      locale: lang === 'en' ? 'en_US' : lang === 'pt' ? 'pt_BR' : 'es_ES',
      // No `url` here: a layout-level URL would be inherited by every page and
      // falsely claim the home page as the canonical for all of them. Pages
      // that want a specific `og:url` set it themselves.
      title: siteTitle,
      description: siteOgDescription,
      siteName: 'Nuniversity',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: site?.og_alt || 'Nuniversity - Educational Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteOgDescription,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function RootLayout(
  props: {
    children: React.ReactNode
    params: Promise<{ lang: string }>
  }
) {
  const { lang } = await props.params;

  const {
    children
  } = props;

  const dict = await getDictionary(lang as Locale)

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/*
          Applies the saved theme before the first paint.

          Without this, a dark-mode visitor gets a white flash on every hard
          navigation: the server renders no `dark` class, so the browser paints
          the light theme until React hydrates and adds it. The script is a
          constant string and runs synchronously in <head>.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/*
          Warms the destination HTML when a visitor hovers or focuses an
          internal link. The RSC `.txt` payloads Next would normally prefetch
          are pruned from the artifact (see `scripts/postbuild.mjs`), so links
          fall back to document navigation — this keeps that feel fast. Served
          from `public/`, so it is one cached file rather than inline bytes on
          every page. The site is deployed at the domain root.
        */}
        <script src="/nav-prefetch.js" defer />
        <JsonLd
          data={[
            organizationSchema(
              dict.metadata?.site?.description ||
                'A comprehensive educational platform offering interactive courses, coding tools, and study games across technology, engineering, and sciences.'
            ),
            websiteSchema(lang as Locale),
          ]}
        />
      </head>
      <body className={inter.className}>
        {/*
          Content-Security-Policy.

          GitHub Pages cannot send custom response headers, so the policy is
          delivered as a <meta http-equiv> tag. `meta`-based CSP supports every
          directive used here except `frame-ancestors` and `report-uri`.

          `scripts/verify-csp.mjs` checks the built output against this policy
          and fails the build if any page violates it or omits it.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={CSP_POLICY}
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <a href="#main-content" className="skip-link">
          {dict.navigation.skip_to_content || 'Skip to content'}
        </a>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header lang={lang as Locale} dict={dict} />
            <main
              id="main-content"
              tabIndex={-1}
              // `overflow-x-clip` is the last-resort guard for any page whose
              // content cannot wrap. It does not create a scroll container,
              // so `position: sticky` in the header still works.
              className="flex-grow focus:outline-none overflow-x-clip"
            >
              {children}
            </main>
            <Footer lang={lang as Locale} dict={dict} />
          </div>
        </Providers>
      </body>
    </html>
  )
}