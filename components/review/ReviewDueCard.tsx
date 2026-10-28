'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { getDueCards } from '@/lib/practice/cards'

/** Courses-page card: how many review cards are due today. Renders nothing when zero. */
export default function ReviewDueCard({ lang }: { lang: Locale }) {
  const [due, setDue] = useState<number | null>(null)

  useEffect(() => {
    setDue(getDueCards().length)
  }, [])

  if (due === null || due === 0) return null

  return (
    <Link
      href={`/${lang}/review/`}
      data-testid="review-due-card"
      className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10"
    >
      <CalendarClock className="h-4 w-4 text-primary" />
      {due} {due === 1 ? 'card' : 'cards'} due for review
    </Link>
  )
}
