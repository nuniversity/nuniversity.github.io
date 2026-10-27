export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllQuizzes, getQuiz } from '@/lib/quizzes/get-quiz-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { QuizDetail } from '@/components/quizzes/QuizDetail'
import { buildAlternates } from '@/lib/seo/alternates'
import { pageMetadata } from '@/lib/seo/metadata'
import JsonLd from '@/components/seo/JsonLd'
import { quizSchema } from '@/lib/seo/json-ld'

interface QuizPageProps {
  params: {
    lang: Locale
    quizSlug: string
  }
}

export async function generateStaticParams() {
  const quizzes = await getAllQuizzes()
  return quizzes.map(quiz => ({ quizSlug: quiz.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; quizSlug: string }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  const quiz = await getQuiz(params.quizSlug, params.lang)
  const path = `quizzes/${params.quizSlug}`

  if (!quiz) {
    return {
      title: dict.metadata?.quizzes?.notFound || 'Quiz not found',
      alternates: buildAlternates(params.lang, path),
      robots: { index: false, follow: false },
    }
  }

  return pageMetadata({
    lang: params.lang,
    path,
    title: quiz.title,
    description: quiz.description,
    type: 'article',
  })
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { lang, quizSlug } = params
  const dict = await getDictionary(lang)
  const quiz = await getQuiz(quizSlug, lang)

  if (!quiz) notFound()

  return (
    <>
      <JsonLd
        data={quizSchema({
          title: quiz.title,
          description: quiz.description,
          url: `/${lang}/quizzes/${quizSlug}/`,
          lang,
          questionCount: quiz.questions?.length,
          durationSeconds: quiz.durationSeconds,
        })}
      />
      <QuizDetail lang={lang} quiz={quiz} dict={dict} />
    </>
  )
}
