'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map, Clock, TrendingUp, RotateCcw } from 'lucide-react'
import { type RoadmapMetadata, type RoadmapProgress } from '@/lib/roadmaps/types'
import { type Locale } from '@/lib/i18n/config'
import { RoadmapStepCard } from './RoadmapStepCard'

interface RoadmapTimelineProps {
  roadmap: RoadmapMetadata
  lang: Locale
  dict: any
}

export function RoadmapTimeline({ roadmap, lang, dict }: RoadmapTimelineProps) {
  const [progress, setProgress] = useState<RoadmapProgress>({
    roadmapId: roadmap.id,
    completedSteps: [],
    startedAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
  })

  useEffect(() => {
    const saved = localStorage.getItem(`roadmap-progress-${roadmap.id}`)
    if (saved) {
      try {
        setProgress({ ...JSON.parse(saved), lastAccessed: new Date().toISOString() })
      } catch (e) {
        console.error('Failed to parse saved progress', e)
      }
    }
  }, [roadmap.id])

  useEffect(() => {
    localStorage.setItem(`roadmap-progress-${roadmap.id}`, JSON.stringify(progress))
  }, [progress, roadmap.id])

  const toggleStepComplete = (stepId: string) => {
    setProgress(prev => {
      const isCompleted = prev.completedSteps.includes(stepId)
      return {
        ...prev,
        completedSteps: isCompleted
          ? prev.completedSteps.filter(id => id !== stepId)
          : [...prev.completedSteps, stepId],
        lastAccessed: new Date().toISOString(),
      }
    })
  }

  const resetProgress = () => {
    setProgress({
      roadmapId: roadmap.id,
      completedSteps: [],
      startedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    })
  }

  const completionPercentage = Math.round((progress.completedSteps.length / roadmap.steps.length) * 100)

  const isStepLocked = (stepId: string, index: number): boolean => {
    if (index === 0) return false
    const step = roadmap.steps.find(s => s.id === stepId)
    if (!step || step.prerequisites.length === 0) return false
    
    return !step.prerequisites.every(prereq => progress.completedSteps.includes(prereq))
  }

  const isStepCurrent = (stepId: string, index: number): boolean => {
    if (index === 0) return progress.completedSteps.length === 0
    const step = roadmap.steps.find(s => s.id === stepId)
    if (!step) return false
    
    const allPrereqsComplete = step.prerequisites.every(prereq => progress.completedSteps.includes(prereq))
    const notCompleted = !progress.completedSteps.includes(stepId)
    
    return allPrereqsComplete && notCompleted
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{roadmap.title}</h1>
            <p className="text-muted-foreground">{roadmap.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{dict.roadmaps?.duration || 'Duration'}</span>
            </div>
            <p className="font-semibold">{roadmap.estimatedDuration}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{dict.roadmaps?.steps || 'Steps'}</span>
            </div>
            <p className="font-semibold">{roadmap.steps.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Map className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{dict.roadmaps?.difficulty || 'Difficulty'}</span>
            </div>
            <p className="font-semibold capitalize">{roadmap.difficulty}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{dict.roadmaps?.progress || 'Progress'}</span>
            </div>
            <p className="font-semibold">{completionPercentage}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{dict.roadmaps?.overallProgress || 'Overall Progress'}</span>
            <span className="text-sm font-semibold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {progress.completedSteps.length} {dict.roadmaps?.of || 'of'} {roadmap.steps.length} {dict.roadmaps?.stepsCompleted || 'steps completed'}
            </span>
            {progress.completedSteps.length > 0 && (
              <button
                onClick={resetProgress}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {dict.roadmaps?.reset || 'Reset'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />

        {/* Steps */}
        <div className="space-y-6">
          {roadmap.steps.map((step, index) => (
            <RoadmapStepCard
              key={step.id}
              step={step}
              index={index}
              isCompleted={progress.completedSteps.includes(step.id)}
              isLocked={isStepLocked(step.id, index)}
              isCurrent={isStepCurrent(step.id, index)}
              onToggleComplete={toggleStepComplete}
              lang={lang}
              dict={dict}
            />
          ))}
        </div>
      </div>

      {/* Completion message */}
      {completionPercentage === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-2">🎉 {dict.roadmaps?.congratulations || 'Congratulations!'}</h2>
          <p className="text-lg">{dict.roadmaps?.roadmapComplete || 'You have completed this roadmap!'}</p>
        </motion.div>
      )}
    </div>
  )
}
