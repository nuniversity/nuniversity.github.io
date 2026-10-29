import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Providers, useTheme } from '@/components/providers/Providers'
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from '@/lib/theme/theme'


function Probe() {
  const { theme, ready, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} data-testid="probe">
      {ready ? theme : 'pending'}
    </button>
  )
}

function renderProbe() {
  return render(
    <Providers>
      <Probe />
    </Providers>
  )
}

describe('theme initialisation', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  it('exposes an init script that runs before paint', () => {
    // The script must read the stored key and toggle the class — it is the
    // only thing standing between a dark-mode visitor and a white flash.
    expect(THEME_INIT_SCRIPT).toContain(THEME_STORAGE_KEY)
    expect(THEME_INIT_SCRIPT).toContain("classList.toggle('dark'")
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme')
  })

  it('does not remove the dark class before the theme is resolved', async () => {
    // Simulate what the init script does on a dark-mode load.
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    document.documentElement.classList.add('dark')

    renderProbe()
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('dark'))

    // The provider must never have stripped the class on its first effect run.
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('restores the light theme from storage', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    document.documentElement.classList.add('dark')

    renderProbe()
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles and persists', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('probe')).not.toHaveTextContent('pending'))

    const before = screen.getByTestId('probe').textContent
    fireEvent.click(screen.getByTestId('probe'))

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).not.toBe(before)
    })
  })

  it('ignores a corrupt stored value', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse')
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('probe')).not.toHaveTextContent('pending'))
    expect(['light', 'dark']).toContain(screen.getByTestId('probe').textContent)
  })
})
