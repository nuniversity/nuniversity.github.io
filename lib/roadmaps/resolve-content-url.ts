import { type RoadmapStep } from './types'
import { type Locale } from '@/lib/i18n/config'

export type ContentKind = 'course' | 'tool' | 'game' | 'library' | 'external'

export interface ContentTarget {
  href: string
  kind: ContentKind
}

const KIND_BY_PREFIX: Record<string, ContentKind> = {
  course: 'course',
  courses: 'course',
  tool: 'tool',
  tools: 'tool',
  game: 'game',
  games: 'game',
  library: 'library',
}

const PREFIX_BY_KIND: Record<Exclude<ContentKind, 'external'>, string> = {
  course: 'courses',
  tool: 'tools',
  game: 'games',
  library: 'library',
}

/** Only allow path segments that cannot escape the locale root. */
function safeSegments(ref: string): string[] {
  return ref
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== '.' && part !== '..')
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, ''))
    .filter(Boolean)
}

function routeFor(prefix: string, segments: string[], locale: Locale): string {
  return `/${locale}/${prefix}${segments.length ? `/${segments.join('/')}` : ''}`
}

/**
 * Resolves the destination of a roadmap step.
 *
 * Two contentRef forms are supported:
 *   - explicit app path: `courses/<course>/<lesson>`, `tools/<slug>`, `games/<category>/<slug>`, `library`
 *   - legacy course path: `<course>/<lesson>`, resolved from the step type
 *
 * `externalUrl` wins over contentRef. Milestone steps have no destination.
 */
export function stepContentTarget(step: RoadmapStep, locale: Locale): ContentTarget | null {
  if (step.externalUrl) return { href: step.externalUrl, kind: 'external' }
  if (!step.contentRef) return null

  const parts = safeSegments(step.contentRef)
  if (parts.length === 0) return null

  const prefix = parts[0].toLowerCase()
  if (KIND_BY_PREFIX[prefix]) {
    const kind = KIND_BY_PREFIX[prefix]
    if (kind === 'library') return { href: `/${locale}/library`, kind }
    return {
      href: routeFor(PREFIX_BY_KIND[kind as Exclude<ContentKind, 'external'>], parts.slice(1), locale),
      kind,
    }
  }

  switch (step.type) {
    case 'course':
    case 'tool':
    case 'game':
      return {
        href: routeFor(PREFIX_BY_KIND[step.type], parts, locale),
        kind: step.type,
      }
    case 'library':
      return { href: `/${locale}/library`, kind: 'library' }
    case 'milestone':
    case 'concept':
    default:
      return null
  }
}

/** Backwards-compatible helper used by the existing card/pages. */
export function resolveContentUrl(step: RoadmapStep, locale: Locale): string | null {
  return stepContentTarget(step, locale)?.href ?? null
}
