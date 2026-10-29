import React, { useEffect } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuestionBlock, { type LessonQuestion } from '@/components/markdown/QuestionBlock'
import FillBlankQuestion from '@/components/markdown/FillBlankQuestion'
import BucketDropQuestion from '@/components/markdown/BucketDropQuestion'
import {
  LessonScoreProvider,
  LessonScoreSummary,
  useLessonScoreWidget,
} from '@/components/lessons/LessonScoreContext'


function Probe({ label, total, correct, missed, answered }: {
  label: string
  total: number
  correct: number
  missed: string[]
  answered: boolean
}) {
  const { scoreId, register, report } = useLessonScoreWidget('probe')
  useEffect(() => {
    register({ id: scoreId, label, total })
    report({ id: scoreId, label, total, correct, missed, answered })
  }, [scoreId, label, total, correct, missed, answered, register, report])
  return null
}

describe('LessonScoreProvider', () => {
  it('renders no summary when nothing is registered', () => {
    const { container } = render(
      <LessonScoreProvider>
        <div>empty</div>
        <LessonScoreSummary />
      </LessonScoreProvider>
    )
    expect(screen.queryByTestId('lesson-score-summary')).not.toBeInTheDocument()
    expect(container.textContent).toContain('empty')
  })

  it('shows partial results and remaining count while widgets are unanswered', () => {
    render(
      <LessonScoreProvider>
        <Probe label="q" total={4} correct={0} missed={[]} answered={false} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )

    const summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('Knowledge check')
    expect(summary).toHaveTextContent('0/4 correct')
    expect(summary).toHaveTextContent('1 remaining')
    expect(summary).not.toHaveTextContent('Items to review')
    expect(summary).not.toHaveTextContent('Nice work')
  })

  it('lists missed items and hides the suggestion below 70%', () => {
    render(
      <LessonScoreProvider>
        <Probe label="a" total={4} correct={1} missed={['wrong one', 'wrong two']} answered={true} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )

    const summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('1/4 correct')
    expect(summary).toHaveTextContent('Items to review')
    expect(summary).toHaveTextContent('wrong one')
    expect(summary).toHaveTextContent('wrong two')
    expect(summary).not.toHaveTextContent('remaining')
    expect(summary).not.toHaveTextContent('Nice work')
  })

  it('suggests completion when everything is answered at 70% or above', () => {
    render(
      <LessonScoreProvider>
        <Probe label="a" total={4} correct={3} missed={['one miss']} answered={true} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )

    const summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('3/4 correct')
    expect(summary).toHaveTextContent('one miss')
    expect(summary).toHaveTextContent('Nice work: mark the lesson as complete')
    expect(summary).not.toHaveTextContent('remaining')
  })
})

describe('QuestionBlock score reporting', () => {
  const data: LessonQuestion = {
    id: 'q-1',
    type: 'multiple-choice',
    question: 'Which service is used for object storage?',
    options: ['Amazon S3', 'Amazon EC2'],
    correct: 0,
  }

  it('does not register when reveal is false (exam mode)', () => {
    render(
      <LessonScoreProvider>
        <QuestionBlock data={data} reveal={false} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )
    expect(screen.queryByTestId('lesson-score-summary')).not.toBeInTheDocument()
  })

  it('reports correct answers and updates the summary', () => {
    render(
      <LessonScoreProvider>
        <QuestionBlock data={data} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )

    let summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('0/1 correct')

    fireEvent.click(screen.getByText('Amazon S3'))
    fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }))

    summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('1/1 correct')
    expect(summary).not.toHaveTextContent('Items to review')
    expect(summary).toHaveTextContent('Nice work: mark the lesson as complete')
  })

  it('lists the question as missed when answered incorrectly and resets on Try Again', () => {
    render(
      <LessonScoreProvider>
        <QuestionBlock data={data} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )

    fireEvent.click(screen.getByText('Amazon EC2'))
    fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }))

    let summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('0/1 correct')
    expect(summary).toHaveTextContent('Items to review')
    expect(summary).toHaveTextContent(data.question)

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))

    summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('0/1 correct')
    expect(summary).toHaveTextContent('1 remaining')
    expect(summary).not.toHaveTextContent('Items to review')
  })
})

describe('FillBlankQuestion score reporting (items mode partial credit)', () => {
  const items = [
    { prompt: 'The object storage service is ______ .', answer: 'Amazon S3' },
    { prompt: 'A virtual server service is ______ .', answer: 'Amazon EC2' },
  ]

  it('grants partial credit per item and lists missed prompts', () => {
    render(
      <LessonScoreProvider>
        <FillBlankQuestion question="Fill the blanks" items={items} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )

    expect(screen.getByTestId('lesson-score-summary')).toHaveTextContent('0/2 correct')

    fireEvent.change(screen.getByLabelText('Item 1, blank 1'), { target: { value: 'Amazon S3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))

    const summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('1/2 correct')
    expect(summary).toHaveTextContent('Items to review')
    expect(summary).toHaveTextContent(items[1].prompt)
    expect(summary).not.toHaveTextContent(items[0].prompt)
    expect(summary).not.toHaveTextContent('remaining')

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(screen.getByTestId('lesson-score-summary')).toHaveTextContent('0/2 correct')
    expect(screen.getByTestId('lesson-score-summary')).toHaveTextContent('1 remaining')
  })
})

describe('BucketDropQuestion score reporting', () => {
  const buckets = [
    { label: 'Storage', items: ['Amazon S3'] },
    { label: 'Compute', items: ['Amazon EC2'] },
  ]

  it('reports unanswered state, then partial credit after Check Answers', () => {
    render(
      <LessonScoreProvider>
        <BucketDropQuestion question="Sort the services" buckets={buckets} />
        <LessonScoreSummary />
      </LessonScoreProvider>
    )

    let summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('0/2 correct')
    expect(summary).toHaveTextContent('1 remaining')

    fireEvent.click(screen.getByRole('button', { name: 'Amazon S3' }))
    fireEvent.click(screen.getByRole('button', { name: /Bucket: Storage/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))

    summary = screen.getByTestId('lesson-score-summary')
    expect(summary).toHaveTextContent('1/2 correct')
    expect(summary).toHaveTextContent('Items to review')
    expect(summary).toHaveTextContent('Amazon EC2')
  })
})
