// app/[lang]/games/vocabulary/[slug]/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getVocabularyGame, getAllGames } from '@/lib/games/get-game-content'
import { Metadata } from 'next'
import { VocabularyGameClient } from './vocabulary-game-client'
import { notFound } from 'next/navigation'

interface VocabularyGamePageProps {
  params: { 
    lang: Locale
    slug: string
  }
}

export async function generateStaticParams() {
  const allGames = await getAllGames()
  const vocabularyGames = allGames.filter(game => game.category === 'vocabulary')
  
  return vocabularyGames.map(game => ({
    slug: game.slug
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; slug: string }
}): Promise<Metadata> {
  const game = await getVocabularyGame(params.slug)
  
  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }
  
  return {
    title: game.title,
    description: game.description,
  }
}

export default async function VocabularyGamePage({ params }: VocabularyGamePageProps) {
  const { lang, slug } = params
  const dict = await getDictionary(lang)
  
  const game = await getVocabularyGame(slug)
  
  if (!game) {
    notFound()
  }

  return (
    <VocabularyGameClient 
      lang={lang}
      game={game}
      dict={dict}
    />
  )
}