import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  LessonCompleteButton,
  LessonKeyboardNav,
  LessonScrollProgress,
  LessonVisitTracker,
} from '@/components/lessons/LessonProgress'
import {
  LAST_VISITED_KEY,
  getCourseProgress,
  getLastVisited,
  markLessonComplete,
} from '@/lib/progress/storage'
import { getProfile } from '@/lib/gamification/profile'


const mocks = vi.hoisted(() => ({
  push: vi.fn<[string], void>(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

const dict = {
  lesson: {
    mark_complete: 'Mark lesson as complete',
    mark_incomplete: 'Mark as incomplete',
    completed_badge: 'Completed',
  },
}

beforeEach(() => {
  window.localStorage.clear()
  mocks.push.mockClear()
})

describe('LessonCompleteButton', () => {
  it('marks the lesson complete and stores progress', () => {
    render(<LessonCompleteButton courseSlug="aws-aif-c01" lessonSlug="intro" dict={dict} />)

    const button = screen.getByTestId('lesson-complete-button')
    expect(button).toHaveTextContent('Mark lesson as complete')
    expect(button).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(button)

    expect(getCourseProgress('aws-aif-c01')?.completed).toEqual(['intro'])
    expect(button).toHaveTextContent('Mark as incomplete')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('reverts to incomplete when toggled off', () => {
    render(<LessonCompleteButton courseSlug="aws-aif-c01" lessonSlug="intro" dict={dict} />)

    const button = screen.getByTestId('lesson-complete-button')
    fireEvent.click(button)
    fireEvent.click(button)

    expect(getCourseProgress('aws-aif-c01')?.completed).toEqual([])
    expect(button).toHaveTextContent('Mark lesson as complete')
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })

  it('shows the completed state for an already-finished lesson', () => {
    markLessonComplete('aws-aif-c01', 'intro')

    render(<LessonCompleteButton courseSlug="aws-aif-c01" lessonSlug="intro" dict={dict} />)

    const button = screen.getByTestId('lesson-complete-button')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveTextContent('Mark as incomplete')
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('tracks completion per course', () => {
    markLessonComplete('other-course', 'intro')

    render(<LessonCompleteButton courseSlug="aws-aif-c01" lessonSlug="intro" dict={dict} />)

    expect(screen.getByTestId('lesson-complete-button')).toHaveAttribute('aria-pressed', 'false')
    expect(getCourseProgress('other-course')?.completed).toEqual(['intro'])
  })

  it('awards lesson and course XP when the final lesson completes', () => {
    render(
      <LessonCompleteButton
        courseSlug="aws-aif-c01"
        lessonSlug="intro"
        lessonSlugs={['intro']}
        dict={dict}
      />
    )

    fireEvent.click(screen.getByTestId('lesson-complete-button'))

    const profile = getProfile()
    expect(profile.xp).toBe(110)
    expect(Object.keys(profile.badges)).toEqual(
      expect.arrayContaining(['first-lesson', 'course-complete'])
    )
  })

  it('withholds the course award until every lesson is complete', () => {
    render(
      <LessonCompleteButton
        courseSlug="aws-aif-c01"
        lessonSlug="intro"
        lessonSlugs={['intro', 'setup']}
        dict={dict}
      />
    )

    fireEvent.click(screen.getByTestId('lesson-complete-button'))

    const profile = getProfile()
    expect(profile.xp).toBe(10)
    expect(Object.keys(profile.badges)).toEqual(['first-lesson'])
  })
})

describe('LessonVisitTracker', () => {
  it('writes the last-visited pointer and course progress on mount', () => {
    render(
      <LessonVisitTracker
        courseSlug="aws-aif-c01"
        lessonSlug="intro"
        courseTitle="AWS AIF C01"
        lessonTitle="Introduction"
        lang="en"
      />
    )

    const pointer = getLastVisited()
    expect(pointer).toMatchObject({
      courseSlug: 'aws-aif-c01',
      lessonSlug: 'intro',
      courseTitle: 'AWS AIF C01',
      lessonTitle: 'Introduction',
      lang: 'en',
    })
    expect(LAST_VISITED_KEY).toBe('v1:last-visited')
    expect(getCourseProgress('aws-aif-c01')?.lastLesson).toBe('intro')
  })

  it('does not rewrite storage when props are unchanged', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const props = {
      courseSlug: 'aws-aif-c01',
      lessonSlug: 'intro',
      courseTitle: 'AWS AIF C01',
      lessonTitle: 'Introduction',
      lang: 'en',
    }
    const { rerender } = render(<LessonVisitTracker {...props} />)
    const afterMount = setItem.mock.calls.length

    rerender(<LessonVisitTracker {...props} />)

    expect(setItem.mock.calls.length).toBe(afterMount)
    setItem.mockRestore()
  })
})

describe('LessonKeyboardNav', () => {
  it('navigates forward on ArrowRight and back on ArrowLeft', () => {
    render(<LessonKeyboardNav prevHref="/en/courses/x/prev" nextHref="/en/courses/x/next" />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(mocks.push).toHaveBeenCalledWith('/en/courses/x/next')

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(mocks.push).toHaveBeenCalledWith('/en/courses/x/prev')
  })

  it('does nothing when an edge is missing', () => {
    render(<LessonKeyboardNav prevHref={null} nextHref={null} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('ignores typing targets', () => {
    render(
      <>
        <LessonKeyboardNav prevHref="/p" nextHref="/n" />
        <input aria-label="answer" />
      </>
    )

    fireEvent.keyDown(screen.getByLabelText('answer'), { key: 'ArrowRight' })
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('ignores modifier combinations', () => {
    render(<LessonKeyboardNav prevHref="/p" nextHref="/n" />)

    fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true })
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('ignores other keys', () => {
    render(<LessonKeyboardNav prevHref="/p" nextHref="/n" />)

    fireEvent.keyDown(window, { key: 'a' })
    expect(mocks.push).not.toHaveBeenCalled()
  })
})

describe('LessonScrollProgress', () => {
  it('renders the fixed scroll indicator', () => {
    render(<LessonScrollProgress />)

    expect(screen.getByTestId('lesson-scroll-progress')).toBeInTheDocument()
  })
})
