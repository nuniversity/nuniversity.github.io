import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionBody } from '@/components/quizzes/QuestionBody'
import type { QuizQuestion, QuizResponse } from '@/lib/quizzes/types'
import dict from '../../dictionaries/en.json'

vi.stubGlobal('React', React)

const mcq: QuizQuestion = {
  id: 'q001',
  subdomain: '1.1 - Test',
  type: 'mcq',
  question: 'Pick the right one',
  options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
  correct: 2,
  explanation: 'Gamma is right',
}

const multi: QuizQuestion = {
  id: 'q002',
  subdomain: '2.1 - Test',
  type: 'multi',
  question: 'Pick two',
  options: ['one', 'two', 'three', 'four', 'five'],
  correct: [1, 3],
  explanation: 'two and four',
}

const ordering: QuizQuestion = {
  id: 'q003',
  subdomain: '3.2 - Test',
  type: 'ordering',
  question: 'Order the steps',
  options: ['First', 'Second', 'Third', 'Distractor'],
  correct: [0, 1, 2],
  explanation: 'First, Second, Third',
}

const matching: QuizQuestion = {
  id: 'q004',
  subdomain: '4.1 - Test',
  type: 'matching',
  question: 'Match the items',
  options: ['Red', 'Green', 'Blue'],
  prompts: ['Sky', 'Grass', 'Blood'],
  correct: [2, 1, 0],
  explanation: 'Sky-Blue, Grass-Green, Blood-Red',
}

describe('QuestionBody: single answer', () => {
  it('emits the selected option on click', () => {
    const onChange = vi.fn()
    render(<QuestionBody question={mcq} response={null} onChange={onChange} dict={dict} />)
    fireEvent.click(screen.getByRole('radio', { name: /Alpha/ }))
    expect(onChange).toHaveBeenCalledWith({ type: 'mcq', selected: 0 })
  })

  it('locks and reveals correctness in reveal mode', () => {
    render(
      <QuestionBody question={mcq} response={{ type: 'mcq', selected: 0 }} mode="reveal" dict={dict} />
    )
    const radios = screen.getAllByRole('radio')
    expect(radios.every(radio => (radio as HTMLButtonElement).disabled)).toBe(true)
    expect(screen.getByRole('radio', { name: /Gamma/ }).className).toContain('border-green-500')
    expect(screen.getByRole('radio', { name: /Alpha/ }).className).toContain('border-red-500')
  })
})

describe('QuestionBody: multiple response', () => {
  it('toggles picks and keeps them sorted', () => {
    const onChange = vi.fn()
    const { rerender } = render(<QuestionBody question={multi} response={{ type: 'multi', selected: [] }} onChange={onChange} dict={dict} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /four/ }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'multi', selected: [3] })

    rerender(<QuestionBody question={multi} response={{ type: 'multi', selected: [3] }} onChange={onChange} dict={dict} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /two/ }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'multi', selected: [1, 3] })
  })

  it('deselects an already picked option', () => {
    const onChange = vi.fn()
    render(<QuestionBody question={multi} response={{ type: 'multi', selected: [1, 3] }} onChange={onChange} dict={dict} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /two/ }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'multi', selected: [3] })
  })
})

describe('QuestionBody: ordering', () => {
  it('adds available responses to the sequence and reorders them', () => {
    const onChange = vi.fn()
    render(<QuestionBody question={ordering} response={{ type: 'ordering', sequence: [] }} onChange={onChange} dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: 'First' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'ordering', sequence: [0] })

    onChange.mockClear()
    render(<QuestionBody question={ordering} response={{ type: 'ordering', sequence: [1, 0] }} onChange={onChange} dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: 'Move up 2' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'ordering', sequence: [0, 1] })
  })

  it('removes a placed response from the sequence', () => {
    const onChange = vi.fn()
    render(<QuestionBody question={ordering} response={{ type: 'ordering', sequence: [0, 1] }} onChange={onChange} dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove 1' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'ordering', sequence: [1] })
  })

  it('shows the correct order when the answer is wrong in reveal mode', () => {
    render(
      <QuestionBody question={ordering} response={{ type: 'ordering', sequence: [1, 0, 2] }} mode="reveal" dict={dict} />
    )
    expect(screen.getByText('Correct order')).toBeInTheDocument()
    expect(screen.getByText(/1\. First/)).toBeInTheDocument()
  })
})

describe('QuestionBody: matching', () => {
  it('assigns a pair through the prompt select', () => {
    const onChange = vi.fn()
    const { container } = render(
      <QuestionBody question={matching} response={{ type: 'matching', pairs: [null, null, null] }} onChange={onChange} dict={dict} />
    )
    const selects = container.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: '2' } })
    expect(onChange).toHaveBeenLastCalledWith({ type: 'matching', pairs: [2, null, null] })
  })

  it('marks rows and lists correct matches in reveal mode', () => {
    const { container } = render(
      <QuestionBody
        question={matching}
        response={{ type: 'matching', pairs: [2, 1, 0] }}
        mode="reveal"
        dict={dict}
      />
    )
    const selects = container.querySelectorAll('select')
    expect((selects[0] as HTMLSelectElement).disabled).toBe(true)
    expect(screen.getByText('Correct matches')).toBeInTheDocument()
    expect(screen.getByText(/Sky → Blue/)).toBeInTheDocument()
  })
})

describe('QuestionBody: response normalization', () => {
  it('renders safely when the response shape does not match the question type', () => {
    const mismatched = { type: 'mcq', selected: 1 } as unknown as QuizResponse
    render(<QuestionBody question={ordering} response={mismatched} dict={dict} />)
    expect(screen.getByText('Available responses')).toBeInTheDocument()
  })
})
