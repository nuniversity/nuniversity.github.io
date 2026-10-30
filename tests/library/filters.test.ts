import { describe, expect, it } from 'vitest'
import type { LibraryResource } from '@/lib/library/types'
import {
  applyLibraryFilters,
  buildLibraryFilterOptions,
  EMPTY_LIBRARY_FILTERS,
  sortLibraryResources,
} from '@/lib/library/filters'
import { searchLibraryResources } from '@/lib/library/search'

function resource(overrides: Partial<LibraryResource>): LibraryResource {
  return {
    id: 'r1',
    title: 'Resource',
    description: 'Description',
    type: 'video',
    category: 'Computer Science',
    author: 'Author',
    url: 'https://example.com',
    tags: [],
    language: 'en',
    isPaid: false,
    ...overrides,
  }
}

const resources: LibraryResource[] = [
  resource({ id: 'a', title: 'Clean Code', type: 'ebook', platform: 'Amazon', category: 'Software Engineering', author: 'Robert Martin', isPaid: true }),
  resource({
    id: 'b',
    title: 'CS50: Computational Thinking',
    type: 'video',
    platform: 'YouTube',
    category: 'Computer Science',
    tags: ['algorithms'],
    rating: 5,
  }),
  resource({
    id: 'c',
    title: 'Ação e Reação',
    type: 'analysis',
    platform: 'Nuniversity',
    category: 'Physics',
    language: 'pt',
    analysis: { objectives: [], takeaways: [], quiz: [] },
  }),
]

describe('library filters', () => {
  it('derives options from the resource set', () => {
    const options = buildLibraryFilterOptions(resources)
    expect(options.types).toEqual(['analysis', 'video', 'ebook'])
    expect(options.platforms).toEqual(['Amazon', 'Nuniversity', 'YouTube'])
    expect(options.languages).toEqual(['en', 'pt'])
  })

  it('filters by type, platform, language, paid status and analysis', () => {
    expect(
      applyLibraryFilters(resources, { ...EMPTY_LIBRARY_FILTERS, types: ['ebook'] }).map((r) => r.id)
    ).toEqual(['a'])
    expect(
      applyLibraryFilters(resources, { ...EMPTY_LIBRARY_FILTERS, platform: 'YouTube' }).map((r) => r.id)
    ).toEqual(['b'])
    expect(
      applyLibraryFilters(resources, { ...EMPTY_LIBRARY_FILTERS, language: 'pt' }).map((r) => r.id)
    ).toEqual(['c'])
    expect(
      applyLibraryFilters(resources, { ...EMPTY_LIBRARY_FILTERS, freeOnly: true }).map((r) => r.id)
    ).toEqual(['b', 'c'])
    expect(
      applyLibraryFilters(resources, { ...EMPTY_LIBRARY_FILTERS, withAnalysisOnly: true }).map((r) => r.id)
    ).toEqual(['c'])
  })

  it('sorts without mutating the source', () => {
    const sorted = sortLibraryResources(resources, 'title_asc')
    expect(sorted.map((r) => r.id)).toEqual(['c', 'a', 'b'])
    expect(resources[0].id).toBe('a')
    expect(sortLibraryResources(resources, 'rating')[0].id).toBe('b')
  })
})

describe('library search', () => {
  it('matches title, author, platform, category and tags', () => {
    expect(searchLibraryResources(resources, 'clean').map((r) => r.id)).toEqual(['a'])
    expect(searchLibraryResources(resources, 'martin').map((r) => r.id)).toEqual(['a'])
    expect(searchLibraryResources(resources, 'youtube').map((r) => r.id)).toEqual(['b'])
    expect(searchLibraryResources(resources, 'computer science').map((r) => r.id)).toEqual(['b'])
    expect(searchLibraryResources(resources, 'algorithms').map((r) => r.id)).toEqual(['b'])
  })

  it('is diacritic-insensitive and ranks title matches first', () => {
    expect(searchLibraryResources(resources, 'acao').map((r) => r.id)).toEqual(['c'])
    expect(searchLibraryResources(resources, 'aç').map((r) => r.id)).toEqual(['c'])
  })

  it('returns the original list for an empty query', () => {
    expect(searchLibraryResources(resources, '   ')).toBe(resources)
  })
})
