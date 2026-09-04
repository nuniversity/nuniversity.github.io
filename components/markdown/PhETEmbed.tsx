'use client'

import { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'

interface PhETEmbedProps {
  slug: string
  title?: string
  language?: string
}

const PHET_BASE = 'https://phet.colorado.edu/sims/html'

export default function PhETEmbed({ slug, title, language = 'en' }: PhETEmbedProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const url = `${PHET_BASE}/${slug}/latest/${slug}_${language}.html`
  const displayName = title || slug.replace(/-/g, ' ')

  if (error) {
    return (
      <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{displayName}</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">
            Failed to load simulation
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
          >
            Open on PhET <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <Play className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{displayName}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Open fullscreen ↗
        </a>
      </div>
      <div className="relative bg-white" style={{ aspectRatio: '834 / 504' }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading simulation...</span>
            </div>
          </div>
        )}
        <iframe
          src={url}
          title={displayName}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
      <div className="px-4 py-2 border-t bg-muted/30">
        <span className="text-xs text-muted-foreground">
          Simulation by{' '}
          <a
            href="https://phet.colorado.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            PhET Interactive Simulations
          </a>
          , University of Colorado Boulder
        </span>
      </div>
    </div>
  )
}
