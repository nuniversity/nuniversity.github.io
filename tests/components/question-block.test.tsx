import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuestionBlock, { type LessonQuestion } from '@/components/markdown/QuestionBlock'


const baseData: LessonQuestion = {
  id: 'q-1',
  type: 'multiple-choice',
  question: 'Which service is used for object storage?',
  options: ['Amazon S3', 'Amazon EC2', 'Amazon RDS'],
  correct: 0,
  explanation: 'S3 is the object storage service.',
}

describe('QuestionBlock', () => {
  it('renders question text and all options', () => {
    render(<QuestionBlock data={baseData} />)

    expect(screen.getByText(baseData.question)).toBeInTheDocument()
    for (const option of baseData.options) {
      expect(screen.getByText(option)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Check Answer' })).toBeDisabled()
  })

  it('shows correct feedback when the correct option is selected and checked', () => {
    render(<QuestionBlock data={baseData} />)

    fireEvent.click(screen.getByText('Amazon S3'))
    fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }))

    expect(screen.getByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText(baseData.explanation as string)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check Answer' })).not.toBeInTheDocument()
  })

  it('shows incorrect feedback when a wrong option is selected and checked', () => {
    render(<QuestionBlock data={baseData} />)

    fireEvent.click(screen.getByText('Amazon EC2'))
    fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }))

    expect(screen.getByText('Incorrect')).toBeInTheDocument()
    expect(screen.getByText(baseData.explanation as string)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })
})
