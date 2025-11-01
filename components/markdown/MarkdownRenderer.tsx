'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { useState, useEffect, useRef } from 'react'
import { Info, AlertCircle, CheckCircle, AlertTriangle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

import SyntaxHighlighterWrapper from './FixWrapper'

interface MarkdownRendererProps {
  content: string
}

const langMap: Record<string, string> = {
  // diagram
  diagram: 'diagram',
  mermaid: 'mermaid',
  // sql
  sql: 'sql',
  psql: 'sql',
  postgresql: 'sql',
  // javascript
  javascript: 'javascript',
  typescript: 'typescript',
  // python
  python: 'python',
  py: 'python',
  // rust
  rust: 'rust',
  rs: 'rust',
  // bash / shell
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  // terraform / hcl
  terraform: 'terraform',
  hcl: 'terraform',
  tf: 'terraform'
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
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mermaidRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const renderDiagram = async () => {
      if (!containerRef.current) return

      try {
        // Dynamically import mermaid once
        if (!mermaidRef.current) {
          const mermaidModule = await import('mermaid')
          mermaidRef.current = mermaidModule.default ?? mermaidModule
          mermaidRef.current.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          })
        }
        
        if (!mounted) return

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        
        // Render the diagram
        const { svg } = await mermaidRef.current.render(id, code)

        if (!mounted || !containerRef.current) return

        // Inject SVG
        containerRef.current.innerHTML = svg
        
        const svgEl = containerRef.current.querySelector('svg') as SVGSVGElement | null
        if (!svgEl) return

        // Make SVG responsive
        svgEl.style.maxWidth = '100%'
        svgEl.style.height = 'auto'
        svgEl.style.display = 'block'
        svgEl.style.margin = '0 auto'
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet')

      } catch (err) {
        console.error('Mermaid rendering error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    }

    renderDiagram()

    return () => {
      mounted = false
    }
  }, [code])

  // Handle zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleResetZoom = () => setZoom(1)

  // Handle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) {
      setZoom(1) // Reset zoom when entering fullscreen
    }
  }

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
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
          <summary className="text-xs cursor-pointer text-red-700 dark:text-red-300">
            Show diagram code
          </summary>
          <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs overflow-x-auto">
            {code}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className={`mermaid-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Zoom Controls */}
      <div className="zoom-controls-toolbar">
        <button
          onClick={handleZoomOut}
          className="zoom-btn"
          title="Zoom Out (Ctrl + Mouse Wheel)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button
          onClick={handleZoomIn}
          className="zoom-btn"
          title="Zoom In (Ctrl + Mouse Wheel)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="zoom-btn"
          title="Reset Zoom"
          aria-label="Reset zoom"
        >
          1:1
        </button>
        <div className="zoom-divider" />
        <button
          onClick={toggleFullscreen}
          className="zoom-btn"
          title="Toggle Fullscreen"
          aria-label="Toggle fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Diagram Container */}
      <div 
        className="mermaid-scroll-container"
        onWheel={handleWheel}
      >
        <div 
          className="mermaid-diagram-container"
          style={{ transform: `scale(${zoom})` }}
        >
          <div 
            ref={containerRef}
            className="mermaid-content"
          />
        </div>
      </div>

      {/* Fullscreen hint */}
      {!isFullscreen && (
        <div className="zoom-hint">
          💡 Tip: Use Ctrl + Mouse Wheel to zoom, or click fullscreen icon
        </div>
      )}
    </div>
  )
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-3xl font-bold mb-4 mt-6 text-foreground border-b pb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-2xl font-semibold mb-3 mt-5 text-foreground">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-xl font-semibold mb-2 mt-4 text-foreground">
            {children}
          </h4>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="mb-4 leading-7 text-foreground/90">
            {children}
          </p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-7 text-foreground/90">
            {children}
          </li>
        ),

        // Code blocks with copy button and Mermaid support
        code: ({ node, className, children, ...props }) => {
          const match = /language-([a-z0-9_+-]+)/i.exec(className || '')
          const langRaw = match ? match[1].toLowerCase() : null
          const language = langRaw ? (langMap[langRaw] ?? langRaw) : null

          if (language) {
            const codeString = String(children).replace(/\n$/, '')

            // Handle Mermaid diagrams
            if (language === 'mermaid') {
              return <MermaidDiagram code={codeString} />
            }

            return (
              <div className="relative my-6 rounded-lg overflow-hidden border border-gray-700">
                <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 font-mono flex justify-between items-center">
                  <span>{language}</span>
                  <CopyButton textToCopy={codeString} />
                </div>

                <SyntaxHighlighterWrapper
                  language={language}
                  PreTag="div"
                  className="!my-0 !rounded-none"
                >
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

        // Blockquotes - Enhanced with DaisyUI alert styles
        blockquote: ({ children }) => {
          const content = String(children)
          
          // Check for alert types
          if (content.includes('[!NOTE]') || content.includes('[!INFO]')) {
            return (
              <div className="alert alert-info my-4 flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          if (content.includes('[!WARNING]')) {
            return (
              <div className="alert alert-warning my-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          if (content.includes('[!DANGER]') || content.includes('[!ERROR]')) {
            return (
              <div className="alert alert-error my-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          if (content.includes('[!SUCCESS]')) {
            return (
              <div className="alert alert-success my-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          return (
            <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
              {children}
            </blockquote>
          )
        },

        // Links
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

        // Tables - Using DaisyUI table styles
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra w-full">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-base-200">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="font-semibold text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td>{children}</td>
        ),

        // Horizontal Rule
        hr: () => (
          <hr className="my-8 border-border" />
        ),

        // Images
        img: ({ src, alt }) => (
          <div className="my-6">
            <img
              src={src}
              alt={alt || ''}
              className="rounded-lg max-w-full h-auto shadow-lg"
            />
            {alt && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {alt}
              </p>
            )}
          </div>
        ),

        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">
            {children}
          </strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic">
            {children}
          </em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}