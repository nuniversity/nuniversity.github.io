'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, Lock, ChevronDown, ChevronUp, ExternalLink, Lightbulb, MessageCircle, GitBranch, BookOpen } from 'lucide-react'
import { type RoadmapStep, type RoadmapRelationship, STEP_TYPE_CONFIG } from '@/lib/roadmaps/types'
import { type Locale } from '@/lib/i18n/config'

interface RoadmapStepProps {
  step: RoadmapStep
  index: number
  isCompleted: boolean
  isLocked: boolean
  isCurrent: boolean
  onToggleComplete: (stepId: string) => void
  lang: Locale
  dict: any
}

export function RoadmapStepCard({ step, index, isCompleted, isLocked, isCurrent, onToggleComplete, lang, dict }: RoadmapStepProps) {
  const [isExpanded, setIsExpanded] = useState(isCurrent)
  const stepConfig = STEP_TYPE_CONFIG[step.type]

  const handleToggle = () => {
    if (!isLocked) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLocked) {
      onToggleComplete(step.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative pl-8 md:pl-12 ${isLocked ? 'opacity-60' : ''}`}
    >
      {/* Timeline node */}
      <div className="absolute left-0 top-6 md:left-4">
        <button
          onClick={handleComplete}
          disabled={isLocked}
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : isCurrent
              ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
              : isLocked
              ? 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 text-gray-500'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-500'
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : isLocked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Step card */}
      <div
        onClick={handleToggle}
        className={`bg-card border rounded-xl p-4 md:p-6 cursor-pointer transition-all hover:shadow-lg ${
          isCurrent ? 'border-blue-500 shadow-md' : ''
        } ${isCompleted ? 'border-green-300 dark:border-green-700' : ''}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${stepConfig.color}`}>
                {stepConfig.label}
              </span>
              {step.estimatedDuration && (
                <span className="text-xs text-muted-foreground">{step.estimatedDuration}</span>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{step.description}</p>
          </div>
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t"
            >
              {/* Comments */}
              {step.comments && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">
                        {dict.roadmaps?.comments || 'Comment'}
                      </h4>
                      <p className="text-sm text-blue-600 dark:text-blue-200">{step.comments}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ideas */}
              {step.ideas.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                        {dict.roadmaps?.ideas || 'Ideas to Practice'}
                      </h4>
                      <ul className="space-y-1">
                        {step.ideas.map((idea, i) => (
                          <li key={i} className="text-sm text-yellow-600 dark:text-yellow-200 flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-yellow-500 rounded-full flex-shrink-0" />
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Prerequisites */}
              {step.prerequisites.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    {dict.roadmaps?.prerequisites || 'Prerequisites'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {step.prerequisites.map((prereq) => (
                      <span
                        key={prereq}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full"
                      >
                        {prereq.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships */}
              {step.relationships.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    {dict.roadmaps?.nextSteps || 'Next Steps'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {step.relationships.map((rel, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 text-xs rounded-full ${
                          rel.type === 'required'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {rel.leadsTo.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {rel.type === 'optional' && ` (${dict.roadmaps?.optional || 'optional'})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Go to Course button */}
              {step.contentRef && (
                <div className="mb-4">
                  <Link
                    href={`/${lang}/courses/${step.contentRef}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    <BookOpen className="w-5 h-5" />
                    {dict.roadmaps?.goToCourse || 'Go to Course'}
                  </Link>
                </div>
              )}

              {/* Action button */}
              {!isLocked && (
                <button
                  onClick={handleComplete}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCompleted
                    ? dict.roadmaps?.completed || 'Completed'
                    : dict.roadmaps?.markComplete || 'Mark as Complete'}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
