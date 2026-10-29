'use client'

import { FlagImage } from '@/components/ui/flag'
import { flagCodeFor } from '@/lib/languages/format'

/**
 * Flags for a generic language pair (PT → EN, ES → PT, ...) used across the
 * Languages app resources: activity cards, hub group headers, pair pages.
 * Both languages must have flag artwork, otherwise the component renders
 * nothing and the caller keeps its text chip.
 */
export function PairFlags({
  source,
  target,
  size = 16,
  className = '',
}: {
  source: string
  target: string
  size?: number
  className?: string
}) {
  const sourceCode = flagCodeFor(source)
  const targetCode = flagCodeFor(target)
  if (!sourceCode || !targetCode) return null

  return (
    <span
      role="img"
      aria-label={`${source.toUpperCase()} → ${target.toUpperCase()}`}
      title={`${source.toUpperCase()} → ${target.toUpperCase()}`}
      className={`inline-flex items-center gap-1 align-middle ${className}`}
    >
      <FlagImage code={sourceCode} size={size} />
      <span className="text-[10px] font-semibold text-muted-foreground">→</span>
      <FlagImage code={targetCode} size={size} />
    </span>
  )
}
