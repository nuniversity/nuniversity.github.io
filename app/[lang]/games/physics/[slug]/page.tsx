export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getGameFile, getAllGames, type GameFileData } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PeriodicTableClient } from './periodic-table-client'

interface GamePageProps {
  params: { lang: Locale; slug: string }
}

export async function generateStaticParams() {
  const allGames = await getAllGames()
  return allGames.filter(g => g.category === 'physics').map(g => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: { lang: Locale; slug: string } }): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  const game = await getGameFile<GameFileData>('physics', params.slug, params.lang)
  if (!game) return { title: dict.metadata?.games?.notFound || 'Game Not Found' }
  return { title: game.title, description: game.description }
}

export default async function PhysicsGamePage({ params }: GamePageProps) {
  const { lang, slug } = params
  const dict = await getDictionary(lang)
  const game = await getGameFile<GameFileData>('physics', slug, lang)
  if (!game) notFound()
  return <PeriodicTableClient lang={lang} game={game} dict={dict} />
}
