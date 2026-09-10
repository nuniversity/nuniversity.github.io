// app/[lang]/games/conversation/[slug]/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getConversationGame, getAllGames } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { ThirtySixQuestionsClient } from './thirty-six-questions-client'
import { notFound } from 'next/navigation'

interface ConversationGamePageProps {
  params: {
    lang: Locale
    slug: string
  }
}

export async function generateStaticParams() {
  const allGames = await getAllGames()
  const conversationGames = allGames.filter(game => game.category === 'conversation')

  return conversationGames.map(game => ({
    slug: game.slug
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; slug: string }
}): Promise<Metadata> {
  const game = await getConversationGame(params.slug)

  if (!game) {
    return { title: 'Game Not Found' }
  }

  return {
    title: `${game.title} — Conversation`,
    description: game.description,
  }
}

export default async function ConversationGamePage({ params }: ConversationGamePageProps) {
  const { lang, slug } = params
  const dict = await getDictionary(lang)

  const game = await getConversationGame(slug, lang)

  if (!game) {
    notFound()
  }

  return (
    <ThirtySixQuestionsClient
      lang={lang}
      game={game}
      dict={dict}
    />
  )
}
