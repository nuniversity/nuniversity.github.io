'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readJson, safeRemove, writeJson } from '@/lib/storage/safe-storage'

interface PersistentOptions {
  /**
   * Previous un-namespaced keys. The first valid legacy value is migrated to
   * the new key once and then removed.
   */
  legacyKeys?: string[]
}

/**
 * localStorage-backed state with defensive hydration.
 *
 * The write side is gated on hydration: previously tools wrote their initial
 * empty array during the first paint, before the load effect's state landed,
 * so closing the tab in that window destroyed the user's data. Here the first
 * write happens only after the stored value has been read and applied.
 *
 * @param key      Namespaced storage key (e.g. `mimir:tools:habits`).
 * @param initial  Value used for SSR and until hydration completes.
 * @param validate Shape validator; return `null` to discard corrupt data.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  validate: (raw: unknown) => T | null,
  options: PersistentOptions = {}
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)
  const validateRef = useRef(validate)
  validateRef.current = validate
  const stateRef = useRef(state)
  stateRef.current = state
  const readyRef = useRef(false)

  useEffect(() => {
    readyRef.current = hydrated
  }, [hydrated])

  useEffect(() => {
    let value: T | null = null

    for (const legacyKey of options.legacyKeys ?? []) {
      const legacyValue = readJson(legacyKey, validateRef.current)
      if (legacyValue !== null) {
        value = legacyValue
        writeJson(key, legacyValue)
        safeRemove(legacyKey)
        break
      }
    }

    if (value === null) {
      value = readJson(key, validateRef.current)
    }

    if (value !== null) setState(value)
    setHydrated(true)
    // Keys are stable identifiers; re-running on validator identity would
    // re-hydrate on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    // Debounce bursts (typing in a textarea) instead of serialising the whole
    // tool state on every keystroke.
    const timer = setTimeout(() => writeJson(key, state), 250)
    return () => clearTimeout(timer)
  }, [hydrated, key, state])

  // Flush the latest value when the component unmounts. Guarded by the
  // *rendered* hydrated flag so StrictMode's mount/cleanup probe cannot write
  // the pre-hydration default over real data.
  useEffect(() => {
    return () => {
      if (readyRef.current) writeJson(key, stateRef.current)
    }
  }, [key])

  return [state, setState, hydrated]
}

/**
 * Clipboard copy with a self-clearing "copied" flag.
 * Reports failure instead of claiming success on insecure origins, and clears
 * its timeout on unmount.
 */
export function useCopyToClipboard(timeoutMs = 2000) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
          throw new Error('Clipboard API unavailable')
        }
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setFailed(false)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), timeoutMs)
        return true
      } catch {
        setCopied(false)
        setFailed(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setFailed(false), timeoutMs)
        return false
      }
    },
    [timeoutMs]
  )

  return { copied, failed, copy }
}
