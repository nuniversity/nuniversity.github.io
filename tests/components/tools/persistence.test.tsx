import { describe, expect, it, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { usePersistentState } from '@/lib/tools/use-persistent-state'

function strings(raw: unknown): string[] | null {
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : null
}

describe('usePersistentState', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('hydrates from storage without overwriting it', async () => {
    window.localStorage.setItem('mimir:tools:test', JSON.stringify(['saved']))

    const { result } = renderHook(() =>
      usePersistentState<string[]>('mimir:tools:test', [], strings)
    )

    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0]).toEqual(['saved'])
    expect(JSON.parse(window.localStorage.getItem('mimir:tools:test') as string)).toEqual(['saved'])
  })

  it('migrates a legacy key exactly once', async () => {
    window.localStorage.setItem('legacy_tools', JSON.stringify(['old']))

    const { result } = renderHook(() =>
      usePersistentState<string[]>('mimir:tools:test', [], strings, {
        legacyKeys: ['legacy_tools'],
      })
    )

    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0]).toEqual(['old'])
    expect(window.localStorage.getItem('legacy_tools')).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('mimir:tools:test') as string)).toEqual(['old'])
  })

  it('discards corrupt values instead of crashing', async () => {
    window.localStorage.setItem('mimir:tools:test', '{not json')

    const { result } = renderHook(() =>
      usePersistentState<string[]>('mimir:tools:test', [], strings)
    )

    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0]).toEqual([])
    // The corrupt payload is replaced by the sanitised default after the
    // debounced write, not re-read on the next mount.
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem('mimir:tools:test') as string)).toEqual([])
    )
  })

  it('persists updates after hydration', async () => {
    const { result } = renderHook(() =>
      usePersistentState<string[]>('mimir:tools:test', [], strings)
    )

    await waitFor(() => expect(result.current[2]).toBe(true))
    act(() => result.current[1](['new']))
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem('mimir:tools:test') as string)).toEqual(['new'])
    )
  })
})
