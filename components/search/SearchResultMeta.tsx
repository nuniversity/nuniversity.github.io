'use client'

import { resultChips, resultContext, type ResultChip } from '@/lib/search/result-meta'
import type { SearchDoc } from '@/lib/search/matcher'

interface SearchResultMetaProps {
  doc: SearchDoc
  /** Render the parent course / position line above the chips. */
  showContext?: boolean
  className?: string
}

/**
 * The metadata block under a search result.
 *
 * Shared by the hero type-ahead and the command palette so both surfaces
 * render identically — a divergence between them is what makes a feature
 * appear on one screen and not another.
 *
 * The chips carry their own border so they stay legible on any surface, in
 * both the light and the dark theme, rather than relying on a subtle
 * background tint that can disappear against the panel behind it.
 */
export function SearchResultMeta({ doc, showContext = true, className = '' }: SearchResultMetaProps) {
  const context = showContext ? resultContext(doc) : null
  const chips = resultChips(doc)

  if (!context && chips.length === 0) return null

  return (
    <span className={`mt-1.5 block ${className}`}>
      {context && (
        <span className="mb-1 block truncate text-xs font-medium text-section-courses">
          {context}
        </span>
      )}
      {chips.length > 0 && (
        <span className="flex flex-wrap items-center gap-1">
          {chips.map(chip => (
            <Chip key={chip.label} chip={chip} />
          ))}
        </span>
      )}
    </span>
  )
}

function Chip({ chip }: { chip: ResultChip }) {
  const tone =
    chip.tone === 'success'
      ? 'border-success/40 bg-success-soft text-success-foreground'
      : chip.tone === 'warning'
        ? 'border-warning/40 bg-warning-soft text-warning-foreground'
        : chip.tone === 'danger'
          ? 'border-danger/40 bg-danger-soft text-danger-foreground'
          : 'border-border-strong bg-surface-sunken text-foreground-muted'

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-tight ${tone}`}
    >
      {chip.label}
    </span>
  )
}

export default SearchResultMeta
