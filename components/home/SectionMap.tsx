// components/home/SectionMap.tsx
'use client'

import Link from '@/components/navigation/AppLink'
import { ArrowUpRight } from 'lucide-react'
import { sections, sectionOrder, type SectionId } from '@/lib/navigation/sections'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface SectionMapProps {
  lang: Locale
  dict: Dictionary
}

/**
 * The site's colour map, rendered on the home page.
 *
 * Every top-level section owns a colour. Showing them together makes the
 * colour a genuine wayfinding cue: once a learner learns that "violet means
 * Courses", they can find it again from any page.
 */
export default function SectionMap({ lang, dict }: SectionMapProps) {
  const descriptions: Record<SectionId, string> = {
    general: dict.features?.items?.community?.description || dict.metadata?.home?.description || '',
    courses: dict.courses?.subtitle || '',
    tools: dict.tools?.subtitle || '',
    games: dict.games?.subtitle || '',
    quizzes: dict.quizzes?.subtitle || '',
    library: dict.library?.subtitle || '',
    roadmaps: dict.features?.items?.study?.description || '',
    languages: dict.metadata?.languages?.description || '',
  }

  return (
    <section className="bg-background pb-16 pt-24 md:pb-20 md:pt-28" aria-labelledby="section-map-title">
      <div className="container-custom">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="section-map-title"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {dict.features?.title || 'Everything you need to learn'}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">
            {dict.features?.subtitle ||
              'Eight areas, each with its own colour. Learn the colour, and you always know where you are.'}
          </p>
        </div>

        <ul className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectionOrder.map((id, index) => {
            const section = sections[id]
            const Icon = section.icon
            const href = section.path ? `/${lang}/${section.path}` : `/${lang}`
            const description = descriptions[id]

            return (
              <li key={id} style={{ '--i': index } as React.CSSProperties}>
                <Link
                  href={href}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 ${section.hoverBorder}`}
                >
                  {/* Colour wash that intensifies on hover */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      backgroundImage: `linear-gradient(135deg, hsl(var(--section-${
                        id === 'general' ? 'brand' : id
                      }-soft)) 0%, transparent 65%)`,
                    }}
                  />

                  <span
                    className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110 ${
                      id === 'general' ? 'bg-brand-mark' : section.gradient
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <h3 className="relative mt-4 text-base font-semibold text-foreground">
                    {id === 'general'
                      ? dict.navigation.home
                      : (dict.navigation[id] as string) || id}
                  </h3>

                  {description && (
                    <p className="relative mt-1.5 line-clamp-3 text-sm leading-relaxed text-foreground-muted">
                      {description}
                    </p>
                  )}

                  <span
                    className={`relative mt-4 inline-flex items-center gap-1 text-sm font-semibold ${
                      id === 'general' ? 'text-section-brand' : section.text
                    }`}
                  >
                    Explore
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
