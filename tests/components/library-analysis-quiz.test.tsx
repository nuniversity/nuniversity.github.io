import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryAnalysisQuiz } from '@/components/library/library-analysis-quiz'
import type { LibraryAnalysisQuestion } from '@/lib/library/types'

const dict = {
  library: {
    analysis_quiz: 'Check your understanding',
    analysis_quiz_hint: 'Answer the questions.',
    submit_quiz: 'Check answers',
    your_score: 'Your score',
    correct: 'Correct',
    incorrect: 'Incorrect',
    try_again: 'Try again',
    answer_all: 'Answer every question first.',
    best_score: 'Best score',
  },
}

const questions: LibraryAnalysisQuestion[] = [
  { id: 'q1', question: 'Two plus two?', options: ['3', '4'], correct: 1, explanation: 'It is four.' },
  { id: 'q2', question: 'The sky is?', options: ['Green', 'Blue'], correct: 1 },
]

beforeEach(() => {
  window.localStorage.clear()
})

describe('LibraryAnalysisQuiz', () => {
  it('requires all answers before submitting', async () => {
    const user = userEvent.setup()
    render(<LibraryAnalysisQuiz analysisId="a1" questions={questions} dict={dict} />)

    const submit = screen.getByRole('button', { name: 'Check answers' })
    expect(submit).toBeDisabled()
    await user.click(screen.getByLabelText('4'))
    expect(submit).toBeDisabled()
    await user.click(screen.getByLabelText('Blue'))
    expect(submit).toBeEnabled()
  })

  it('scores, persists the attempt and shows explanations', async () => {
    const user = userEvent.setup()
    render(<LibraryAnalysisQuiz analysisId="a1" questions={questions} dict={dict} />)

    await user.click(screen.getByLabelText('4'))
    await user.click(screen.getByLabelText('Green'))
    await user.click(screen.getByRole('button', { name: 'Check answers' }))

    expect(screen.getByText('Your score: 1/2')).toBeInTheDocument()
    expect(screen.getByText('It is four.')).toBeInTheDocument()
    const saved = JSON.parse(window.localStorage.getItem('v1:library-analysis-progress-a1')!)
    expect(saved).toMatchObject({ score: 1, total: 2, passed: false })
  })

  it('restores the best score on mount and allows retry', async () => {
    window.localStorage.setItem(
      'v1:library-analysis-progress-a1',
      JSON.stringify({ answers: { q1: 1, q2: 1 }, score: 2, total: 2, passed: true, completedAt: '2026-01-01' })
    )
    const user = userEvent.setup()
    render(<LibraryAnalysisQuiz analysisId="a1" questions={questions} dict={dict} />)

    expect(screen.getByText('Best score: 2/2')).toBeInTheDocument()
    await user.click(screen.getByLabelText('4'))
    await user.click(screen.getByLabelText('Blue'))
    await user.click(screen.getByRole('button', { name: 'Check answers' }))
    expect(screen.getByText('Your score: 2/2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('button', { name: 'Check answers' })).toBeDisabled()
  })
})
