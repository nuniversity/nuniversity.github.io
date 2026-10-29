import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ReviewClient from '@/components/review/ReviewClient'

const dict = {
  review: {
    title: 'Daily review',
    mixed_title: 'Mixed practice',
    mixed_empty: 'No practice questions found for this course.',
    empty: 'Nothing due.',
    correct: 'Correct',
    incorrect: 'Incorrect',
    next: 'Next',
    finish: 'Finish',
    done: 'Session complete.',
    again: 'Practice again',
  },
  courses: {
    back_to_course: 'Back to course',
    back_to_courses: 'Back to courses',
  },
}

const QUESTION = {
  id: 'en:courses/aws-aif-c01/intro/q1',
  lesson: 'intro',
  course: 'aws-aif-c01',
  type: 'multiple-choice',
  question: 'What is 2 + 2?',
  options: ['4', '5'],
  correct: 0,
  explanation: 'Basic arithmetic.',
}

function mockIndex(questions: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ course: 'aws-aif-c01', lang: 'en', questions }),
    })
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('ReviewClient mixed practice', () => {
  it('offers both ways back after the session completes', async () => {
    mockIndex([QUESTION])
    render(<ReviewClient lang="en" dict={dict} courseSlug="aws-aif-c01" />)

    await screen.findByTestId('review-session')
    fireEvent.click(screen.getByRole('button', { name: /A\. 4/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))

    const done = await screen.findByTestId('review-done')
    expect(done).toHaveTextContent('Session complete.')
    expect(screen.getByRole('link', { name: 'Back to course' })).toHaveAttribute(
      'href',
      '/en/courses/aws-aif-c01/'
    )
    expect(screen.getByRole('link', { name: 'Back to courses' })).toHaveAttribute(
      'href',
      '/en/courses/'
    )
  })

  it('renders the mixed empty state and no back buttons inside the card', async () => {
    mockIndex([])
    render(<ReviewClient lang="en" dict={dict} courseSlug="aws-aif-c01" />)

    expect(await screen.findByTestId('review-empty')).toHaveTextContent(
      'No practice questions found for this course.'
    )
    expect(screen.queryByRole('link')).toBeNull()
  })
})
