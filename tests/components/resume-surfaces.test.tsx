import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResumeCta from '@/components/courses/ResumeCta'
import CourseProgressBadge from '@/components/courses/CourseProgressBadge'
import ContinueLearning from '@/components/home/ContinueLearning'
import CourseContentList from '@/components/lessons/CourseContentList'
import { markLessonComplete, recordVisit } from '@/lib/progress/storage'

vi.stubGlobal('React', React)

const dict = {
  courses: {
    start_learning: 'Start Learning',
    progress: 'Progress',
    lessons: 'lessons',
  },
  lesson: {
    continue: 'Continue',
    completed_badge: 'Completed',
    progress_of: '{done} of {total} completed',
  },
  navigation: {
    courses: 'Courses',
  },
}

const lessonSlugs = ['intro', 'setup', 'deploy']

beforeEach(() => {
  window.localStorage.clear()
})

describe('ResumeCta', () => {
  it('renders the Start Learning markup when there is no progress', () => {
    render(
      <ResumeCta lang="en" courseSlug="aws-aif-c01" lessonSlugs={lessonSlugs} lessonCount={3} dict={dict} />
    )

    const link = screen.getByRole('link', { name: /Start Learning/ })
    expect(link).toHaveAttribute('href', '/en/courses/aws-aif-c01/intro')
    expect(screen.queryByTestId('resume-cta')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resume-percent')).not.toBeInTheDocument()
  })

  it('swaps to Continue resuming the last visited lesson', () => {
    recordVisit('aws-aif-c01', 'setup', { courseTitle: 'C', lessonTitle: 'Setup', lang: 'en' })

    render(
      <ResumeCta lang="en" courseSlug="aws-aif-c01" lessonSlugs={lessonSlugs} lessonCount={3} dict={dict} />
    )

    const link = screen.getByTestId('resume-cta')
    expect(link).toHaveTextContent('Continue')
    expect(link).toHaveAttribute('href', '/en/courses/aws-aif-c01/setup')
  })

  it('falls back to the first lesson when lastLesson is not in the list', () => {
    recordVisit('aws-aif-c01', 'removed-lesson', { courseTitle: 'C', lessonTitle: 'Gone', lang: 'en' })

    render(
      <ResumeCta lang="en" courseSlug="aws-aif-c01" lessonSlugs={lessonSlugs} lessonCount={3} dict={dict} />
    )

    expect(screen.getByTestId('resume-cta')).toHaveAttribute('href', '/en/courses/aws-aif-c01/intro')
  })

  it('shows percent from completed lessons', () => {
    recordVisit('aws-aif-c01', 'intro', { courseTitle: 'C', lessonTitle: 'Intro', lang: 'en' })
    markLessonComplete('aws-aif-c01', 'intro')
    markLessonComplete('aws-aif-c01', 'setup')

    render(
      <ResumeCta lang="en" courseSlug="aws-aif-c01" lessonSlugs={lessonSlugs} lessonCount={3} dict={dict} />
    )

    const pct = screen.getByTestId('resume-percent')
    expect(pct).toHaveTextContent('67%')
    expect(pct).toHaveAttribute('aria-label', '67% Progress')
  })
})

describe('CourseProgressBadge', () => {
  it('renders nothing when the course has no progress', () => {
    const { container } = render(
      <CourseProgressBadge courseSlug="aws-aif-c01" lessonCount={4} dict={dict} />
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows percent once progress exists', () => {
    recordVisit('aws-aif-c01', 'intro', { courseTitle: 'C', lessonTitle: 'Intro', lang: 'en' })
    markLessonComplete('aws-aif-c01', 'intro')

    render(<CourseProgressBadge courseSlug="aws-aif-c01" lessonCount={4} dict={dict} />)

    expect(screen.getByTestId('course-progress-badge')).toHaveTextContent('25%')
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('shows 100% when every lesson is completed', () => {
    recordVisit('aws-aif-c01', 'a', { courseTitle: 'C', lessonTitle: 'A', lang: 'en' })
    markLessonComplete('aws-aif-c01', 'a')
    markLessonComplete('aws-aif-c01', 'b')

    render(<CourseProgressBadge courseSlug="aws-aif-c01" lessonCount={2} dict={dict} />)

    expect(screen.getByTestId('course-progress-badge')).toHaveTextContent('100%')
  })
})

describe('ContinueLearning', () => {
  const courses = [{ slug: 'aws-aif-c01', lessonCount: 4 }]

  it('renders nothing when there is no last-visited pointer', () => {
    const { container } = render(
      <ContinueLearning lang="en" dict={dict} courses={courses} />
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows localized snapshots and percent when the locale matches', () => {
    recordVisit('aws-aif-c01', 'setup', { courseTitle: 'AWS AIF', lessonTitle: 'Setup Guide', lang: 'en' })
    markLessonComplete('aws-aif-c01', 'intro')

    render(<ContinueLearning lang="en" dict={dict} courses={courses} />)

    const section = screen.getByTestId('continue-learning')
    expect(section).toHaveTextContent('AWS AIF')
    expect(section).toHaveTextContent('Setup Guide')
    expect(section).toHaveTextContent('25%')
    expect(section).toHaveTextContent('1 of 4 completed')
    expect(screen.getByRole('link', { name: /Continue/ })).toHaveAttribute(
      'href',
      '/en/courses/aws-aif-c01/setup'
    )
  })

  it('falls back to a generic slug-only card when the pointer locale differs', () => {
    recordVisit('aws-aif-c01', 'setup', { courseTitle: 'AWS AIF', lessonTitle: 'Setup Guide', lang: 'pt' })

    render(<ContinueLearning lang="en" dict={dict} courses={courses} />)

    const section = screen.getByTestId('continue-learning')
    expect(section).not.toHaveTextContent('AWS AIF')
    expect(section).not.toHaveTextContent('Setup Guide')
    expect(section).toHaveTextContent('Courses')
    expect(section).toHaveTextContent('setup')
    expect(screen.getByRole('link', { name: /Continue/ })).toHaveAttribute(
      'href',
      '/en/courses/aws-aif-c01/setup'
    )
  })

  it('omits percent when the course is unknown to the current page data', () => {
    recordVisit('other-course', 'intro', { courseTitle: 'Other', lessonTitle: 'Intro', lang: 'en' })

    render(<ContinueLearning lang="en" dict={dict} courses={courses} />)

    const section = screen.getByTestId('continue-learning')
    expect(section).toHaveTextContent('Other')
    expect(section).not.toHaveTextContent('%')
  })
})

describe('CourseContentList', () => {
  const lessons = [
    { slug: 'intro', title: 'Introduction' },
    { slug: 'setup', title: 'Setup Guide' },
  ]

  it('lists lessons without checkmarks when nothing is completed', () => {
    render(
      <CourseContentList lang="en" courseSlug="aws-aif-c01" lessonSlug="intro" lessons={lessons} dict={dict} />
    )

    expect(screen.getByRole('link', { name: /Introduction/ })).toBeInTheDocument()
    expect(screen.queryAllByTestId('outline-check')).toHaveLength(0)
    expect(screen.getByTestId('course-content-progress')).toHaveTextContent('0 of 2 completed')
  })

  it('marks completed lessons with a check and updates the count', () => {
    recordVisit('aws-aif-c01', 'intro', { courseTitle: 'C', lessonTitle: 'Intro', lang: 'en' })
    markLessonComplete('aws-aif-c01', 'intro')

    render(
      <CourseContentList lang="en" courseSlug="aws-aif-c01" lessonSlug="setup" lessons={lessons} dict={dict} />
    )

    expect(screen.getByTestId('course-content-progress')).toHaveTextContent('1 of 2 completed')
    const introLink = screen.getByRole('link', { name: /Introduction/ })
    expect(introLink).toHaveTextContent('Completed')
    const setupLink = screen.getByRole('link', { name: /Setup Guide/ })
    expect(setupLink).not.toHaveTextContent('Completed')
  })

  it('highlights the active lesson', () => {
    render(
      <CourseContentList lang="en" courseSlug="aws-aif-c01" lessonSlug="intro" lessons={lessons} dict={dict} />
    )

    expect(screen.getByRole('link', { name: /Introduction/ }).className).toContain('bg-primary')
  })
})
