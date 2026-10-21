import { type RoadmapStep } from './types'
import { type Locale } from '@/lib/i18n/config'

export function resolveContentUrl(step: RoadmapStep, locale: Locale): string | null {
  if (step.externalUrl) {
    return step.externalUrl
  }

  if (step.contentRef) {
    const parts = step.contentRef.split('/')
    if (parts.length === 2) {
      return `/${locale}/courses/${parts[0]}/${parts[1]}`
    }
    return `/${locale}/courses/${parts[0]}`
  }

  return null
}
