export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllQuizzes } from '@/lib/quizzes/get-quiz-content'
import { Metadata } from 'next'
import { QuizzesClient } from './quizzes-client'
import { buildAlternates } from '@/lib/seo/alternates'

interface QuizzesPageProps {
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
    alternates: buildAlternates(params.lang, 'quizzes'),
    title: dict.metadata?.quizzes?.title || 'Quizzes: Tests & Certification Practice',
    description:
      dict.metadata?.quizzes?.description ||
      'Certification quizzes, practice tests and timed exam simulations with scoring, attempt history and printable certificates.' }
}

export default async function QuizzesPage(props: QuizzesPageProps) {
  const params = await props.params;
  const { lang } = params
  const dict = await getDictionary(lang)

  const quizList = await getAllQuizzes(lang)

  return <QuizzesClient lang={lang} quizzes={quizList} dict={dict} />
}
