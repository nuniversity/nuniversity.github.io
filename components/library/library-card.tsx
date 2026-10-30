'use client'

import Link from '@/components/navigation/AppLink'
import { ArrowRight, ExternalLink, Star, Clock, BookOpenCheck } from 'lucide-react'
import type { LibraryResource } from '@/lib/library/types'
import { ResourceThumbnail } from './resource-thumbnail'
import {
  authorLabel,
  categoryLabel,
  difficultyLabel,
  platformIcon,
  typeLabel,
} from './resource-style'

interface LibraryCardProps {
  resource: LibraryResource
  dict: any
}

export function LibraryCard({ resource, dict }: LibraryCardProps) {
  const difficulty = difficultyLabel(resource, dict)
  const PlatformIcon = platformIcon(resource.platform)
  const isAnalysis = resource.type === 'analysis'
  const isInternal = resource.url.startsWith('/')
  const title = resource.title || dict.library?.untitled_resource || 'Untitled resource'
  const description = resource.description || dict.library?.no_description || 'No description yet.'

  const cta = isAnalysis ? (
    <Link
      href={resource.url}
      className="flex items-center justify-between text-primary font-medium text-sm transition-transform group-hover:translate-x-1"
      aria-label={`${dict.library?.read_analysis || 'Read analysis'}: ${title}`}
    >
      <span>{dict.library?.read_analysis || 'Read analysis'}</span>
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  ) : isInternal ? (
    <Link
      href={resource.url}
      className="flex items-center justify-between text-primary font-medium text-sm transition-transform group-hover:translate-x-1"
      aria-label={`${dict.library?.open_course || 'Open course'}: ${title}`}
    >
      <span>{dict.library?.open_course || 'Open course'}</span>
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  ) : (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between text-primary font-medium text-sm transition-transform group-hover:translate-x-1"
      aria-label={`${dict.library?.view_resource || 'View resource'}: ${title}`}
    >
      <span>{dict.library?.view_resource || 'View resource'}</span>
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  )

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <ResourceThumbnail resource={resource} dict={dict} />

      <div className="flex-1 p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-section-library-soft px-2.5 py-1 text-xs font-medium text-section-library dark:bg-section-library/15 dark:text-section-library">
            {typeLabel(resource, dict)}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {resource.isPaid ? (
              <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                {dict.library?.labels?.paid || 'Paid'}
              </span>
            ) : (
              <span className="rounded-md bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {dict.library?.labels?.free || 'Free'}
              </span>
            )}
            {typeof resource.rating === 'number' && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                {resource.rating}
              </span>
            )}
          </div>
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          {dict.library?.labels?.author || 'By'} {authorLabel(resource, dict)}
        </p>
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{description}</p>

        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
            <PlatformIcon className="h-3 w-3" aria-hidden="true" />
            {resource.platform || dict.library?.unknown_platform || 'Unknown platform'}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5">{categoryLabel(resource, dict)}</span>
          {difficulty && <span className="rounded-md bg-muted px-2 py-0.5">{difficulty}</span>}
          {resource.language && (
            <span className="rounded-md bg-muted px-2 py-0.5 uppercase">{resource.language}</span>
          )}
          {resource.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {resource.duration}
            </span>
          )}
          {resource.pages && (
            <span className="inline-flex items-center gap-1">
              <BookOpenCheck className="h-3 w-3" aria-hidden="true" />
              {resource.pages} {dict.library?.labels?.pages || 'pages'}
            </span>
          )}
        </div>

        {resource.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {resource.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-section-library-soft px-2 py-0.5 text-[11px] text-section-library dark:bg-section-library/15 dark:text-section-library"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t bg-muted/30 px-5 py-4">{cta}</div>
    </article>
  )
}
