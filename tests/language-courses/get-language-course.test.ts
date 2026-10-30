import { describe, expect, it, vi } from 'vitest'

// The loader imports `server-only`, which throws outside a Server Component.
vi.mock('server-only', () => ({}))

import {
  getAllLanguageCourses,
  getCourseDir,
  localizeLesson,
  parseLessonFileName,
} from '@/lib/language-courses/get-language-course'

describe('language course content loader', () => {
  it('lists every course on disk with its counts', () => {
    const courses = getAllLanguageCourses('en')
    expect(courses.length).toBeGreaterThan(0)
    const english = courses.find((course) => course.id === 'english-for-pt')
    expect(english).toBeTruthy()
    expect(english?.unitCount).toBeGreaterThan(0)
    expect(english?.lessonCount).toBeGreaterThan(0)
    expect(english?.name.en).toBeTruthy()
  })

  it('resolves a course directory under content/language-courses', () => {
    expect(getCourseDir('english-for-pt')).toMatch(/content[/\\]language-courses[/\\]english-for-pt$/)
  })

  it('strips the numeric prefix and extension from lesson files', () => {
    expect(parseLessonFileName('01-introductions.json')).toBe('introductions')
    expect(parseLessonFileName('lesson.json')).toBe('lesson')
  })

  it('applies locale overrides to a lesson', () => {
    const lesson = {
      id: 'lesson',
      title: { en: 'Hello', pt: 'Olá' },
      goal: { en: 'Greet', pt: 'Cumprimentar' },
      locales: { es: { title: 'Hola', goal: 'Saludar' } },
    } as any

    expect(localizeLesson(lesson, 'es')).toMatchObject({
      title: { en: 'Hello', pt: 'Olá', es: 'Hola' },
      goal: { en: 'Greet', pt: 'Cumprimentar', es: 'Saludar' },
    })
    // Unknown locale falls back to the original object.
    expect(localizeLesson(lesson, 'fr')).toBe(lesson)
  })
})
