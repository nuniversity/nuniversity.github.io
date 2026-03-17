// app/[lang]/games/quiz/[slug]/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getQuizGame, getAllGames } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { QuizGameClient } from './quiz-game-client'
import { notFound } from 'next/navigation'

interface QuizGamePageProps {
  params: {
    lang: Locale
    slug: string
  }
}

export async function generateStaticParams() {
  const allGames = await getAllGames()
  const quizGames = allGames.filter(game => game.category === 'quiz')

  return quizGames.map(game => ({
    slug: game.slug
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; slug: string }
}): Promise<Metadata> {
  const game = await getQuizGame(params.slug)

  if (!game) {
    return { title: 'Game Not Found' }
  }

  return {
    title: `${game.title} — Quiz`,
    description: game.description,
  }
}

export default async function QuizGamePage({ params }: QuizGamePageProps) {
  const { lang, slug } = params
  const dict = await getDictionary(lang)

  const game = await getQuizGame(slug)

  if (!game) {
    notFound()
  }

  return (
    <QuizGameClient
      lang={lang}
      game={game}
      dict={dict}
    />
  )
}
