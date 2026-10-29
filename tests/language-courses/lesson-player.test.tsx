import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonPlayer } from '@/components/language-course/lesson-player'
import type {
  GrammarPoint,
  LanguageCourseMeta,
  LanguageLesson,
  VocabItem,
} from '@/lib/language-courses/types'
import { recordAndEmit } from '@/lib/gamification/bus'
import { getProfile } from '@/lib/gamification/profile'
import { getCourseProgress } from '@/lib/language-courses/storage'
import { getReviewCards } from '@/lib/practice/cards'


const vocab: VocabItem[] = [
  { id: 'w001', source: 'hello', target: 'olá', level: 'A1', topics: ['greetings'] },
  { id: 'w002', source: 'good morning', target: 'bom dia', level: 'A1', topics: ['greetings'] },
  { id: 'w003', source: 'name', target: 'nome', level: 'A1', topics: ['people'] },
  { id: 'w004', source: 'friend', target: 'amigo', level: 'A1', topics: ['people'] },
]

const grammar: GrammarPoint[] = [
  {
    id: 'g-be-present',
    title: { en: 'BE', pt: 'BE' },
    pattern: 'I am | You are | She is',
    tip: { en: 'Use am with I.', pt: 'Use am com I.' },
    examples: [{ en: 'I am Ana.', pt: 'Eu sou a Ana.' }],
  },
]

const lesson: LanguageLesson = {
  id: 'test-course::u1::l1',
  slug: 'l1',
  unit: 'u1',
  order: 1,
  title: { en: 'Lesson one', pt: 'Lição um' },
  goal: { en: 'Test goal', pt: 'Meta de teste' },
  objectives: ['Objective one'],
  vocabIds: ['w001', 'w002', 'w003'],
  xp: 20,
  steps: [
    { id: 's01', type: 'vocab', skill: 'vocabulary', vocabIds: ['w001', 'w002', 'w003'] },
    {
      id: 's02',
      type: 'match',
      skill: 'vocabulary',
      prompt: { en: 'Match', pt: 'Ligue' },
      pairs: [
        { source: 'hello', target: 'olá' },
        { source: 'name', target: 'nome' },
        { source: 'friend', target: 'amigo' },
      ],
    },
    {
      id: 's03',
      type: 'select',
      skill: 'vocabulary',
      prompt: { en: 'Choose', pt: 'Escolha' },
      question: 'olá em inglês:',
      options: ['hello', 'good morning', 'friend'],
      correct: 0,
    },
    {
      id: 's04',
      type: 'dictation',
      skill: 'writing',
      audio: 'I am a student.',
      answer: 'I am a student.',
    },
    {
      id: 's05',
      type: 'speak',
      skill: 'speaking',
      prompt: { en: 'Speak', pt: 'Fale' },
      mode: 'shadow',
      lines: [{ text: 'I am a student.', translation: 'Sou estudante.' }],
    },
    { id: 's06', type: 'review', skill: 'vocabulary', count: 3 },
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

const unit = {
  slug: 'u1',
  order: 1,
  title: { en: 'Unit one', pt: 'Unidade um' },
  description: { en: 'First unit', pt: 'Primeira unidade' },
  cefr: 'A1' as const,
  objectives: [],
  lessons: [{ slug: 'l1', title: { en: 'Lesson one', pt: 'Lição um' } }],
}

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

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('LessonPlayer journey', () => {
  it('plays a full lesson: vocab, match, select, dictation, speak, then finishes', async () => {
    const user = userEvent.setup()
    const xpBefore = getProfile().xp

    renderPlayer()

    // Step 1: vocab intro (3 cards)
    const continueButtons = await screen.findAllByRole('button', { name: /continue/i })
    expect(screen.getByTestId('step-vocab')).toBeInTheDocument()
    await user.click(continueButtons[0])
    await user.click(await screen.findByRole('button', { name: /continue/i }))
    await user.click(await screen.findByRole('button', { name: /continue/i }))

    // Step 2: match — click each source then its translation
    expect(screen.getByTestId('step-match')).toBeInTheDocument()
    const pairs: Array<[string, string]> = [
      ['match-s-0', 'match-t-0'],
      ['match-s-1', 'match-t-1'],
      ['match-s-2', 'match-t-2'],
    ]
    for (const [a, b] of pairs) {
      await user.click(screen.getByTestId(a))
      await user.click(screen.getByTestId(b))
    }
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: select — correct answer
    expect(screen.getByTestId('step-select')).toBeInTheDocument()
    await user.click(screen.getByTestId('option-0'))
    expect(screen.getByTestId('step-feedback')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4: dictation — type the answer
    expect(screen.getByTestId('step-dictation')).toBeInTheDocument()
    await user.type(screen.getByTestId('dictation-input'), 'I am a student.')
    await user.click(screen.getByTestId('dictation-check'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 5: speak — self-check
    expect(screen.getByTestId('step-speak')).toBeInTheDocument()
    await user.click(screen.getByTestId('said-it'))

    // Step 6: review with nothing due → skipped automatically
    await waitFor(() => expect(screen.getByTestId('lesson-finish')).toBeInTheDocument())

    // Progress persisted
    const progress = getCourseProgress('test-course')
    expect(progress.units.u1?.lessons.l1).toBeDefined()
    expect(progress.units.u1?.lessons.l1.attempts).toBe(1)
    expect(progress.lastLesson).toEqual({ unit: 'u1', lesson: 'l1' })

    // New vocab scheduled into FSRS
    const cards = getReviewCards()
    expect(cards['lang::pt-en::w001']).toBeDefined()
    expect(cards['lang::pt-en::w002']).toBeDefined()
    expect(cards['lang::pt-en::w003']).toBeDefined()

    // XP awarded for the language lesson
    expect(getProfile().xp).toBeGreaterThanOrEqual(xpBefore + 15)
  })

  it('emits the gamification event through the bus', async () => {
    const user = userEvent.setup()
    const listener = vi.fn()
    const { onAward } = await import('@/lib/gamification/bus')
    onAward(listener)

    renderPlayer()
    const clickContinue = async () => {
      const buttons = screen.queryAllByRole('button', { name: /continue/i })
      if (buttons.length > 0) await user.click(buttons[0])
    }

    await clickContinue() // vocab 1
    await clickContinue() // vocab 2
    await clickContinue() // vocab 3
    // match: fast path — click pairs then continue
    for (const [a, b] of [
      ['match-s-0', 'match-t-0'],
      ['match-s-1', 'match-t-1'],
      ['match-s-2', 'match-t-2'],
    ]) {
      await user.click(screen.getByTestId(a))
      await user.click(screen.getByTestId(b))
    }
    await clickContinue()
    await user.click(screen.getByTestId('option-0'))
    await clickContinue()
    await user.type(screen.getByTestId('dictation-input'), 'I am a student.')
    await user.click(screen.getByTestId('dictation-check'))
    await clickContinue()
    await user.click(screen.getByTestId('said-it'))

    await waitFor(() => {
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ xp: 15, badges: expect.arrayContaining(['polyglot-start']) })
      )
    })
  })

  it('dictation accepts a small typo as almost and still advances', async () => {
    const user = userEvent.setup()
    renderPlayer()

    // Vocab ×3
    for (let i = 0; i < 3; i++) {
      await user.click(await screen.findByRole('button', { name: /continue/i }))
    }
    // Match
    for (const [a, b] of [
      ['match-s-0', 'match-t-0'],
      ['match-s-1', 'match-t-1'],
      ['match-s-2', 'match-t-2'],
    ]) {
      await user.click(screen.getByTestId(a))
      await user.click(screen.getByTestId(b))
    }
    await user.click(await screen.findByRole('button', { name: /continue/i }))
    // Select
    await user.click(screen.getByTestId('option-1')) // wrong on purpose
    await user.click(screen.getByRole('button', { name: /continue/i }))
    // Dictation with one slip: "am" → "an" (1 edit, 15 chars, tolerance 2)
    await user.type(screen.getByTestId('dictation-input'), 'I an a student.')
    await user.click(screen.getByTestId('dictation-check'))
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(/almost/i)
  })
})
