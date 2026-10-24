import { describe, expect, it } from 'vitest'
import { fold, searchDocs, groupDocs, type SearchDoc } from '@/lib/search/matcher'

const doc = (over: Partial<SearchDoc>): SearchDoc => ({
  id: 'en:test:1',
  type: 'lesson',
  title: 'Untitled',
  description: '',
  url: '/en/x/',
  lang: 'en',
  ...over,
})

describe('fold', () => {
  it('strips diacritics and punctuation, lowercasing', () => {
    expect(fold('Memória Episódica vs. Semântica!')).toBe('memoria episodica vs semantica')
  })

  it('keeps digits and collapses separators', () => {
    expect(fold('3-2-1 Countdown  Fase')).toBe('3 2 1 countdown fase')
  })

  it('handles nullish input', () => {
    expect(fold('')).toBe('')
    expect(fold(undefined as unknown as string)).toBe('')
  })
})

describe('searchDocs', () => {
  const docs: SearchDoc[] = [
    doc({ id: 'a', title: 'Foundations of Agent Memory', description: 'Short and long term memory', url: '/en/a/' }),
    doc({ id: 'b', title: 'AWS AI Practitioner', description: 'Covers agent memory topics', url: '/en/b/' }),
    doc({ id: 'c', title: 'Data Engineering', description: 'Pipelines at scale', text: 'sharding and partitioning strategies', url: '/en/c/' }),
    doc({ id: 'd', title: 'Unrelated', description: 'Nothing here', url: '/en/d/' }),
  ]

  it('matches diacritic-free queries against accented titles', () => {
    const result = searchDocs([doc({ id: 'x', title: 'Memória de Trabalho' })], 'memoria')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('x')
  })

  it('requires every query token to match', () => {
    expect(searchDocs(docs, 'agent memory')).toHaveLength(2)
    expect(searchDocs(docs, 'agent zebra')).toHaveLength(0)
  })

  it('matches body text as the weakest signal', () => {
    const result = searchDocs(docs, 'sharding')
    expect(result.map(entry => entry.id)).toEqual(['c'])
  })

  it('ranks title matches above description-only matches', () => {
    const result = searchDocs(docs, 'memory')
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('b')
  })

  it('prefers exact full-title matches and course-typed ties', () => {
    const result = searchDocs(
      [
        doc({ id: 'long', type: 'lesson', title: 'Data Engineering Pipelines Deep Dive' }),
        doc({ id: 'exact', type: 'course', title: 'Data Engineering' }),
      ],
      'data engineering'
    )
    expect(result.map(entry => entry.id)).toEqual(['exact', 'long'])
  })

  it('applies the limit', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      doc({ id: `m${i}`, title: `Memory topic ${i}` })
    )
    expect(searchDocs(many, 'memory', 5)).toHaveLength(5)
    expect(searchDocs(many, 'memory')).toHaveLength(8)
  })

  it('returns nothing for blank queries', () => {
    expect(searchDocs(docs, '   ')).toEqual([])
    expect(searchDocs(docs, '!!')).toEqual([])
  })
})

describe('groupDocs', () => {
  it('groups by type in canonical order', () => {
    const groups = groupDocs([
      doc({ id: 'g1', type: 'game' }),
      doc({ id: 'c1', type: 'course' }),
      doc({ id: 'l1', type: 'lesson' }),
      doc({ id: 'c2', type: 'course' }),
    ])
    expect(groups.map(group => group.type)).toEqual(['course', 'lesson', 'game'])
    expect(groups[0].items.map(entry => entry.id)).toEqual(['c1', 'c2'])
  })

  it('drops empty groups', () => {
    expect(groupDocs([doc({ id: 'only', type: 'tool' })])).toHaveLength(1)
    expect(groupDocs([])).toEqual([])
  })
})
