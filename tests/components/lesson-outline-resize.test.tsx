import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LessonOutline from '@/components/lessons/LessonOutline'


vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/progress/storage', () => ({
  getCourseProgress: () => null,
}))

const dict = {
  lesson: {
    menu_toggle: 'Lesson menu',
    outline_title: 'On this page',
    toc_empty: 'No sections in this lesson',
    keyboard_hint: 'Tip: use ← and → to switch lessons',
    hide_outline: 'Hide course outline',
    show_outline: 'Show outline',
    resize_outline: 'Resize course outline',
    completed_badge: 'Completed',
  },
  courses: { back_to_courses: 'Back to Courses', course_content: 'Course Content' },
} as any

const lessons = [
  { slug: 'intro', title: 'Introduction' },
  { slug: 'setup', title: 'Setup Guide' },
]

function renderOutline() {
  return render(
    <LessonOutline
      lang="en"
      courseSlug="aws"
      lessonSlug="intro"
      courseTitle="AWS Course"
      lessonTitle="Introduction"
      lessons={lessons}
      dict={dict}
    >
      <div data-lesson-content>
        <h2 id="one">One</h2>
      </div>
    </LessonOutline>
  )
}

describe('LessonOutline resize and collapse', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders a keyboard-operable resize separator', () => {
    renderOutline()
    const separator = screen.getByTestId('outline-resizer')
    expect(separator).toHaveAttribute('role', 'separator')
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    expect(separator).toHaveAttribute('tabIndex', '0')
    expect(separator).toHaveAttribute('aria-valuemin', '240')
    expect(separator).toHaveAttribute('aria-valuemax', '520')
  })

  it('follows the window-splitter pattern', () => {
    renderOutline()
    const separator = screen.getByTestId('outline-resizer')

    // aria-valuenow reports the primary pane's size, and aria-valuetext makes
    // the pixel value meaningful to a screen reader.
    expect(separator).toHaveAttribute('aria-valuenow', '320')
    expect(separator).toHaveAttribute('aria-valuetext', '320 pixels')

    // The separator must name the pane it resizes.
    expect(separator).toHaveAttribute('aria-controls', 'lesson-outline')
    expect(document.getElementById('lesson-outline')).not.toBeNull()

    // A visible focus indicator is required for a focusable separator.
    expect(separator.className).toContain('focus-visible:ring-2')
  })

  it('collapses and restores with Enter', () => {
    renderOutline()
    const separator = screen.getByTestId('outline-resizer')

    fireEvent.keyDown(separator, { key: 'Enter' })
    expect(screen.queryByTestId('outline-resizer')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Show outline'))
    expect(screen.getByTestId('outline-resizer')).toBeInTheDocument()
  })

  it('resizes with the arrow keys and remembers the width', () => {
    renderOutline()
    const separator = screen.getByTestId('outline-resizer')
    expect(separator).toHaveAttribute('aria-valuenow', '320')

    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(screen.getByTestId('outline-resizer')).toHaveAttribute('aria-valuenow', '344')

    fireEvent.keyDown(separator, { key: 'ArrowLeft' })
    expect(screen.getByTestId('outline-resizer')).toHaveAttribute('aria-valuenow', '320')

    expect(localStorage.getItem('lesson-outline-width')).toBe('320')
  })

  it('clamps the width to the allowed range', () => {
    renderOutline()
    const separator = screen.getByTestId('outline-resizer')

    fireEvent.keyDown(separator, { key: 'Home' })
    expect(screen.getByTestId('outline-resizer')).toHaveAttribute('aria-valuenow', '240')

    fireEvent.keyDown(separator, { key: 'End' })
    expect(screen.getByTestId('outline-resizer')).toHaveAttribute('aria-valuenow', '520')
  })

  it('hides the outline and shows a way to bring it back', () => {
    renderOutline()

    fireEvent.click(screen.getByLabelText('Hide course outline'))

    // The separator disappears with the sidebar.
    expect(screen.queryByTestId('outline-resizer')).not.toBeInTheDocument()
    expect(localStorage.getItem('lesson-outline-collapsed')).toBe('1')

    const reopen = screen.getByLabelText('Show outline')
    fireEvent.click(reopen)

    expect(screen.getByTestId('outline-resizer')).toBeInTheDocument()
    expect(localStorage.getItem('lesson-outline-collapsed')).toBe('0')
  })

  it('restores the saved width and collapsed state on mount', () => {
    localStorage.setItem('lesson-outline-width', '420')
    localStorage.setItem('lesson-outline-collapsed', '1')

    renderOutline()

    // Collapsed, so the separator is absent but the reopen control is present.
    expect(screen.queryByTestId('outline-resizer')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Show outline'))
    expect(screen.getByTestId('outline-resizer')).toHaveAttribute('aria-valuenow', '420')
  })

  it('ignores a corrupt saved width', () => {
    localStorage.setItem('lesson-outline-width', 'not-a-number')
    renderOutline()
    expect(screen.getByTestId('outline-resizer')).toHaveAttribute('aria-valuenow', '320')
  })

  it('clamps an out-of-range saved width', () => {
    localStorage.setItem('lesson-outline-width', '9999')
    renderOutline()
    expect(screen.getByTestId('outline-resizer')).toHaveAttribute('aria-valuenow', '520')
  })
})
