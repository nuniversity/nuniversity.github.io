'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, ArrowRight, Layers, Trophy } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type LanguageActivity } from '@/lib/languages/get-language-content'
import { getMatchingBest, getFlashcardProgress, LEARNED_THRESHOLD } from '@/lib/languages/storage'
import { tpl } from '@/lib/languages/format'
import { PairFlags } from './pair-flags'

interface LanguageActivityCardProps {
  lang: Locale
  activity: LanguageActivity
  dict: any
}

function difficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
    case 'advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

export function LanguageActivityCard({ lang, activity, dict }: LanguageActivityCardProps) {
  const [bestPercent, setBestPercent] = useState<number | null>(null)
  const [learnedCount, setLearnedCount] = useState<number | null>(null)

  const pair = `${activity.languagePair.source}-${activity.languagePair.target}`

  useEffect(() => {
    if (activity.gameType === 'flashcards') {
      const { progress } = getFlashcardProgress(pair, activity.slug)
      const learned = Object.values(progress).filter(card => card.streak >= LEARNED_THRESHOLD).length
      setLearnedCount(learned)
    } else {
      const best = getMatchingBest(pair, activity.slug)
      setBestPercent(best ? best.accuracy : null)
    }
  }, [pair, activity.slug, activity.gameType])

  const languages = dict?.languages ?? {}
  const typeLabel =
    activity.gameType === 'flashcards'
      ? languages.types?.flashcards || 'Flashcards'
      : languages.types?.matching || 'Translation Quiz'
  const TypeIcon = activity.gameType === 'flashcards' ? Layers : ArrowLeftRight

  const wordsLabel = tpl(languages.card?.words || '{n} words', { n: activity.wordCount })

  let statLabel = languages.card?.not_attempted || 'Not attempted'
  let statIcon = null
  if (activity.gameType === 'flashcards' && learnedCount !== null && learnedCount > 0) {
    statLabel = tpl(languages.card?.completed_count || '{n} completed', { n: learnedCount })
    statIcon = <Trophy className="w-3.5 h-3.5" />
  } else if (activity.gameType !== 'flashcards' && bestPercent !== null) {
    statLabel = tpl(languages.card?.best_score || 'Best {score}%', { score: bestPercent })
    statIcon = <Trophy className="w-3.5 h-3.5" />
  }

  return (
    <Link
      href={`/${lang}/languages/${pair}/${activity.slug}/`}
      className="group block min-w-0"
    >
      <div className="h-full min-w-0 flex flex-col bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <TypeIcon className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
            {typeLabel}
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2 min-w-0">
          {activity.title}
        </h3>
        <p className="text-muted-foreground line-clamp-3 mb-4 text-sm min-w-0">
          {activity.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-3 text-xs min-w-0">
          <span className={`px-2 py-0.5 rounded-full font-medium ${difficultyColor(activity.difficulty)}`}>
            {dict?.games?.difficulty?.[activity.difficulty] || activity.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {wordsLabel}
          </span>
          <PairFlags
            source={activity.languagePair.source}
            target={activity.languagePair.target}
            size={14}
            className="px-1"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4 min-w-0">
          {activity.localesAvailable.map(locale => (
            <span key={locale} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs uppercase">
              {locale}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            {statIcon}
            <span className="truncate">{statLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary shrink-0">
            {languages.open || 'Open'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}
