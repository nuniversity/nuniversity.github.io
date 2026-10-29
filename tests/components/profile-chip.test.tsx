import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ProfileChip from '@/components/gamification/ProfileChip'
import { recordAndEmit } from '@/lib/gamification/bus'
import { clearProfile, saveProfile } from '@/lib/gamification/profile'


const dict = {
  gamification: {
    xp: '{n} XP',
    level: 'Level {n}',
    streak: { title: 'Streak', days: '{n} day streak', best: 'Best: {n}' },
    level_up: 'Level up! You reached level {n}',
    badges: {
      title: 'Badges',
      empty: 'No badges yet',
      awarded: 'Badge earned: {name}',
      first_lesson: 'First steps',
      first_lesson_desc: 'Complete your first lesson',
      quiz_pass: 'Quiz qualifier',
      quiz_pass_desc: 'Pass a certification quiz',
      perfect_quiz: 'Perfect score',
      perfect_quiz_desc: 'Score 100% on a quiz',
      course_complete: 'Course conqueror',
      course_complete_desc: 'Complete every lesson in a course',
      streak_7: 'On fire',
      streak_7_desc: 'Keep a 7-day learning streak',
    },
  },
} as any

beforeEach(() => {
  clearProfile()
})

describe('ProfileChip', () => {
  it('shows level and XP from the stored profile', () => {
    saveProfile({ xp: 240, badges: {}, streak: { current: 1, best: 1, lastDay: null } })

    render(<ProfileChip dict={dict} />)

    expect(screen.getByTestId('profile-chip')).toBeInTheDocument()
    expect(screen.getByText('Level 3')).toBeInTheDocument()
    expect(screen.getByText('240 XP')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-streak')).not.toBeInTheDocument()
  })

  it('shows the streak counter for multi-day streaks', () => {
    saveProfile({ xp: 0, badges: {}, streak: { current: 3, best: 5, lastDay: null } })

    render(<ProfileChip dict={dict} />)

    const streak = screen.getByTestId('profile-streak')
    expect(streak).toHaveTextContent('3')
  })

  it('lists all badges in the popover with awarded state', () => {
    saveProfile({
      xp: 10,
      badges: { 'first-lesson': '2026-01-01T00:00:00.000Z' },
      streak: { current: 7, best: 7, lastDay: null },
    })

    render(<ProfileChip dict={dict} />)
    fireEvent.click(screen.getByTestId('profile-chip'))

    const popover = screen.getByTestId('badge-popover')
    expect(popover).toBeInTheDocument()
    expect(screen.getByText('Badges')).toBeInTheDocument()
    expect(screen.getByTestId('badge-first-lesson')).toHaveAttribute('data-awarded', 'true')
    expect(screen.getByText('First steps')).toBeInTheDocument()
    expect(screen.getByTestId('badge-quiz-pass')).toHaveAttribute('data-awarded', 'false')
    expect(screen.getByText('Pass a certification quiz')).toBeInTheDocument()
    expect(screen.getByTestId('badge-perfect-quiz')).toHaveAttribute('data-awarded', 'false')
    expect(screen.getByTestId('badge-course-complete')).toHaveAttribute('data-awarded', 'false')
    expect(screen.getByTestId('badge-streak-7')).toHaveAttribute('data-awarded', 'false')
    expect(screen.getByText('7 day streak')).toBeInTheDocument()
    expect(screen.getByText('Best: 7')).toBeInTheDocument()
  })

  it('refreshes when an award event fires', () => {
    render(<ProfileChip dict={dict} />)
    expect(screen.getByText('0 XP')).toBeInTheDocument()

    act(() => {
      recordAndEmit({ type: 'lesson-complete', courseSlug: 'c', lessonSlug: 'l' })
    })

    expect(screen.getByText('10 XP')).toBeInTheDocument()
  })
})
