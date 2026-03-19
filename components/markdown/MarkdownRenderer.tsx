'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { useState, useEffect, useRef } from 'react'
import { AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

import SyntaxHighlighterWrapper from './FixWrapper'

interface MarkdownRendererProps {
  content: string
}

const langMap: Record<string, string> = {
  diagram: 'diagram',
  mermaid: 'mermaid',
  sql: 'sql',
  psql: 'sql',
  postgresql: 'sql',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  py: 'python',
  rust: 'rust',
  rs: 'rust',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  terraform: 'terraform',
  hcl: 'terraform',
  tf: 'terraform',
}

function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy text', e)
    }
  }

  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-600 focus:outline-none"
      aria-label="Copy code"
      type="button"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

interface MermaidDiagramProps {
  code: string
}

function MermaidDiagram({ code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const mermaidRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const renderDiagram = async () => {
      if (!containerRef.current) return

      try {
        if (!mermaidRef.current) {
          const mermaidModule = await import('mermaid')
          mermaidRef.current = mermaidModule.default ?? mermaidModule
          mermaidRef.current.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            flowchart: {
              useMaxWidth: false,
              htmlLabels: true,
              curve: 'basis',
            },
          })
        }

        if (!mounted) return

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg } = await mermaidRef.current.render(id, code)

        if (!mounted || !containerRef.current) return

        containerRef.current.innerHTML = svg

        const svgEl = containerRef.current.querySelector('svg') as SVGSVGElement | null
        if (!svgEl) return

        const rawW = svgEl.getAttribute('width')
        const rawH = svgEl.getAttribute('height')
        const parsedW = rawW ? parseFloat(rawW) : null
        const parsedH = rawH ? parseFloat(rawH) : null

        if (!svgEl.getAttribute('viewBox') && parsedW && parsedH) {
          svgEl.setAttribute('viewBox', `0 0 ${parsedW} ${parsedH}`)
        }

        svgEl.removeAttribute('width')
        svgEl.removeAttribute('height')
        svgEl.style.width = '100%'
        svgEl.style.height = 'auto'
        svgEl.style.display = 'block'
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet')

        if (parsedW && parsedH) {
          setNaturalSize({ w: parsedW, h: parsedH })
        } else {
          requestAnimationFrame(() => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) setNaturalSize({ w: rect.width, h: rect.height })
          })
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    }

    renderDiagram()
    return () => { mounted = false }
  }, [code])

  const handleZoomIn    = () => setZoom(prev => Math.min(parseFloat((prev + 0.25).toFixed(2)), 4))
  const handleZoomOut   = () => setZoom(prev => Math.max(parseFloat((prev - 0.25).toFixed(2)), 0.25))
  const handleResetZoom = () => setZoom(1)

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
    setZoom(1)
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.25, Math.min(4, parseFloat((prev + delta).toFixed(2)))))
    }
  }

  if (error) {
    return (
      <div className="mermaid-error-container">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Diagram Error</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <details className="mt-2">
          <summary className="text-xs cursor-pointer text-red-700 dark:text-red-300">Show diagram code</summary>
          <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs overflow-x-auto">{code}</pre>
        </details>
      </div>
    )
  }

  const scaledStyle: React.CSSProperties =
    zoom !== 1 && naturalSize
      ? { width: naturalSize.w * zoom, height: naturalSize.h * zoom, transform: `scale(${zoom})`, transformOrigin: 'top left' }
      : { width: '100%', transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: 'top left' }

  return (
    <div className={`mermaid-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="zoom-controls-toolbar">
        <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out" aria-label="Zoom out" disabled={zoom <= 0.25}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In" aria-label="Zoom in" disabled={zoom >= 4}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleResetZoom} className="zoom-btn" title="Reset Zoom" aria-label="Reset zoom">1:1</button>
        <div className="zoom-divider" />
        <button onClick={toggleFullscreen} className="zoom-btn" title="Toggle Fullscreen" aria-label="Toggle fullscreen">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="mermaid-scroll-container" onWheel={handleWheel}>
        <div style={scaledStyle}>
          <div ref={containerRef} className="mermaid-content" />
        </div>
      </div>

      {!isFullscreen && (
        <div className="zoom-hint md:block hidden">
          💡 Tip: Use Ctrl + Mouse Wheel to zoom, or click the fullscreen icon
        </div>
      )}
    </div>
  )
}

// ─── Alert Box Preprocessor ───────────────────────────────────────────────────
// Converts GitHub-style > [!TYPE] blockquotes into styled <div> callouts.
//
// Key fixes vs. original:
//  1. Normalises \r\n → \n before matching (gray-matter on Windows can leave \r\n)
//  2. Regex allows optional trailing spaces/tabs after [!TYPE]
//  3. Continuation line prefix pattern allows optional leading spaces before ">"

const ALERT_META: Record<string, { cls: string; icon: string; label: string }> = {
  NOTE:      { cls: 'callout-note',      icon: 'ℹ️',  label: 'Note' },
  INFO:      { cls: 'callout-note',      icon: 'ℹ️',  label: 'Info' },
  WARNING:   { cls: 'callout-warning',   icon: '⚠️',  label: 'Warning' },
  DANGER:    { cls: 'callout-danger',    icon: '🚨',  label: 'Danger' },
  ERROR:     { cls: 'callout-danger',    icon: '🚨',  label: 'Error' },
  SUCCESS:   { cls: 'callout-success',   icon: '✅',  label: 'Success' },
  TIP:       { cls: 'callout-tip',       icon: '💡',  label: 'Tip' },
  IMPORTANT: { cls: 'callout-important', icon: '📌',  label: 'Important' },
}

function preprocessAlerts(md: string): string {
  // Step 1: normalise line endings
  const normalised = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Step 2: replace alert blockquotes with HTML divs
  // Pattern explanation:
  //   ^> \[!TYPE\]   — blockquote starting with [!TYPE] at line start
  //   [ \t]*\n       — optional trailing whitespace then newline
  //   ((?:...)*)     — capture all following "> ..." lines
  return normalised.replace(
    /^> \[!(NOTE|INFO|WARNING|DANGER|ERROR|SUCCESS|TIP|IMPORTANT)\][ \t]*\n((?:[ \t]*>[ \t]?[^\n]*\n?)*)/gim,
    (_match: string, type: string, rest: string) => {
      const meta = ALERT_META[type.toUpperCase()]
      if (!meta) return _match

      // Strip the "> " prefix from each body line
      const body = rest
        .split('\n')
        .map((line: string) => line.replace(/^[ \t]*>[ \t]?/, ''))
        .filter((line: string) => line.trim() !== '')
        .join('\n')

      return (
        `<div class="callout ${meta.cls}">\n` +
        `<div class="callout-header"><span class="callout-icon">${meta.icon}</span><span class="callout-label">${meta.label}</span></div>\n` +
        `<div class="callout-body">\n\n${body}\n\n</div>\n` +
        `</div>\n`
      )
    }
  )
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const processedContent = preprocessAlerts(content)

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-3xl font-bold mb-4 mt-6 text-foreground border-b pb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-2xl font-semibold mb-3 mt-5 text-foreground">{children}</h3>,
        h4: ({ children }) => <h4 className="text-xl font-semibold mb-2 mt-4 text-foreground">{children}</h4>,

        p: ({ children }) => <p className="mb-4 leading-7 text-foreground/90">{children}</p>,

        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">{children}</ol>,
        li: ({ children }) => <li className="leading-7 text-foreground/90">{children}</li>,

        code: ({ node, className, children, ...props }) => {
          const match = /language-([a-z0-9_+-]+)/i.exec(className || '')
          const langRaw = match ? match[1].toLowerCase() : null
          const language = langRaw ? (langMap[langRaw] ?? langRaw) : null

          if (language) {
            const codeString = String(children).replace(/\n$/, '')

            if (language === 'mermaid') {
              return <MermaidDiagram code={codeString} />
            }

            return (
              <div className="relative my-6 rounded-lg overflow-hidden border border-gray-700">
                <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 font-mono flex justify-between items-center">
                  <span>{language}</span>
                  <CopyButton textToCopy={codeString} />
                </div>
                <SyntaxHighlighterWrapper language={language} PreTag="div" className="!my-0 !rounded-none">
                  {codeString}
                </SyntaxHighlighterWrapper>
              </div>
            )
          }

          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
              {children}
            </code>
          )
        },

        // Plain blockquote fallback — alert boxes are handled by preprocessAlerts
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
            {children}
          </blockquote>
        ),

        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:underline font-medium"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),

        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra w-full">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-base-200">{children}</thead>,
        th: ({ children }) => <th className="font-semibold text-left">{children}</th>,
        td: ({ children }) => <td>{children}</td>,

        hr: () => <hr className="my-8 border-border" />,

        img: ({ src, alt }) => (
          <div className="my-6">
            <img src={src} alt={alt || ''} className="rounded-lg max-w-full h-auto shadow-lg" />
            {alt && <p className="text-center text-sm text-muted-foreground mt-2">{alt}</p>}
          </div>
        ),

        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {processedContent}
    </ReactMarkdown>
  )
}
