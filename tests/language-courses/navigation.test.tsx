import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonPlayer } from '@/components/language-course/lesson-player'
import { StepVocab } from '@/components/language-course/steps-content'
import { StepSpeak } from '@/components/language-course/steps-production'
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
  { id: 'w002', source: 'good morning', target: 'bom dia', level: 'A1', topics: ['greetings'] },
  { id: 'w003', source: 'name', target: 'nome', level: 'A1', topics: ['people'] },
]

const grammar: GrammarPoint[] = [
  {
    id: 'g-be-present',
    title: { en: 'BE', pt: 'BE' },
    pattern: 'I am',
    tip: { en: 'Use am with I.', pt: 'Use am com I.' },
    examples: [],
  },
]

const stepProps = {
  lang: 'pt',
  source: 'pt',
  target: 'en',
  t: {},
  onResult: vi.fn(),
  onComplete: vi.fn(),
  vocabById: new Map(vocab.map((item) => [item.id, item])),
  grammarById: new Map(grammar.map((point) => [point.id, point])),
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('React', React)
  stepProps.onResult.mockClear()
  stepProps.onComplete.mockClear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('sub-step navigation', () => {
  it('vocab cards navigate back and forward, disabled at the edges', async () => {
    const user = userEvent.setup()
    render(
      <StepVocab
        {...stepProps}
        step={{ id: 's01', type: 'vocab', skill: 'vocabulary', vocabIds: ['w001', 'w002', 'w003'] }}
      />
    )

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByTestId('vocab-back')).toBeDisabled()

    await user.click(screen.getByTestId('vocab-forward'))
    expect(screen.getByText('good morning')).toBeInTheDocument()
    await user.click(screen.getByTestId('vocab-back'))
    expect(screen.getByText('hello')).toBeInTheDocument()

    // Forward twice reaches the last card, where forward disables.
    await user.click(screen.getByTestId('vocab-forward'))
    await user.click(screen.getByTestId('vocab-forward'))
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByTestId('vocab-forward')).toBeDisabled()
  })

  it('speak lines navigate back and forward without losing progress', async () => {
    const user = userEvent.setup()
    render(
      <StepSpeak
        {...stepProps}
        step={{
          id: 's05',
          type: 'speak',
          skill: 'speaking',
          prompt: { en: 'Speak', pt: 'Fale' },
          mode: 'shadow',
          lines: [
            { text: 'I am a student.', translation: 'Sou estudante.' },
            { text: 'I am from Brazil.', translation: 'Sou do Brasil.' },
          ],
        }}
      />
    )

    await user.click(screen.getByTestId('said-it'))
    expect(screen.getByText('I am from Brazil.')).toBeInTheDocument()

    await user.click(screen.getByTestId('speak-back'))
    expect(screen.getByText('I am a student.')).toBeInTheDocument()
    expect(screen.getByTestId('speak-forward')).toBeEnabled()

    await user.click(screen.getByTestId('speak-forward'))
    await user.click(screen.getByTestId('said-it'))
    expect(stepProps.onComplete).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Step-level navigation: back into visited steps, forward only up to the
// frontier, and no double-recording on revisit.
// ---------------------------------------------------------------------------

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

describe('step-level navigation', () => {
  function renderPlayer() {
    return render(
      <LessonPlayer
        lang="pt"
        course={course}
        unit={unit}
        lesson={lesson}
        vocab={vocab}
        grammar={grammar}
        nextHref="/pt/languages/courses/test-course/u1/l2/"
        dict={{}}
      />
    )
  }

  it('goes back to visited steps, replays graded ones read-only, and never double-records', async () => {
    const user = userEvent.setup()
    renderPlayer()

    // vocab: single card → continue completes the step.
    await user.click(screen.getByRole('button', { name: /continue/i }))
    // select: answer correctly, continue.
    await user.click(screen.getByTestId('option-0'))
    await user.click(screen.getByRole('button', { name: /continue/i }))
    // now at speak (frontier).
    expect(screen.getByTestId('step-speak')).toBeInTheDocument()

    // Back once lands on the graded select step → replay view, not re-answer.
    await user.click(screen.getByTestId('step-back'))
    expect(screen.getByTestId('step-replay')).toBeInTheDocument()
    expect(screen.getByTestId('step-replay').textContent).toContain('hello')

    // Back again lands on the vocab step → content steps stay interactive.
    await user.click(screen.getByTestId('step-back'))
    expect(screen.getByTestId('step-vocab')).toBeInTheDocument()

    // Completing revisited content steps advances without recording again.
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByTestId('step-replay')).toBeInTheDocument()

    // Forward through the replay reaches the speak frontier; finish.
    await user.click(screen.getByTestId('replay-forward'))
    expect(screen.getByTestId('step-speak')).toBeInTheDocument()
    await user.click(screen.getByTestId('said-it'))
    await waitFor(() => expect(screen.getByTestId('lesson-finish')).toBeInTheDocument())

    // Every step recorded exactly once, despite the revisit.
    const store = getPracticeStore('test-course')
    expect(store.answers['test-course::l1::s01']?.attempts).toBe(1)
    expect(store.answers['test-course::l1::s02']?.attempts).toBe(1)
    expect(getCourseProgress('test-course').units.u1?.lessons.l1).toBeDefined()
  })

  it('forward is capped at the frontier (cannot skip into unvisited steps)', async () => {
    const user = userEvent.setup()
    renderPlayer()

    // At the first step the forward button is disabled: nothing visited yet.
    expect(screen.getByTestId('step-forward')).toBeDisabled()
    expect(screen.getByTestId('step-back')).toBeDisabled()
  })
})
