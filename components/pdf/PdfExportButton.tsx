'use client'

import { useCallback, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { FileDown } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'

export interface PdfLesson {
  slug: string
  title: string
  description?: string
}

interface PdfExportButtonProps {
  mode: 'lesson' | 'course'
  lang: Locale
  courseSlug: string
  lessonSlug?: string
  lessonTitle?: string
  lessonDescription?: string
  courseTitle?: string
  courseDescription?: string
  lessons?: PdfLesson[]
  dict: any
  className?: string
}

interface PdfSection {
  title: string
  description?: string
  html: string
}

type Status = 'idle' | 'preparing' | 'error'

/** Remove controls and executable content before putting lesson HTML in the print sheet. */
export function sanitizeLessonContent(root: Element): string {
  const clone = root.cloneNode(true) as HTMLElement
  clone
    .querySelectorAll(
      'script, style, link, iframe, object, embed, video, audio, canvas, button, select, input, textarea, [data-audio-skip], [data-pdf-hide]'
    )
    .forEach((element) => element.remove())
  clone.querySelectorAll('a[href^="javascript:"]').forEach((element) => element.removeAttribute('href'))
  clone.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (/^on/i.test(attribute.name) || attribute.name === 'srcdoc') element.removeAttribute(attribute.name)
    }
  })
  // Print sheets render in one pass; lazy images may otherwise be blank.
  clone.querySelectorAll('img').forEach((image) => {
    image.loading = 'eager'
    image.decoding = 'sync'
  })
  return clone.innerHTML
}

export function PdfExportButton({
  mode,
  lang,
  courseSlug,
  lessonSlug,
  lessonTitle = '',
  lessonDescription = '',
  courseTitle = '',
  courseDescription = '',
  lessons = [],
  dict,
  className = '',
}: PdfExportButtonProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [sections, setSections] = useState<PdfSection[] | null>(null)

  const cleanup = useCallback(() => {
    document.documentElement.classList.remove('pdf-export-mode')
    setSections(null)
    setStatus('idle')
  }, [])

  const print = useCallback(async () => {
    if (status === 'preparing') return
    setStatus('preparing')
    try {
      const collected: PdfSection[] =
        mode === 'lesson'
          ? [
              {
                title: lessonTitle || document.title,
                description: lessonDescription,
                html: sanitizeLessonContent(
                  document.querySelector('[data-lesson-content]') ?? document.createElement('div')
                ),
              },
            ]
          : await Promise.all(
              lessons.map(async (lesson) => {
                const url = `/${lang}/courses/${courseSlug}/${lesson.slug}/`
                const response = await fetch(url, { credentials: 'same-origin' })
                if (!response.ok) throw new Error(`lesson request failed: ${lesson.slug}`)
                const html = await response.text()
                const documentFragment = new DOMParser().parseFromString(html, 'text/html')
                const root = documentFragment.querySelector('[data-lesson-content]')
                if (!root) throw new Error(`lesson content missing: ${lesson.slug}`)
                return {
                  title: lesson.title,
                  description: lesson.description,
                  html: sanitizeLessonContent(root),
                }
              })
            )

      if (collected.every((section) => !section.html.trim())) throw new Error('empty PDF content')

      setStatus('idle')
      // Render the portal synchronously so the sheet is in the DOM before
      // the browser opens its print dialog.
      flushSync(() => setSections(collected))

      document.documentElement.classList.add('pdf-export-mode')
      const onAfterPrint = () => {
        window.removeEventListener('afterprint', onAfterPrint)
        cleanup()
      }
      window.addEventListener('afterprint', onAfterPrint, { once: true })
      window.print()
    } catch {
      setStatus('error')
      setSections(null)
    }
  }, [
    status,
    mode,
    lessonTitle,
    lessonDescription,
    lessons,
    lang,
    courseSlug,
    cleanup,
  ])

  const label =
    mode === 'course'
      ? dict.courses?.print_course || 'Download course PDF'
      : dict.lesson?.print_lesson || 'Save lesson as PDF'

  return (
    <>
      <button
        type="button"
        onClick={print}
        disabled={status === 'preparing'}
        aria-busy={status === 'preparing'}
        data-testid={mode === 'course' ? 'print-course-pdf' : 'print-lesson-pdf'}
        className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-60 ${className}`}
      >
        <FileDown className="h-4 w-4" aria-hidden="true" />
        {status === 'preparing'
          ? dict.courses?.preparing_pdf || 'Preparing PDF…'
          : status === 'error'
            ? dict.courses?.pdf_error || 'Could not prepare the PDF. Try again.'
            : label}
      </button>

      {sections &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="pdf-sheet-root" data-testid="pdf-sheet" aria-hidden="true">
            <header className="pdf-cover">
              <p className="pdf-cover-kicker">
                {mode === 'course'
                  ? dict.courses?.title || 'Course'
                  : dict.navigation?.courses || 'Course'}
              </p>
              <h1>{mode === 'course' ? courseTitle : lessonTitle}</h1>
              {(mode === 'course' ? courseDescription : lessonDescription) && (
                <p>{mode === 'course' ? courseDescription : lessonDescription}</p>
              )}
              <p className="pdf-cover-meta">
                {mode === 'course'
                  ? `${lessons.length} ${dict.courses?.lessons || 'lessons'}`
                  : lessonSlug}
              </p>
            </header>

            {sections.map((section, index) => (
              <section className="pdf-lesson" key={`${section.title}-${index}`}>
                <header className="pdf-lesson-header">
                  <p className="pdf-cover-kicker">
                    {mode === 'course' ? `${index + 1} / ${sections.length}` : ''}
                  </p>
                  <h2>{section.title}</h2>
                  {section.description && <p>{section.description}</p>}
                </header>
                <div
                  className="pdf-lesson-content prose-measure"
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />
              </section>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
