'use client'

import { useEffect, useRef } from 'react'

type IntervalCallback = () => void

/**
 * Declarative `setInterval` (the Dan Abramov pattern, hardened).
 *
 * - The timer survives re-renders: the effect depends only on `delay`, so a
 *   ticking value changing state never tears the interval down and recreates it
 *   (the churn/drift bug every game client previously had).
 * - The callback is always fresh: it is kept in a ref and read at tick time, so
 *   inline callbacks see the latest state without restarting the timer.
 * - `delay === null` pauses the interval; cleanup is automatic on unmount.
 */
export function useInterval(callback: IntervalCallback, delay: number | null): void {
  const savedCallback = useRef<IntervalCallback>(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
