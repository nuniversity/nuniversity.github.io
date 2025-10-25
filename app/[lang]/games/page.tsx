// app/[lang]/games/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllGames } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { GamesClient } from './games-client'

interface GamesPageProps {
  params: { lang: Locale }
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    title: 'Games - Learn While Playing',
    description: 'Interactive learning games for vocabulary, math, coding, and more',
  }
}

export default async function GamesPage({ params }: GamesPageProps) {
  const { lang } = params
  const dict = await getDictionary(lang)
  
  // Get all games at build time
  const allGames = await getAllGames()

  return (
    <GamesClient 
      lang={lang}
      games={allGames}
      dict={dict}
    />
  )
}