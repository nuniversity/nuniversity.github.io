import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonPlayer } from '@/components/language-course/lesson-player'
import type {
  GrammarPoint,
  LanguageCourseMeta,
  LanguageLesson,
  UnitManifest,
  VocabItem,
} from '@/lib/language-courses/types'
import { getCourseProgress } from '@/lib/language-courses/storage'
import { getPracticeStore } from '@/lib/practice/record'

vi.stubGlobal('React', React)

const vocab: VocabItem[] = [
  { id: 'w001', source: 'hello', target: 'olá', level: 'A1', topics: ['greetings'] },
]

const grammar: GrammarPoint[] = []

const lesson: LanguageLesson = {
  id: 'test-course::u1::l1',
  slug: 'l1',
  unit: 'u1',
  order: 1,
  title: { en: 'Lesson one', pt: 'Lição um' },
  goal: { en: 'Test goal', pt: 'Meta de teste' },
  objectives: ['Objective one'],
  vocabIds: ['w001'],
  xp: 20,
  steps: [
    { id: 's01', type: 'vocab', skill: 'vocabulary', vocabIds: ['w001'] },
    {
      id: 's02',
      type: 'select',
      skill: 'vocabulary',
      prompt: { en: 'Choose', pt: 'Escolha' },
      question: 'olá em inglês:',
      options: ['hello', 'friend'],
      correct: 0,
    },
    {
      id: 's03',
      type: 'speak',
      skill: 'speaking',
      prompt: { en: 'Speak', pt: 'Fale' },
      mode: 'shadow',
      lines: [{ text: 'I am a student.', translation: 'Sou estudante.' }],
    },
  ],
}

const course: LanguageCourseMeta = {
  id: 'test-course',
  name: { en: 'Test course', pt: 'Curso de teste' },
  description: { en: 'A course for tests.', pt: 'Um curso para testes.' },
  source: 'pt',
  target: 'en',
  cefrTarget: 'A1',
  difficulty: 'beginner',
  units: [],
  grammar,
}

const unit: UnitManifest = {
  slug: 'u1',
  order: 1,
  title: { en: 'Unit one', pt: 'Unidade um' },
  description: { en: 'First unit', pt: 'Primeira unidade' },
  cefr: 'A1',
  objectives: [],
  lessons: [{ slug: 'l1', title: { en: 'Lesson one', pt: 'Lição um' } }],
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('React', React)
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('mistake replay (second-chance retrieval)', () => {
  it('missed steps return once at the end; retries record but the score is snapshotted', async () => {
    const user = userEvent.setup()
    render(
      <LessonPlayer
        lang="pt"
        course={course}
        unit={unit}
        lesson={lesson}
        vocab={vocab}
        grammar={grammar}
        nextHref="/pt/languages/courses/test-course/u1/l2/"
        dict={{ languageCourse: {} }}
      />
    )

    // s01 vocab → continue.
    await user.click(screen.getByRole('button', { name: /continue/i }))
    // s02 select → answer WRONG on purpose.
    await user.click(screen.getByTestId('option-1'))
    await user.click(screen.getByRole('button', { name: /continue/i }))
    // s03 speak → self-check → lesson completes.
    await user.click(screen.getByTestId('said-it'))

    // The replay phase appears with the missed step.
    const banner = await screen.findByTestId('replay-banner')
    expect(banner.textContent).toContain('Fix the mistakes')

    // The select step is served fresh: answer correctly this time.
    await user.click(screen.getByTestId('option-0'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(screen.getByTestId('lesson-finish')).toBeInTheDocument())

    // Retry recorded as a second attempt (1 wrong + 1 correct).
    const store = getPracticeStore('test-course')
    expect(store.answers['test-course::l1::s02']?.attempts).toBe(2)
    expect(store.answers['test-course::l1::s02']?.correct).toBe(1)

    // Lesson percent snapshotted BEFORE the replay (2/3 ≈ 67%), not inflated.
    const progress = getCourseProgress('test-course')
    expect(progress.units.u1?.lessons.l1?.bestPercent).toBe(67)
    expect(progress.units.u1?.lessons.l1?.lastPercent).toBe(67)
  })

  it('goes straight to the finish screen when nothing is missed', async () => {
    const user = userEvent.setup()
    render(
      <LessonPlayer
        lang="pt"
        course={course}
        unit={unit}
        lesson={lesson}
        vocab={vocab}
        grammar={grammar}
        nextHref="/pt/languages/courses/test-course/u1/l2/"
        dict={{ languageCourse: {} }}
      />
    )

    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.click(screen.getByTestId('option-0'))
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.click(screen.getByTestId('said-it'))

    await waitFor(() => expect(screen.getByTestId('lesson-finish')).toBeInTheDocument())
    expect(screen.queryByTestId('replay-banner')).toBeNull()

    const progress = getCourseProgress('test-course')
    expect(progress.units.u1?.lessons.l1?.bestPercent).toBe(100)
  })
})
