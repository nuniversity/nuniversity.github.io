export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllLanguageActivities } from '@/lib/languages/get-language-content'
import { getAllLanguageCourses } from '@/lib/language-courses/get-language-course'
import { Metadata } from 'next'
import { LanguagesHubClient } from './languages-hub-client'
import { buildAlternates } from '@/lib/seo/alternates'

interface LanguagesPageProps {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)
  return {
    alternates: buildAlternates(params.lang, 'languages'),
    title: dict.metadata?.languages?.title || 'Language Practice: Flashcards & Translation Quizzes',
    description:
      dict.metadata?.languages?.description ||
      'Interactive flashcards and translation quizzes for English, Portuguese, Spanish and French with progress tracking.' }
}

export default async function LanguagesPage(props: LanguagesPageProps) {
  const params = await props.params;
  const { lang } = params
  const dict = await getDictionary(lang)

  const activities = await getAllLanguageActivities(lang)
  const languageCourses = getAllLanguageCourses(lang)

  return <LanguagesHubClient lang={lang} activities={activities} dict={dict} courses={languageCourses} />
}
