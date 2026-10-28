'use client'

import { useEffect, useRef } from 'react'
import { useLessonScore } from './LessonScoreContext'
import { recordPracticeAnswer, stablePracticeKey } from '@/lib/practice/record'
import { newCard, reviewCard } from '@/lib/practice/fsrs'
import { getReviewCards, saveReviewCard } from '@/lib/practice/cards'

interface PracticeRecorderProps {
  courseSlug: string
  lessonSlug: string
  /** Lesson-level skill tags from frontmatter (v1: usually 0 or 1). */
  skills?: string[]
}

/**
 * Headless bridge between lesson widgets and the persisted learner model.
 * Renders nothing. On every new widget result it (a) updates the per-course
 * practice answer store and (b) schedules the FSRS review card for that
 * question. Exam-mode lessons do not mount this component.
 */
export default function PracticeRecorder({ courseSlug, lessonSlug, skills = [] }: PracticeRecorderProps) {
  const { results } = useLessonScore()
  const seenRef = useRef<Record<string, string>>({})

  useEffect(() => {
    for (const result of Object.values(results)) {
      if (!result.answered) continue
      const signature = `${result.correct}|${result.missed.length}`
      if (seenRef.current[result.id] === signature) continue
      seenRef.current[result.id] = signature

      const key = stablePracticeKey(courseSlug, result.key, lessonSlug, result.label)
      const skill = skills.length === 1 ? skills[0] : null
      const correct = result.correct > 0

      recordPracticeAnswer(courseSlug, lessonSlug, { key, label: result.label, skill, correct })

      const now = new Date()
      const cards = getReviewCards()
      const existing = cards[key]
      const { next } = existing
        ? reviewCard(existing, correct, now)
        : reviewCard(newCard(key, courseSlug, lessonSlug, now), correct, now)
      saveReviewCard(next)
    }
  }, [results, courseSlug, lessonSlug, skills])

  return null
}
