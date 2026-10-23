export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllLanguageActivities } from '@/lib/languages/get-language-content'
import { Metadata } from 'next'
import { LanguagesHubClient } from './languages-hub-client'

interface LanguagesPageProps {
  params: { lang: Locale }
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  return {
    title: dict.metadata?.languages?.title || 'Language Practice — Flashcards & Translation Quizzes',
    description:
      dict.metadata?.languages?.description ||
      'Interactive flashcards and translation quizzes for English, Portuguese, Spanish and French with progress tracking.',
  }
}

export default async function LanguagesPage({ params }: LanguagesPageProps) {
  const { lang } = params
  const dict = await getDictionary(lang)

  const activities = await getAllLanguageActivities(lang)

  return <LanguagesHubClient lang={lang} activities={activities} dict={dict} />
}
