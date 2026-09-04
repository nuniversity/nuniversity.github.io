'use client'

import { useEffect, useRef, useState } from 'react'
import { Atom, ExternalLink } from 'lucide-react'

interface MoleculeViewerProps {
  pdbId: string
  style?: string
  color?: string
  height?: string
  label?: string
  background?: string
}

const STYLE_MAP: Record<string, any> = {
  cartoon: (color: string) => ({ cartoon: { color } }),
  stick: (color: string) => ({ stick: { colorscheme: color === 'spectrum' ? 'Jmol' : color } }),
  sphere: (color: string) => ({ sphere: { colorscheme: color === 'spectrum' ? 'Jmol' : color } }),
  line: (color: string) => ({ line: { color } }),
  'cartoon+stick': (color: string) => ({
    cartoon: { color },
    stick: { colorscheme: 'greenCarbon', radius: 0.15 },
  }),
}

export default function MoleculeViewer({
  pdbId,
  style = 'cartoon',
  color = 'spectrum',
  height = '500px',
  label,
  background,
}: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const initializedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = label || `Protein: ${pdbId.toUpperCase()}`
  const pdbUrl = `https://www.rcsb.org/structure/${pdbId.toUpperCase()}`

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    let cancelled = false

    const load = async () => {
      try {
        const $3Dmol = await import('3dmol/build/3Dmol.js')
        if (cancelled || !containerRef.current) return

        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: background || 'white',
          backgroundAlpha: background === 'transparent' ? 0.0 : 1.0,
          antialias: true,
        })
        viewerRef.current = viewer

        const response = await fetch(`https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`)
        if (!response.ok) throw new Error(`PDB ${pdbId} not found (${response.status})`)
        if (cancelled) return

        const pdbData = await response.text()
        if (cancelled) return

        viewer.addModel(pdbData, 'pdb')

        const styleFn = STYLE_MAP[style] || STYLE_MAP.cartoon
        viewer.setStyle({}, styleFn(color))
        viewer.zoomTo()
        viewer.render()

        if (!cancelled) setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load molecule')
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
      if (viewerRef.current?.spin) viewerRef.current.spin(false)
      if (containerRef.current) containerRef.current.innerHTML = ''
      viewerRef.current = null
      initializedRef.current = false
    }
  }, [pdbId, style, color, background])

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <Atom className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{displayName}</span>
        <a
          href={pdbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          View on RCSB PDB ↗
        </a>
      </div>
      <div className="relative" style={{ height }}>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading molecule...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <a
                href={pdbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
              >
                View on RCSB PDB <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Structure: <a href={pdbUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-mono">{pdbId.toUpperCase()}</a>
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          Drag to rotate · Scroll to zoom · Right-click to pan
        </span>
      </div>
    </div>
  )
}
