import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PomodoroTimer from '@/components/tools/PomodoroTimer'

function seed(settings: Record<string, unknown>, runtime: Record<string, unknown>) {
  window.localStorage.setItem('mimir:tools:pomodoro_settings', JSON.stringify(settings))
  window.localStorage.setItem('mimir:tools:pomodoro_runtime', JSON.stringify(runtime))
}

describe('PomodoroTimer', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('takes the long break after the fourth completed work session', async () => {
    seed(
      { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionCount: 3 },
      { phase: 'work', remaining: 30, isActive: true, deadline: Date.now() - 1000 }
    )

    render(
      <React.StrictMode>
        <PomodoroTimer lang="en" dict={{}} />
      </React.StrictMode>
    )

    await waitFor(() => expect(screen.getByText('Long Break')).toBeTruthy())
    expect(screen.getByText('15:00')).toBeTruthy()

    // Persistence is debounced, so wait for the flush before asserting.
    await waitFor(() => {
      const raw = window.localStorage.getItem('mimir:tools:pomodoro_logs')
      expect(raw).toBeTruthy()
      const logs = JSON.parse(raw as string)
      // StrictMode double-invokes effects; the session must still be logged once.
      expect(logs).toHaveLength(1)
    })
  })

  it('takes a short break after the third session', async () => {
    seed(
      { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionCount: 2 },
      { phase: 'work', remaining: 30, isActive: true, deadline: Date.now() - 1000 }
    )

    render(<PomodoroTimer lang="en" dict={{}} />)

    await waitFor(() => expect(screen.getByText('Break Time')).toBeTruthy())
    expect(screen.getByText('05:00')).toBeTruthy()
  })

  it('restores a running timer from its saved deadline', async () => {
    seed(
      { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionCount: 0 },
      { phase: 'work', remaining: 1500, isActive: true, deadline: Date.now() + 60_000 }
    )

    render(<PomodoroTimer lang="en" dict={{}} />)

    await waitFor(() => expect(screen.getByText('01:00')).toBeTruthy())
    expect(screen.queryByText('25:00')).toBeNull()
  })
})
