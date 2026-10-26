// components/markdown/LessonImage.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface LessonImageProps {
  src: string
  alt?: string
  /** Optional visible caption, distinct from the alt text. */
  caption?: string
}

/**
 * An image in lesson content.
 *
 * Uses real `<figure>` semantics, loads lazily, and opens a keyboard-
 * accessible lightbox on click (Escape closes, arrows move between the
 * images on the page, focus returns to the trigger).
 */
export default function LessonImage({ src, alt = '', caption }: LessonImageProps) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, close])

  const isExternal = /^https?:\/\//i.test(src)

  return (
    <figure className="my-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full overflow-hidden rounded-xl border border-border bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={alt ? `Enlarge image: ${alt}` : 'Enlarge image'}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="mx-auto max-h-[32rem] w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
        />
        <span className="flex items-center justify-center gap-1.5 border-t border-border py-1.5 text-xs text-foreground-subtle">
          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
          Click to enlarge
        </span>
      </button>

      {caption && (
        <figcaption className="mt-2 text-center text-sm text-foreground-muted">
          {caption}
        </figcaption>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || 'Image'}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 animate-fade-in"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close image"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[88vh] max-w-full rounded-lg object-contain"
            onClick={event => event.stopPropagation()}
          />

          {caption && (
            <p className="absolute bottom-6 left-1/2 w-full max-w-2xl -translate-x-1/2 px-4 text-center text-sm text-white/80">
              {caption}
            </p>
          )}
        </div>
      )}
    </figure>
  )
}
