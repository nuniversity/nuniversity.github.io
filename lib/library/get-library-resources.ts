// lib/library/get-library-resources.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'
import {
  type LibraryAnalysisQuestion,
  type LibraryResource,
  type ResourceType,
} from './types'
import { getCourseResources } from './course-resources'

const LIBRARY_DIR = path.join(process.cwd(), 'content', 'library')

export async function getAllResources(lang: Locale): Promise<LibraryResource[]> {
  const langDir = path.join(LIBRARY_DIR, lang)
  const fallbackDir = path.join(LIBRARY_DIR, 'en')
  const actualDir = fs.existsSync(langDir) ? langDir : fallbackDir

  if (!fs.existsSync(actualDir)) {
    return []
  }

  const resources: LibraryResource[] = []
  const typesFolders = fs.readdirSync(actualDir)

  for (const typeFolder of typesFolders) {
    const typePath = path.join(actualDir, typeFolder)
    
    if (!fs.statSync(typePath).isDirectory()) continue

    const files = fs.readdirSync(typePath).filter(file => file.endsWith('.md'))

    for (const file of files) {
      const filePath = path.join(typePath, file)
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContent)

      const id = data.id || file.replace('.md', '')
      const type = typeFolder as ResourceType
      resources.push({
        id,
        title: data.title || id.replace(/[-_]/g, ' '),
        description: data.description || excerpt(content),
        type,
        category: data.category || 'Uncategorized',
        author: data.author || 'Unknown',
        url: data.url || (type === 'analysis' ? `/${lang}/library/analysis/${id}/` : ''),
        thumbnail: data.thumbnail,
        difficulty: data.difficulty,
        duration: data.duration,
        pages: data.pages,
        publishDate: data.publishDate,
        lastUpdated: data.lastUpdated,
        tags: Array.isArray(data.tags) ? data.tags : [],
        language: data.language || lang,
        isPaid: data.isPaid ?? false,
        rating: data.rating,
        platform: data.platform,
        content: type === 'analysis' ? content : undefined,
        analysis: type === 'analysis' ? parseAnalysisMeta(data) : undefined,
      })
    }
  }

  // The courses app catalog is projected in at read time. Markdown resources
  // stay authoritative for their own id+type, so an authored library entry can
  // override a projected course without changing this loader.
  const seen = new Set(resources.map((resource) => `${resource.type}:${resource.id}`))
  for (const course of await getCourseResources(lang)) {
    const key = `${course.type}:${course.id}`
    if (seen.has(key)) continue
    seen.add(key)
    resources.push(course)
  }

  return resources.sort((a, b) => {
    const aDate = a.lastUpdated || a.publishDate || ''
    const bDate = b.lastUpdated || b.publishDate || ''
    if (aDate && bDate && aDate !== bDate) {
      return bDate.localeCompare(aDate)
    }
    if (aDate !== bDate) {
      // Undated entries (all courses projected from the course app) follow the
      // dated ones, then sort alphabetically so the order is deterministic.
      return aDate ? -1 : 1
    }
    return a.title.localeCompare(b.title)
  })
}

export async function getResourceById(
  id: string, 
  type: ResourceType, 
  lang: Locale
): Promise<LibraryResource | null> {
  const filePath = path.join(LIBRARY_DIR, lang, type, `${id}.md`)
  const fallbackPath = path.join(LIBRARY_DIR, 'en', type, `${id}.md`)
  const actualPath = fs.existsSync(filePath) ? filePath : fallbackPath

  if (!fs.existsSync(actualPath)) {
    // Course resources live in the courses app, not in content/library.
    if (type === 'course') {
      return (await getCourseResources(lang)).find((course) => course.id === id) ?? null
    }
    return null
  }

  const fileContent = fs.readFileSync(actualPath, 'utf8')
  const { data, content } = matter(fileContent)
  const resolvedId = data.id || id

  return {
    id: resolvedId,
    title: data.title || resolvedId.replace(/[-_]/g, ' '),
    description: data.description || excerpt(content),
    type,
    category: data.category || 'Uncategorized',
    author: data.author || 'Unknown',
    url: data.url || (type === 'analysis' ? `/${lang}/library/analysis/${resolvedId}/` : ''),
    thumbnail: data.thumbnail,
    difficulty: data.difficulty,
    duration: data.duration,
    pages: data.pages,
    publishDate: data.publishDate,
    lastUpdated: data.lastUpdated,
    tags: Array.isArray(data.tags) ? data.tags : [],
    language: data.language || lang,
    isPaid: data.isPaid ?? false,
    rating: data.rating,
    platform: data.platform,
    content: type === 'analysis' ? content : undefined,
    analysis: type === 'analysis' ? parseAnalysisMeta(data) : undefined,
  }
}

function excerpt(markdown: string): string {
  return markdown
    .replace(/^#.+$/gm, '')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function parseQuiz(value: unknown): LibraryAnalysisQuestion[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((raw, index) => {
    if (typeof raw !== 'object' || raw === null) return []
    const item = raw as Record<string, unknown>
    if (typeof item.question !== 'string' || !Array.isArray(item.options)) return []
    const options = item.options.filter((option): option is string => typeof option === 'string')
    const correct = typeof item.correct === 'number' ? item.correct : 0
    if (options.length < 2 || correct < 0 || correct >= options.length) return []
    return [{
      id: typeof item.id === 'string' ? item.id : `q${index + 1}`,
      question: item.question,
      options,
      correct,
      explanation: typeof item.explanation === 'string' ? item.explanation : undefined,
    }]
  })
}

function parseAnalysisMeta(data: Record<string, unknown>) {
  return {
    resourceId: typeof data.resourceId === 'string' ? data.resourceId : undefined,
    resourceType: typeof data.resourceType === 'string' ? (data.resourceType as ResourceType) : undefined,
    summary: typeof data.summary === 'string' ? data.summary : undefined,
    objectives: stringArray(data.objectives),
    takeaways: stringArray(data.takeaways),
    quiz: parseQuiz(data.quiz),
  }
}

export async function getAllAnalyses(lang: Locale): Promise<LibraryResource[]> {
  return (await getAllResources(lang)).filter((resource) => resource.type === 'analysis')
}

export async function getAnalysis(id: string, lang: Locale): Promise<LibraryResource | null> {
  return getResourceById(id, 'analysis', lang)
}

export async function getResourcesByType(
  type: ResourceType, 
  lang: Locale
): Promise<LibraryResource[]> {
  const resources = await getAllResources(lang)
  return resources.filter(r => r.type === type)
}

export async function getResourcesByCategory(
  category: string, 
  lang: Locale
): Promise<LibraryResource[]> {
  const resources = await getAllResources(lang)
  return resources.filter(r => r.category === category)
}