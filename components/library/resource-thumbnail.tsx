'use client'

import { useState } from 'react'
import { type LibraryResource } from '@/lib/library/types'
import { platformIcon, typeLabel, platformLabel, TYPE_ICON, TYPE_TINT } from './resource-style'

interface ResourceThumbnailProps {
  resource: LibraryResource
  dict: any
}

/**
 * Library thumbnail with a real fallback instead of hiding the image.
 *
 * The placeholder is intentionally data-driven: type icon + type label +
 * platform, so a resource without a cover, or with a broken cover URL, still
 * reads as a complete card rather than an empty grey block.
 */
export function ResourceThumbnail({ resource, dict }: ResourceThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const TypeIcon = TYPE_ICON[resource.type]
  const PlatformIcon = platformIcon(resource.platform)
  const hasImage = Boolean(resource.thumbnail) && !failed

  return (
    <div className="relative aspect-video overflow-hidden bg-muted">
      {hasImage ? (
        <img
          src={resource.thumbnail}
          alt=""
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className={`flex h-full w-full flex-col justify-between p-4 ${TYPE_TINT[resource.type]}`}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-1 text-[11px] font-medium">
              <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {typeLabel(resource, dict)}
            </span>
            <PlatformIcon className="h-5 w-5 opacity-70" aria-hidden="true" />
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="max-w-[70%] text-sm font-semibold leading-snug line-clamp-2">
              {resource.title}
            </span>
            <span className="text-[11px]">{platformLabel(resource, dict)}</span>
          </div>
        </div>
      )}

      {hasImage && (
        <span
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm"
          title={platformLabel(resource, dict)}
        >
          <PlatformIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {platformLabel(resource, dict)}
        </span>
      )}
    </div>
  )
}
