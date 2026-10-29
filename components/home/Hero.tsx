// components/home/Hero.tsx
'use client'

import Link from '@/components/navigation/AppLink'
import { ArrowRight, Sparkles, PlayCircle } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import HeroSearch from './HeroSearch'

interface HeroProps {
  lang: Locale
  dict: Dictionary
}

/**
 * The home hero.
 *
 * Deliberately *not* a full-bleed gradient slab: the brand gradient belongs
 * to the chrome and to a single primary action, so the page reads as a light
 * editorial surface with depth rather than one big colour block.
 */
export default function Hero({ lang, dict }: HeroProps) {
  return (
    <section className="relative border-b border-border/60 bg-background">
      {/* Ambient brand light — the section colours bleed in as soft fields.
          The clipping lives on this inner wrapper so the search dropdown is
          free to overflow the hero instead of being cut off by it. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-40 top-10 h-[26rem] w-[26rem] rounded-full bg-section-library/10 blur-3xl" />
        <div className="absolute bottom-[-14rem] left-1/4 h-[24rem] w-[24rem] rounded-full bg-section-languages/10 blur-3xl" />
        {/* Fine grid for a sense of structure */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border) / 0.55) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.55) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 75% 55% at 50% 0%, #000 35%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 75% 55% at 50% 0%, #000 35%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative container-custom pb-20 pt-16 md:pb-24 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-foreground-muted backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-section-courses" aria-hidden="true" />
            {dict.hero.badge}
          </span>

          <h1
            className="animate-fade-in-up mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            style={{ animationDelay: '60ms' }}
          >
            {dict.hero.title}{' '}
            <span className="text-gradient">{dict.hero.titleHighlight}</span>
          </h1>

          <p
            className="animate-fade-in-up mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-foreground-muted sm:text-xl"
            style={{ animationDelay: '120ms' }}
          >
            {dict.hero.subtitle}
          </p>

          {/* Search-first entry point — a real type-ahead, not a shortcut.
              The animation lives on the field row, not on a wrapper, so the
              results panel is never trapped behind later content. */}
          <HeroSearch
            lang={lang}
            dict={dict}
            placeholder={dict.hero.search_placeholder || 'What do you want to learn?'}
            label={dict.hero.search_placeholder || 'Search courses, lessons and tools'}
            fieldClassName="animate-fade-in-up"
            animationDelay="180ms"
          />

          <div
            className="animate-fade-in-up mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            style={{ animationDelay: '240ms' }}
          >
            <Link href={`/${lang}/courses`} className="btn btn-primary btn-lg group w-full sm:w-auto">
              <span>{dict.hero.cta.explore}</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link href={`/${lang}/roadmaps`} className="btn btn-secondary btn-lg group w-full sm:w-auto">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              <span>{dict.navigation.roadmaps || 'Roadmaps'}</span>
            </Link>
          </div>

          {/* Capability chips */}
          <ul
            className="animate-fade-in-up mt-9 flex flex-wrap items-center justify-center gap-2"
            style={{ animationDelay: '300ms' }}
          >
            {[
              {
                label: dict.hero.features.coding,
                dot: 'bg-section-courses',
                text: 'text-section-courses',
              },
              { label: dict.hero.features.tools, dot: 'bg-section-tools', text: 'text-section-tools' },
              {
                label: dict.hero.features.courses,
                dot: 'bg-section-quizzes',
                text: 'text-section-quizzes',
              },
            ].map(chip => (
              <li
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-foreground-muted backdrop-blur"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} aria-hidden="true" />
                {chip.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
