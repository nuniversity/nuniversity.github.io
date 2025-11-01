// app/[lang]/library/library-client.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Search, Library, Video, BookOpen, GraduationCap, FileText, 
  Github, Headphones, Newspaper, Filter, X, ExternalLink,
  Clock, Star, DollarSign, Tag, TrendingUp
} from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { LibraryResource, ResourceType, DifficultyLevel } from '@/lib/library/types'

interface LibraryClientProps {
  lang: Locale
  resources: LibraryResource[]
  dict: any
}

const typeIcons: Record<ResourceType, any> = {
  video: Video,
  ebook: BookOpen,
  course: GraduationCap,
  blog: FileText,
  repository: Github,
  podcast: Headphones,
  article: Newspaper,
}

const typeColors: Record<ResourceType, string> = {
  video: 'from-red-600 to-pink-600',
  ebook: 'from-blue-600 to-cyan-600',
  course: 'from-purple-600 to-indigo-600',
  blog: 'from-green-600 to-emerald-600',
  repository: 'from-gray-700 to-gray-900',
  podcast: 'from-orange-600 to-amber-600',
  article: 'from-teal-600 to-cyan-600',
}

export function LibraryClient({ lang, resources, dict }: LibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel[]>([])
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'rating'>('newest')

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category))
    return Array.from(cats).sort()
  }, [resources])

  const filteredResources = useMemo(() => {
    let filtered = resources.filter((resource) => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query || 
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.author.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))

      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(resource.type)
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(resource.category)
      const matchesDifficulty = selectedDifficulty.length === 0 || 
        (resource.difficulty && selectedDifficulty.includes(resource.difficulty))
      const matchesFree = !showFreeOnly || !resource.isPaid

      return matchesSearch && matchesType && matchesCategory && matchesDifficulty && matchesFree
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.lastUpdated || b.publishDate || '').localeCompare(a.lastUpdated || a.publishDate || '')
        case 'oldest':
          return (a.lastUpdated || a.publishDate || '').localeCompare(b.lastUpdated || b.publishDate || '')
        case 'title_asc':
          return a.title.localeCompare(b.title)
        case 'title_desc':
          return b.title.localeCompare(a.title)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [resources, searchQuery, selectedTypes, selectedCategories, selectedDifficulty, showFreeOnly, sortBy])

  const stats = useMemo(() => ({
    total: resources.length,
    categories: categories.length,
    authors: new Set(resources.map(r => r.author)).size,
  }), [resources, categories])

  const toggleType = (type: ResourceType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedCategories([])
    setSelectedDifficulty([])
    setShowFreeOnly(false)
  }

  const hasActiveFilters = searchQuery || selectedTypes.length > 0 || 
    selectedCategories.length > 0 || selectedDifficulty.length > 0 || showFreeOnly

  return (
    <div className="container-custom py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
            <Library className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {dict.library?.title || 'Learning Library'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {dict.library?.subtitle || 'Curated educational resources'}
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              <span>{stats.total} {dict.library?.stats?.resources || 'resources'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>{stats.categories} {dict.library?.stats?.categories || 'categories'}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.authors} {dict.library?.stats?.authors || 'contributors'}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border rounded-2xl p-6 mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={dict.library?.search_placeholder || 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {dict.library?.filter_by || 'Filter by:'}
            </span>
            
            {/* Type Filters */}
            {(['video', 'ebook', 'course', 'blog', 'repository'] as ResourceType[]).map(type => {
              const Icon = typeIcons[type]
              const isSelected = selectedTypes.includes(type)
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{dict.library?.resource_types?.[type] || type}</span>
                </button>
              )
            })}

            {/* Free Only */}
            <button
              onClick={() => setShowFreeOnly(!showFreeOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                showFreeOnly 
                  ? 'bg-green-600 text-white' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{dict.library?.free_only || 'Free Only'}</span>
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
              >
                <X className="w-4 h-4" />
                <span>{dict.library?.clear_filters || 'Clear'}</span>
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {dict.library?.sort_by || 'Sort by:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">{dict.library?.sort_options?.newest || 'Newest'}</option>
              <option value="oldest">{dict.library?.sort_options?.oldest || 'Oldest'}</option>
              <option value="title_asc">{dict.library?.sort_options?.title_asc || 'A-Z'}</option>
              <option value="title_desc">{dict.library?.sort_options?.title_desc || 'Z-A'}</option>
              <option value="rating">{dict.library?.sort_options?.rating || 'Rating'}</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredResources.length} of {resources.length} resources
        </div>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Library className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {dict.library?.no_results || 'No resources found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {dict.library?.try_different_filters || 'Try different filters'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {dict.library?.clear_filters || 'Clear Filters'}
              </button>
            )}
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const Icon = typeIcons[resource.type]
            const colorClass = typeColors[resource.type]

            return (
              <div
                key={resource.id}
                className="group bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                {resource.thumbnail && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={resource.thumbnail} 
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {!resource.isPaid && (
                        <span className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                          {dict.library?.labels?.free || 'Free'}
                        </span>
                      )}
                      {resource.rating && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{resource.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h3>

                  {/* Author */}
                  <p className="text-sm text-muted-foreground mb-3">
                    {dict.library?.labels?.author || 'By'} {resource.author}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {resource.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
                    {resource.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{resource.duration}</span>
                      </div>
                    )}
                    {resource.difficulty && (
                      <span className="px-2 py-0.5 rounded-md bg-muted">
                        {resource.difficulty}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-muted">
                      {resource.category}
                    </span>
                  </div>

                  {/* Tags */}
                  {resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-muted/30 border-t">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-primary font-medium text-sm group-hover:translate-x-1 transition-transform"
                  >
                    <span>{dict.library?.view_resource || 'View Resource'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}