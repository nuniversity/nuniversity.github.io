'use client'

import { useEffect, useState } from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'
import { applyFocusMode } from '@/lib/lessons/focus-mode'

/**
 * Toggles the condensed lesson view (progressive disclosure). Chrome only.
 * Clicking a TOC/anchor link while focus mode is on exits focus mode first,
 * otherwise the link would target a hidden section.
 */
export default function FocusModeToggle({ dict }: { dict?: any }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-lesson-content]')
    if (!root) return
    applyFocusMode(root, enabled)
    return () => applyFocusMode(root, false)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('a[href^="#"]')) setEnabled(false)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [enabled])

  return (
    <button
      type="button"
      data-audio-skip
      aria-pressed={enabled}
      onClick={() => setEnabled((value) => !value)}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
    >
      {enabled ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
      {enabled
        ? dict?.lesson?.focus_off || 'Show full lesson'
        : dict?.lesson?.focus_on || 'Focus mode'}
    </button>
  )
}
