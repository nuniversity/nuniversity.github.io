'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Counts up to `target` once the element scrolls into view.
 *
 * Under `prefers-reduced-motion: reduce` the value is applied immediately, so
 * the number is still correct — it just does not animate.
 */
export function useCountUp(target: number, durationMs = 1400) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(target)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setValue(target)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting || started.current) return
        started.current = true
        observer.disconnect()

        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs)
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.round(target * eased))
          if (progress < 1) requestAnimationFrame(tick)
          else setValue(target)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [target, durationMs])

  return { ref, value }
}
