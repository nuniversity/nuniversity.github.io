// app/[lang]/layout.tsx
import '../globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Providers } from '@/components/providers/Providers'
import { i18n, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  themeColor: '#3b82f6',
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  const site = dict.metadata?.site
  const siteTitle = site?.title || 'NUniversity - Learn, Code, and Grow'
  const siteDescription = site?.description || 'A comprehensive educational platform offering interactive courses, coding tools, and study games across technology, engineering, and sciences.'
  const siteOgDescription = site?.og_description || 'A comprehensive educational platform offering interactive courses, coding tools, and study games.'

  return {
    title: {
      default: siteTitle,
      template: '%s | NUniversity'
    },
    description: siteDescription,
    keywords: site?.keywords || ['education', 'online courses', 'programming', 'engineering', 'science', 'interactive learning', 'coding tools'],
    authors: [{ name: 'NUniversity Team' }],
    creator: 'NUniversity',
    publisher: 'NUniversity',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://nuniversity.github.io'),
    alternates: {
      canonical: `/${params.lang}`,
      languages: {
        'en': '/en/',
        'pt': '/pt/',
        'es': '/es/',
        'x-default': '/en/',
      },
    },
    openGraph: {
      type: 'website',
      locale: params.lang === 'en' ? 'en_US' : params.lang === 'pt' ? 'pt_BR' : 'es_ES',
      url: `https://nuniversity.github.io/${params.lang}`,
      title: siteTitle,
      description: siteOgDescription,
      siteName: 'NUniversity',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: site?.og_alt || 'NUniversity - Educational Platform',
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

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang)

  return (
    <html lang={params.lang} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "NUniversity",
              "url": "https://nuniversity.github.io",
              "description": dict.metadata?.site?.description || "A comprehensive educational platform offering interactive courses, coding tools, and study games across technology, engineering, and sciences.",
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": dict.metadata?.site?.customer_service || "customer service",
                "availableLanguage": dict.metadata?.site?.available_languages || ["English", "Português", "Español"]
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">
          {dict.navigation.skip_to_content || 'Skip to content'}
        </a>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header lang={params.lang} dict={dict} />
            <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
              {children}
            </main>
            <Footer lang={params.lang} dict={dict} />
          </div>
        </Providers>
      </body>
    </html>
  )
}