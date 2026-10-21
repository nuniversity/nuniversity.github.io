import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { splitAnswer } from '@/lib/markdown/split-answer'
import FillBlankQuestion from '@/components/markdown/FillBlankQuestion'
import BucketDropQuestion from '@/components/markdown/BucketDropQuestion'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'

vi.stubGlobal('React', React)

describe('splitAnswer', () => {
  it('returns the whole trimmed answer when there is at most one blank', () => {
    expect(splitAnswer(1, '  130  ')).toEqual(['130'])
    expect(splitAnswer(1, '2.00')).toEqual(['2.00'])
    expect(splitAnswer(0, '5')).toEqual(['5'])
  })

  it('splits two-part answers on ", "', () => {
    expect(splitAnswer(2, '30 minutes, first attempt')).toEqual(['30 minutes', 'first attempt'])
    expect(splitAnswer(2, ' 30 minutes , first attempt ')).toEqual(['30 minutes', 'first attempt'])
  })

  it('splits two-part answers on "; "', () => {
    expect(splitAnswer(2, '30 minutes; 15 minutes late')).toEqual(['30 minutes', '15 minutes late'])
  })

  it('extracts three numerics from a parenthesised answer', () => {
    expect(splitAnswer(3, '65 (50 scored + 15 unscored)')).toEqual(['65', '50', '15'])
  })

  it('extracts decimals as numerics', () => {
    expect(splitAnswer(2, 'budget 2.00 over 130 minutes')).toEqual(['2.00', '130'])
  })

  it('handles pt-style numerals in the parenthesised answer', () => {
    expect(splitAnswer(3, '65 (50 pontuados + 15 não pontuados)')).toEqual(['65', '50', '15'])
  })

  it('falls back to repeated copies when no splitter matches the blank count', () => {
    expect(splitAnswer(3, 'opaque')).toEqual(['opaque', 'opaque', 'opaque'])
    expect(splitAnswer(2, '65 (50 scored + 15 unscored)')).toEqual([
      '65 (50 scored + 15 unscored)',
      '65 (50 scored + 15 unscored)',
    ])
  })
})

const fillblankItems = [
  { prompt: 'Exam duration: ______ minutes', answer: '130' },
  { prompt: 'Total items: ______ (______ scored + ______ unscored)', answer: '65 (50 scored + 15 unscored)' },
  { prompt: 'Passing scaled score: ______ / 1000', answer: '720' },
  { prompt: 'Average pacing budget: ______ minutes per item', answer: '2.00' },
  { prompt: 'Fail wait before re-taking: ______ days', answer: '14' },
  { prompt: 'ESL extra time: ______ minutes, available on the ______ attempt', answer: '30 minutes, first attempt' },
  { prompt: 'Online launch window: within ______ minutes; more than ______ late forfeits the fee', answer: '30 minutes; 15 minutes late' },
  { prompt: 'Results delivered within ______ business days', answer: '5' },
]

function fillAllCorrectly() {
  const inputs = screen.getAllByRole('textbox')
  const values = ['130', '65', '50', '15', '720', '2.00', '14', '30 minutes', 'first attempt', '30 minutes', '15 minutes late', '5']
  expect(inputs).toHaveLength(values.length)
  inputs.forEach((input, index) => fireEvent.change(input, { target: { value: values[index] } }))
}

describe('FillBlankQuestion items mode', () => {
  it('renders the 8-item fixture with title, instructions and one input per blank', () => {
    render(
      <FillBlankQuestion
        question="Exam-day numbers, from memory"
        instructions="Fill each blank with the number AWS publishes. Answers are exact."
        items={fillblankItems}
      />
    )

    expect(screen.getByText('Exam-day numbers, from memory')).toBeInTheDocument()
    expect(screen.getByText('Fill each blank with the number AWS publishes. Answers are exact.')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Check Answers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('grades all items correct when every blank matches', () => {
    render(<FillBlankQuestion question="Exam-day numbers, from memory" items={fillblankItems} />)

    fillAllCorrectly()
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))

    expect(screen.getByText('Perfect — all blanks filled correctly!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check Answers' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('textbox').every(input => (input as HTMLInputElement).disabled)).toBe(true)
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('grades items wrong and reports the score', () => {
    render(<FillBlankQuestion question="Exam-day numbers, from memory" items={fillblankItems} />)

    fillAllCorrectly()
    fireEvent.change(screen.getByLabelText('Item 4, blank 1'), { target: { value: '2.0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))

    expect(screen.getByText('Some blanks are wrong — 7 of 8 items correct.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('Try Again clears values and re-enables checking', () => {
    render(<FillBlankQuestion question="Exam-day numbers, from memory" items={fillblankItems} />)

    fillAllCorrectly()
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))
    expect(screen.queryByRole('button', { name: 'Check Answers' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(screen.getByRole('button', { name: 'Check Answers' })).toBeInTheDocument()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(12)
    expect(inputs.every(input => (input as HTMLInputElement).value === '')).toBe(true)
    expect(inputs.every(input => !(input as HTMLInputElement).disabled)).toBe(true)
    expect(screen.queryByText('Perfect — all blanks filled correctly!')).not.toBeInTheDocument()
  })

  it('grades case-insensitively with surrounding whitespace', () => {
    render(
      <FillBlankQuestion
        question="Mixed case"
        items={[{ prompt: 'Attempt: ______', answer: 'First Attempt' }]}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  first attempt ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))

    expect(screen.getByText('Perfect — all blanks filled correctly!')).toBeInTheDocument()
  })
})

describe('FillBlankQuestion template mode regression', () => {
  it('renders the legacy word-bank layout when template/answers are given', () => {
    render(
      <FillBlankQuestion
        question="Legacy template"
        template="Answer: {{1}} and {{2}}"
        answers={{ '1': 'alpha', '2': 'beta' }}
        distractors={['gamma']}
      />
    )

    expect(screen.getByText('Legacy template')).toBeInTheDocument()
    expect(screen.getByText(/Word Bank/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Answers' })).toBeInTheDocument()
  })
})

const bucketFixture = [
  { label: 'Full A+B sweep under one timer', items: ['Day 7'] },
  { label: 'Trap pairs re-derived from framing', items: ['Day 6'] },
]

describe('BucketDropQuestion', () => {
  it('renders the pool and all buckets', () => {
    render(<BucketDropQuestion question="Drag each day to its one action" buckets={bucketFixture} />)

    expect(screen.getByText('Drag each day to its one action')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day 7' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Day 6' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bucket: Trap pairs re-derived from framing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Answers' })).toBeInTheDocument()
  })

  it('selects a pool item and places it into a clicked bucket', () => {
    render(<BucketDropQuestion question="Drag each day to its one action" buckets={bucketFixture} />)

    const day7 = screen.getByRole('button', { name: 'Day 7' })
    fireEvent.click(day7)
    expect(screen.getByRole('button', { name: 'Day 7' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' }))

    const bucket = screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' })
    const chip = screen.getByRole('button', { name: 'Day 7' })
    expect(bucket).toContainElement(chip)
    expect(chip).not.toHaveAttribute('aria-pressed')
  })

  it('returns a placed chip to the pool when clicked', () => {
    render(<BucketDropQuestion question="Drag each day to its one action" buckets={bucketFixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Day 7' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' }))
    const bucket = screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' })
    fireEvent.click(screen.getByRole('button', { name: 'Day 7' }))

    expect(bucket).not.toHaveTextContent('Day 7')
    expect(screen.getByRole('button', { name: 'Day 7' })).not.toContainElement(bucket)
  })

  it('Check reveals correctness, score and the correct bucket for wrong placements', () => {
    render(<BucketDropQuestion question="Drag each day to its one action" buckets={bucketFixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Day 7' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Day 6' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' }))

    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))

    expect(screen.getByText('1 / 2 correct — red items are in the wrong bucket or still unplaced.')).toBeInTheDocument()
    expect(screen.getByText('Correct: Trap pairs re-derived from framing')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check Answers' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    const wrongBucket = screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' })
    expect(wrongBucket.className).toContain('border-red-500')
    const rightBucket = screen.getByRole('button', { name: 'Bucket: Trap pairs re-derived from framing' })
    expect(rightBucket.className).toContain('border-red-500')
  })

  it('Check reports all correct when every item sits in its bucket', () => {
    render(<BucketDropQuestion question="Drag each day to its one action" buckets={bucketFixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Day 7' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Day 6' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bucket: Trap pairs re-derived from framing' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))

    expect(screen.getByText('All correct!')).toBeInTheDocument()
    const bucket = screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' })
    expect(bucket.className).toContain('border-green-500')
  })

  it('Try Again resets placements, pool and feedback', () => {
    render(<BucketDropQuestion question="Drag each day to its one action" buckets={bucketFixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Day 7' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }))
    expect(screen.getByRole('status')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day 7' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day 6' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bucket: Full A+B sweep under one timer' })).not.toHaveTextContent('Day 7')
    expect(screen.getByRole('button', { name: 'Check Answers' })).toBeInTheDocument()
  })
})

const fence = (config: unknown) => '```interactive\n' + JSON.stringify(config, null, 2) + '\n```'

describe('MarkdownRenderer interactive dispatch', () => {
  it('renders a matching interactive fence as MatchingQuestion', () => {
    render(
      <MarkdownRenderer
        content={fence({
          type: 'matching',
          title: 'Smoke matcher',
          instructions: 'Match the pairs.',
          pairs: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' },
          ],
          answer: 'A→1, B→2',
        })}
      />
    )

    expect(screen.getByText('Matching Question')).toBeInTheDocument()
    expect(screen.getByText('Smoke matcher')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders a fillblank interactive fence as FillBlankQuestion items mode', () => {
    render(
      <MarkdownRenderer
        content={fence({
          type: 'fillblank',
          title: 'Smoke blanks',
          instructions: 'Type the numbers.',
          items: [
            { prompt: 'Exam duration: ______ minutes', answer: '130' },
            { prompt: 'Passing score: ______', answer: '720' },
          ],
        })}
      />
    )

    expect(screen.getByText('Smoke blanks')).toBeInTheDocument()
    expect(screen.getByText('Type the numbers.')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Check Answers' })).toBeInTheDocument()
  })

  it('renders a dragdrop interactive fence as BucketDropQuestion', () => {
    render(
      <MarkdownRenderer
        content={fence({
          type: 'dragdrop',
          title: 'Smoke buckets',
          instructions: 'Place the days.',
          buckets: [
            { label: 'Sweep day', items: ['Day 7'] },
            { label: 'Rest day', items: ['Day 1'] },
          ],
        })}
      />
    )

    expect(screen.getByText('Smoke buckets')).toBeInTheDocument()
    expect(screen.getByText('Place the days.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bucket: Sweep day' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day 1' })).toBeInTheDocument()
  })

  it('renders the Invalid interactive config box for an unknown type', () => {
    render(<MarkdownRenderer content={fence({ type: 'bogus', title: 'Nope' })} />)

    expect(screen.getByText(/Invalid interactive config/)).toBeInTheDocument()
    expect(screen.getByText(/Unknown interactive type: bogus/)).toBeInTheDocument()
  })

  it('renders the Invalid interactive config box when type is missing', () => {
    render(<MarkdownRenderer content={fence({ title: 'No type' })} />)

    expect(screen.getByText(/Invalid interactive config/)).toBeInTheDocument()
    expect(screen.getByText(/Missing interactive type/)).toBeInTheDocument()
  })

  it('renders the Invalid interactive config box for malformed JSON', () => {
    render(<MarkdownRenderer content={'```interactive\n{ not json\n```'} />)

    expect(screen.getByText(/Invalid interactive config/)).toBeInTheDocument()
  })
})
