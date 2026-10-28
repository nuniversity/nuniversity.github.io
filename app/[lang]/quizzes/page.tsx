export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllQuizzes } from '@/lib/quizzes/get-quiz-content'
import { Metadata } from 'next'
import { QuizzesClient } from './quizzes-client'
import { buildAlternates } from '@/lib/seo/alternates'

interface QuizzesPageProps {
  params: { lang: Locale }
}

export async function generateMetadata({
  params }: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  return {
    alternates: buildAlternates(params.lang, 'quizzes'),
    title: dict.metadata?.quizzes?.title || 'Quizzes: Tests & Certification Practice',
    description:
      dict.metadata?.quizzes?.description ||
      'Certification quizzes, practice tests and timed exam simulations with scoring, attempt history and printable certificates.' }
}

export default async function QuizzesPage({ params }: QuizzesPageProps) {
  const { lang } = params
  const dict = await getDictionary(lang)

  const quizList = await getAllQuizzes(lang)

  return <QuizzesClient lang={lang} quizzes={quizList} dict={dict} />
}
