import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeChooser, type PracticeLesson } from '@/components/language-course/practice-chooser'

vi.stubGlobal('React', React)

const lessons: PracticeLesson[] = [
  {
    unit: '01-first-steps',
    unitTitle: { en: 'First Steps', pt: 'Primeiros Passos' },
    cefr: 'A1',
    lesson: 'greetings',
    title: { en: 'Greetings', pt: 'Cumprimentos' },
    goal: { en: 'Say hello', pt: 'Diga olá' },
    skills: ['reading', 'vocabulary'],
  },
  {
    unit: '02-routines',
    unitTitle: { en: 'People and Routines', pt: 'Pessoas e Rotinas' },
    cefr: 'A2',
    lesson: 'my-day',
    title: { en: 'My day', pt: 'Meu dia' },
    goal: { en: 'Describe your routine', pt: 'Descreva sua rotina' },
    skills: ['listening', 'grammar'],
  },
]

const dict = {
  languageCourse: {
    cefr: 'Level',
    subject: 'Subject',
    skill: 'Skill',
    reading: 'Reading',
    listening: 'Listening',
    writing: 'Writing',
    speaking: 'Speaking',
    vocabulary_skill: 'Vocabulary',
    grammar: 'Grammar',
  },
}

function renderChooser() {
  return render(
    <PracticeChooser lang="en" courseId="english-for-pt" lessons={lessons} dict={dict} />
  )
}

describe('PracticeChooser', () => {
  it('lists every lesson with its level, subject and skills', () => {
    renderChooser()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute(
      'href',
      '/en/languages/courses/english-for-pt/01-first-steps/greetings/'
    )
    expect(screen.getByText('Greetings')).toBeInTheDocument()
    expect(screen.getAllByText('Reading').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Listening').length).toBeGreaterThan(0)
  })

  it('filters by level', async () => {
    const user = userEvent.setup()
    renderChooser()

    await user.selectOptions(screen.getByLabelText('Level'), 'A2')

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByText('My day')).toBeInTheDocument()
    expect(screen.queryByText('Greetings')).toBeNull()
  })

  it('filters by subject', async () => {
    const user = userEvent.setup()
    renderChooser()

    await user.selectOptions(screen.getByLabelText('Subject'), '01-first-steps')

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByText('Greetings')).toBeInTheDocument()
  })

  it('filters by skill and shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    renderChooser()

    await user.selectOptions(screen.getByLabelText('Skill'), 'listening')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByText('My day')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Level'), 'A1')
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText(/No exercise matches/)).toBeInTheDocument()
  })
})
