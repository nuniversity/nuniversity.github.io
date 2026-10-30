import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepInput } from '@/components/language-course/steps-content'
import { StepReview } from '@/components/language-course/steps-interactive'
import type { VocabItem } from '@/lib/language-courses/types'
import type { ReviewCardState } from '@/lib/practice/types'


const baseProps = {
  lang: 'pt',
  source: 'pt',
  target: 'en',
  t: {},
  onResult: vi.fn(),
  onComplete: vi.fn(),
  vocabById: new Map<string, VocabItem>(),
  grammarById: new Map(),
}

beforeEach(() => {
  window.localStorage.clear()
  baseProps.onResult.mockClear()
  baseProps.onComplete.mockClear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('cognitive features', () => {
  it('bolds the target forms in dialogue lines (textual input enhancement)', () => {
    render(
      <StepInput
        {...baseProps}
        step={{
          id: 's02',
          type: 'input',
          skill: 'listening',
          lines: [{ speaker: 'Ana', text: 'Good morning! I am Ana.', translation: 'Bom dia! Eu sou a Ana.', gender: 'female', enhance: ['am'] }],
        }}
      />
    )

    const strong = screen.getByText('am', { selector: 'strong' })
    expect(strong).toBeInTheDocument()
    expect(strong.parentElement?.textContent).toContain('Good morning! I am Ana.')
    // The spoken audio text stays plain (enhancement is visual only).
    expect(screen.getByLabelText(/play audio/i)).toBeInTheDocument()
  })

  it('review weave alternates recall and recognition formats', async () => {
    const user = userEvent.setup()
    const vocab: VocabItem[] = [
      { id: 'w001', source: 'hello', target: 'olá', level: 'A1', topics: ['greetings'] },
      { id: 'w002', source: 'good morning', target: 'bom dia', level: 'A1', topics: ['greetings'] },
      { id: 'w003', source: 'name', target: 'nome', level: 'A1', topics: ['people'] },
    ]
    const cards: ReviewCardState[] = [
      { key: 'lang::pt-en::w001', courseSlug: 'c', lessonSlug: 'vocabulary', due: '2026-01-01T00:00:00.000Z', stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 0, reps: 1, lapses: 0, state: 0, lastReview: null },
      { key: 'lang::pt-en::w002', courseSlug: 'c', lessonSlug: 'vocabulary', due: '2026-01-01T00:00:00.000Z', stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 0, reps: 1, lapses: 0, state: 0, lastReview: null },
    ]
    const onReviewGrade = vi.fn()
    const vocabById = new Map(vocab.map((item) => [item.id, item]))

    render(
      <StepReview
        {...baseProps}
        step={{ id: 's06', type: 'review', skill: 'vocabulary', count: 2 }}
        vocabById={vocabById}
        reviewItems={cards}
        onReviewGrade={onReviewGrade}
      />
    )

    // Item 1 (even index): recall — L1 prompt, reveal, self-grade.
    expect(screen.getByTestId('step-review').textContent).toContain('olá')
    await user.click(screen.getByText('Reveal'))
    await user.click(screen.getByTestId('knew-it'))

    // Item 2 (odd index): recognition — EN word with L1 options.
    expect(screen.getByTestId('review-mcq-word').textContent).toBe('good morning')
    const options = screen.getAllByRole('button').filter((button) => /^[A-C]\./.test(button.textContent ?? ''))
    expect(options).toHaveLength(3)
    const correct = options.find((button) => button.textContent?.includes('bom dia'))
    expect(correct).toBeDefined()
    await user.click(correct!)
    // Feedback shows, then Continue grades the item.
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(onReviewGrade).toHaveBeenCalledTimes(2)
    expect(onReviewGrade.mock.calls[0][1]).toBe(true)
    expect(onReviewGrade.mock.calls[1][1]).toBe(true)
  })
})
