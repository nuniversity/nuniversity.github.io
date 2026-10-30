import { describe, expect, it } from 'vitest'
import { getAllCourses } from '@/lib/courses/get-course-content'
import {
  getAllResources,
  getResourceById,
} from '@/lib/library/get-library-resources'

describe('library course resources', () => {
  it('projects every course app page into the library', async () => {
    const [courses, resources] = await Promise.all([
      getAllCourses('en'),
      getAllResources('en'),
    ])
    const libraryCourses = resources.filter((resource) => resource.type === 'course')
    const ids = new Set(libraryCourses.map((resource) => resource.id))
    const slugs = new Set(courses.map((course) => course.slug))

    expect(courses.length).toBeGreaterThan(40)
    for (const course of courses) {
      expect(ids.has(course.slug), `missing library course: ${course.slug}`).toBe(true)
    }

    for (const resource of libraryCourses.filter((resource) => slugs.has(resource.id))) {
      expect(resource.url).toBe(`/en/courses/${resource.id}/`)
      expect(resource.platform).toBe('Nuniversity')
      expect(resource.language).toBe('en')
      expect(resource.isPaid).toBe(false)
    }
  })

  it('keeps curated external course resources alongside the app catalog', async () => {
    const resources = await getAllResources('en')
    const mit = resources.find(
      (resource) => resource.type === 'course' && resource.id === 'mit-intro-cs'
    )

    expect(mit).toBeDefined()
    expect(mit?.url).toBe('https://www.edx.org/course/introduction-to-computer-science-and-programming-7')
  })

  it('only exposes courses that have a page in the requested locale', async () => {
    const [ptResources, enResources] = await Promise.all([
      getAllResources('pt'),
      getAllResources('en'),
    ])
    const ptIds = new Set(ptResources.map((resource) => resource.id))
    const enIds = new Set(enResources.map((resource) => resource.id))

    // These two courses ship Portuguese lessons only.
    expect(ptIds.has('math-foundations')).toBe(true)
    expect(ptIds.has('hybrid-impact-enterprise')).toBe(true)
    expect(enIds.has('math-foundations')).toBe(false)
    expect(enIds.has('hybrid-impact-enterprise')).toBe(false)
  })

  it('resolves a projected course through getResourceById', async () => {
    const course = await getResourceById('agent-memory-knowledge', 'course', 'en')

    expect(course?.title).toBe('Agent Knowledge Bases and Memory')
    expect(course?.url).toBe('/en/courses/agent-memory-knowledge/')
    expect(course?.category).toBe('Artificial Intelligence')
    expect(course?.difficulty).toBe('intermediate')
  })

  it('does not emit duplicate type:id pairs', async () => {
    const resources = await getAllResources('pt')
    const keys = resources.map((resource) => `${resource.type}:${resource.id}`)

    expect(new Set(keys).size).toBe(keys.length)
  })
})
