import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LessonExam from '@/components/quizzes/LessonExam'
import { getHistory, quizHistoryKey } from '@/lib/quizzes/storage'
import type { LessonQuestion } from '@/components/markdown/QuestionBlock'


const questions: LessonQuestion[] = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'Question one?',
    options: ['Right', 'Wrong'],
    correct: 0,
    explanation: 'Because right.',
  },
  {
    id: 'q2',
    type: 'true-false',
    question: 'Question two?',
    options: ['True', 'False'],
    correct: 1,
  },
]

const dict = {
  common: { cancel: 'Cancel' },
  widgets: {
    multiple_choice: { title: 'Practice Question' },
    correct: 'Correct!',
    incorrect: 'Incorrect',
    check_answer: 'Check Answer',
    try_again: 'Try Again',
  },
  quizzes: {
    exam: { navigator: 'Question Navigator', answered: 'Answered', unanswered: 'Unanswered' },
    lesson: {
      start: 'Start Exam',
      start_hint: 'Answer every question.',
      time_remaining: 'Time remaining',
      submit: 'Submit Exam',
      confirm_title: 'Submit exam?',
      confirm_body: 'Unanswered questions count as incorrect.',
      complete_title: 'Exam Complete',
      saved: 'Attempt saved to your history',
      review: 'Review answers',
      breakdown: 'Breakdown by type',
      exit: 'Back to lesson',
      unanswered: 'Unanswered',
    },
  },
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('LessonExam smoke', () => {
  it('shows lesson view, runs exam, submits and shows results', async () => {
    render(
      <LessonExam lang="en" lessonId="course/lesson" questions={questions} examMinutes={1} dict={dict}>
        <p>lesson-children</p>
      </LessonExam>
    )

    expect(screen.getByText('lesson-children')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Start Exam/ }))

    expect(screen.queryByText('lesson-children')).not.toBeInTheDocument()
    expect(screen.getByText('01:00')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Wrong'))
    expect(screen.queryByRole('button', { name: 'Check Answer' })).not.toBeInTheDocument()
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument()
    expect(screen.queryByText('Because right.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Right'))
    expect(screen.queryByText('Because right.')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /Question Navigator|Unanswered|Answered/ })[1])

    fireEvent.click(screen.getByRole('button', { name: /Submit Exam/ }))
    expect(screen.getByText('Submit exam?')).toBeInTheDocument()
    expect(screen.getByText('1 Unanswered')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /Submit Exam/ })[1])

    expect(screen.getByText('Exam Complete')).toBeInTheDocument()
    expect(screen.getByText('0/2')).toBeInTheDocument()
    expect(screen.getByText('Back to lesson')).toBeInTheDocument()

    const history = getHistory('course/lesson')
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ mode: 'course-exam', score: 0, total: 2, passed: false })
    expect(window.localStorage.getItem(quizHistoryKey('course/lesson'))).toContain('course-exam')

    fireEvent.click(screen.getByRole('button', { name: /Back to lesson/ }))
    expect(screen.getByText('lesson-children')).toBeInTheDocument()
  })
})
