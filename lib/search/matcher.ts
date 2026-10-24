export type SearchDocType =
  | 'course'
  | 'lesson'
  | 'quiz'
  | 'tool'
  | 'roadmap'
  | 'library'
  | 'game'
  | 'language'

export interface SearchDoc {
  id: string
  type: SearchDocType
  title: string
  description: string
  url: string
  lang: string
  text?: string
  courseSlug?: string
}

export const SEARCH_TYPES: SearchDocType[] = [
  'course',
  'lesson',
  'quiz',
  'tool',
  'roadmap',
  'library',
  'game',
  'language',
]

const TYPE_WEIGHT: Record<SearchDocType, number> = {
  course: 7,
  lesson: 6,
  quiz: 5,
  tool: 4,
  roadmap: 3,
  library: 3,
  game: 2,
  language: 2,
}

export function fold(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenize(query: string): string[] {
  return fold(query)
    .split(' ')
    .filter(Boolean)
}

function wordScore(words: string[], token: string, exact: number, prefix: number, partial: number): number {
  if (words.includes(token)) return exact
  if (words.some(word => word.startsWith(token))) return prefix
  if (words.some(word => word.includes(token))) return partial
  return 0
}

export function scoreDoc(doc: SearchDoc, tokens: string[], foldedQuery: string): number {
  const title = fold(doc.title)
  const description = fold(doc.description)
  const text = fold(doc.text || '')
  const titleWords = title ? title.split(' ') : []
  const descriptionWords = description ? description.split(' ') : []

  let score = 0
  for (const token of tokens) {
    const best = Math.max(
      wordScore(titleWords, token, 80, 60, 40),
      wordScore(descriptionWords, token, 25, 20, 15),
      text && text.includes(token) ? 5 : 0
    )
    if (best === 0) return 0
    score += best
  }

  if (title === foldedQuery) score += 100
  else if (title.startsWith(foldedQuery)) score += 40

  return score + TYPE_WEIGHT[doc.type]
}

export function searchDocs(docs: SearchDoc[], query: string, limit = 8): SearchDoc[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []
  const foldedQuery = fold(query)

  const scored: { doc: SearchDoc; score: number }[] = []
  for (const doc of docs) {
    const score = scoreDoc(doc, tokens, foldedQuery)
    if (score > 0) scored.push({ doc, score })
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.doc.title.length !== b.doc.title.length) return a.doc.title.length - b.doc.title.length
    return a.doc.url.localeCompare(b.doc.url)
  })

  return scored.slice(0, limit).map(entry => entry.doc)
}

export interface SearchGroup {
  type: SearchDocType
  items: SearchDoc[]
}

export function groupDocs(docs: SearchDoc[]): SearchGroup[] {
  const groups: SearchGroup[] = []
  for (const type of SEARCH_TYPES) {
    const items = docs.filter(doc => doc.type === type)
    if (items.length > 0) groups.push({ type, items })
  }
  return groups
}
