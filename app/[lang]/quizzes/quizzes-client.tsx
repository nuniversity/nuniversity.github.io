'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Trophy, ArrowRight, FileQuestion, Award } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type QuizKind, type QuizSummary } from '@/lib/quizzes/types'
import { getBest, type QuizBest } from '@/lib/quizzes/storage'

interface QuizzesClientProps {
  lang: Locale
  quizzes: QuizSummary[]
  dict: any
}

type KindFilter = 'all' | QuizKind

const KIND_FILTERS: KindFilter[] = ['all', 'certification', 'practice', 'course-exam']

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

const KIND_BADGES: Record<QuizKind, string> = {
  certification: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  practice: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'course-exam': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
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

export function QuizzesClient({ lang, quizzes, dict }: QuizzesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [bests, setBests] = useState<Record<string, QuizBest | null>>({})

  useEffect(() => {
    const map: Record<string, QuizBest | null> = {}
    for (const quiz of quizzes) {
      map[quiz.slug] = getBest(quiz.slug)
    }
    setBests(map)
  }, [quizzes])

  const categories = useMemo(() => {
    const unique: string[] = []
    for (const quiz of quizzes) {
      if (!unique.includes(quiz.category)) unique.push(quiz.category)
    }
    return unique
  }, [quizzes])

  const filteredQuizzes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return quizzes.filter((quiz) => {
      const haystack = `${quiz.title} ${quiz.description} ${quiz.category} ${quiz.topic || ''}`.toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesKind = kindFilter === 'all' || quiz.kind === kindFilter
      const matchesCategory = categoryFilter === 'all' || quiz.category === categoryFilter
      return matchesQuery && matchesKind && matchesCategory
    })
  }, [quizzes, searchQuery, kindFilter, categoryFilter])

  const countLabel =
    quizzes.length === 1
      ? dict.quizzes?.count?.one || '1 quiz'
      : tpl(dict.quizzes?.count?.other || '{n} quizzes', { n: quizzes.length })

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {dict.quizzes?.title || 'Quizzes, Tests & Certification Practice'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {dict.quizzes?.subtitle || 'Certification quizzes, practice tests and timed exam simulations with scoring and instant feedback.'}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{countLabel}</p>
          <Link
            href={`/${lang}/quizzes/certificates/`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            data-testid="certificates-link"
          >
            <Award className="h-4 w-4" />
            {dict.quizzes?.certificates?.title || 'My certificates'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="bg-card border rounded-2xl p-6 mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={tpl(dict.quizzes?.search_placeholder || 'Search quizzes...', {})}
              aria-label={dict.quizzes?.search_placeholder || 'Search quizzes'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {dict.quizzes?.filters?.kind || 'Type'}
            </span>
            {KIND_FILTERS.map((kind) => {
              const isActive = kindFilter === kind
              const label =
                kind === 'all'
                  ? dict.quizzes?.filters?.all || 'All'
                  : dict.quizzes?.kind?.[kind] || kind
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
              htmlFor="quiz-category-filter"
              className="text-sm font-medium text-muted-foreground"
            >
              {dict.quizzes?.filters?.category || 'Category'}
            </label>
            <select
              id="quiz-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border bg-background text-foreground text-sm max-w-full focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">
                {dict.quizzes?.filters?.category_all || 'All categories'}
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-20">
            <FileQuestion className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {dict.quizzes?.empty || 'No quizzes available yet'}
            </p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {dict.quizzes?.no_results || 'No quizzes found matching your search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => {
              const best = bests[quiz.slug] ?? null
              const visibleDomains = quiz.domains.slice(0, 4)
              const extraDomains = quiz.domains.length - visibleDomains.length
              const languages = Array.from(
                new Set(['en', ...Object.keys(quiz.locales ?? {})])
              )

              return (
                <Link
                  key={quiz.slug}
                  href={`/${lang}/quizzes/${quiz.slug}/`}
                  className="group block min-w-0"
                >
                  <div className="h-full min-w-0 flex flex-col bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          KIND_BADGES[quiz.kind] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {dict.quizzes?.kind?.[quiz.kind] || quiz.kind}
                      </span>
                      {quiz.difficulty && (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColor(
                            quiz.difficulty
                          )}`}
                        >
                          {dict.quizzes?.difficulty?.[quiz.difficulty] || quiz.difficulty}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2 min-w-0">
                      {quiz.title}
                    </h3>

                    <p className="text-muted-foreground line-clamp-3 mb-4 text-sm min-w-0">
                      {quiz.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3 text-xs min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {tpl(dict.quizzes?.card?.questions || '{n} questions', { n: quiz.questionCount })}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {tpl(dict.quizzes?.card?.duration || '{n} min', { n: Math.round(quiz.durationSeconds / 60) })}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {tpl(dict.quizzes?.card?.passing || 'Pass {score}%', { score: quiz.passingScore })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          best
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {best
                          ? tpl(dict.quizzes?.card?.best || 'Best {score}%', { score: best.percent })
                          : dict.quizzes?.card?.not_attempted || 'Not attempted'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3 min-w-0">
                      {visibleDomains.map((domain) => (
                        <span
                          key={domain.id}
                          title={domain.name}
                          className="max-w-[12rem] truncate px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                        >
                          {domain.name}
                        </span>
                      ))}
                      {extraDomains > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                          {`+${extraDomains}`}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4 min-w-0">
                      {languages.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs"
                        >
                          {code.toUpperCase()}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t">
                      <span className="text-sm font-medium text-primary">
                        {dict.quizzes?.open || 'Open'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
