// components/markdown/VideoEmbed.tsx
'use client'

import { useState } from 'react'
import { PlayCircle, ExternalLink } from 'lucide-react'

export interface VideoConfig {
  /** `youtube` or `vimeo`. */
  provider?: string
  /** The video id (YouTube) or the numeric id (Vimeo). */
  id?: string
  /** Full URL — used instead of `id` when supplied. */
  url?: string
  title?: string
  /** Start offset in seconds. */
  start?: number
  /** End offset in seconds. */
  end?: number
  /** Optional caption rendered under the player. */
  caption?: string
}

interface VideoEmbedProps {
  config: VideoConfig
}

const YOUTUBE_HOST = 'https://www.youtube-nocookie.com'
const VIMEO_HOST = 'https://player.vimeo.com'

/**
 * Extracts a provider and id from a video URL.
 * Returns `null` for anything that is not a recognised video link.
 */
export function parseVideoUrl(url: string): { provider: 'youtube' | 'vimeo'; id: string } | null {
  const match = /^https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.exec(url.trim())
  if (!match) return null
  const host = match[1].toLowerCase()

  if (host === 'youtu.be') {
    const id = url.trim().split('/').filter(Boolean)[0]?.split(/[?&#]/)[0]
    return id ? { provider: 'youtube', id } : null
  }
  if (host === 'youtube.com') {
    const id = /[?&]v=([^&#]+)/.exec(url)?.[1] ?? /\/embed\/([^?&#/]+)/.exec(url)?.[1]
    return id ? { provider: 'youtube', id } : null
  }
  // Vimeo
  const id = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(url)?.[1]
  return id ? { provider: 'vimeo', id } : null
}

/**
 * A video embed.
 *
 * The player is behind a **click-to-load facade**: no third-party request is
 * made until the learner asks for it, so no cookie is set and nothing is
 * phoned home on page view. The facade falls back to a plain link.
 */
export default function VideoEmbed({ config }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false)

  const raw = config.url?.trim() || config.id?.trim() || ''
  const parsed = raw ? parseVideoUrl(raw) : null
  const provider = (config.provider?.toLowerCase() || parsed?.provider) as
    | 'youtube'
    | 'vimeo'
    | undefined

  const id = parsed?.id || (provider ? raw.replace(/[^A-Za-z0-9_-]/g, '') : '')
  const title = config.title || 'Video'

  if (!id || (provider !== 'youtube' && provider !== 'vimeo')) {
    return (
      <div className="my-6 rounded-xl border border-border bg-danger-soft p-4 text-sm text-danger-foreground">
        This video reference is not valid.
      </div>
    )
  }

  const params = new URLSearchParams()
  if (provider === 'youtube') {
    params.set('rel', '0')
    if (config.start) params.set('start', String(Math.max(0, Math.round(config.start))))
    if (config.end) params.set('end', String(Math.max(0, Math.round(config.end))))
  } else {
    if (config.start) params.set('#t', `${Math.max(0, Math.round(config.start))}s`)
  }
  const query = params.toString()

  const src =
    provider === 'youtube'
      ? `${YOUTUBE_HOST}/embed/${id}${query ? `?${query}` : ''}`
      : `${VIMEO_HOST}/video/${id}${query ? `?${query}` : ''}`

  const watchUrl =
    provider === 'youtube'
      ? `https://www.youtube.com/watch?v=${id}`
      : `https://vimeo.com/${id}`

  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-xl border border-border bg-surface-sunken">
        {playing ? (
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/10 via-surface to-accent/10 transition-colors hover:from-primary/15 hover:to-accent/15"
            aria-label={`Play video: ${title}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 group-hover:scale-110">
              <PlayCircle className="h-8 w-8" aria-hidden="true" />
            </span>
            <span className="px-4 text-center text-sm font-semibold text-foreground">{title}</span>
            <span className="text-xs text-foreground-subtle">
              Loads from {provider === 'youtube' ? 'YouTube' : 'Vimeo'} — nothing is requested until you press play.
            </span>
          </button>
        )}
      </div>

      {(config.caption || true) && (
        <figcaption className="mt-2 flex items-center justify-center gap-3 text-xs text-foreground-muted">
          {config.caption && <span>{config.caption}</span>}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
          >
            Watch on {provider === 'youtube' ? 'YouTube' : 'Vimeo'}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </figcaption>
      )}
    </figure>
  )
}
