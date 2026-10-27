import { describe, expect, it } from 'vitest'
import { buildAlternates, safeSegment } from '@/lib/seo/alternates'
import {
  breadcrumbSchema,
  courseSchema,
  lessonSchema,
  organizationSchema,
  toIsoDuration,
} from '@/lib/seo/json-ld'
import { serializeJsonLd } from '@/components/seo/JsonLd'

describe('buildAlternates', () => {
  it('produces a canonical and an hreflang set for every locale', () => {
    const result = buildAlternates('pt', 'courses/aws-aif-c01')
    expect(result.canonical).toBe('/pt/courses/aws-aif-c01')
    expect(result.languages).toEqual({
      en: '/en/courses/aws-aif-c01',
      pt: '/pt/courses/aws-aif-c01',
      es: '/es/courses/aws-aif-c01',
      'x-default': '/en/courses/aws-aif-c01',
    })
  })

  it('handles the locale root', () => {
    const result = buildAlternates('es')
    expect(result.canonical).toBe('/es')
    expect(result.languages['x-default']).toBe('/en')
  })

  it('normalises leading and trailing slashes', () => {
    expect(buildAlternates('en', '/tools/').canonical).toBe('/en/tools')
  })

  it('never emits a double slash', () => {
    expect(buildAlternates('en', '//courses//').canonical).toBe('/en/courses')
  })
})

describe('safeSegment', () => {
  it('strips characters that could escape a path', () => {
    expect(safeSegment('../../etc/passwd')).toBe('etcpasswd')
    expect(safeSegment('a/b')).toBe('ab')
    expect(safeSegment('ok-slug_1.v2')).toBe('ok-slug_1.v2')
    expect(safeSegment(undefined)).toBe('')
  })
})

describe('toIsoDuration', () => {
  it.each([
    ['90 minutes', 'PT90M'],
    ['12 Weeks', 'P84D'],
    ['4 weeks', 'P28D'],
    ['2 hours', 'PT2H'],
    ['3 days', 'P3D'],
  ])('converts %s', (input, expected) => {
    expect(toIsoDuration(input)).toBe(expected)
  })

  it('returns null for values it cannot interpret', () => {
    expect(toIsoDuration('self-paced')).toBeNull()
    expect(toIsoDuration('')).toBeNull()
    expect(toIsoDuration('0 weeks')).toBeNull()
  })
})

describe('structured data', () => {
  it('builds an organisation with social profiles and a logo', () => {
    const org = organizationSchema('An educational platform')
    expect(org['@type']).toBe('EducationalOrganization')
    expect(org.sameAs).toBeInstanceOf(Array)
    expect((org.sameAs as string[]).length).toBeGreaterThan(0)
    expect(org.logo).toBeDefined()
  })

  it('builds a Course with its syllabus and duration', () => {
    const course = courseSchema({
      title: 'AWS AI Practitioner',
      description: 'Exam prep',
      url: '/en/courses/aws-aif-c01/',
      lang: 'en',
      difficulty: 'intermediate',
      duration: '12 weeks',
      lessonTitles: ['Intro', 'Setup'],
    })
    expect(course['@type']).toBe('Course')
    expect(course.timeRequired).toBe('P84D')
    expect(course.hasPart).toHaveLength(2)
    expect(course.url).toBe('https://nuniversity.github.io/en/courses/aws-aif-c01/')
    expect(course.isAccessibleForFree).toBe(true)
  })

  it('omits undefined keys rather than emitting nulls', () => {
    const course = courseSchema({
      title: 'Bare course',
      description: 'No extras',
      url: '/en/courses/x/',
      lang: 'en',
    })
    expect(Object.keys(course)).not.toContain('educationalLevel')
    expect(Object.keys(course)).not.toContain('timeRequired')
    expect(JSON.stringify(course)).not.toContain('undefined')
  })

  it('builds a LearningResource linked to its parent course', () => {
    const lesson = lessonSchema({
      title: 'Foundations',
      description: 'Intro lesson',
      url: '/en/courses/aws/01-foundations/',
      lang: 'en',
      courseTitle: 'AWS',
      courseUrl: '/en/courses/aws/',
      position: 1,
    })
    expect(lesson['@type']).toBe('LearningResource')
    expect(lesson.position).toBe(1)
    expect((lesson.isPartOf as { name: string }).name).toBe('AWS')
  })

  it('builds a breadcrumb list with positions', () => {
    const crumbs = breadcrumbSchema([
      { name: 'Home', url: '/en/' },
      { name: 'Courses', url: '/en/courses/' },
    ])
    const items = crumbs.itemListElement as Array<Record<string, unknown>>
    expect(items[0].position).toBe(1)
    expect(items[1].position).toBe(2)
    expect(items[1].item).toBe('https://nuniversity.github.io/en/courses/')
  })
})

describe('serializeJsonLd', () => {
  it('escapes < so content cannot break out of the script tag', () => {
    const payload = serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: '</script><script>alert(1)</script>',
    })
    expect(payload).not.toContain('</script>')
    expect(payload).toContain('\\u003c')
  })

  it('produces valid JSON', () => {
    const payload = serializeJsonLd({ '@context': 'https://schema.org', '@type': 'Thing', name: 'x' })
    expect(() => JSON.parse(payload)).not.toThrow()
  })
})
