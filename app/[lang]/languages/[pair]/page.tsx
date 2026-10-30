export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllLanguageActivities, getAllPairs } from '@/lib/languages/get-language-content'
import { Metadata } from 'next'
import Link from '@/components/navigation/AppLink'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { LanguageActivityCard } from '@/components/languages/language-activity-card'
import { pairChipLabel, tpl } from '@/lib/languages/format'
import { PairFlags } from '@/components/languages/pair-flags'
import { buildAlternates } from '@/lib/seo/alternates'

interface LanguagePairPageProps {
  params: Promise<{
    lang: Locale
    pair: string
  }>
}

export async function generateStaticParams() {
  const pairs = await getAllPairs()

  return pairs.map(pair => ({
    pair
  }))
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale; pair: string }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)
  const [source, target] = params.pair.split('-')
  const base = dict.metadata?.languages?.title || 'Language Practice: Flashcards & Translation Quizzes'
  const chip = source && target ? `${source.toUpperCase()} → ${target.toUpperCase()}` : params.pair

  return {
    alternates: buildAlternates(params.lang, `languages/${params.pair}`),
    title: `${chip}: ${base}`,
    description:
      dict.metadata?.languages?.description ||
      'Interactive flashcards and translation quizzes with progress tracking.' }
}

export default async function LanguagePairPage(props: LanguagePairPageProps) {
  const params = await props.params;
  const { lang, pair } = params
  const dict = await getDictionary(lang)

  const pairs = await getAllPairs()
  if (!pairs.includes(pair)) {
    notFound()
  }

  const activities = (await getAllLanguageActivities(lang))
    .filter(activity => `${activity.languagePair.source}-${activity.languagePair.target}` === pair)

  const [source, target] = pair.split('-')
  const languages = dict.languages as any

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/${lang}/languages/`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {languages?.back_to_languages || 'Back to Languages'}
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <PairFlags source={source} target={target} size={20} />
            <span className="text-sm text-muted-foreground">
              {tpl(languages?.card?.activities_count || '{n} activities', { n: activities.length })}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {languages?.title || 'Language Practice'}
          </h1>
          <p className="text-muted-foreground">
            {languages?.subtitle || 'Learn languages through flashcards and translation quizzes'}
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              {languages?.no_results || 'No activities match your search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activities.map(activity => (
              <LanguageActivityCard
                key={activity.slug}
                lang={lang}
                activity={activity}
                dict={dict}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
