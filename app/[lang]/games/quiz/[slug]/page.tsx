export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllQuizzes } from '@/lib/quizzes/get-quiz-content'
import { Metadata } from 'next'
import { RedirectToQuizzes } from '@/components/quizzes/RedirectToQuizzes'
import { buildAlternates } from '@/lib/seo/alternates'

interface QuizRedirectPageProps {
  params: Promise<{
    lang: Locale
    slug: string
  }>
}

interface MetadataQuizzesTexts {
  quizzes?: {
    title?: string
  }
}

export async function generateStaticParams() {
  const quizzes = await getAllQuizzes()
  const slugs = Array.from(new Set(quizzes.map(quiz => quiz.slug)))

  return slugs.map(slug => ({
    slug
  }))
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale; slug: string }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)
  const metadata = dict.metadata as unknown as MetadataQuizzesTexts | undefined

  return {
    alternates: buildAlternates(params.lang, `games/quiz/${params.slug}`),
    title: metadata?.quizzes?.title || 'Quizzes',
    robots: { index: false, follow: false } }
}

export default async function QuizRedirectPage(props: QuizRedirectPageProps) {
  const params = await props.params;
  const { lang, slug } = params
  const dict = await getDictionary(lang)

  return (
    <RedirectToQuizzes
      lang={lang}
      slug={slug}
      dict={dict}
    />
  )
}
