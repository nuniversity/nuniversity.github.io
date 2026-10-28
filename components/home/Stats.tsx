// components/home/Stats.tsx
'use client'

import { BookOpen, Wrench, GamepadIcon, Library, type LucideIcon } from 'lucide-react'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import StatCounter from './StatCounter'

const iconMap = {
  BookOpen,
  Wrench,
  GamepadIcon,
  Library,
} as const

export type StatIcon = keyof typeof iconMap

export interface StatItem {
  label: string
  value: string
  icon: StatIcon
}

/** Each stat carries the colour of the section it counts. */
const sectionOf: Record<StatIcon, string> = {
  BookOpen: 'bg-gradient-section-courses',
  Wrench: 'bg-gradient-section-tools',
  GamepadIcon: 'bg-gradient-section-games',
  Library: 'bg-gradient-section-library',
}

interface StatsProps {
  dict: Dictionary
  stats: StatItem[]
}

/**
 * A closing credibility band.
 *
 * It sits at the end of the page rather than near the top: the numbers are
 * supporting evidence, not the main story, so they follow the content.
 */
export default function Stats({ dict, stats }: StatsProps) {
  return (
    <section className="section bg-surface-sunken/60" aria-labelledby="stats-title">
      <div className="container-custom">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2
            id="stats-title"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {dict.stats?.title || 'Join our growing'}{' '}
            <span className="text-gradient">{dict.stats?.titleHighlight || 'community'}</span>
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">
            {dict.stats?.subtitle ||
              'Thousands of learners trust Nuniversity to advance their careers and knowledge.'}
          </p>
        </div>

        <dl className="stagger mx-auto grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = iconMap[stat.icon]
            return (
              <div
                key={stat.label}
                style={{ '--i': index } as React.CSSProperties}
                className="card card-hover flex flex-col items-center gap-3 p-6 text-center"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${sectionOf[stat.icon]} text-white`}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <dd className="text-3xl font-bold tracking-tight text-foreground">
                  <StatCounter value={stat.value} />
                </dd>
                <dt className="text-sm text-foreground-muted">{stat.label}</dt>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
