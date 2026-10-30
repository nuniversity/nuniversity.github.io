import {
  BookOpen,
  BookOpenCheck,
  Cloud,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Headphones,
  Newspaper,
  ShoppingCart,
  Video,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import type { LibraryResource, ResourceType } from '@/lib/library/types'

export const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  video: Video,
  ebook: BookOpen,
  course: GraduationCap,
  blog: FileText,
  repository: Github,
  podcast: Headphones,
  article: Newspaper,
  analysis: BookOpenCheck,
}

export const TYPE_TINT: Record<ResourceType, string> = {
  video: 'bg-section-library-soft text-section-library',
  ebook: 'bg-section-library-soft text-section-library',
  course: 'bg-section-library-soft text-section-library',
  blog: 'bg-section-library-soft text-section-library',
  repository: 'bg-section-library-soft text-section-library',
  podcast: 'bg-section-library-soft text-section-library',
  article: 'bg-section-library-soft text-section-library',
  analysis: 'bg-section-library-soft text-section-library',
}

const PLATFORM_ICON: Record<string, LucideIcon> = {
  youtube: Youtube,
  github: Github,
  amazon: ShoppingCart,
  edx: GraduationCap,
  'google cloud': Cloud,
  medium: FileText,
  'software engineering daily': Headphones,
  nuniversity: GraduationCap,
}

export function platformIcon(platform: string | undefined): LucideIcon {
  if (!platform) return Globe
  return PLATFORM_ICON[platform.trim().toLowerCase()] ?? Globe
}

export function typeLabel(resource: LibraryResource, dict: any): string {
  return dict.library?.resource_types?.[resource.type] || resource.type
}

export function platformLabel(resource: LibraryResource, dict: any): string {
  return resource.platform || dict.library?.unknown_platform || 'Unknown platform'
}

export function authorLabel(resource: LibraryResource, dict: any): string {
  return resource.author && resource.author !== 'Unknown'
    ? resource.author
    : dict.library?.unknown_author || 'Unknown author'
}

export function categoryLabel(resource: LibraryResource, dict: any): string {
  return resource.category && resource.category !== 'Uncategorized'
    ? resource.category
    : dict.library?.unknown_category || 'Uncategorized'
}

export function difficultyLabel(resource: LibraryResource, dict: any): string | null {
  if (!resource.difficulty || resource.difficulty === 'all') return null
  return dict.library?.difficulty?.[resource.difficulty] || resource.difficulty
}
