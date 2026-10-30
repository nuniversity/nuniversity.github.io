import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PdfExportButton, sanitizeLessonContent } from '@/components/pdf/PdfExportButton'

const dict = {
  courses: {
    title: 'Course',
    lessons: 'lessons',
    print_course: 'Download course PDF',
    preparing_pdf: 'Preparing PDF…',
    pdf_error: 'Could not prepare the PDF. Try again.',
  },
  lesson: { print_lesson: 'Save lesson as PDF' },
  navigation: { courses: 'Course' },
}

let printed: ReturnType<typeof vi.fn>

beforeEach(() => {
  printed = vi.fn()
  Object.defineProperty(window, 'print', { configurable: true, value: printed })
  document.documentElement.classList.remove('pdf-export-mode')
  document.body.innerHTML = ''
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('pdf-export-mode')
})

function lessonDom() {
  const root = document.createElement('div')
  root.setAttribute('data-lesson-content', 'true')
  root.innerHTML = `
    <h2>Lesson heading</h2>
    <p>Lesson body text.</p>
    <button>Copy</button>
    <script>alert('no')</script>
  `
  document.body.appendChild(root)
  return root
}

describe('PdfExportButton', () => {
  it('prints the current lesson content through a body-portalled sheet', async () => {
    lessonDom()
    const user = userEvent.setup()
    render(
      <PdfExportButton
        mode="lesson"
        lang="en"
        courseSlug="course"
        lessonSlug="lesson"
        lessonTitle="Lesson title"
        lessonDescription="Lesson description"
        dict={dict}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Save lesson as PDF' }))

    const sheet = await screen.findByTestId('pdf-sheet')
    expect(sheet).toHaveTextContent('Lesson title')
    expect(sheet).toHaveTextContent('Lesson body text.')
    expect(sheet).not.toHaveTextContent('alert')
    expect(printed).toHaveBeenCalledTimes(1)
    expect(document.documentElement).toHaveClass('pdf-export-mode')

    act(() => window.dispatchEvent(new Event('afterprint')))
    await waitFor(() => expect(screen.queryByTestId('pdf-sheet')).not.toBeInTheDocument())
    expect(document.documentElement).not.toHaveClass('pdf-export-mode')
  })

  it('collects every lesson for the course PDF', async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      text: async () =>
        '<html><body><div data-lesson-content="true"><h2>' +
        (String(url).includes('/a/') ? 'A content' : 'B content') +
        '</h2></div></body></html>',
    }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <PdfExportButton
        mode="course"
        lang="en"
        courseSlug="course"
        courseTitle="Course title"
        courseDescription="Course description"
        lessons={[
          { slug: 'a', title: 'A title' },
          { slug: 'b', title: 'B title' },
        ]}
        dict={dict}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Download course PDF' }))

    const sheet = await screen.findByTestId('pdf-sheet')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sheet).toHaveTextContent('A title')
    expect(sheet).toHaveTextContent('A content')
    expect(sheet).toHaveTextContent('B title')
    expect(printed).toHaveBeenCalledTimes(1)
  })

  it('shows an error and does not print when a lesson cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, text: async () => '' })))
    const user = userEvent.setup()

    render(
      <PdfExportButton
        mode="course"
        lang="en"
        courseSlug="course"
        courseTitle="Course"
        lessons={[{ slug: 'a', title: 'A' }]}
        dict={dict}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Download course PDF' }))

    expect(await screen.findByText('Could not prepare the PDF. Try again.')).toBeInTheDocument()
    expect(printed).not.toHaveBeenCalled()
    expect(screen.queryByTestId('pdf-sheet')).not.toBeInTheDocument()
  })

  it('strips scripts and interactive controls from lesson HTML', () => {
    lessonDom()
    const root = document.querySelector('[data-lesson-content]')!
    const html = sanitizeLessonContent(root)

    expect(html).toContain('Lesson heading')
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<script')
  })
})
