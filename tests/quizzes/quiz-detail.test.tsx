import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuizDetail } from '@/components/quizzes/QuizDetail'
import type { QuizData } from '@/lib/quizzes/types'
import dict from '../../dictionaries/en.json'

vi.stubGlobal('React', React)

const quiz: QuizData = {
  id: 'aif-c01-test',
  slug: 'aif-c01-test',
  kind: 'certification',
  category: 'Cloud & AI',
  title: 'AWS AI Practitioner (Test)',
  description: 'Fixture quiz',
  difficulty: 'intermediate',
  topic: 'AWS',
  certification: 'AWS Certified AI Practitioner (AIF-C01)',
  durationSeconds: 5400,
  passingScore: 70,
  mockQuestionCount: 2,
  domains: [
    { id: 'D1', name: 'Domain 1', color: 'blue', subdomains: ['1.1 - Alpha', '1.2 - Beta'] },
  ],
  allocations: { '1.1 - Alpha': 60, '1.2 - Beta': 40 },
  questions: [
    {
      id: 'q001',
      subdomain: '1.1 - Alpha',
      type: 'mcq',
      question: 'What is the capital of France?',
      options: ['Paris', 'Lyon', 'Nice', 'Marseille'],
      correct: 0,
      explanation: 'Paris is the capital.',
    },
    {
      id: 'q002',
      subdomain: '1.2 - Beta',
      type: 'multi',
      question: 'Select the two prime numbers',
      options: ['4', '7', '9', '11', '15'],
      correct: [1, 3],
      explanation: '7 and 11 are prime.',
    },
  ],
}

beforeEach(() => {
  window.localStorage.clear()
})

function startPractice() {
  render(<QuizDetail lang="en" quiz={quiz} dict={dict} />)
  const shuffleToggle = screen.getByRole('button', { pressed: true })
  fireEvent.click(shuffleToggle)
  fireEvent.click(screen.getByRole('button', { name: /Start Practice/ }))
}

describe('learning mode: staging, skip and return', () => {
  it('stages an answer without revealing feedback', async () => {
    startPractice()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()

    const paris = await screen.findByRole('radio', { name: /Paris/ })
    fireEvent.click(paris)

    expect(screen.queryByText('Correct!')).not.toBeInTheDocument()
    expect(screen.queryByText('Incorrect')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Check answer/ })).toBeEnabled()
    expect(paris).toHaveAttribute('aria-checked', 'true')
  })

  it('keeps the staged answer when skipping and returning', async () => {
    startPractice()

    fireEvent.click(await screen.findByRole('radio', { name: /Paris/ }))
    fireEvent.click(screen.getByRole('button', { name: /Skip for now/ }))

    await screen.findByRole('checkbox', { name: /7/ })
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Q1 (answered, not checked)')).toBeInTheDocument()
    expect(screen.getByLabelText('Q2 (not answered)')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Previous/ }))
    const paris = await screen.findByRole('radio', { name: /Paris/ })
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
    expect(paris).toHaveAttribute('aria-checked', 'true')
  })

  it('reveals correctness and explanation only after checking', async () => {
    startPractice()

    fireEvent.click(await screen.findByRole('radio', { name: /Paris/ }))
    fireEvent.click(screen.getByRole('button', { name: /Check answer/ }))

    expect(await screen.findByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText('Paris is the capital.')).toBeInTheDocument()
    expect(screen.getByLabelText('Q1 (checked, correct)')).toBeInTheDocument()
  })

  it('grades a staged answer silently at finish and excludes blanks', async () => {
    startPractice()

    fireEvent.click(await screen.findByRole('radio', { name: /Paris/ }))
    fireEvent.click(screen.getByRole('button', { name: /Skip for now/ }))
    await screen.findByRole('checkbox', { name: /7/ })

    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))

    expect(await screen.findByText('100%')).toBeInTheDocument()
    expect(screen.getByText('1 correct out of 1 questions')).toBeInTheDocument()
  })

  it('reports a fully blank run as zero scored answers', async () => {
    startPractice()
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))

    expect(await screen.findByText('0 correct out of 0 questions')).toBeInTheDocument()
  })
})

describe('learning mode: multiple response flow', () => {
  it('checks a multi-select answer and reports it correct', async () => {
    startPractice()

    fireEvent.click(screen.getByLabelText('Q2 (not answered)'))
    await screen.findByRole('checkbox', { name: /7/ })
    expect(screen.getByRole('button', { name: /Check answer/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox', { name: /7/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /11/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Check answer/ })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /Check answer/ }))

    expect(await screen.findByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText('7 and 11 are prime.')).toBeInTheDocument()
  })
})

describe('simulation mode: draw and no feedback', () => {
  it('draws the scaled mock size and hides results until submit', async () => {
    render(<QuizDetail lang="en" quiz={quiz} dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: /Start Mock Exam/ }))

    expect(await screen.findByText(/2 questions drawn proportionally/)).toBeInTheDocument()
    expect(screen.getByText(/2 Qs/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Begin Exam/ }))

    await screen.findByRole('button', { name: /Flag for review/ })
    const radios = screen.queryAllByRole('radio')
    if (radios.length > 0) {
      fireEvent.click(radios[0])
    } else {
      const checkboxes = screen.queryAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
    }

    expect(screen.queryByText('Correct!')).not.toBeInTheDocument()
    expect(screen.queryByText('Incorrect')).not.toBeInTheDocument()
    expect(screen.getByText(/Answers are not revealed during the exam/)).toBeInTheDocument()
  })
})
