'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface RegisteredWidget {
  id: string
  label: string
  total: number
}

export interface LessonWidgetResult {
  id: string
  label: string
  total: number
  correct: number
  missed: string[]
  answered: boolean
  /** Authored, stable identifier (e.g. the question fence's `id`). Optional. */
  key?: string
}

export interface LessonScoreValue {
  claimId: (prefix: string) => string
  register: (widget: RegisteredWidget) => void
  report: (result: LessonWidgetResult) => void
  registered: Record<string, RegisteredWidget>
  results: Record<string, LessonWidgetResult>
}

function noop(): void {
  /* claimed ids are only minted inside a provider */
}

const noopValue: LessonScoreValue = {
  claimId: () => '',
  register: noop,
  report: noop,
  registered: {},
  results: {},
}

const LessonScoreContext = createContext<LessonScoreValue>(noopValue)

function sameWidget(a: RegisteredWidget | undefined, b: RegisteredWidget): boolean {
  return !!a && a.label === b.label && a.total === b.total
}

function sameResult(a: LessonWidgetResult | undefined, b: LessonWidgetResult): boolean {
  if (!a || a.answered !== b.answered || a.correct !== b.correct || a.total !== b.total || a.label !== b.label) return false
  return a.missed.length === b.missed.length && a.missed.every((m, i) => m === b.missed[i])
}

export function LessonScoreProvider({ children }: { children: ReactNode }) {
  const [registered, setRegistered] = useState<Record<string, RegisteredWidget>>({})
  const [results, setResults] = useState<Record<string, LessonWidgetResult>>({})
  const counterRef = useRef(0)
  const claimedRef = useRef(new Set<string>())

  const claimId = useCallback((prefix: string): string => {
    let id: string
    do {
      counterRef.current += 1
      id = `${prefix}-${counterRef.current}`
    } while (claimedRef.current.has(id))
    claimedRef.current.add(id)
    return id
  }, [])

  const register = useCallback((widget: RegisteredWidget) => {
    setRegistered(prev => (sameWidget(prev[widget.id], widget) ? prev : { ...prev, [widget.id]: widget }))
  }, [])

  const report = useCallback((result: LessonWidgetResult) => {
    setResults(prev => (sameResult(prev[result.id], result) ? prev : { ...prev, [result.id]: result }))
  }, [])

  const value = useMemo<LessonScoreValue>(
    () => ({ claimId, register, report, registered, results }),
    [claimId, register, report, registered, results]
  )

  return <LessonScoreContext.Provider value={value}>{children}</LessonScoreContext.Provider>
}

export function useLessonScore(): LessonScoreValue {
  return useContext(LessonScoreContext)
}

export interface LessonScoreWidget {
  scoreId: string
  register: LessonScoreValue['register']
  report: LessonScoreValue['report']
}

export function useLessonScoreWidget(prefix: string): LessonScoreWidget {
  const score = useLessonScore()
  const idRef = useRef<string | null>(null)
  if (idRef.current === null) idRef.current = score.claimId(prefix)
  return { scoreId: idRef.current, register: score.register, report: score.report }
}

export interface LessonScoreSummaryProps {
  dict?: any
}

export function LessonScoreSummary({ dict }: LessonScoreSummaryProps) {
  const { registered, results } = useLessonScore()
  const s = dict?.lesson?.score

  const registeredList = useMemo(() => Object.values(registered), [registered])
  const expected = registeredList.reduce((sum, w) => sum + w.total, 0)
  const answeredList = useMemo(() => Object.values(results).filter(r => r.answered), [results])
  const correct = answeredList.reduce((sum, r) => sum + r.correct, 0)
  const unansweredWidgets = registeredList.filter(w => results[w.id]?.answered !== true).length
  const missed = useMemo(() => {
    const seen = new Set<string>()
    const items: string[] = []
    for (const r of answeredList) {
      for (const m of r.missed) {
        if (!seen.has(m)) {
          seen.add(m)
          items.push(m)
        }
      }
    }
    return items
  }, [answeredList])

  if (registeredList.length === 0 || expected === 0) return null

  const allAnswered = unansweredWidgets === 0
  const percent = expected > 0 ? correct / expected : 0
  const suggestComplete = allAnswered && percent >= 0.7

  return (
    <div
      data-testid="lesson-score-summary"
      /* Status chrome, not lesson prose: the read-aloud feature skips it. */
      data-audio-skip
      className="mt-8 rounded-xl border bg-muted/30 p-4 sm:p-6 space-y-3"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{s?.title || 'Knowledge check'}</span>
        <span className="text-sm font-bold tabular-nums text-primary">
          {(s?.result || '{correct}/{total} correct')
            .replace('{correct}', String(correct))
            .replace('{total}', String(expected))}
        </span>
      </div>

      {!allAnswered && (
        <p className="text-xs text-muted-foreground">
          {(s?.unanswered || '{n} remaining').replace('{n}', String(unansweredWidgets))}
        </p>
      )}

      {missed.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s?.missed || 'Items to review'}</p>
          <ul className="space-y-1">
            {missed.slice(0, 20).map(item => (
              <li key={item} className="text-sm text-foreground/80 break-words">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestComplete && (
        <p className="text-sm font-medium text-green-700 dark:text-green-400">{s?.suggest_complete || 'Nice work: mark the lesson as complete'}</p>
      )}
    </div>
  )
}
