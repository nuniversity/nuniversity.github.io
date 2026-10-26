import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Calculator,
  GamepadIcon,
  Award,
  Library,
  Map,
  Languages,
  Home,
} from 'lucide-react'

/**
 * The site's colour map.
 *
 * Every top-level section owns a colour. The colour is applied to that
 * section's navigation state, its page header, and the icon tiles of its
 * cards, so a learner can tell where they are from a glance.
 *
 * Section colours are deliberately distinct from:
 *  - the brand gradient (blue → cyan), which belongs to the site chrome, and
 *  - the status colours (green = success, amber = warning, red = danger),
 *    which must never be mistaken for a section.
 */
export type SectionId =
  | 'general'
  | 'courses'
  | 'tools'
  | 'games'
  | 'quizzes'
  | 'library'
  | 'roadmaps'
  | 'languages'

export interface SectionDefinition {
  id: SectionId
  /** URL segment that identifies this section. */
  path: string
  icon: LucideIcon
  /** Tailwind gradient utility applied to icon tiles and headers. */
  gradient: string
  /** Tailwind text colour utility for accents on this section's surfaces. */
  text: string
  /** Tailwind soft-background utility for tinted chips and pills. */
  soft: string
  /** Tailwind ring colour used by the active navigation indicator. */
  ring: string
  /** Tailwind hover-border utility for interactive cards in this section. */
  hoverBorder: string
}

export const sections: Record<SectionId, SectionDefinition> = {
  general: {
    id: 'general',
    path: '',
    icon: Home,
    gradient: 'bg-brand-mark',
    text: 'text-section-brand',
    soft: 'bg-section-brand-soft',
    ring: 'ring-section-brand',
    hoverBorder: 'hover:border-primary/40',
  },
  courses: {
    id: 'courses',
    path: 'courses',
    icon: BookOpen,
    gradient: 'bg-gradient-section-courses',
    text: 'text-section-courses',
    soft: 'bg-gradient-section-courses-soft',
    ring: 'ring-section-courses',
    hoverBorder: 'hover:border-section-courses/40',
  },
  tools: {
    id: 'tools',
    path: 'tools',
    icon: Calculator,
    gradient: 'bg-gradient-section-tools',
    text: 'text-section-tools',
    soft: 'bg-gradient-section-tools-soft',
    ring: 'ring-section-tools',
    hoverBorder: 'hover:border-section-tools/40',
  },
  games: {
    id: 'games',
    path: 'games',
    icon: GamepadIcon,
    gradient: 'bg-gradient-section-games',
    text: 'text-section-games',
    soft: 'bg-gradient-section-games-soft',
    ring: 'ring-section-games',
    hoverBorder: 'hover:border-section-games/40',
  },
  quizzes: {
    id: 'quizzes',
    path: 'quizzes',
    icon: Award,
    gradient: 'bg-gradient-section-quizzes',
    text: 'text-section-quizzes',
    soft: 'bg-gradient-section-quizzes-soft',
    ring: 'ring-section-quizzes',
    hoverBorder: 'hover:border-section-quizzes/40',
  },
  library: {
    id: 'library',
    path: 'library',
    icon: Library,
    gradient: 'bg-gradient-section-library',
    text: 'text-section-library',
    soft: 'bg-gradient-section-library-soft',
    ring: 'ring-section-library',
    hoverBorder: 'hover:border-section-library/40',
  },
  roadmaps: {
    id: 'roadmaps',
    path: 'roadmaps',
    icon: Map,
    gradient: 'bg-gradient-section-roadmaps',
    text: 'text-section-roadmaps',
    soft: 'bg-gradient-section-roadmaps-soft',
    ring: 'ring-section-roadmaps',
    hoverBorder: 'hover:border-section-roadmaps/40',
  },
  languages: {
    id: 'languages',
    path: 'languages',
    icon: Languages,
    gradient: 'bg-gradient-section-languages',
    text: 'text-section-languages',
    soft: 'bg-gradient-section-languages-soft',
    ring: 'ring-section-languages',
    hoverBorder: 'hover:border-section-languages/40',
  },
}

/** The order sections appear in the primary navigation. */
export const sectionOrder: SectionId[] = [
  'general',
  'courses',
  'tools',
  'games',
  'quizzes',
  'library',
  'roadmaps',
  'languages',
]

/**
 * Resolves the section a pathname belongs to.
 *
 * `/en/courses/aws/01-intro` → `courses`
 * `/en/about`                → `general`
 */
export function getSectionFromPath(pathname: string | null | undefined): SectionId {
  if (!pathname) return 'general'
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  if (!first) return 'general'
  const match = sectionOrder.find((id) => sections[id].path === first)
  return match ?? 'general'
}

/** True when `href` points into the given section. */
export function isSectionActive(href: string, pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const hrefPath = href.split('?')[0].replace(/\/$/, '')
  const currentPath = pathname.replace(/\/$/, '')
  if (hrefPath === currentPath) return true
  return currentPath.startsWith(hrefPath + '/')
}
