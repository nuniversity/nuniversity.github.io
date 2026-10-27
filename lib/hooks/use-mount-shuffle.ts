'use client'

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Returns `source` unchanged on the server and on the first client render,
 * then applies `shuffle` once after mount.
 *
 * Shuffling during render is a hydration bug: the server and the client each
 * call `Math.random()` and produce different orders, so React throws error
 * #425 and discards the server HTML. Deferring the shuffle to an effect keeps
 * the two renders identical.
 */
export function useMountShuffle<T>(
  source: T[],
  shuffle: (items: T[]) => T[]
): [T[], Dispatch<SetStateAction<T[]>>] {
  const [items, setItems] = useState<T[]>(source)
  const shuffled = useRef(false)

  useEffect(() => {
    if (shuffled.current) return
    shuffled.current = true
    setItems(shuffle(source))
    // The shuffle runs exactly once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [items, setItems]
}
