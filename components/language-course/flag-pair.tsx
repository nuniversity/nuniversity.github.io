'use client'

import { FlagImage } from '@/components/ui/flag'
import { pairChipLabel } from '@/lib/languages/format'

export { FlagImage }

/**
 * Language-pair flags as real SVG artwork (`public/flags/<code>.svg`).
 *
 * Flag emojis (🇧🇷 🇬🇧) render as plain letter codes on Windows, so the
 * course pair is shown with self-hosted SVG flags instead, falling back to
 * the text chip when a course declares no flags.
 */

export function FlagPair({
  languages,
  flags,
  size = 20,
  className = '',
}: {
  /** Language codes, for the accessible title (PT → EN). */
  languages: { source: string; target: string }
  /** Flag file codes from course.json (`br`, `gb`, ...). */
  flags: { source: string; target: string }
  size?: number
  className?: string
}) {
  return (
    <span
      role="img"
      aria-label={flagPairTitle(languages)}
      title={flagPairTitle(languages)}
      className={`inline-flex items-center gap-1 align-middle ${className}`}
    >
      <FlagImage code={flags.source} size={size} />
      <span className="text-[10px] font-semibold text-muted-foreground">→</span>
      <FlagImage code={flags.target} size={size} />
    </span>
  )
}

/** Accessible text for the pair, e.g. "PT → EN", for screen readers/titles. */
export function flagPairTitle(pair: { source: string; target: string }): string {
  return pairChipLabel(pair)
}
