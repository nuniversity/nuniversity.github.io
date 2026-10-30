'use client'

import type { LucideIcon } from 'lucide-react'

interface ToolHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  /** Tailwind gradient stops, e.g. `from-blue-600 to-cyan-600`. */
  gradient?: string
  /** `gradient` paints the icon tile with the tool gradient; `brand` uses the brand mark. */
  variant?: 'gradient' | 'brand'
}

/**
 * Shared tool hero: icon tile, gradient title and subtitle.
 * Every tool previously duplicated this block with slightly different markup.
 */
export function ToolHeader({
  icon: Icon,
  title,
  subtitle,
  gradient = 'from-blue-600 to-cyan-600',
  variant = 'gradient',
}: ToolHeaderProps) {
  return (
    <header className="text-center mb-8">
      <div
        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
          variant === 'brand' ? 'bg-brand-mark' : `bg-gradient-to-br ${gradient}`
        }`}
      >
        <Icon className="w-8 h-8 text-white" aria-hidden="true" />
      </div>
      <h1
        className={`text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent pb-1 ${
          variant === 'brand' ? 'bg-brand' : `bg-gradient-to-r ${gradient}`
        }`}
      >
        {title}
      </h1>
      <p className="text-muted-foreground text-lg">{subtitle}</p>
    </header>
  )
}
