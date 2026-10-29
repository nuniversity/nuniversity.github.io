import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import Spotlight from '@/components/home/Spotlight'


vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const dict = {
  featured: { title: 'Featured', titleHighlight: 'Courses' },
  courses: {
    lessons: 'Lessons',
    lesson: 'Lesson',
    difficulty_labels: { beginner: 'Beginner', advanced: 'Advanced' },
    cta: { start_learning: 'Start Learning', view_all: 'Explore all courses' },
  },
} as any

const courses = [
  {
    slug: 'agent-memory',
    title: 'Agent Knowledge Bases and Memory',
    description: 'Design persistent memory systems.',
    area: 'Artificial Intelligence',
    difficulty: 'beginner' as const,
    duration: '4 Weeks',
    lessonCount: 5,
  },
  {
    slug: 'aws-lakehouse',
    title: 'Data Lakehouse on AWS',
    description: 'Build a lakehouse.',
    area: 'Cloud & AI/ML',
    difficulty: 'advanced' as const,
    duration: '12 Weeks',
    lessonCount: 16,
  },
]

describe('Spotlight', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterAll(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders the first course', () => {
    render(<Spotlight lang="en" dict={dict} courses={courses} />)
    expect(screen.getByText('Agent Knowledge Bases and Memory')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start Learning/ })).toHaveAttribute(
      'href',
      '/en/courses/agent-memory/'
    )
  })

  it('advances to the next slide', () => {
    render(<Spotlight lang="en" dict={dict} courses={courses} />)
    fireEvent.click(screen.getByLabelText('Next course'))
    expect(screen.getByText('Data Lakehouse on AWS')).toBeInTheDocument()
  })

  it('wraps around when going back from the first slide', () => {
    render(<Spotlight lang="en" dict={dict} courses={courses} />)
    fireEvent.click(screen.getByLabelText('Previous course'))
    expect(screen.getByText('Data Lakehouse on AWS')).toBeInTheDocument()
  })

  it('jumps to a slide via the dot indicators', () => {
    render(<Spotlight lang="en" dict={dict} courses={courses} />)
    fireEvent.click(screen.getByLabelText('Go to slide 2'))
    expect(screen.getByText('Data Lakehouse on AWS')).toBeInTheDocument()
  })

  it('exposes the carousel pattern', () => {
    const { container } = render(<Spotlight lang="en" dict={dict} courses={courses} />)
    const carousel = container.querySelector('[aria-roledescription="carousel"]')
    expect(carousel).toBeTruthy()
    expect(carousel).toHaveAttribute('aria-label', 'Featured')
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', '1 of 2')
  })

  it('shows the course metadata', () => {
    render(<Spotlight lang="en" dict={dict} courses={courses} />)
    expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument()
    expect(screen.getByText('4 Weeks')).toBeInTheDocument()
    expect(screen.getByText(/5 Lessons/)).toBeInTheDocument()
    expect(screen.getByText('Beginner')).toBeInTheDocument()
  })

  it('renders nothing when there are no courses', () => {
    const { container } = render(<Spotlight lang="en" dict={dict} courses={[]} />)
    expect(container.innerHTML).toBe('')
  })
})
