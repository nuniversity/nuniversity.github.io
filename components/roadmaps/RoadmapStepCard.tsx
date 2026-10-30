'use client'

import Link from '@/components/navigation/AppLink'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lightbulb,
  MessageCircle,
  GitBranch,
  BookOpen,
  Flag,
  Play,
} from 'lucide-react'
import { STEP_TYPE_CONFIG, type RoadmapMetadata } from '@/lib/roadmaps/types'
import { type RoadmapStepState } from '@/lib/roadmaps/step-graph'
import { type Locale } from '@/lib/i18n/config'

interface RoadmapStepCardProps {
  state: RoadmapStepState
  roadmap: RoadmapMetadata
  isExpanded: boolean
  onToggle: () => void
  onToggleComplete: () => void
  lang: Locale
  dict: any
  lockedByLabel: (id: string) => string
}

const STATUS_CLASSES: Record<RoadmapStepState['status'], string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  current: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  available: 'bg-muted text-muted-foreground',
  locked: 'bg-muted text-muted-foreground',
}

export function RoadmapStepCard({
  state,
  roadmap,
  isExpanded,
  onToggle,
  onToggleComplete,
  lang,
  dict,
  lockedByLabel,
}: RoadmapStepCardProps) {
  const { step, index, completed, locked, current, status, lockedBy, content } = state
  const typeConfig = STEP_TYPE_CONFIG[step.type]
  const titleId = `step-label-${step.id}`
  const panelId = `step-panel-${step.id}`
  const statusLabel =
    dict.roadmaps?.[status] || (status === 'completed' ? 'Completed' : status === 'current' ? 'Current' : status === 'locked' ? 'Locked' : 'Available')

  const openLabel =
    content?.kind === 'course'
      ? dict.roadmaps?.goToCourse || 'Go to course'
      : dict.roadmaps?.openResource || 'Open resource'

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.04 }}
      className="relative flex gap-3 sm:gap-4"
    >
      <div className="flex w-8 shrink-0 flex-col items-center pt-4">
        <button
          type="button"
          onClick={onToggleComplete}
          disabled={locked}
          aria-label={
            completed
              ? dict.roadmaps?.markIncomplete || 'Mark step as not complete'
              : dict.roadmaps?.markComplete || 'Mark as complete'
          }
          aria-pressed={completed}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
            completed
              ? 'border-green-500 bg-green-500 text-white'
              : current
                ? 'border-blue-500 bg-blue-500 text-white'
                : locked
                  ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary'
          }`}
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ) : locked ? (
            <Lock className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Circle className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <span className="mt-2 w-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <div
        className={`mb-2 min-w-0 flex-1 rounded-xl border bg-card transition-shadow ${
          current ? 'border-primary shadow-md' : completed ? 'border-green-300 dark:border-green-700' : 'border-border'
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="flex w-full items-start gap-3 rounded-xl p-4 text-left hover:bg-accent/40 sm:p-5"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            {step.type === 'milestone' ? (
              <Flag className="h-4 w-4 text-amber-500" aria-hidden="true" />
            ) : (
              <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold text-white ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[status]}`}>
                {statusLabel}
              </span>
              {step.estimatedDuration && (
                <span className="text-xs text-muted-foreground">{step.estimatedDuration}</span>
              )}
            </span>
            <span id={titleId} className="block text-lg font-semibold leading-snug">
              {step.title}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground line-clamp-2">{step.description}</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={titleId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t p-4 sm:p-5">
                {locked && lockedBy.length > 0 && (
                  <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    {dict.roadmaps?.lockedHint || 'Finish these steps first:'}{' '}
                    {lockedBy.map((id, position) => (
                      <span key={id}>
                        {position > 0 && ', '}
                        <a href={`#step-${id}`} className="font-medium underline underline-offset-2">
                          {lockedByLabel(id)}
                        </a>
                      </span>
                    ))}
                  </p>
                )}

                {step.comments && (
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {dict.roadmaps?.comments || 'Comment'}
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-200">{step.comments}</p>
                      </div>
                    </div>
                  </div>
                )}

                {step.ideas.length > 0 && (
                  <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" aria-hidden="true" />
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                          {dict.roadmaps?.ideas || 'Ideas to Practice'}
                        </h4>
                        <ul className="space-y-1">
                          {step.ideas.map((idea) => (
                            <li
                              key={idea}
                              className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
                              {idea}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {step.prerequisites.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <GitBranch className="h-4 w-4" aria-hidden="true" />
                      {dict.roadmaps?.prerequisites || 'Prerequisites'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {step.prerequisites.map((prereq) => (
                        <a
                          key={prereq}
                          href={`#step-${prereq}`}
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary"
                        >
                          {lockedByLabel(prereq)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {step.relationships.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <GitBranch className="h-4 w-4" aria-hidden="true" />
                      {dict.roadmaps?.nextSteps || 'Next Steps'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {step.relationships.map((relationship) => (
                        <a
                          key={`${relationship.leadsTo}-${relationship.type}`}
                          href={`#step-${relationship.leadsTo}`}
                          className={`rounded-full px-3 py-1 text-xs ${
                            relationship.type === 'required'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-primary-soft text-primary-soft-foreground dark:text-primary'
                          }`}
                        >
                          {lockedByLabel(relationship.leadsTo)}
                          {relationship.type === 'optional' &&
                            ` (${dict.roadmaps?.optional || 'optional'})`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {content && (
                  <Link
                    href={content.href}
                    {...(content.kind === 'external'
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-medium text-white transition-all hover:from-green-700 hover:to-emerald-700"
                  >
                    {content.kind === 'external' ? (
                      <ExternalLink className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Play className="h-5 w-5" aria-hidden="true" />
                    )}
                    {openLabel}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={onToggleComplete}
                  disabled={locked}
                  className={`w-full rounded-lg py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  {completed
                    ? dict.roadmaps?.completed || 'Completed'
                    : dict.roadmaps?.markComplete || 'Mark as Complete'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}
