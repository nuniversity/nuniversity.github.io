export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllQuizzes } from '@/lib/quizzes/get-quiz-content'
import { Metadata } from 'next'
import { CertificatesClient } from '@/components/quizzes/CertificatesClient'
import { buildAlternates } from '@/lib/seo/alternates'

interface CertificatesPageProps {
  params: { lang: Locale }
}

export async function generateMetadata({
  params }: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  return {
    alternates: buildAlternates(params.lang, 'quizzes/certificates'),
    title: dict.quizzes?.certificates?.title || 'My certificates',
    description:
      dict.quizzes?.certificates?.description ||
      'Certifications earned by passing mock exams' }
}

export default async function CertificatesPage({ params }: CertificatesPageProps) {
  const { lang } = params
  const dict = await getDictionary(lang)
  const quizzes = await getAllQuizzes(lang)

  return (
    <CertificatesClient
      lang={lang}
      dict={dict}
      quizzes={quizzes.map(quiz => ({
        slug: quiz.slug,
        title: quiz.title,
        passingScore: quiz.passingScore }))}
    />
  )
}
