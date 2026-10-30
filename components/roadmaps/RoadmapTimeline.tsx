'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Map, Clock, TrendingUp, RotateCcw, Play, Share2, CheckCircle2 } from 'lucide-react'
import { type RoadmapMetadata } from '@/lib/roadmaps/types'
import { type Locale } from '@/lib/i18n/config'
import { buildRoadmapGraph, stepTitle } from '@/lib/roadmaps/step-graph'
import {
  emptyRoadmapProgress,
  getRoadmapProgress,
  hasRoadmapReward,
  markRoadmapReward,
  resetRoadmapProgress,
  saveRoadmapProgress,
  toggleRoadmapStep,
} from '@/lib/roadmaps/storage'
import type { RoadmapProgress } from '@/lib/roadmaps/types'
import { recordAndEmit } from '@/lib/gamification/bus'
import { RoadmapStepCard } from './RoadmapStepCard'

interface RoadmapTimelineProps {
  roadmap: RoadmapMetadata
  lang: Locale
  dict: any
}

const STEP_QUERY = 'step'

function readStepParam(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(STEP_QUERY)
}

function writeStepParam(stepId: string | null): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return
  const url = new URL(window.location.href)
  if (stepId) url.searchParams.set(STEP_QUERY, stepId)
  else url.searchParams.delete(STEP_QUERY)
  window.history.replaceState(window.history.state, '', url.toString())
}

export function RoadmapTimeline({ roadmap, lang, dict }: RoadmapTimelineProps) {
  const [progress, setProgress] = useState<RoadmapProgress>(() => emptyRoadmapProgress(roadmap.id))
  const [hydrated, setHydrated] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Load once after mount, then persist on every change. The `hydrated` gate
  // prevents the initial empty state from overwriting saved progress.
  useEffect(() => {
    const saved = getRoadmapProgress(roadmap.id) ?? emptyRoadmapProgress(roadmap.id)
    setProgress(saved)
    setHydrated(true)
  }, [roadmap.id])

  useEffect(() => {
    if (hydrated) saveRoadmapProgress(progress)
  }, [progress, hydrated])

  const graph = useMemo(
    () => buildRoadmapGraph(roadmap, progress.completedSteps, lang),
    [roadmap, progress.completedSteps, lang]
  )

  // Expand the current step by default, or the step named in the share URL.
  useEffect(() => {
    if (!hydrated) return
    const requested = readStepParam()
    if (requested && roadmap.steps.some((step) => step.id === requested)) {
      setExpandedId(requested)
      return
    }
    setExpandedId((current) => current ?? graph.currentStepId ?? roadmap.steps[0]?.id ?? null)
  }, [hydrated, graph.currentStepId, roadmap.steps])

  const expand = useCallback((stepId: string) => {
    setExpandedId((current) => (current === stepId ? null : stepId))
    writeStepParam(stepId)
  }, [])

  const toggleStep = useCallback(
    (stepId: string) => {
      const next = toggleRoadmapStep(progress, stepId)
      setProgress(next)
      const nextComplete =
        roadmap.steps.length > 0 && roadmap.steps.every((step) => next.completedSteps.includes(step.id))
      if (nextComplete && !hasRoadmapReward(roadmap.id)) {
        markRoadmapReward(roadmap.id)
        recordAndEmit({ type: 'roadmap-complete', roadmapId: roadmap.id })
      }
    },
    [progress, roadmap.id, roadmap.steps]
  )

  const reset = useCallback(() => {
    setProgress(resetRoadmapProgress(roadmap.id))
    setExpandedId(null)
    writeStepParam(null)
  }, [roadmap.id])

  const copyStepLink = useCallback(async () => {
    const stepId = expandedId ?? graph.currentStepId
    if (!stepId || typeof window === 'undefined') return
    if (!navigator.clipboard?.writeText) return
    const url = new URL(window.location.href)
    url.searchParams.set(STEP_QUERY, stepId)
    try {
      await navigator.clipboard?.writeText(url.toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard is optional; the URL is still visible in the address bar.
    }
  }, [expandedId, graph.currentStepId])

  const continueLearning = useCallback(() => {
    const id = graph.nextStepId ?? graph.currentStepId ?? roadmap.steps[0]?.id
    if (!id) return
    setExpandedId(id)
    writeStepParam(id)
    document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [graph.nextStepId, graph.currentStepId, roadmap.steps])

  return (
    <div className="mx-auto max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-mark">
            <Map className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold md:text-4xl">{roadmap.title}</h1>
            <p className="mt-1 text-muted-foreground">{roadmap.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat icon={Clock} label={dict.roadmaps?.duration || 'Duration'} value={roadmap.estimatedDuration} />
          <Stat icon={TrendingUp} label={dict.roadmaps?.steps || 'Steps'} value={String(roadmap.steps.length)} />
          <Stat
            icon={Map}
            label={dict.roadmaps?.difficulty || 'Difficulty'}
            value={
              dict.roadmaps?.difficultyLevels?.[String(roadmap.difficulty).toLowerCase()] ??
              roadmap.difficulty
            }
          />
          <Stat icon={CheckCircle2} label={dict.roadmaps?.progress || 'Progress'} value={`${graph.percent}%`} />
        </div>
      </motion.div>

      <div className="mb-8 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{dict.roadmaps?.overallProgress || 'Overall Progress'}</p>
            <p className="text-xs text-muted-foreground">
              {graph.completedCount} {dict.roadmaps?.of || 'of'} {graph.totalCount}{' '}
              {dict.roadmaps?.stepsCompleted || 'steps completed'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={continueLearning}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {dict.roadmaps?.continue || 'Continue'}
            </button>
            <button
              type="button"
              onClick={copyStepLink}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {copied ? dict.roadmaps?.linkCopied || 'Copied' : dict.roadmaps?.shareStep || 'Share step'}
            </button>
            {graph.completedCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-red-500"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {dict.roadmaps?.reset || 'Reset'}
              </button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{dict.roadmaps?.overallProgress || 'Overall Progress'}</span>
            <span className="font-semibold tabular-nums">{graph.percent}%</span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={graph.percent}
            aria-label={`${roadmap.title}: ${graph.percent}%`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${graph.percent}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-brand"
            />
          </div>
        </div>
      </div>

      <ol className="relative space-y-4" aria-label={roadmap.title}>
        {graph.states.map((state) => (
          <li key={state.step.id} id={`step-${state.step.id}`} aria-current={state.current ? 'step' : undefined}>
            <RoadmapStepCard
              state={state}
              roadmap={roadmap}
              isExpanded={expandedId === state.step.id}
              onToggle={() => expand(state.step.id)}
              onToggleComplete={() => toggleStep(state.step.id)}
              lang={lang}
              dict={dict}
              lockedByLabel={(id) => stepTitle(roadmap, id)}
            />
          </li>
        ))}
      </ol>

      {graph.complete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center text-white"
          role="status"
        >
          <h2 className="mb-2 text-2xl font-bold">🎉 {dict.roadmaps?.congratulations || 'Congratulations!'}</h2>
          <p className="text-lg">{dict.roadmaps?.roadmapComplete || 'You have completed this roadmap!'}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {dict.roadmaps?.reset || 'Reset'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Map
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
