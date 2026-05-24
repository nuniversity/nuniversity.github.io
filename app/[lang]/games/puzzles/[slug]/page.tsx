export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getGameFile, getAllGames } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WordSearchClient } from './word-search-client'

interface GamePageProps {
  params: { lang: Locale; slug: string }
}

export async function generateStaticParams() {
  const allGames = await getAllGames()
  return allGames.filter(g => g.category === 'puzzles').map(g => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: { lang: Locale; slug: string } }): Promise<Metadata> {
  const game = await getGameFile<any>('puzzles', params.slug)
  if (!game) return { title: 'Game Not Found' }
  return { title: game.title, description: game.description }
}

export default async function PuzzlesGamePage({ params }: GamePageProps) {
  const { lang, slug } = params
  const dict = await getDictionary(lang)
  const game = await getGameFile<any>('puzzles', slug)
  if (!game) notFound()
  return <WordSearchClient lang={lang} game={game} dict={dict} />
}
