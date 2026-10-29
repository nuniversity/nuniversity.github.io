import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguagesHubClient } from '@/app/[lang]/languages/languages-hub-client'
import type { LanguageActivity } from '@/lib/languages/get-language-content'
import type { LanguageCourseSummary } from '@/lib/language-courses/get-language-course'


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

const activity: LanguageActivity = {
  slug: 'en-to-pt',
  title: 'English to Portuguese - Basic Vocabulary',
  description: 'Match English words with their Portuguese translations',
  category: 'vocabulary',
  difficulty: 'beginner',
  gameType: 'matching',
  languagePair: { source: 'en', target: 'pt' },
  wordCount: 50,
  localesAvailable: ['en'],
}

const dict = { languages: {}, languageCourse: {} }

function renderHub() {
  return render(<LanguagesHubClient lang="pt" activities={[activity]} dict={dict} courses={[course]} />)
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('hub search reaches the language courses', () => {
  it('shows everything with an empty query', async () => {
    renderHub()
    await waitFor(() => {
      expect(screen.getByTestId('language-course-english-for-pt')).toBeInTheDocument()
      expect(screen.getByText('English to Portuguese - Basic Vocabulary')).toBeInTheDocument()
    })
  })

  it('keeps the course when the query matches it and hides non-matching activities', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.type(screen.getByRole('textbox'), 'inglês')

    await waitFor(() => {
      expect(screen.getByTestId('language-course-english-for-pt')).toBeInTheDocument()
      expect(screen.queryByText('English to Portuguese - Basic Vocabulary')).toBeNull()
    })
    // The no-results message must NOT show while a course matched.
    expect(screen.queryByTestId('language-courses-section')).not.toBeNull()
  })

  it('keeps matching activities and hides the courses when only they match', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.type(screen.getByRole('textbox'), 'Basic Vocabulary')

    await waitFor(() => {
      expect(screen.getByText('English to Portuguese - Basic Vocabulary')).toBeInTheDocument()
      expect(screen.queryByTestId('language-course-english-for-pt')).toBeNull()
    })
  })

  it('shows the no-results state when nothing matches', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.type(screen.getByRole('textbox'), 'zzz')

    await waitFor(() => {
      expect(screen.queryByTestId('language-course-english-for-pt')).toBeNull()
      expect(screen.queryByText('English to Portuguese - Basic Vocabulary')).toBeNull()
      expect(screen.getAllByText(/no activities match/i).length).toBeGreaterThan(0)
    })
  })
})
