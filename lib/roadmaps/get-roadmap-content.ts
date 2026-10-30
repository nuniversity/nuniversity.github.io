import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'
import {
  type RelationshipType,
  type RoadmapMetadata,
  type RoadmapRelationship,
  type RoadmapStep,
  type StepType,
} from './types'

const ROADMAPS_DIR = path.join(process.cwd(), 'content', 'roadmaps')

export interface RoadmapInfo {
  id: string
  order: number
  title: string
  description: string
  icon: string
  difficulty: string
  estimatedDuration: string
  stepCount: number
}

function parseRoadmapFile(filePath: string, locale: Locale): RoadmapMetadata | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    const steps = parseSteps(content)

    return {
      id: data.id || path.basename(path.dirname(filePath)),
      title: data.title || 'Untitled Roadmap',
      description: data.description || '',
      icon: data.icon || 'Map',
      order: data.order || 0,
      difficulty: data.difficulty || 'beginner',
      estimatedDuration: data.estimatedDuration || '',
      steps,
    }
  } catch (error) {
    console.error(`Error parsing roadmap file: ${filePath}`, error)
    return null
  }
}

function parseList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((item) => item.trim().replace(/"/g, ''))
    .filter(Boolean)
}

const STEP_TYPES: StepType[] = ['concept', 'course', 'tool', 'game', 'library', 'milestone']
const RELATION_TYPES: RelationshipType[] = ['required', 'optional', 'branch']

/** Exported for parser tests; content files are the only production input. */
export function parseSteps(markdownContent: string): RoadmapStep[] {
  const steps: RoadmapStep[] = []
  const stepRegex = /## Step:\s*(.+?)\n([\s\S]*?)(?=## Step:|$)/g
  let match

  while ((match = stepRegex.exec(markdownContent)) !== null) {
    const title = match[1].trim()
    const stepContent = match[2]

    const idMatch = stepContent.match(/- id:\s*(.+)/)
    const typeMatch = stepContent.match(/- type:\s*(.+)/)
    const contentRefMatch = stepContent.match(/- contentRef:\s*(.+)/)
    const externalUrlMatch = stepContent.match(/- externalUrl:\s*(.+)/)
    const descriptionMatch = stepContent.match(/- description:\s*([\s\S]*?)(?=\n- )/)
    const prerequisitesMatch = stepContent.match(/- prerequisites:\s*\[([^\]]*)\]/)
    const conditionalsMatch = stepContent.match(/- conditionals:\s*\[([^\]]*)\]/)
    const commentsMatch = stepContent.match(/- comments:\s*(.+)/)
    const ideasMatch = stepContent.match(/- ideas:\s*\[([^\]]*)\]/)
    const durationMatch = stepContent.match(/- estimatedDuration:\s*(.+)/)

    const relationships: RoadmapRelationship[] = []
    const relRegex = /- leadsTo:\s*(.+?)\n\s+type:\s*(.+)(?:\n\s+label:\s*(.*))?/g
    let relMatch
    while ((relMatch = relRegex.exec(stepContent)) !== null) {
      const relationType = relMatch[2].trim() as RelationshipType
      relationships.push({
        leadsTo: relMatch[1].trim(),
        type: RELATION_TYPES.includes(relationType) ? relationType : 'required',
        label: relMatch[3]?.trim(),
      })
    }

    steps.push({
      id: idMatch?.[1].trim() || title.toLowerCase().replace(/\s+/g, '-'),
      title,
      type: STEP_TYPES.includes(typeMatch?.[1].trim() as StepType)
        ? (typeMatch?.[1].trim() as StepType)
        : 'concept',
      contentRef: contentRefMatch?.[1].trim() === 'null' ? null : contentRefMatch?.[1].trim(),
      externalUrl: externalUrlMatch?.[1].trim(),
      description: descriptionMatch?.[1].trim() || '',
      prerequisites: parseList(prerequisitesMatch?.[1]),
      conditionals: parseList(conditionalsMatch?.[1]),
      comments: commentsMatch?.[1].trim() || '',
      ideas: parseList(ideasMatch?.[1]),
      relationships,
      estimatedDuration: durationMatch?.[1].trim(),
    })
  }

  return steps
}

export async function getAllRoadmaps(locale: Locale): Promise<RoadmapInfo[]> {
  try {
    if (!fs.existsSync(ROADMAPS_DIR)) {
      return []
    }

    const roadmapDirs = fs.readdirSync(ROADMAPS_DIR)
    const roadmaps: RoadmapInfo[] = []

    for (const dir of roadmapDirs) {
      const filePath = path.join(ROADMAPS_DIR, dir, `${locale}.md`)
      const fallbackPath = path.join(ROADMAPS_DIR, dir, 'en.md')
      const actualPath = fs.existsSync(filePath) ? filePath : fallbackPath

      const roadmap = parseRoadmapFile(actualPath, locale)
      if (roadmap) {
        roadmaps.push({
          id: roadmap.id,
          title: roadmap.title,
          description: roadmap.description,
          icon: roadmap.icon,
          order: roadmap.order,
          difficulty: roadmap.difficulty,
          estimatedDuration: roadmap.estimatedDuration,
          stepCount: roadmap.steps.length,
        })
      }
    }

    return roadmaps.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  } catch (error) {
    console.error('Error reading roadmaps:', error)
    return []
  }
}

export async function getRoadmapContent(roadmapSlug: string, locale: Locale): Promise<RoadmapMetadata | null> {
  try {
    const filePath = path.join(ROADMAPS_DIR, roadmapSlug, `${locale}.md`)
    const fallbackPath = path.join(ROADMAPS_DIR, roadmapSlug, 'en.md')
    const actualPath = fs.existsSync(filePath) ? filePath : fallbackPath

    return parseRoadmapFile(actualPath, locale)
  } catch (error) {
    console.error(`Error reading roadmap content: ${roadmapSlug}`, error)
    return null
  }
}

export { resolveContentUrl } from './resolve-content-url'
