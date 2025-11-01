// lib/library/types.ts
export type ResourceType = 
  | 'video' 
  | 'ebook' 
  | 'course' 
  | 'blog' 
  | 'repository' 
  | 'podcast'
  | 'article'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'

export interface LibraryResource {
  id: string
  title: string
  description: string
  type: ResourceType
  category: string
  author: string
  url: string
  thumbnail?: string
  difficulty?: DifficultyLevel
  duration?: string // For videos/courses
  pages?: number // For ebooks
  publishDate?: string
  lastUpdated?: string
  tags: string[]
  language: string
  isPaid: boolean
  rating?: number
  platform?: string // YouTube, Udemy, GitHub, Medium, etc.
}

export interface LibraryFilters {
  type?: ResourceType[]
  category?: string[]
  difficulty?: DifficultyLevel[]
  isPaid?: boolean
  language?: string[]
  searchQuery?: string
}

export const RESOURCE_TYPES: Record<ResourceType, { label: string; icon: string }> = {
  video: { label: 'Video', icon: 'Video' },
  ebook: { label: 'E-Book', icon: 'BookOpen' },
  course: { label: 'Online Course', icon: 'GraduationCap' },
  blog: { label: 'Blog Post', icon: 'FileText' },
  repository: { label: 'Code Repository', icon: 'Github' },
  podcast: { label: 'Podcast', icon: 'Headphones' },
  article: { label: 'Article', icon: 'Newspaper' },
}

export const CATEGORIES = [
  'Computer Science',
  'Data Engineering',
  'Software Engineering',
  'Cloud Computing',
  'Artificial Intelligence',
  'Mathematics',
  'Physics',
  'Web Development',
  'Mobile Development',
  'DevOps',
  'Cybersecurity',
  'Blockchain',
] as const

export type Category = typeof CATEGORIES[number]