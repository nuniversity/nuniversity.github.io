import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { LanguageCourseCard } from '@/components/language-course/language-course-card'
import type { LanguageCourseSummary } from '@/lib/language-courses/get-language-course'
import { saveLessonResult } from '@/lib/language-courses/storage'
import { newCard, reviewCard } from '@/lib/practice/fsrs'
import { saveReviewCard } from '@/lib/practice/cards'

vi.stubGlobal('React', React)

const course: LanguageCourseSummary = {
  id: 'english-for-pt',
  name: { en: 'English for Portuguese Speakers', pt: 'Inglês para Falantes de Português' },
  description: { en: 'Learn English from zero.', pt: 'Aprenda inglês do zero.' },
  source: 'pt',
  target: 'en',
  cefrTarget: 'A1',
  difficulty: 'beginner',
  emoji: '🇬🇧',
  flags: { source: 'br', target: 'gb' },
  unitCount: 2,
  lessonCount: 4,
  vocabCount: 30,
}

function renderCard() {
  return render(<LanguageCourseCard lang="pt" course={course} dict={{ languageCourse: {} }} />)
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('React', React)
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('LanguageCourseCard (hub)', () => {
  it('renders the rich card with meta chips and the start CTA for new learners', async () => {
    renderCard()

    const card = screen.getByTestId('language-course-english-for-pt')
    expect(card.textContent).toContain('Inglês para Falantes de Português')
    expect(card.textContent).toContain('A1')
    // Flags as SVG artwork (the accessible pair label lives on aria-label).
    expect(card.querySelector('img[src="/flags/br.svg"]')).not.toBeNull()
    expect(card.querySelector('img[src="/flags/gb.svg"]')).not.toBeNull()
    expect(card.textContent).toContain('2')
    expect(screen.getByTestId('course-cta-english-for-pt').textContent).toContain('Start')

    await waitFor(() => {
      const bar = screen.getByTestId('course-progress-english-for-pt')
      expect(bar.getAttribute('style')).toContain('width: 0%')
    })
  })

  it('shows live progress and the continue CTA after lessons are completed', async () => {
    saveLessonResult('english-for-pt', 'u1', 'l1', 100)
    saveLessonResult('english-for-pt', 'u1', 'l2', 90)

    renderCard()

    await waitFor(() => {
      expect(screen.getByTestId('course-progress-english-for-pt').getAttribute('style')).toContain('width: 50%')
    })
    expect(screen.getByTestId('course-cta-english-for-pt').textContent).toContain('Continue')
  })

  it('shows a due-review chip when vocabulary is pending', async () => {
    // A card seeded in the past is due now.
    const past = new Date('2026-01-01T00:00:00Z')
    const fresh = newCard('lang::pt-en::w001', 'english-for-pt', 'vocabulary', past)
    const { next } = reviewCard(fresh, true, past)
    saveReviewCard(next)

    renderCard()

    await waitFor(() =>
      expect(screen.getByTestId('course-due-english-for-pt').textContent).toContain('1')
    )
  })
})
