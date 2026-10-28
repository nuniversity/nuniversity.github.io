// app/[lang]/games/conversation/[slug]/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getConversationGame, getAllGames } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { ThirtySixQuestionsClient } from './thirty-six-questions-client'
import { notFound } from 'next/navigation'
import { buildAlternates } from '@/lib/seo/alternates'

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
  params }: {
  params: { lang: Locale; slug: string }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  const game = await getConversationGame(params.slug, params.lang)

  if (!game) {
    return {
    alternates: buildAlternates(params.lang, `games/conversation/${params.slug}`),
    title: dict.metadata?.games?.notFound || 'Game Not Found' }
  }

  return {
    alternates: buildAlternates(params.lang, `games/conversation/${params.slug}`),
    title: `${game.title}: ${dict.games?.suffixes?.conversation || 'Conversation'}`,
    description: game.description }
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
