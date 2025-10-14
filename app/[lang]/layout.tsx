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

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    title: {
      default: 'NUniversity - Learn, Code, and Grow',
      template: '%s | NUniversity'
    },
    description: 'A comprehensive educational platform offering interactive courses, coding tools, and study games across technology, engineering, and sciences.',
    keywords: ['education', 'online courses', 'programming', 'engineering', 'science', 'interactive learning', 'coding tools'],
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
        'en': '/en',
        'pt': '/pt',
        'es': '/es',
      },
    },
    openGraph: {
      type: 'website',
      locale: params.lang === 'en' ? 'en_US' : params.lang === 'pt' ? 'pt_BR' : 'es_ES',
      url: `https://nuniversity.github.io/${params.lang}`,
      title: 'NUniversity - Learn, Code, and Grow',
      description: 'A comprehensive educational platform offering interactive courses, coding tools, and study games.',
      siteName: 'NUniversity',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'NUniversity - Educational Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'NUniversity - Learn, Code, and Grow',
      description: 'A comprehensive educational platform offering interactive courses, coding tools, and study games.',
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="alternate" hrefLang="en" href="https://nuniversity.github.io/en" />
        <link rel="alternate" hrefLang="pt" href="https://nuniversity.github.io/pt" />
        <link rel="alternate" hrefLang="es" href="https://nuniversity.github.io/es" />
        <link rel="alternate" hrefLang="x-default" href="https://nuniversity.github.io/en" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "NUniversity",
              "url": "https://nuniversity.github.io",
              "description": "A comprehensive educational platform offering interactive courses, coding tools, and study games across technology, engineering, and sciences.",
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": ["English", "Português", "Español"]
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header lang={params.lang} dict={dict} />
            <main className="flex-grow">
              {children}
            </main>
            <Footer lang={params.lang} dict={dict} />
          </div>
        </Providers>
      </body>
    </html>
  )
}