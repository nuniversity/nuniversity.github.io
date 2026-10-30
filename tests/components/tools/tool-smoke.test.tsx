import React from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import BrainWritingSession from '@/components/tools/BrainWritingSession'
import DecisionMatrix from '@/components/tools/DecisionMatrix'
import EisenhowerMatrix from '@/components/tools/EisenhowerMatrix'
import FlashcardMaker from '@/components/tools/FlashcardMaker'
import HabitTracker from '@/components/tools/HabitTracker'
import LLMPromptBuilder from '@/components/tools/LLMPromptBuilder'
import PomodoroTimer from '@/components/tools/PomodoroTimer'
import RegexTester from '@/components/tools/RegexTester'
import SWOTMatrix from '@/components/tools/SWOTMatrix'
import UnitConverter from '@/components/tools/UnitConverter'

const dict = {}

function heading() {
  return screen.getAllByRole('heading', { level: 1 }).length > 0
}

describe('tool interaction smoke', () => {
  it('unit converter switches category and swaps units', () => {
    render(<UnitConverter lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Mass/i }))
    fireEvent.click(screen.getByLabelText('Swap units'))
    expect(screen.getByTestId('unit-result')).toBeTruthy()
  })

  it('decision matrix edits title and adds an option', () => {
    render(<DecisionMatrix lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.change(screen.getByLabelText('Decision Title'), { target: { value: 'Pick one' } })
    fireEvent.change(screen.getByLabelText('Scale (1–5)'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Add new option...'), { target: { value: 'Option D' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0])
    expect(screen.getByDisplayValue('Option D')).toBeTruthy()
  })

  it('habit tracker adds and removes a habit', () => {
    render(<HabitTracker lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.change(screen.getByLabelText('New habit name...'), { target: { value: 'Stretch' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getAllByText('Stretch').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Delete this habit/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryAllByText('Stretch')).toHaveLength(0)
  })

  it('swot matrix adds an item and generates strategies', () => {
    render(<SWOTMatrix lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.change(screen.getByRole('textbox', { name: 'Add item — Strengths' }), { target: { value: 'Brand' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add item — Strengths' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Add item — Opportunities' }), { target: { value: 'New market' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add item — Opportunities' }))
    fireEvent.click(screen.getByRole('button', { name: 'Strategies' }))
    expect(screen.getAllByText(/Brand/).length).toBeGreaterThan(0)
  })

  it('eisenhower matrix adds and completes a task', () => {
    render(<EisenhowerMatrix lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    const taskInput = document.getElementById('eisenhower-doFirst') as HTMLInputElement
    fireEvent.change(taskInput, { target: { value: 'Ship release' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add task — Do First' }))
    expect(screen.getByText('Ship release')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Pending: Ship release/ }))
    expect(screen.getByRole('button', { name: /Completed: Ship release/ })).toBeTruthy()
  })

  it('flashcards creates a deck and adds a card', () => {
    render(<FlashcardMaker lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.change(screen.getByLabelText('Deck name'), { target: { value: 'Biology' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    fireEvent.change(screen.getByLabelText('Front (question)'), { target: { value: 'Cell?' } })
    fireEvent.change(screen.getByLabelText('Back (answer)'), { target: { value: 'Unit' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Card' })[0])
    expect(screen.getByText('Cell?')).toBeTruthy()
  })

  it('brain-writing starts a session and accepts an idea', async () => {
    render(<BrainWritingSession lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.change(screen.getByLabelText('Session Name *'), { target: { value: 'Workshop' } })
    fireEvent.change(screen.getByLabelText('Participants *'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('button', { name: /Start Brain-Writing Session/i }))
    await waitFor(() => expect(screen.getByRole('timer')).toBeTruthy())
    const idea = screen.getAllByPlaceholderText('Enter your idea...')[0]
    fireEvent.change(idea, { target: { value: 'First idea' } })
    expect(screen.getByDisplayValue('First idea')).toBeTruthy()
  })

  it('prompt builder generates and resets a prompt', () => {
    render(<LLMPromptBuilder lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.change(screen.getByLabelText(/Objective/), { target: { value: 'Explain DNS' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    expect(screen.getAllByText(/Explain DNS/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Reset form' }))
    expect(screen.queryAllByText(/Explain DNS/)).toHaveLength(0)
  })

  it('regex tester toggles flags and opens the cheat sheet', async () => {
    render(<RegexTester lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^i:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cheat Sheet' }))
    expect(screen.getByText('Anchors')).toBeTruthy()
    await waitFor(() => expect(screen.getByTestId('regex-highlighted')).toBeTruthy())
  })

  it('pomodoro switches tabs and starts the timer', () => {
    render(<PomodoroTimer lang="en" dict={dict} />)
    expect(heading()).toBe(true)
    fireEvent.click(screen.getByRole('tab', { name: /Tasks/i }))
    expect(screen.getByText('Session Tasks')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: /Timer/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
  })
})
