import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import LessonOutline from '@/components/lessons/LessonOutline'
import { markLessonComplete } from '@/lib/progress/storage'

vi.stubGlobal('React', React)

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  observed: Element[] = []
  constructor(
    public callback: (entries: { target: Element; isIntersecting: boolean }[], observer: MockIntersectionObserver) => void
  ) {
    MockIntersectionObserver.instances.push(this)
  }
  observe(element: Element) {
    this.observed.push(element)
  }
  unobserve() {}
  disconnect() {}
  trigger(element: Element, isIntersecting: boolean) {
    this.callback([{ target: element, isIntersecting }], this)
  }
}

const dict = {
  lesson: {
    outline_title: 'On this page',
    menu_toggle: 'Lesson menu',
    toc_empty: 'No sections in this lesson',
    keyboard_hint: 'Tip: use ← and → to switch lessons',
  },
  courses: {
    back_to_courses: 'Back to Courses',
    course_content: 'Course Content',
  },
}

const lessons = [
  { slug: 'intro', title: 'Introduction' },
  { slug: 'setup', title: 'Setup Guide' },
]

function renderOutline(lessonSlug = 'setup') {
  return render(
    <LessonOutline
      lang="en"
      courseSlug="aws-aif-c01"
      lessonSlug={lessonSlug}
      courseTitle="AWS AIF C01"
      lessonTitle="Setup Guide"
      lessons={lessons}
      dict={dict}
    />
  )
}

let contentRoot: HTMLElement

beforeEach(() => {
  window.localStorage.clear()
  MockIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  contentRoot = document.createElement('div')
  contentRoot.setAttribute('data-lesson-content', '')
  contentRoot.innerHTML = '<h2 id="overview">Overview</h2><h3 id="details">Details</h3>'
  document.body.appendChild(contentRoot)
})

afterEach(() => {
  cleanup()
  contentRoot.remove()
})

describe('LessonOutline syllabus', () => {
  it('lists every lesson with numbering', () => {
    renderOutline()

    const nav = screen.getByRole('navigation', { name: 'Course Content' })
    expect(nav).toHaveTextContent('01Introduction')
    expect(nav).toHaveTextContent('02Setup Guide')
  })

  it('marks the active lesson', () => {
    renderOutline('setup')

    const active = screen.getByRole('link', { name: /Setup Guide/ })
    expect(active.className).toContain('bg-primary')
    const inactive = screen.getByRole('link', { name: /Introduction/ })
    expect(inactive.className).not.toContain('bg-primary')
  })

  it('renders the course title and back link', () => {
    renderOutline()

    expect(screen.getByText('AWS AIF C01')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Courses' })).toHaveAttribute('href', '/en/courses')
  })

  it('shows a check on completed syllabus lessons', () => {
    markLessonComplete('aws-aif-c01', 'intro')

    renderOutline()

    expect(screen.getAllByTestId('outline-check')).toHaveLength(1)
    expect(
      screen.getByRole('link', { name: /Introduction/ }).querySelector('[data-testid="outline-check"]')
    ).not.toBeNull()
    expect(
      screen.getByRole('link', { name: /Setup Guide/ }).querySelector('[data-testid="outline-check"]')
    ).toBeNull()
  })
})

describe('LessonOutline table of contents', () => {
  it('extracts h2/h3 ids from the lesson content container', () => {
    renderOutline()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(toc).toHaveTextContent('Overview')
    expect(toc).toHaveTextContent('Details')
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '#overview')
  })

  it('shows the empty hint when the lesson has no headings', () => {
    contentRoot.innerHTML = '<p>Just prose, no headings.</p>'
    renderOutline()

    expect(screen.getByText('No sections in this lesson')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'On this page' })).not.toBeInTheDocument()
  })

  it('highlights the section reported by the IntersectionObserver', () => {
    renderOutline()

    const observer = MockIntersectionObserver.instances[0]
    expect(observer).toBeDefined()
    const details = contentRoot.querySelector('#details') as Element
    expect(observer.observed).toContain(details)

    act(() => {
      observer.trigger(details, true)
    })
    expect(screen.getByRole('link', { name: 'Details' }).className).toContain('text-primary')
    expect(screen.getByRole('link', { name: 'Overview' }).className).not.toContain('text-primary')
  })
})

describe('LessonOutline mobile drawer', () => {
  it('opens and closes the drawer from the menu button', () => {
    renderOutline()

    const toggle = screen.getByRole('button', { name: 'Lesson menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('lesson-drawer-overlay')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('lesson-drawer-overlay')).not.toBeInTheDocument()
  })

  it('closes the drawer when the overlay is clicked', () => {
    renderOutline()

    fireEvent.click(screen.getByRole('button', { name: 'Lesson menu' }))
    fireEvent.click(screen.getByTestId('lesson-drawer-overlay'))

    expect(screen.getByRole('button', { name: 'Lesson menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})
