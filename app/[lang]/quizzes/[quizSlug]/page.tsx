export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllQuizzes, getQuiz } from '@/lib/quizzes/get-quiz-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { QuizDetail } from '@/components/quizzes/QuizDetail'

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

  if (!quiz) {
    return {
      title: dict.metadata?.quizzes?.notFound || 'Quiz not found',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: quiz.title,
    description: quiz.description,
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { lang, quizSlug } = params
  const dict = await getDictionary(lang)
  const quiz = await getQuiz(quizSlug, lang)

  if (!quiz) notFound()

  return <QuizDetail lang={lang} quiz={quiz} dict={dict} />
}
