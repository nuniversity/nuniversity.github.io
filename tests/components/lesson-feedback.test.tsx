import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LessonFeedback from '@/components/lessons/LessonFeedback'
import { getLessonFeedback, getLessonFeedbacks } from '@/lib/lessons/feedback'

vi.stubGlobal('React', React)

const dict = {
  lesson: {
    feedback: {
      title: 'Was this helpful?',
      yes: 'Yes',
      no: 'No',
      thanks: 'Thanks for your feedback!',
    },
  },
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('LessonFeedback', () => {
  it('asks the yes/no question', () => {
    render(<LessonFeedback slug="aws-aif-c01/intro" dict={dict} />)

    expect(screen.getByText('Was this helpful?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })

  it('stores an up verdict and shows the thank-you state', () => {
    render(<LessonFeedback slug="aws-aif-c01/intro" dict={dict} />)

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Yes' })).not.toBeInTheDocument()
    expect(getLessonFeedback('aws-aif-c01/intro')).toBe('up')
    expect(getLessonFeedbacks()).toHaveLength(1)
  })

  it('stores a down verdict', () => {
    render(<LessonFeedback slug="aws-aif-c01/intro" dict={dict} />)

    fireEvent.click(screen.getByRole('button', { name: 'No' }))

    expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument()
    expect(getLessonFeedback('aws-aif-c01/intro')).toBe('down')
  })

  it('surfaces a previously saved verdict but keeps the buttons available', () => {
    window.localStorage.setItem(
      'v1:lesson-feedback',
      JSON.stringify([{ slug: 'aws-aif-c01/intro', verdict: 'down', at: '2026-10-01T00:00:00.000Z' }])
    )

    render(<LessonFeedback slug="aws-aif-c01/intro" dict={dict} />)

    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('resets state when the lesson slug changes', () => {
    const { rerender } = render(<LessonFeedback slug="aws-aif-c01/intro" dict={dict} />)

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument()

    rerender(<LessonFeedback slug="aws-aif-c01/setup" dict={dict} />)

    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(getLessonFeedback('aws-aif-c01/intro')).toBe('up')
    expect(getLessonFeedback('aws-aif-c01/setup')).toBeNull()
  })
})
