export interface LessonFeedbackEntry {
  slug: string
  verdict: 'up' | 'down'
  at: string
}

const FEEDBACK_KEY = 'v1:lesson-feedback'
const FEEDBACK_CAP = 200

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}

function isValidEntry(raw: unknown): raw is LessonFeedbackEntry {
  if (typeof raw !== 'object' || raw === null) return false
  const value = raw as Record<string, unknown>
  return (
    typeof value.slug === 'string' &&
    (value.verdict === 'up' || value.verdict === 'down') &&
    typeof value.at === 'string'
  )
}

export function getLessonFeedbacks(): LessonFeedbackEntry[] {
  const raw = safeGet(FEEDBACK_KEY)
  if (raw === null) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      safeRemove(FEEDBACK_KEY)
      return []
    }
    return parsed.filter(isValidEntry)
  } catch {
    safeRemove(FEEDBACK_KEY)
    return []
  }
}

export function getLessonFeedback(slug: string): 'up' | 'down' | null {
  const entries = getLessonFeedbacks()
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].slug === slug) return entries[i].verdict
  }
  return null
}

export function saveLessonFeedback(entry: LessonFeedbackEntry): void {
  const entries = getLessonFeedbacks().filter(e => e.slug !== entry.slug)
  entries.push(entry)
  safeSet(FEEDBACK_KEY, JSON.stringify(entries.slice(-FEEDBACK_CAP)))
}
