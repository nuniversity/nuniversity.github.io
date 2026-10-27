export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllLanguageActivities, getPairForSlug } from '@/lib/languages/get-language-content'
import { Metadata } from 'next'
import { RedirectToLanguages } from '@/components/languages/RedirectToLanguages'
import { buildAlternates } from '@/lib/seo/alternates'

interface LanguageRedirectPageProps {
  params: {
    lang: Locale
    slug: string
  }
}

interface MetadataLanguagesTexts {
  languages?: {
    title?: string
    notFound?: string
  }
}

export async function generateStaticParams() {
  const activities = await getAllLanguageActivities()
  const slugs = Array.from(new Set(activities.map(activity => activity.slug)))

  return slugs.map(slug => ({
    slug
  }))
}

export async function generateMetadata({
  params }: {
  params: { lang: Locale; slug: string }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  const metadata = dict.metadata as unknown as MetadataLanguagesTexts | undefined

  return {
    alternates: buildAlternates(params.lang, `games/vocabulary/${params.slug}`),
    title: metadata?.languages?.title || 'Language Practice',
    robots: { index: false, follow: false } }
}

export default async function LanguageRedirectPage({ params }: LanguageRedirectPageProps) {
  const { lang, slug } = params
  const dict = await getDictionary(lang)
  const pair = await getPairForSlug(slug)

  return (
    <RedirectToLanguages
      lang={lang}
      slug={slug}
      pair={pair}
      dict={dict}
    />
  )
}
