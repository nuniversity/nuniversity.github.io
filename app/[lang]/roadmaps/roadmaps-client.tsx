'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Map, Search, Clock, TrendingUp, BookOpen } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'

interface RoadmapInfo {
  id: string
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

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function RoadmapsClient({ lang, roadmaps, dict }: RoadmapsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    
    return roadmaps.filter((roadmap) => {
      const matchesSearch = !query || 
        roadmap.title.toLowerCase().includes(query) ||
        roadmap.description.toLowerCase().includes(query)
      
      const matchesDifficulty = difficultyFilter === 'all' || roadmap.difficulty === difficultyFilter
      
      return matchesSearch && matchesDifficulty
    })
  }, [roadmaps, searchQuery, difficultyFilter])

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
            <Map className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {dict.roadmaps?.title || 'Roadmaps'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {dict.roadmaps?.subtitle || 'Structured learning paths to guide your journey'}
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              <span>{roadmaps.length} {dict.roadmaps?.totalRoadmaps || 'roadmaps'}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{roadmaps.reduce((sum, r) => sum + r.stepCount, 0)} {dict.roadmaps?.totalSteps || 'total steps'}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border rounded-2xl p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={dict.roadmaps?.searchPlaceholder || 'Search roadmaps...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    difficultyFilter === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {dict.roadmaps?.difficulty?.[level] || level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredRoadmaps.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Map className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery
                ? dict.roadmaps?.noResults || 'No roadmaps found'
                : dict.roadmaps?.noRoadmaps || 'No roadmaps available yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? dict.roadmaps?.tryDifferentSearch || 'Try a different search term'
                : dict.roadmaps?.checkBackSoon || 'Check back soon for new roadmaps'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {dict.roadmaps?.clearSearch || 'Clear Search'}
              </button>
            )}
          </div>
        )}

        {/* Roadmaps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoadmaps.map((roadmap) => (
            <Link
              key={roadmap.id}
              href={`/${lang}/roadmaps/${roadmap.id}`}
              className="group block bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${difficultyColors[roadmap.difficulty] || ''}`}>
                    {dict.roadmaps?.difficulty?.[roadmap.difficulty] || roadmap.difficulty}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {roadmap.title}
                </h3>

                <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed mb-4">
                  {roadmap.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{roadmap.estimatedDuration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{roadmap.stepCount} steps</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-end">
                <span className="text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                  {dict.roadmaps?.startLearning || 'Start Learning →'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
