import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'
import { type RoadmapMetadata, type RoadmapStep } from './types'

const ROADMAPS_DIR = path.join(process.cwd(), 'content', 'roadmaps')

export interface RoadmapInfo {
  id: string
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

function parseSteps(markdownContent: string): RoadmapStep[] {
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

    const relationships: any[] = []
    const relRegex = /- leadsTo:\s*(.+?)\n\s+type:\s*(.+)(?:\n\s+label:\s*(.*))?/g
    let relMatch
    while ((relMatch = relRegex.exec(stepContent)) !== null) {
      relationships.push({
        leadsTo: relMatch[1].trim(),
        type: relMatch[2].trim(),
        label: relMatch[3]?.trim(),
      })
    }

    steps.push({
      id: idMatch?.[1].trim() || title.toLowerCase().replace(/\s+/g, '-'),
      title,
      type: (typeMatch?.[1].trim() || 'concept') as any,
      contentRef: contentRefMatch?.[1].trim() === 'null' ? null : contentRefMatch?.[1].trim(),
      externalUrl: externalUrlMatch?.[1].trim(),
      description: descriptionMatch?.[1].trim() || '',
      prerequisites: prerequisitesMatch?.[1].split(',').map(s => s.trim().replace(/"/g, '')) || [],
      conditionals: conditionalsMatch?.[1].split(',').map(s => s.trim().replace(/"/g, '')) || [],
      comments: commentsMatch?.[1].trim() || '',
      ideas: ideasMatch?.[1].split(',').map(s => s.trim().replace(/"/g, '')) || [],
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
          difficulty: roadmap.difficulty,
          estimatedDuration: roadmap.estimatedDuration,
          stepCount: roadmap.steps.length,
        })
      }
    }

    return roadmaps.sort((a, b) => a.id.localeCompare(b.id))
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

export function resolveContentUrl(step: RoadmapStep, locale: Locale): string | null {
  if (step.externalUrl) {
    return step.externalUrl
  }

  if (step.contentRef) {
    const parts = step.contentRef.split('/')
    if (parts.length === 2) {
      return `/${locale}/courses/${parts[0]}/${parts[1]}`
    }
    return `/${locale}/courses/${parts[0]}`
  }

  return null
}
