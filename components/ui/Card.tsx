import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  /** Adds the hover lift + focus ring treatment for interactive cards. */
  interactive?: boolean
  as?: 'div' | 'article' | 'section' | 'li'
}

const BASE = 'card'
const INTERACTIVE = 'card-hover'

/**
 * The shared card surface.
 *
 * Replaces the ad-hoc `rounded-xl border bg-card shadow-sm` pattern that was
 * repeated across the codebase, so elevation, radius and hover behaviour are
 * consistent everywhere.
 */
export function Card({ children, className = '', interactive = false, as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`${BASE} ${interactive ? INTERACTIVE : ''} ${className}`}>{children}</Tag>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div
      className={`flex items-center gap-2 border-b border-border bg-surface-sunken px-4 py-2.5 text-sm font-semibold text-foreground ${className}`}
    >
      {children}
    </div>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`p-4 ${className}`}>{children}</div>
}

interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>
}

export default Card
