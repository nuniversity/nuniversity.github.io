import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInterval } from '@/lib/games/use-timer'
import { useSafeTimeouts } from '@/lib/games/use-safe-timeouts'

afterEach(() => vi.useRealTimers())

describe('useInterval', () => {
  it('ticks the callback at the given delay', () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    renderHook(() => useInterval(cb, 1000))
    act(() => { vi.advanceTimersByTime(2500) })
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('does not tear down the interval when the callback identity changes', () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    const latest = vi.fn()
    const { rerender } = renderHook(({ fn }) => useInterval(fn, 1000), { initialProps: { fn: cb } })
    const before = vi.getTimerCount()
    // Re-render with a fresh inline callback — the common pattern that caused
    // interval churn in the previous implementations.
    rerender({ fn: latest })
    expect(vi.getTimerCount()).toBe(before)
    act(() => { vi.advanceTimersByTime(1000) })
    // The timer survived (no restart) and the tick dispatched the latest
    // callback, not a stale captured one.
    expect(latest).toHaveBeenCalledTimes(1)
    expect(cb).not.toHaveBeenCalled()
  })

  it('pauses with a null delay and resumes with a number', () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    const { rerender } = renderHook(({ d }) => useInterval(cb, d), { initialProps: { d: 1000 as number | null } })
    act(() => { vi.advanceTimersByTime(2000) })
    expect(cb).toHaveBeenCalledTimes(2)
    rerender({ d: null })
    expect(vi.getTimerCount()).toBe(0)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(cb).toHaveBeenCalledTimes(2)
    rerender({ d: 1000 })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(cb).toHaveBeenCalledTimes(3)
  })

  it('clears the interval on unmount', () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    const { unmount } = renderHook(() => useInterval(cb, 1000))
    unmount()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('useSafeTimeouts', () => {
  it('fires the scheduled callback', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSafeTimeouts())
    const cb = vi.fn()
    act(() => { result.current.setSafeTimeout(cb, 500) })
    act(() => { vi.advanceTimersByTime(500) })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('drops callbacks scheduled after unmount', () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    const { result, unmount } = renderHook(() => useSafeTimeouts())
    act(() => { result.current.setSafeTimeout(cb, 500) })
    unmount()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(cb).not.toHaveBeenCalled()
  })

  it('clears a pending timer via clearSafeTimeout', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSafeTimeouts())
    const cb = vi.fn()
    let id = 0
    act(() => { id = result.current.setSafeTimeout(cb, 500) })
    act(() => { result.current.clearSafeTimeout(id) })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(cb).not.toHaveBeenCalled()
  })

  it('clearAll cancels restart-pending phase transitions (the orphan-timer bug)', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSafeTimeouts())
    const first = vi.fn()
    const second = vi.fn()
    act(() => { result.current.setSafeTimeout(first, 400) })
    act(() => { result.current.clearAll() })
    act(() => { result.current.setSafeTimeout(second, 800) })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
