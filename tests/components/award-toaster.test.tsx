import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import AwardToaster from '@/components/gamification/AwardToaster'
import { emitAward } from '@/lib/gamification/bus'


const dict = {
  gamification: {
    xp: '{n} XP',
    level: 'Level {n}',
    level_up: 'Level up! You reached level {n}',
    badges: {
      awarded: 'Badge earned: {name}',
      quiz_pass: 'Quiz qualifier',
      first_lesson: 'First steps',
    },
  },
} as any

afterEach(() => {
  vi.useRealTimers()
})

describe('AwardToaster', () => {
  it('renders nothing until an award fires', () => {
    render(<AwardToaster dict={dict} />)
    expect(screen.queryByTestId('award-toaster')).not.toBeInTheDocument()
  })

  it('shows an XP toast', () => {
    render(<AwardToaster dict={dict} />)

    act(() => {
      emitAward({ xp: 10, badges: [], level: 1, previousLevel: 1 })
    })

    expect(screen.getByTestId('award-toaster')).toBeInTheDocument()
    expect(screen.getByTestId('award-toast')).toHaveTextContent('+10 XP')
  })

  it('shows one toast per awarded badge with its localized name', () => {
    render(<AwardToaster dict={dict} />)

    act(() => {
      emitAward({ xp: 0, badges: ['first-lesson', 'quiz-pass'], level: 1, previousLevel: 1 })
    })

    const toasts = screen.getAllByTestId('award-toast')
    expect(toasts).toHaveLength(2)
    expect(toasts[0]).toHaveTextContent('Badge earned: First steps')
    expect(toasts[1]).toHaveTextContent('Badge earned: Quiz qualifier')
  })

  it('shows a level-up toast', () => {
    render(<AwardToaster dict={dict} />)

    act(() => {
      emitAward({ xp: 0, badges: [], level: 4, previousLevel: 3 })
    })

    expect(screen.getByTestId('award-toast')).toHaveTextContent('Level up! You reached level 4')
  })

  it('dismisses toasts after 4.5 seconds', () => {
    render(<AwardToaster dict={dict} />)
    vi.useFakeTimers()

    act(() => {
      emitAward({ xp: 10, badges: [], level: 1, previousLevel: 1 })
    })
    expect(screen.getAllByTestId('award-toast')).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(4500)
    })
    expect(screen.queryByTestId('award-toast')).not.toBeInTheDocument()
  })
})
