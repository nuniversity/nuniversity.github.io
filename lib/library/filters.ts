import type { DifficultyLevel, LibraryResource, ResourceType } from './types'

export interface LibraryFilters {
  query: string
  types: ResourceType[]
  categories: string[]
  difficulties: DifficultyLevel[]
  platform: string
  language: string
  freeOnly: boolean
  withAnalysisOnly: boolean
}

export type LibrarySort = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'rating'

export const EMPTY_LIBRARY_FILTERS: LibraryFilters = {
  query: '',
  types: [],
  categories: [],
  difficulties: [],
  platform: '',
  language: '',
  freeOnly: false,
  withAnalysisOnly: false,
}

export interface LibraryFilterOptions {
  types: ResourceType[]
  categories: string[]
  difficulties: DifficultyLevel[]
  platforms: string[]
  languages: string[]
}

const TYPE_ORDER: ResourceType[] = [
  'analysis',
  'course',
  'video',
  'ebook',
  'podcast',
  'blog',
  'article',
  'repository',
]

const DIFFICULTY_ORDER: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced']

export function buildLibraryFilterOptions(resources: LibraryResource[]): LibraryFilterOptions {
  const presentTypes = new Set(resources.map((resource) => resource.type))
  const categories = new Set(resources.map((resource) => resource.category).filter(Boolean))
  const difficulties = new Set(
    resources
      .map((resource) => resource.difficulty)
      .filter((level): level is DifficultyLevel => Boolean(level && level !== 'all'))
  )
  const platforms = new Set(resources.map((resource) => resource.platform).filter(Boolean) as string[])
  const languages = new Set(resources.map((resource) => resource.language).filter(Boolean))

  return {
    types: TYPE_ORDER.filter((type) => presentTypes.has(type)),
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    difficulties: DIFFICULTY_ORDER.filter((level) => difficulties.has(level)),
    platforms: Array.from(platforms).sort((a, b) => a.localeCompare(b)),
    languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
  }
}

export function applyLibraryFilters(
  resources: LibraryResource[],
  filters: LibraryFilters
): LibraryResource[] {
  return resources.filter((resource) => {
    if (filters.types.length > 0 && !filters.types.includes(resource.type)) return false
    if (filters.categories.length > 0 && !filters.categories.includes(resource.category)) return false
    if (
      filters.difficulties.length > 0 &&
      (!resource.difficulty || !filters.difficulties.includes(resource.difficulty))
    ) {
      return false
    }
    if (filters.platform && resource.platform !== filters.platform) return false
    if (filters.language && resource.language !== filters.language) return false
    if (filters.freeOnly && resource.isPaid) return false
    if (filters.withAnalysisOnly && !resource.analysis && resource.type !== 'analysis') return false
    return true
  })
}

export function sortLibraryResources(resources: LibraryResource[], sortBy: LibrarySort): LibraryResource[] {
  const copy = [...resources]
  switch (sortBy) {
    case 'oldest':
      return copy.sort((a, b) =>
        (a.lastUpdated || a.publishDate || '').localeCompare(b.lastUpdated || b.publishDate || '')
      )
    case 'title_asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    case 'title_desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title))
    case 'rating':
      return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'newest':
    default:
      return copy.sort((a, b) =>
        (b.lastUpdated || b.publishDate || '').localeCompare(a.lastUpdated || a.publishDate || '')
      )
  }
}
