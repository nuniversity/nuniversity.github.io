export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getGameFile, getAllGames, type GameFileData } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WordSearchClient } from './word-search-client'
import { buildAlternates } from '@/lib/seo/alternates'

interface GamePageProps {
  params: Promise<{ lang: Locale; slug: string }>
}

export async function generateStaticParams() {
  const allGames = await getAllGames()
  return allGames.filter(g => g.category === 'puzzles').map(g => ({ slug: g.slug }))
}

export async function generateMetadata(props: { params: Promise<{ lang: Locale; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)
  const game = await getGameFile<GameFileData>('puzzles', params.slug, params.lang)
  if (!game) return {
    alternates: buildAlternates(params.lang, `games/puzzles/${params.slug}`),
    title: dict.metadata?.games?.notFound || 'Game Not Found' }
  return {
    alternates: buildAlternates(params.lang, `games/puzzles/${params.slug}`),
    title: game.title, description: game.description }
}

export default async function PuzzlesGamePage(props: GamePageProps) {
  const params = await props.params;
  const { lang, slug } = params
  const dict = await getDictionary(lang)
  const game = await getGameFile<GameFileData>('puzzles', slug, lang)
  if (!game) notFound()
  return <WordSearchClient lang={lang} game={game} dict={dict} />
}
