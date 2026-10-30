import { describe, expect, it } from 'vitest'
import { resultChips, resultContext, typeLabel } from '@/lib/search/result-meta'
import type { SearchDoc } from '@/lib/search/matcher'

const base: SearchDoc = {
  id: 'en:lesson:x',
  type: 'lesson',
  title: 'A lesson',
  description: 'A description',
  url: '/en/courses/c/01-a/',
  lang: 'en',
}

describe('resultChips', () => {
  it('shows area, difficulty and duration for a lesson', () => {
    const chips = resultChips({
      ...base,
      area: 'Artificial Intelligence',
      difficulty: 'beginner',
      duration: '30 min',
    })
    expect(chips.map(c => c.label)).toEqual(['Artificial Intelligence', 'beginner', '30 min'])
    expect(chips[1].tone).toBe('success')
  })

  it('tones the difficulty level', () => {
    expect(resultChips({ ...base, difficulty: 'advanced' })[0].tone).toBe('danger')
    expect(resultChips({ ...base, difficulty: 'intermediate' })[0].tone).toBe('warning')
    expect(resultChips({ ...base, difficulty: 'anything else' })[0].tone).toBe('default')
  })

  it('shows the lesson count for a course', () => {
    const chips = resultChips({
      ...base,
      type: 'course',
      area: 'Cloud & AI/ML',
      duration: '12 weeks',
      totalLessons: 16,
    })
    expect(chips.map(c => c.label)).toEqual(['Cloud & AI/ML', '12 weeks', '16 lessons'])
  })

  it('shows the category for a tool', () => {
    const chips = resultChips({ ...base, type: 'tool', category: 'productivity' })
    expect(chips.map(c => c.label)).toEqual(['productivity'])
  })

  it('shows the resource type for a library entry', () => {
    const chips = resultChips({ ...base, type: 'library', category: 'video' })
    expect(chips.map(c => c.label)).toEqual(['video'])
  })

  it('shows the language pair for a language activity', () => {
    const chips = resultChips({ ...base, type: 'language', source: 'en', target: 'pt' })
    expect(chips.map(c => c.label)).toEqual(['EN → PT'])
  })

  it('returns nothing when there is no metadata', () => {
    expect(resultChips(base)).toEqual([])
  })
})

describe('resultContext', () => {
  it('shows the parent course and position for a lesson', () => {
    const context = resultContext({
      ...base,
      courseTitle: 'Agent Memory',
      position: 3,
      totalLessons: 12,
    })
    expect(context).toBe('Agent Memory · Lesson 3 of 12')
  })

  it('shows the author for a course', () => {
    expect(resultContext({ ...base, type: 'course', author: 'Nuniversity' })).toBe('Nuniversity')
  })

  it('returns null when there is no context', () => {
    expect(resultContext(base)).toBeNull()
  })
})

describe('typeLabel', () => {
  const dict = { navigation: { courses: 'Courses', lessons: 'Lessons' }, courses: { lessons: 'Lessons' } }

  it('labels each entry type', () => {
    expect(typeLabel('course', dict)).toBe('Courses')
    expect(typeLabel('lesson', dict)).toBe('Lessons')
    expect(typeLabel('tool', {})).toBe('Tools')
    expect(typeLabel('analysis', { library: { resource_types: { analysis: 'Analyses' } } })).toBe('Analyses')
  })
})
