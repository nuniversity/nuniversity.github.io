export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllLanguageActivities, getLanguageActivity } from '@/lib/languages/get-language-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VocabularyGameClient } from '@/components/languages/vocabulary-game-client'
import { FlashcardGameClient } from '@/components/languages/flashcard-game-client'
import { buildAlternates } from '@/lib/seo/alternates'

interface LanguageActivityPageProps {
  params: Promise<{
    lang: Locale
    pair: string
    activitySlug: string
  }>
}

export async function generateStaticParams() {
  const activities = await getAllLanguageActivities()

  return activities.map(activity => ({
    pair: `${activity.languagePair.source}-${activity.languagePair.target}`,
    activitySlug: activity.slug
  }))
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale; pair: string; activitySlug: string }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)
  const game = await getLanguageActivity(params.activitySlug, params.lang)

  if (!game) {
    return {
    alternates: buildAlternates(params.lang, `languages/${params.pair}/${params.activitySlug}`),
    title: dict.metadata?.languages?.notFound || 'Language activity not found' }
  }

  return {
    alternates: buildAlternates(params.lang, `languages/${params.pair}/${params.activitySlug}`),
    title: game.title,
    description: game.description }
}

export default async function LanguageActivityPage(props: LanguageActivityPageProps) {
  const params = await props.params;
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
