import type { ReactNode } from 'react'
import { sections, type SectionId } from '@/lib/navigation/sections'

interface SectionHeaderProps {
  section: SectionId
  icon: ReactNode
  title: string
  description?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * The header of a section's hub page.
 *
 * The icon tile carries the section's colour, so the colour map is visible
 * on every section landing page and reinforces the navigation indicator.
 */
export function SectionHeader({
  section,
  icon,
  title,
  description,
  children,
  className = '',
}: SectionHeaderProps) {
  const def = sections[section]
  const tile = section === 'general' ? 'bg-brand-mark' : def.gradient

  return (
    <div className={`text-center mb-12 ${className}`}>
      <div
        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${tile} shadow-lg shadow-black/10 mb-4`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">{title}</h1>
      {description && (
        <p className="text-lg text-foreground-muted max-w-2xl mx-auto">{description}</p>
      )}
      {children}
    </div>
  )
}

export default SectionHeader
