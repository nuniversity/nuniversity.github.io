export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllLanguageActivities, getLanguageActivity } from '@/lib/languages/get-language-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VocabularyGameClient } from '@/components/languages/vocabulary-game-client'
import { FlashcardGameClient } from '@/components/languages/flashcard-game-client'

interface LanguageActivityPageProps {
  params: {
    lang: Locale
    pair: string
    activitySlug: string
  }
}

export async function generateStaticParams() {
  const activities = await getAllLanguageActivities()

  return activities.map(activity => ({
    pair: `${activity.languagePair.source}-${activity.languagePair.target}`,
    activitySlug: activity.slug
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; pair: string; activitySlug: string }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  const game = await getLanguageActivity(params.activitySlug, params.lang)

  if (!game) {
    return {
      title: dict.metadata?.languages?.notFound || 'Language activity not found',
    }
  }

  return {
    title: game.title,
    description: game.description,
  }
}

export default async function LanguageActivityPage({ params }: LanguageActivityPageProps) {
  const { lang, pair, activitySlug } = params
  const dict = await getDictionary(lang)

  const game = await getLanguageActivity(activitySlug, lang)

  if (!game) {
    notFound()
  }

  const activityPair = `${game.language_pair.source}-${game.language_pair.target}`
  if (activityPair !== pair) {
    notFound()
  }

  if (game.gameType === 'flashcards') {
    return (
      <FlashcardGameClient
        lang={lang}
        game={game}
        dict={dict}
        pair={pair}
      />
    )
  }

  return (
    <VocabularyGameClient
      lang={lang}
      game={game}
      dict={dict}
      pair={pair}
    />
  )
}
