import { fold, tokenize } from '@/lib/search/matcher'
import type { LibraryResource } from './types'

const FIELD_WEIGHTS = {
  title: [80, 55, 35],
  description: [25, 18, 12],
  author: [22, 16, 10],
  platform: [22, 16, 10],
  category: [18, 12, 8],
  tags: [30, 22, 14],
} as const

type WeightedField = keyof typeof FIELD_WEIGHTS

function fieldScore(value: string, token: string, weights: readonly [number, number, number]): number {
  const folded = fold(value)
  if (!folded) return 0
  const words = folded.split(' ')
  if (words.includes(token)) return weights[0]
  if (words.some((word) => word.startsWith(token))) return weights[1]
  if (folded.includes(token)) return weights[2]
  return 0
}

function scoreResource(resource: LibraryResource, tokens: string[], foldedQuery: string): number {
  const fields: Array<[WeightedField, string]> = [
    ['title', resource.title],
    ['description', resource.description],
    ['author', resource.author],
    ['platform', resource.platform ?? ''],
    ['category', resource.category],
    ['tags', resource.tags.join(' ')],
  ]

  let score = 0
  for (const token of tokens) {
    let best = 0
    for (const [field, value] of fields) {
      best = Math.max(best, fieldScore(value, token, FIELD_WEIGHTS[field]))
    }
    if (best === 0) return 0
    score += best
  }

  const title = fold(resource.title)
  if (title === foldedQuery) score += 100
  else if (title.startsWith(foldedQuery)) score += 40
  return score
}

/** Ranked, diacritic-insensitive library search; an empty query keeps the input order. */
export function searchLibraryResources(resources: LibraryResource[], query: string): LibraryResource[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return resources
  const foldedQuery = fold(query)

  return resources
    .map((resource) => ({ resource, score: scoreResource(resource, tokens, foldedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.resource.title.length !== b.resource.title.length) {
        return a.resource.title.length - b.resource.title.length
      }
      return a.resource.title.localeCompare(b.resource.title)
    })
    .map((entry) => entry.resource)
}
