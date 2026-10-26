import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * A designed empty state.
 *
 * Used wherever a filter or list can legitimately produce nothing — an empty
 * grid reads as a broken page, so every empty result explains itself and
 * offers a way forward.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-foreground-subtle"
        aria-hidden="true"
      >
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-md text-sm leading-relaxed text-foreground-muted">{description}</p>
      )}
      {action}
    </div>
  )
}

export default EmptyState
