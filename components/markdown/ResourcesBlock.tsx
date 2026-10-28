'use client'

import {
  BookOpen,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Headphones,
  Newspaper,
  Video,
} from 'lucide-react'

interface ResourceItem {
  type: 'video' | 'ebook' | 'course' | 'blog' | 'repository' | 'podcast' | 'article'
  title: string
  url: string
  source?: string
  minutes?: number
}

export interface ResourcesConfig {
  heading?: string
  items: ResourceItem[]
}

const ICONS = {
  video: Video,
  ebook: BookOpen,
  course: GraduationCap,
  blog: FileText,
  repository: Github,
  podcast: Headphones,
  article: Newspaper,
} as const

/** Optional depth: verified Library links. Chrome only (audio skips it). */
export default function ResourcesBlock({ data, dict }: { data: ResourcesConfig; dict?: any }) {
  return (
    <div className="my-8 rounded-xl border bg-card p-4 sm:p-6" data-audio-skip>
      <p className="mb-3 text-sm font-semibold">
        {data.heading || dict?.resources?.title || 'Dig deeper'}
      </p>
      <ul className="space-y-2">
        {data.items.map((item) => {
          const Icon = ICONS[item.type] ?? FileText
          return (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {item.source && (
                  <span className="hidden text-xs text-muted-foreground sm:inline">{item.source}</span>
                )}
                {typeof item.minutes === 'number' && (
                  <span className="text-xs text-muted-foreground">{item.minutes} min</span>
                )}
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
