// lib/tools/get-tool-content.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'
import { safeSegment } from '@/lib/seo/alternates'

const toolsDirectory = path.join(process.cwd(), 'content', 'tools')

export interface ToolMetadata {
  slug: string
  title: string
  description: string
  category: string
  icon?: string
  order?: number
  /** Localised markdown body (the "how to use" article). */
  content?: string
}

export async function getAllTools(lang: Locale): Promise<ToolMetadata[]> {
  try {
    if (!fs.existsSync(toolsDirectory)) {
      return []
    }

    const toolFolders = fs.readdirSync(toolsDirectory)
    const tools: ToolMetadata[] = []

    for (const toolFolder of toolFolders) {
      const toolPath = path.join(toolsDirectory, toolFolder)
      const stat = fs.statSync(toolPath)

      if (stat.isDirectory()) {
        const localePath = path.join(toolPath, `${lang}.md`)
        const fallbackPath = path.join(toolPath, 'en.md')
        const metadataPath = fs.existsSync(localePath) ? localePath : fallbackPath

        if (fs.existsSync(metadataPath)) {
          const fileContents = fs.readFileSync(metadataPath, 'utf8')
          const { data } = matter(fileContents)

          tools.push({
            slug: toolFolder,
            title: data.title || toolFolder,
            description: data.description || '',
            category: data.category || 'uncategorized',
            icon: data.icon,
            order: typeof data.order === 'number' ? data.order : 999,
          })
        }
      }
    }

    return tools.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  } catch (error) {
    console.error('Error loading tools:', error)
    return []
  }
}

/**
 * Loads one tool's metadata and localised markdown body.
 * The slug is sanitised so the function is safe to call with any input, not
 * only with values produced by `generateStaticParams`.
 */
export async function getToolMetadata(
  slug: string,
  lang: Locale
): Promise<ToolMetadata | null> {
  try {
    const safeSlug = safeSegment(slug)
    if (!safeSlug) return null

    const localePath = path.join(toolsDirectory, safeSlug, `${lang}.md`)
    const fallbackPath = path.join(toolsDirectory, safeSlug, 'en.md')
    const toolPath = fs.existsSync(localePath) ? localePath : fallbackPath

    if (!fs.existsSync(toolPath)) {
      return null
    }

    const fileContents = fs.readFileSync(toolPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug: safeSlug,
      title: data.title || safeSlug,
      description: data.description || '',
      category: data.category || 'uncategorized',
      icon: data.icon,
      order: typeof data.order === 'number' ? data.order : 999,
      content: content.trim(),
    }
  } catch (error) {
    console.error(`Error loading tool ${slug}:`, error)
    return null
  }
}
