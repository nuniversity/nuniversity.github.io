// app/[lang]/games/games-client.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from '@/components/navigation/AppLink'
import { Gamepad2, Search, Trophy, Target, Brain, Code, BookOpen, Sparkles, Zap, Atom, Heart, ArrowRight, Languages } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { GameMetadata } from '@/lib/games/get-game-content'

interface GamesClientProps {
  lang: Locale
  games: GameMetadata[]
  dict: any
}

export function GamesClient({ lang, games, dict }: GamesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter games based on search query
  const filteredGames = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return games

    return games.filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query)
    )
  }, [games, searchQuery])

  // Group games by category (keys are stable category ids, not display text, so
// an unfortunate localized-label collision can never merge two categories)
const groupedByCategory = useMemo(() => {
  const grouped: Record<string, GameMetadata[]> = {}

  for (const game of filteredGames) {
    if (!grouped[game.category]) {
      grouped[game.category] = []
    }
    grouped[game.category].push(game)
  }

  return grouped
}, [filteredGames])

  // Category icons
  function getCategoryIcon(category: string) {
    const icons: Record<string, any> = {
      'grammar': BookOpen,
      'math': Target,
      'coding': Code,
      'physics': Zap,
      'logic': Brain,
      'fun': Sparkles,
      'science': Atom,
      'puzzles': Search,
      'conversation': Heart
    }
    return icons[category] || Gamepad2
  }

  // Difficulty badge colors
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-section-games shadow-lg shadow-black/10 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {dict.games.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {dict.games.subtitle}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            aria-label={dict.games.search_placeholder || 'Search games'}
            placeholder={dict.games.search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <div className="text-center py-20">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {searchQuery 
                ? (dict.games?.no_results || 'No games found matching your search')
                : (dict.games?.no_games || 'No games available yet')}
            </p>
          </div>
        )}

        {/* Grouped Games */}
        <div className="space-y-12">
          {Object.entries(groupedByCategory).map(([category, categoryGames]) => {
            const Icon = getCategoryIcon(category)
            const categoryLabel = dict.games?.categories?.[category] || category

            return (
              <div key={category}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-section-games flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {categoryLabel}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryGames.map((game) => (
                    <Link
                      key={game.slug}
                      href={`/${lang}/games/${game.category}/${game.slug}`}
                      className="group block bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Header with icon and difficulty */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-section-games flex items-center justify-center">
                          {/* Per-category icon (page-matching); the generic
                              gamepad hid the card's identity. */}
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {game.difficulty && (
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${getDifficultyColor(game.difficulty)}`}>
                            {dict.games?.difficulty?.[game.difficulty as 'beginner' | 'intermediate' | 'advanced'] || game.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Game Title */}
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {game.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground line-clamp-3 mb-4 text-sm">
                        {game.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm font-medium text-primary">
                          {dict.games.play_now}
                        </span>
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Link
            href={`/${lang}/quizzes/`}
            className="group block bg-card border-2 border-dashed border-primary/30 rounded-2xl p-6 hover:border-primary hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-section-games flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {dict.quizzes?.promo?.title || 'Certification Quizzes'}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {dict.quizzes?.promo?.text || 'Practice tests and timed mock exams with scoring, instant feedback and printable certificates.'}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm font-medium text-primary">{dict.quizzes?.open || 'Open'}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
          <Link
            href={`/${lang}/languages/`}
            className="group block bg-card border-2 border-dashed border-primary/30 rounded-2xl p-6 hover:border-primary hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-section-languages flex items-center justify-center">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {dict.languages?.promo?.title || 'Language Practice'}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {dict.languages?.promo?.text || 'Flashcards and translation quizzes for 4 language pairs with progress tracking.'}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm font-medium text-primary">{dict.languages?.open || 'Open'}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
