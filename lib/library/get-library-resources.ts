// lib/library/get-library-resources.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'
import { LibraryResource, ResourceType } from './types'

const LIBRARY_DIR = path.join(process.cwd(), 'content', 'library')

export async function getAllResources(lang: Locale): Promise<LibraryResource[]> {
  const langDir = path.join(LIBRARY_DIR, lang)
  
  if (!fs.existsSync(langDir)) {
    return []
  }

  const resources: LibraryResource[] = []
  const typesFolders = fs.readdirSync(langDir)

  for (const typeFolder of typesFolders) {
    const typePath = path.join(langDir, typeFolder)
    
    if (!fs.statSync(typePath).isDirectory()) continue

    const files = fs.readdirSync(typePath).filter(file => file.endsWith('.md'))

    for (const file of files) {
      const filePath = path.join(typePath, file)
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const { data } = matter(fileContent)

      resources.push({
        id: data.id || file.replace('.md', ''),
        title: data.title || '',
        description: data.description || '',
        type: typeFolder as ResourceType,
        category: data.category || 'Uncategorized',
        author: data.author || 'Unknown',
        url: data.url || '',
        thumbnail: data.thumbnail,
        difficulty: data.difficulty,
        duration: data.duration,
        pages: data.pages,
        publishDate: data.publishDate,
        lastUpdated: data.lastUpdated,
        tags: data.tags || [],
        language: data.language || lang,
        isPaid: data.isPaid ?? false,
        rating: data.rating,
        platform: data.platform,
      })
    }
  }

  return resources.sort((a, b) => {
    if (a.lastUpdated && b.lastUpdated) {
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
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
  
  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)

  return {
    id: data.id || id,
    title: data.title || '',
    description: data.description || content.substring(0, 200),
    type,
    category: data.category || 'Uncategorized',
    author: data.author || 'Unknown',
    url: data.url || '',
    thumbnail: data.thumbnail,
    difficulty: data.difficulty,
    duration: data.duration,
    pages: data.pages,
    publishDate: data.publishDate,
    lastUpdated: data.lastUpdated,
    tags: data.tags || [],
    language: data.language || lang,
    isPaid: data.isPaid ?? false,
    rating: data.rating,
    platform: data.platform,
  }
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