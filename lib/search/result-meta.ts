import type { SearchDoc, SearchDocType } from '@/lib/search/matcher'

export interface ResultChip {
  label: string
  /** Optional visual emphasis, used for the difficulty level. */
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const DIFFICULTY_TONE: Record<string, ResultChip['tone']> = {
  beginner: 'success',
  basic: 'success',
  intermediate: 'warning',
  medium: 'warning',
  advanced: 'danger',
  expert: 'danger',
}

/**
 * The contextual chips shown under a search result.
 *
 * Which metadata matters depends on the entry type, so each type gets the
 * fields that actually help a learner decide whether to open it.
 */
export function resultChips(doc: SearchDoc): ResultChip[] {
  const chips: ResultChip[] = []
  const difficulty = doc.difficulty ? doc.difficulty.toLowerCase() : ''

  const pushDifficulty = () => {
    if (!doc.difficulty) return
    chips.push({ label: doc.difficulty, tone: DIFFICULTY_TONE[difficulty] ?? 'default' })
  }

  switch (doc.type) {
    case 'lesson':
      if (doc.area) chips.push({ label: doc.area })
      pushDifficulty()
      if (doc.duration) chips.push({ label: doc.duration })
      break
    case 'course':
      if (doc.area) chips.push({ label: doc.area })
      pushDifficulty()
      if (doc.duration) chips.push({ label: doc.duration })
      if (doc.totalLessons) chips.push({ label: `${doc.totalLessons} lessons` })
      break
    case 'tool':
      if (doc.category) chips.push({ label: doc.category })
      pushDifficulty()
      break
    case 'quiz':
      if (doc.certification) chips.push({ label: doc.certification })
      else if (doc.category) chips.push({ label: doc.category })
      pushDifficulty()
      break
    case 'game':
      if (doc.category) chips.push({ label: doc.category })
      pushDifficulty()
      break
    case 'library':
      if (doc.category) chips.push({ label: doc.category })
      break
    case 'roadmap':
      pushDifficulty()
      if (doc.duration) chips.push({ label: doc.duration })
      break
    case 'language':
      if (doc.source && doc.target) chips.push({ label: `${doc.source.toUpperCase()} → ${doc.target.toUpperCase()}` })
      break
  }

  return chips
}

/**
 * The single line of context shown above the description.
 *
 * For a lesson this is the course it belongs to — the most useful piece of
 * context when scanning search results.
 */
export function resultContext(doc: SearchDoc): string | null {
  if (doc.type === 'lesson') {
    const parts: string[] = []
    if (doc.courseTitle) parts.push(doc.courseTitle)
    if (doc.position && doc.totalLessons) {
      parts.push(`Lesson ${doc.position} of ${doc.totalLessons}`)
    }
    return parts.length ? parts.join(' · ') : null
  }
  if (doc.type === 'course' && doc.author) return doc.author
  return null
}

/** Human-readable label for an entry type. */
export function typeLabel(type: SearchDocType, dict: any): string {
  switch (type) {
    case 'course':
      return dict?.navigation?.courses ?? 'Courses'
    case 'lesson':
      return dict?.courses?.lessons ?? 'Lessons'
    case 'quiz':
      return dict?.navigation?.quizzes ?? 'Quizzes'
    case 'tool':
      return dict?.navigation?.tools ?? 'Tools'
    case 'roadmap':
      return dict?.navigation?.roadmaps ?? 'Roadmaps'
    case 'library':
      return dict?.navigation?.library ?? 'Library'
    case 'game':
      return dict?.navigation?.games ?? 'Games'
    case 'language':
      return dict?.navigation?.languages ?? 'Languages'
  }
}
