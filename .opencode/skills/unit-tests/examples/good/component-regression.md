# Good example — component regression test

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import ReviewClient from '@/components/review/ReviewClient'

const dict = {
  review: { mixed_title: 'Mixed practice', finish: 'Finish', done: 'Session complete.' },
  courses: { back_to_course: 'Back to course', back_to_courses: 'Back to courses' },
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({ questions: [question], course: 'course', lang: 'en' }),
  })))
})

it('keeps both exits after the mixed session', async () => {
  render(<ReviewClient lang="en" dict={dict} courseSlug="course" />)

  await screen.findByTestId('review-session')
  fireEvent.click(screen.getByRole('button', { name: /A\. 4/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Finish' }))

  const done = await screen.findByTestId('review-done')
  expect(within(done).getByRole('link', { name: 'Back to course' })).toHaveAttribute(
    'href',
    '/en/courses/course/'
  )
})
```

Why it is good:

- state is cleared and fetch is stubbed at the boundary;
- queries use role/test id, not CSS;
- the assertion is a user-visible contract;
- no sleeps, no real clock, no console output.
