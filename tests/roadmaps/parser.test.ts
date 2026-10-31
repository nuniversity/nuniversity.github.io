import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { getRoadmapContent, parseSteps } from '@/lib/roadmaps/get-roadmap-content'
import { stepContentTarget } from '@/lib/roadmaps/resolve-content-url'

const MARKDOWN = `
## Step: First
- id: first
- type: course
- contentRef: course/lesson
- description: First step description.
- prerequisites: []
- conditionals: []
- comments: A comment.
- ideas: ["one", "two"]
- estimatedDuration: 2 hours
- relationships:
  - leadsTo: second
    type: required

## Step: Second
- id: second
- type: tool
- contentRef: my-tool
- description: Second step.
- prerequisites: ["first"]
- conditionals: []
- comments:
- ideas: []
- estimatedDuration: 1 hour
- relationships:
  - leadsTo: first
    type: optional
    label: back
`

describe('roadmap parser', () => {
  it('parses every step, idea, duration and relationship', () => {
    const steps = parseSteps(MARKDOWN)

    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({
      id: 'first',
      type: 'course',
      contentRef: 'course/lesson',
      prerequisites: [],
      ideas: ['one', 'two'],
      estimatedDuration: '2 hours',
    })
    expect(steps[0].relationships).toEqual([{ leadsTo: 'second', type: 'required', label: undefined }])
    expect(steps[1].relationships[0]).toMatchObject({ leadsTo: 'first', type: 'optional', label: 'back' })
  })

  it('falls back to concept for an unknown type', () => {
    const [step] = parseSteps('## Step: X\n- id: x\n- type: unknown\n- description: d')
    expect(step.type).toBe('concept')
  })

  it('parses the real roadmap content', async () => {
    const roadmap = await getRoadmapContent('intro-to-software-engineering', 'en')

    expect(roadmap?.steps).toHaveLength(10)
    expect(roadmap?.steps[0].id).toBe('processes')
    expect(roadmap?.steps.at(-1)?.id).toBe('agentic-ai-development')
    expect(roadmap?.steps.every((step) => step.title.length > 0)).toBe(true)
  })

  it.each(['en', 'pt', 'es'] as const)('%s exposes the same step ids and valid refs', async (locale) => {
    const roadmap = await getRoadmapContent('intro-to-software-engineering', locale)
    expect(roadmap).not.toBeNull()
    const ids = roadmap!.steps.map((step) => step.id)
    expect(ids).toEqual([
      'processes',
      'foundation-of-algorithms',
      'computing-imperative-algorithm',
      'clean-code-design-patterns',
      'solid-principles-oop',
      'clean-architecture',
      'functional-declarative-coding',
      'ddd-software-architecture',
      'tdd-code-quality',
      'agentic-ai-development',
    ])

    for (const step of roadmap!.steps) {
      for (const prerequisite of step.prerequisites) {
        expect(ids).toContain(prerequisite)
      }
      for (const relationship of step.relationships) {
        expect(ids).toContain(relationship.leadsTo)
      }
      expect(stepContentTarget(step, locale)).not.toBeNull()
    }
  })

  it('parses the AI agentic development roadmap', async () => {
    const roadmap = await getRoadmapContent('ai-agentic-development', 'en')

    expect(roadmap?.steps).toHaveLength(19)
    expect(roadmap?.steps[0].id).toBe('ai-literacy')
    expect(roadmap?.steps.at(-1)?.id).toBe('production-agentic-engineer')
    expect(roadmap?.steps.filter((step) => step.type === 'milestone')).toHaveLength(3)
    expect(roadmap?.steps.every((step) => step.title.length > 0 && step.description.length > 0)).toBe(true)
  })

  it.each(['en', 'pt', 'es'] as const)('%s AI agentic roadmap: same step ids and resolvable refs', async (locale) => {
    const roadmap = await getRoadmapContent('ai-agentic-development', locale)
    expect(roadmap).not.toBeNull()
    const ids = roadmap!.steps.map((step) => step.id)
    expect(ids).toEqual([
      'ai-literacy',
      'prompt-engineering',
      'python-foundations',
      'python-intermediate',
      'python-advanced',
      'llm-native-developer',
      'langgraph-fundamentals',
      'langgraph-intermediate',
      'agent-memory-rag',
      'crewai-multi-agent',
      'opencode-fundamentals',
      'opencode-agents',
      'multi-agent-systems',
      'langfuse-observability',
      'guardrails-evaluation',
      'opencode-workflows',
      'langgraph-advanced',
      'agentic-ai-capstone',
      'production-agentic-engineer',
    ])

    for (const step of roadmap!.steps) {
      for (const prerequisite of step.prerequisites) {
        expect(ids).toContain(prerequisite)
      }
      for (const relationship of step.relationships) {
        expect(ids).toContain(relationship.leadsTo)
      }
      const target = stepContentTarget(step, locale)
      if (step.type === 'milestone') {
        expect(step.contentRef).toBeNull()
      } else {
        expect(target).not.toBeNull()
        // Every course ref must resolve to a real lesson file in this locale
        // (or fall back to the English lesson, matching getCourseContent).
        const [courseSlug, lessonSlug] = step.contentRef!.split('/')
        const lessonsDir = path.join(process.cwd(), 'content', 'courses', courseSlug)
        const exists = (dir: string) => fs.existsSync(path.join(lessonsDir, dir, `${lessonSlug}.md`))
        expect(exists(locale) || exists('en')).toBe(true)
      }
    }
  })
})
