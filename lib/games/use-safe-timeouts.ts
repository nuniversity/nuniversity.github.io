'use client'

import { useCallback, useEffect, useRef } from 'react'

export type SafeTimeoutId = number

/**
 * Ref-tracked `setTimeout` registry that can never leave orphan callbacks.
 *
 * Fixes the stale-timer bug class found across the game clients:
 * - A callback scheduled on unmount would otherwise fire into a dead component.
 * - A callback scheduled while a game restarts (e.g. the nested "done showing
 *   the sequence" timeout in number-sequence) would otherwise throw the next
 *   round straight into a later phase.
 *
 * Every handle is cleared automatically on unmount; games call `clearAll()`
 * on restart/quit to invalidate still-pending phase transitions.
 */
export function useSafeTimeouts() {
  const registry = useRef(new Map<SafeTimeoutId, ReturnType<typeof setTimeout>>())
  const nextId = useRef<SafeTimeoutId>(1)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    // Copy the ref value into the closure so the cleanup never touches a
    // possibly-changed ref (react-hooks/exhaustive-deps).
    const live = registry.current
    return () => {
      mountedRef.current = false
      for (const timer of live.values()) clearTimeout(timer)
      live.clear()
    }
  }, [])

  const setSafeTimeout = useCallback((fn: () => void, ms: number): SafeTimeoutId => {
    const id = nextId.current++
    const timer = setTimeout(() => {
      registry.current.delete(id)
      // Never fire into an unmounted component: the cleanup effect clears the
      // registry and flips the flag, so any still-pending handle is dropped.
      if (mountedRef.current) fn()
    }, ms)
    registry.current.set(id, timer)
    return id
  }, [])

  const clearSafeTimeout = useCallback((id: SafeTimeoutId) => {
    const timer = registry.current.get(id)
    if (timer === undefined) return
    clearTimeout(timer)
    registry.current.delete(id)
  }, [])

  const clearAll = useCallback(() => {
    for (const timer of registry.current.values()) clearTimeout(timer)
    registry.current.clear()
  }, [])

  return { setSafeTimeout, clearSafeTimeout, clearAll }
}
