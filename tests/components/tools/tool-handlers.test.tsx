import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

beforeEach(() => {
  window.localStorage.clear()
  // Export handlers run in jsdom too; stub the browser download plumbing.
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock'),
    configurable: true,
  })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

describe('decision matrix handlers', () => {
  it('scores options, reweights, exports and resets', () => {
    render(<DecisionMatrix lang="en" dict={dict} />)

    const options = ['Option A', 'Option B', 'Option C']
    const criteria = ['Cost', 'Impact', 'Effort']
    for (const option of options) {
      for (const criterion of criteria) {
        fireEvent.click(screen.getByRole('button', { name: `${option} — ${criterion}: 3` }))
      }
    }
    expect(screen.getAllByText('Results Summary').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Impact: weight +1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Impact: weight -1' }))
    fireEvent.change(screen.getByLabelText(/Scale/), { target: { value: '3' } })

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    fireEvent.click(screen.getByRole('button', { name: 'Delete Option C' }))
    expect(screen.queryByDisplayValue('Option C')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
  })
})

describe('flashcard handlers', () => {
  it('studies a deck through to statistics and deletes it', async () => {
    render(<FlashcardMaker lang="en" dict={dict} />)

    await waitFor(() => expect(screen.getByText('Sample Deck')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.click(screen.getByRole('button', { name: /Study/ }))

    // Flip and rate until the session ends (failed cards requeue once).
    for (let i = 0; i < 8; i += 1) {
      const card = document.querySelector('.perspective-1000') as HTMLElement | null
      if (!card || !screen.queryByText(/Tap to reveal answer/i)) break
      fireEvent.click(card)
      fireEvent.click(screen.getByRole('button', { name: /Good/ }))
    }

    expect(screen.getByText('Deck Statistics')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: /Decks/ })[0])

    fireEvent.click(screen.getByRole('button', { name: /Delete this deck/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: /Delete this deck/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Sample Deck')).toBeNull()
  })

  it('edits a card inline', async () => {
    render(<FlashcardMaker lang="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText('Sample Deck')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    fireEvent.click(screen.getAllByRole('button', { name: /Edit What is a variable/ })[0])
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'Edited front' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.queryByDisplayValue('Edited front')).toBeNull()
  })
})

describe('habit handlers', () => {
  it('toggles days, navigates months and deletes with confirmation', () => {
    render(<HabitTracker lang="en" dict={dict} />)
    fireEvent.change(screen.getByLabelText('New habit name...'), { target: { value: 'Walk' } })
    fireEvent.change(screen.getByLabelText('Daily'), { target: { value: 'weekly' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const day = document.querySelector('button[aria-pressed]') as HTMLButtonElement
    fireEvent.click(day)

    fireEvent.click(screen.getByRole('button', { name: /Prev/ }))
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))

    fireEvent.click(screen.getByRole('button', { name: /Delete this habit/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: /Delete this habit/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryAllByText('Walk')).toHaveLength(0)
  })
})

describe('swot handlers', () => {
  it('edits, removes, toggles views and exports', () => {
    render(<SWOTMatrix lang="en" dict={dict} />)

    const strengthInput = document.getElementById('swot-strengths') as HTMLInputElement
    fireEvent.change(strengthInput, { target: { value: 'Brand' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add item — Strengths' }))

    fireEvent.click(screen.getByRole('button', { name: 'List View' }))
    fireEvent.click(screen.getByRole('button', { name: 'Matrix View' }))

    fireEvent.click(screen.getByRole('button', { name: /Edit: Brand/ }))
    fireEvent.change(screen.getByLabelText('Edit item'), { target: { value: 'Brand trust' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Brand trust')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export Report' }))

    fireEvent.click(screen.getByRole('button', { name: 'Strategies' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide Strategies' }))

    fireEvent.click(screen.getByRole('button', { name: /Clear All/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: /Delete: Brand trust/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('eisenhower handlers', () => {
  it('moves tasks, filters, exports and clears', () => {
    render(<EisenhowerMatrix lang="en" dict={dict} />)

    const input = document.getElementById('eisenhower-doFirst') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Ship release' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add task — Do First' }))

    fireEvent.click(screen.getByRole('button', { name: /Edit: Ship release/ }))
    fireEvent.change(screen.getByLabelText('Edit task'), { target: { value: 'Ship release v2' } })
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'delegate' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Ship release v2')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Hide Completed/ }))
    fireEvent.click(screen.getByRole('button', { name: /Show Completed/ }))
    fireEvent.click(screen.getByRole('button', { name: 'List View' }))
    fireEvent.click(screen.getByRole('button', { name: 'Matrix View' }))

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    fireEvent.click(screen.getByRole('button', { name: /Delete: Ship release v2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    fireEvent.keyDown(document, { key: 'Escape' })
  })
})

describe('brain-writing handlers', () => {
  it('starts, pauses, toggles view and resets', () => {
    render(<BrainWritingSession lang="en" dict={dict} />)
    fireEvent.change(screen.getByLabelText('Session Name *'), { target: { value: 'Workshop' } })
    fireEvent.change(screen.getByLabelText('Participants *'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('button', { name: /Start Brain-Writing Session/i }))

    fireEvent.click(screen.getByRole('button', { name: /List View/ }))
    fireEvent.click(screen.getByRole('button', { name: /Pause/ }))
    fireEvent.click(screen.getByRole('button', { name: /Resume/ }))
    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(screen.getByLabelText('Session Name *')).toBeTruthy()
  })
})

describe('prompt builder handlers', () => {
  it('builds from every field and resets', () => {
    render(<LLMPromptBuilder lang="en" dict={dict} />)
    fireEvent.change(screen.getByLabelText(/Agent Role/), { target: { value: 'teacher' } })
    fireEvent.change(screen.getByLabelText(/Objective/), { target: { value: 'Explain DNS' } })
    fireEvent.change(screen.getByLabelText(/Context/), { target: { value: 'Networking class' } })
    fireEvent.change(screen.getByLabelText(/Target Audience/), { target: { value: 'beginners' } })
    fireEvent.change(screen.getByLabelText(/Constraints/), { target: { value: '500 words' } })
    fireEvent.change(screen.getByLabelText(/Output Format/), { target: { value: 'bullets' } })
    fireEvent.change(screen.getByLabelText(/Examples/), { target: { value: 'example' } })
    fireEvent.change(screen.getByLabelText('Tone'), { target: { value: 'casual' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    expect(screen.getAllByText(/Networking class/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Reset form' }))
    expect(screen.queryAllByText(/Networking class/)).toHaveLength(0)
  })
})

describe('regex handlers', () => {
  it('tests replacements and quick examples', () => {
    render(<RegexTester lang="en" dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }))
    fireEvent.change(screen.getByLabelText('Replacement'), { target: { value: '$1' } })
    fireEvent.change(screen.getByLabelText('Regular Expression'), { target: { value: '(\\w+)@' } })
    fireEvent.change(screen.getByLabelText('Test String'), { target: { value: 'me@example.com' } })

    fireEvent.click(screen.getByRole('button', { name: /Digits:/ }))
    expect(screen.getByLabelText('Regular Expression')).toHaveValue('\\d+')

    fireEvent.click(screen.getByRole('button', { name: 'Cheat Sheet' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide Cheat Sheet' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByLabelText('Test String')).toHaveValue('john@example.com\njane@test.org\nhello world')
  })
})

describe('unit converter handlers', () => {
  it('switches units, values and common conversions', () => {
    render(<UnitConverter lang="en" dict={dict} />)
    fireEvent.change(document.getElementById('unit-value') as HTMLInputElement, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Angle/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Swap units' }))
    fireEvent.change(document.getElementById('unit-from') as HTMLSelectElement, {
      target: { value: 'radians' },
    })
    fireEvent.change(document.getElementById('unit-to') as HTMLSelectElement, {
      target: { value: 'degrees' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: /Degrees/ })[0])
  })
})

describe('pomodoro handlers', () => {
  it('runs the controls, settings and task list', () => {
    render(<PomodoroTimer lang="en" dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.change(document.getElementById('pomodoro-workMinutes') as HTMLInputElement, {
      target: { value: '30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    fireEvent.click(screen.getByRole('tab', { name: /Tasks/ }))
    fireEvent.change(document.getElementById('pomodoro-new-task') as HTMLInputElement, {
      target: { value: 'Read chapter' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Delete: Read chapter/ }))
    expect(screen.queryByText('Read chapter')).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: /Stats/ }))
    expect(screen.getByText('Statistics')).toBeTruthy()
  })
})
