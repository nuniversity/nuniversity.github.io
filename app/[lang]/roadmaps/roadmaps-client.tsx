'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from '@/components/navigation/AppLink'
import { Map, Search, Clock, TrendingUp, BookOpen, ArrowRight, Route } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { getRoadmapProgress, completionPercent } from '@/lib/roadmaps/storage'

interface RoadmapInfo {
  id: string
  order: number
  title: string
  description: string
  icon: string
  difficulty: string
  estimatedDuration: string
  stepCount: number
}

interface RoadmapsClientProps {
  lang: Locale
  roadmaps: RoadmapInfo[]
  dict: any
}

interface ProgressSummary {
  completed: number
  total: number
  percent: number
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function RoadmapsClient({ lang, roadmaps, dict }: RoadmapsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [progress, setProgress] = useState<Record<string, ProgressSummary>>({})

  // Read progress after mount: the static HTML must not depend on localStorage.
  useEffect(() => {
    const next: Record<string, ProgressSummary> = {}
    for (const roadmap of roadmaps) {
      const saved = getRoadmapProgress(roadmap.id)
      const completed = saved?.completedSteps.length ?? 0
      next[roadmap.id] = {
        completed,
        total: roadmap.stepCount,
        percent: completionPercent(completed, roadmap.stepCount),
      }
    }
    setProgress(next)
  }, [roadmaps])

  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    return roadmaps
      .filter((roadmap) => {
        const matchesSearch =
          !query ||
          roadmap.title.toLowerCase().includes(query) ||
          roadmap.description.toLowerCase().includes(query)
        const matchesDifficulty =
          difficultyFilter === 'all' || roadmap.difficulty === difficultyFilter
        return matchesSearch && matchesDifficulty
      })
      .sort((a, b) => {
        const aStarted = (progress[a.id]?.completed ?? 0) > 0 ? 1 : 0
        const bStarted = (progress[b.id]?.completed ?? 0) > 0 ? 1 : 0
        return bStarted - aStarted || a.order - b.order || a.id.localeCompare(b.id)
      })
  }, [roadmaps, searchQuery, difficultyFilter, progress])

  const totalSteps = roadmaps.reduce((sum, roadmap) => sum + roadmap.stepCount, 0)
  const hasProgress = Object.values(progress).some((item) => item.completed > 0)

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-section-roadmaps shadow-lg shadow-black/10 mb-4">
            <Map className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{dict.roadmaps?.title || 'Roadmaps'}</h1>
          <p className="text-muted-foreground text-lg">
            {dict.roadmaps?.subtitle || 'Structured learning paths to guide your journey'}
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4" aria-hidden="true" />
              <span>
                {roadmaps.length} {dict.roadmaps?.totalRoadmaps || 'roadmaps'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>
                {totalSteps} {dict.roadmaps?.totalSteps || 'total steps'}
              </span>
            </div>
            {hasProgress && (
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4" aria-hidden="true" />
                <span>{dict.roadmaps?.yourProgress || 'Your progress is saved'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                placeholder={dict.roadmaps?.searchPlaceholder || 'Search roadmaps...'}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={dict.roadmaps?.searchPlaceholder || 'Search roadmaps'}
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={dict.roadmaps?.difficulty || 'Difficulty'}>
              {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={difficultyFilter === level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    difficultyFilter === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {dict.roadmaps?.difficultyLevels?.[level] || level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredRoadmaps.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-section-roadmaps-soft flex items-center justify-center mx-auto mb-4">
              <Map className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery
                ? dict.roadmaps?.noResults || 'No roadmaps found'
                : dict.roadmaps?.noRoadmaps || 'No roadmaps available yet'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? dict.roadmaps?.tryDifferentSearch || 'Try a different search term'
                : dict.roadmaps?.checkBackSoon || 'Check back soon for new roadmaps'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {dict.roadmaps?.clearSearch || 'Clear Search'}
              </button>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoadmaps.map((roadmap) => {
            const summary = progress[roadmap.id]
            const started = (summary?.completed ?? 0) > 0
            const finished = summary ? summary.completed >= summary.total && summary.total > 0 : false
            return (
              <Link
                key={roadmap.id}
                href={`/${lang}/roadmaps/${roadmap.id}/`}
                className="group flex flex-col bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-section-roadmaps flex items-center justify-center">
                      <Map className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${difficultyColors[roadmap.difficulty] || ''}`}>
                      {dict.roadmaps?.difficultyLevels?.[String(roadmap.difficulty).toLowerCase()] || roadmap.difficulty}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {roadmap.title}
                  </h2>
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed mb-4">
                    {roadmap.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {roadmap.estimatedDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" aria-hidden="true" />
                      {roadmap.stepCount} {dict.roadmaps?.steps || 'steps'}
                    </span>
                  </div>

                  {started && summary && (
                    <div className="mt-5">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{dict.roadmaps?.yourProgress || 'Your progress'}</span>
                        <span className="font-medium tabular-nums">{summary.percent}%</span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={summary.percent}
                        aria-label={`${roadmap.title}: ${summary.percent}%`}
                      >
                        <div className="h-full bg-brand transition-all" style={{ width: `${summary.percent}%` }} />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {summary.completed} {dict.roadmaps?.of || 'of'} {summary.total}{' '}
                        {dict.roadmaps?.stepsCompleted || 'steps completed'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 text-primary font-medium text-sm transition-transform group-hover:translate-x-1">
                    {finished
                      ? dict.roadmaps?.completed || 'Completed'
                      : started
                        ? dict.roadmaps?.continue || 'Continue'
                        : dict.roadmaps?.startLearning || 'Start Learning'}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
