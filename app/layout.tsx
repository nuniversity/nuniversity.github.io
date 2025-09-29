import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Providers } from '@/components/providers/Providers'
import { Metadata } from 'next'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nuniversity.github.io',
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
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" /> */}
        {/* <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
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
                "availableLanguage": ["English"]
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}