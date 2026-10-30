'use client'

import { useEffect } from 'react'

interface FocusableScrollersProps {
  /** Container to scan. */
  selector?: string
}

/**
 * Makes horizontally scrollable regions keyboard-operable.
 *
 * WCAG 2.1.1 requires every function to be available from a keyboard. A
 * `div` with `overflow-x: auto` can be scrolled with a trackpad or a mouse
 * wheel, but a keyboard user cannot reach it unless it is focusable. KaTeX
 * display blocks, wide tables and wide code blocks all fall into this trap,
 * so they are given `tabindex="0"` when — and only when — they actually
 * overflow.
 */
export default function FocusableScrollers({
  selector = '[data-lesson-content]',
}: FocusableScrollersProps) {
  useEffect(() => {
    const root = document.querySelector(selector)
    if (!root) return

    const candidates = root.querySelectorAll<HTMLElement>(
      '.katex-display, .mermaid-scroll-container, table, pre, .not-prose[class*="overflow-x"]'
    )

    const apply = () => {
      for (const el of Array.from(candidates)) {
        const overflows = el.scrollWidth > el.clientWidth + 1
        if (overflows && !el.hasAttribute('tabindex')) {
          el.setAttribute('tabindex', '0')
          el.setAttribute('role', 'region')
          el.setAttribute('aria-label', 'Scrollable content')
          el.dataset.focusAuto = 'true'
        } else if (!overflows && el.dataset.focusAuto === 'true') {
          el.removeAttribute('tabindex')
          el.removeAttribute('role')
          el.removeAttribute('aria-label')
          delete el.dataset.focusAuto
        }
      }
    }

    apply()

    // Content can reflow (fonts, theme, resize), so re-check.
    const observer = new ResizeObserver(apply)
    observer.observe(root)
    return () => observer.disconnect()
  }, [selector])

  return null
}
