'use client'

import { BookMarked } from 'lucide-react'

export interface GlossaryTerm {
  term: string
  definition: string
}

export interface GlossaryConfig {
  terms: GlossaryTerm[]
}

/** Pre-training key terms. Support material, not lesson prose (audio skips it). */
export default function GlossaryBlock({ data, dict }: { data: GlossaryConfig; dict?: any }) {
  return (
    <div className="my-8 rounded-xl border bg-muted/30 p-4 sm:p-6" data-audio-skip>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <BookMarked className="h-4 w-4 text-primary" />
        {dict?.glossary?.title || 'Key terms'}
      </p>
      <dl className="space-y-2">
        {data.terms.map((entry) => (
          <details key={entry.term} className="group rounded-lg border bg-card px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">{entry.term}</summary>
            <dd className="mt-1 text-sm text-foreground/80">{entry.definition}</dd>
          </details>
        ))}
      </dl>
    </div>
  )
}
