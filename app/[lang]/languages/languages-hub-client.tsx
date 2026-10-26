'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, GraduationCap, Languages as LanguagesIcon, Search } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type LanguageActivity } from '@/lib/languages/get-language-content'
import { LanguageActivityCard } from '@/components/languages/language-activity-card'
import { pairChipLabel } from '@/lib/languages/format'

interface LanguagesHubClientProps {
  lang: Locale
  activities: LanguageActivity[]
  dict: any
}

type KindFilter = 'all' | 'flashcards' | 'matching'

const KIND_FILTERS: KindFilter[] = ['all', 'flashcards', 'matching']
const DIFFICULTY_FILTERS = ['all', 'beginner', 'intermediate', 'advanced'] as const

type DifficultyFilter = (typeof DIFFICULTY_FILTERS)[number]

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

export function LanguagesHubClient({ lang, activities, dict }: LanguagesHubClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')

  const languages = dict?.languages ?? {}

  const filteredActivities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return activities.filter(activity => {
      const haystack = `${activity.title} ${activity.description} ${activity.languagePair.source} ${activity.languagePair.target}`.toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesKind = kindFilter === 'all' || activity.gameType === kindFilter
      const matchesDifficulty = difficultyFilter === 'all' || activity.difficulty === difficultyFilter
      return matchesQuery && matchesKind && matchesDifficulty
    })
  }, [activities, searchQuery, kindFilter, difficultyFilter])

  const groups = useMemo(() => {
    const map = new Map<string, LanguageActivity[]>()
    for (const activity of filteredActivities) {
      const key = `${activity.languagePair.source}-${activity.languagePair.target}`
      const list = map.get(key)
      if (list) list.push(activity)
      else map.set(key, [activity])
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredActivities])

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-section-languages shadow-lg shadow-black/10 mb-4">
            <LanguagesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {languages.title || 'Language Practice'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {languages.subtitle || 'Learn languages through flashcards and translation quizzes'}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {tpl(languages.card?.activities_count || '{n} activities', { n: activities.length })}
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-6 mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={languages.search_placeholder || 'Search language activities...'}
              aria-label={languages.search_placeholder || 'Search language activities'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {languages.filters?.kind || 'Type'}
            </span>
            {KIND_FILTERS.map(kind => {
              const isActive = kindFilter === kind
              const label =
                kind === 'all'
                  ? languages.filters?.all || 'All'
                  : languages.types?.[kind] || kind
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setKindFilter(kind)}
                  aria-pressed={isActive}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <label
              htmlFor="language-difficulty-filter"
              className="text-sm font-medium text-muted-foreground"
            >
              {languages.filters?.difficulty || 'Difficulty'}
            </label>
            <select
              id="language-difficulty-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              className="px-3 py-1.5 rounded-lg border bg-background text-foreground text-sm max-w-full focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {DIFFICULTY_FILTERS.map(value => (
                <option key={value} value={value}>
                  {value === 'all'
                    ? languages.filters?.all || 'All'
                    : dict?.games?.difficulty?.[value] || value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-20">
            <LanguagesIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {languages.no_results || 'No activities match your search'}
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {languages.no_results || 'No activities match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(([pair, groupActivities]) => {
              const [source, target] = pair.split('-')
              return (
                <section key={pair} aria-label={pairChipLabel({ source, target })}>
                  <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted font-semibold text-sm">
                        {pairChipLabel({ source, target })}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {tpl(languages.card?.activities_count || '{n} activities', { n: groupActivities.length })}
                      </span>
                    </div>
                    <Link
                      href={`/${lang}/languages/${pair}/`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary shrink-0 hover:opacity-80 transition-opacity"
                    >
                      {languages.open || 'Open'}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {groupActivities.map(activity => (
                      <LanguageActivityCard
                        key={activity.slug}
                        lang={lang}
                        activity={activity}
                        dict={dict}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        <section className="mt-12 bg-card border rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <GraduationCap className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {languages.tracks?.title || 'Language courses'}
          </h2>
          <p className="text-muted-foreground">
            {languages.tracks?.coming_soon || 'Coming soon — new language tracks are on the way.'}
          </p>
        </section>
      </div>
    </div>
  )
}
