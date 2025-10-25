// lib/tools/get-tool-content.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'

const toolsDirectory = path.join(process.cwd(), 'content', 'tools')

export interface ToolMetadata {
  slug: string
  title: string
  description: string
  category: string
  icon?: string
  order?: number
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
        const metadataPath = path.join(toolPath, `${lang}.md`)
        
        if (fs.existsSync(metadataPath)) {
          const fileContents = fs.readFileSync(metadataPath, 'utf8')
          const { data } = matter(fileContents)

          tools.push({
            slug: toolFolder,
            title: data.title || toolFolder,
            description: data.description || '',
            category: data.category || 'uncategorized',
            icon: data.icon,
            order: data.order || 999,
          })
        }
      }
    }

    return tools.sort((a, b) => (a.order || 999) - (b.order || 999))
  } catch (error) {
    console.error('Error loading tools:', error)
    return []
  }
}

export async function getToolMetadata(
  slug: string,
  lang: Locale
): Promise<ToolMetadata | null> {
  try {
    const toolPath = path.join(toolsDirectory, slug, `${lang}.md`)

    if (!fs.existsSync(toolPath)) {
      return null
    }

    const fileContents = fs.readFileSync(toolPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      category: data.category || 'uncategorized',
      icon: data.icon,
      order: data.order,
    }
  } catch (error) {
    console.error(`Error loading tool ${slug}:`, error)
    return null
  }
}