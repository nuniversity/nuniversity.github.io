'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useState, useEffect, useRef } from 'react'
import { AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

import SyntaxHighlighterWrapper from './FixWrapper'
import QuestionBlock from './QuestionBlock'
import PhETEmbed from './PhETEmbed'
import SciencePlot from './SciencePlot'
import MoleculeViewer from './MoleculeViewer'
import LessonImage from './LessonImage'
import VideoEmbed, { parseVideoUrl, type VideoConfig } from './VideoEmbed'
import DragOrderQuestion from './DragOrderQuestion'
import MatchingQuestion from './MatchingQuestion'
import FillBlankQuestion from './FillBlankQuestion'
import BucketDropQuestion from './BucketDropQuestion'
import type { LessonQuestion } from './QuestionBlock'
import { rehypeHeadingIds } from '@/lib/lessons/heading-ids'

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'cite'],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'target'],
    cite: ['index'],
    div: [...(defaultSchema.attributes?.div ?? []), 'className'],
    span: ['className'],
  },
}

interface MarkdownRendererProps {
  content: string
  /** Site locale ('en' | 'pt' | 'es') — drives callout header labels. Defaults to 'en'. */
  lang?: string
  dict?: any
  /**
   * Title already shown by the page. When the Markdown opens with an `# H1`
   * carrying the same text, it is dropped: 1,267 of 1,298 lessons repeat the
   * title inside the body, which rendered the heading twice and gave the page
   * two `h1` elements.
   */
  pageTitle?: string
}

const langMap: Record<string, string> = {
  diagram: 'text',
  mermaid: 'mermaid',
  question: 'question',
  math: 'math',
  phet: 'phet',
  plot: 'plot',
  video: 'video',
  molecule: 'molecule',
  dragdrop: 'dragdrop',
  matching: 'matching',
  fillblank: 'fillblank',
  interactive: 'interactive',
  sql: 'sql',
  psql: 'sql',
  postgresql: 'sql',
  plsql: 'sql',
  javascript: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  python: 'python',
  py: 'python',
  cpython: 'python',
  rust: 'rust',
  rs: 'rust',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  terraform: 'hcl',
  hcl: 'hcl',
  tf: 'hcl',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',
  markdown: 'markdown',
  md: 'markdown',
  java: 'java',
  dockerfile: 'docker',
  docker: 'docker',
  makefile: 'makefile',
  make: 'makefile',
  properties: 'properties',
  dotenv: 'properties',
  xml: 'markup',
  html: 'markup',
  svg: 'markup',
  scala: 'scala',
  gitignore: 'git',
  text: 'plaintext',
  txt: 'plaintext',
  plaintext: 'plaintext',
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

interface MathBlockProps {
  tex: string
}

function MathBlock({ tex }: MathBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const renderMath = async () => {
      try {
        const katex = await import('katex')
        if (!mounted || !containerRef.current) return
        const html = katex.default.renderToString(tex, {
          displayMode: true,
          throwOnError: false,
        })
        containerRef.current.innerHTML = html
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to render math')
        }
      }
    }

    renderMath()
    return () => { mounted = false }
  }, [tex])

  if (error) {
    return (
      <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
        Math rendering error: {error}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="my-6 text-center overflow-x-auto" />
  )
}

interface MermaidDiagramProps {
  code: string
}

/** Diagram colours for the light theme — mirrors the site tokens. */
const MERMAID_LIGHT_VARIABLES = {
  primaryColor: '#eff6ff',
  primaryTextColor: '#0f172a',
  primaryBorderColor: '#2563eb',
  secondaryColor: '#f5f3ff',
  secondaryTextColor: '#0f172a',
  secondaryBorderColor: '#7c3aed',
  tertiaryColor: '#ecfeff',
  tertiaryTextColor: '#0f172a',
  tertiaryBorderColor: '#0891b2',
  lineColor: '#64748b',
  textColor: '#0f172a',
  mainBkg: '#eff6ff',
  nodeBorder: '#2563eb',
  clusterBkg: '#f8fafc',
  clusterBorder: '#cbd5e1',
  edgeLabelBackground: '#ffffff',
  titleColor: '#0f172a',
  noteBkgColor: '#fffbeb',
  noteTextColor: '#78350f',
  noteBorderColor: '#f59e0b',
  actorBkg: '#eff6ff',
  actorBorder: '#2563eb',
  actorTextColor: '#0f172a',
  signalColor: '#0f172a',
  signalTextColor: '#0f172a',
  labelBoxBkgColor: '#eff6ff',
  labelBoxBorderColor: '#2563eb',
  labelTextColor: '#0f172a',
  loopTextColor: '#0f172a',
  activationBkgColor: '#eff6ff',
  attributionBkgColor: '#f8fafc',
  stateBkg: '#eff6ff',
  stateBorder: '#2563eb',
  stateLabelColor: '#0f172a',
  classText: '#0f172a',
}

/** Diagram colours for the dark theme. */
const MERMAID_DARK_VARIABLES = {
  primaryColor: '#172554',
  primaryTextColor: '#e2e8f0',
  primaryBorderColor: '#60a5fa',
  secondaryColor: '#2e1065',
  secondaryTextColor: '#e2e8f0',
  secondaryBorderColor: '#a78bfa',
  tertiaryColor: '#164e63',
  tertiaryTextColor: '#e2e8f0',
  tertiaryBorderColor: '#22d3ee',
  lineColor: '#94a3b8',
  textColor: '#e2e8f0',
  mainBkg: '#172554',
  nodeBorder: '#60a5fa',
  clusterBkg: '#0f172a',
  clusterBorder: '#334155',
  edgeLabelBackground: '#0f172a',
  titleColor: '#f1f5f9',
  noteBkgColor: '#422006',
  noteTextColor: '#fde68a',
  noteBorderColor: '#f59e0b',
  actorBkg: '#172554',
  actorBorder: '#60a5fa',
  actorTextColor: '#e2e8f0',
  signalColor: '#e2e8f0',
  signalTextColor: '#e2e8f0',
  labelBoxBkgColor: '#172554',
  labelBoxBorderColor: '#60a5fa',
  labelTextColor: '#e2e8f0',
  loopTextColor: '#e2e8f0',
  activationBkgColor: '#172554',
  attributionBkgColor: '#0f172a',
  stateBkg: '#172554',
  stateBorder: '#60a5fa',
  stateLabelColor: '#e2e8f0',
  classText: '#e2e8f0',
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
        }

        // Brand-aligned diagram theme. Colours mirror the site tokens so
        // diagrams read as part of the product rather than a default render.
        // The dark set is used when the site is in dark mode.
        const dark = document.documentElement.classList.contains('dark')
        mermaidRef.current.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'strict',
          fontFamily: 'inherit',
          flowchart: {
            useMaxWidth: false,
            curve: 'basis',
          },
          themeVariables: dark ? MERMAID_DARK_VARIABLES : MERMAID_LIGHT_VARIABLES,
        })

        if (!mounted) return

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg } = await mermaidRef.current.render(id, code)

        if (!mounted || !containerRef.current) return

        containerRef.current.innerHTML = svg

        const svgEl = containerRef.current.querySelector('svg') as SVGSVGElement | null
        if (!svgEl) return

        // Mermaid writes the diagram's intrinsic size as `width`/`height`
        // attributes, or as a `viewBox`. That size is what the reader gets:
        // the wrapper below is sized from it and the scroll container pans,
        // instead of shrinking the diagram until its labels are unreadable.
        const rawW = svgEl.getAttribute('width') ?? ''
        const rawH = svgEl.getAttribute('height') ?? ''
        const numeric = (value: string) => (/^\d+(\.\d+)?$/.test(value) ? parseFloat(value) : null)
        const viewBox = svgEl.viewBox?.baseVal
        const parsedW = numeric(rawW) ?? (viewBox && viewBox.width ? viewBox.width : null)
        const parsedH = numeric(rawH) ?? (viewBox && viewBox.height ? viewBox.height : null)

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
            if (rect && rect.width > 0) setNaturalSize({ w: rect.width, h: rect.height })
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

    // Re-render when the site theme flips — the diagram colours differ
    // between light and dark.
    let observer: MutationObserver | null = null
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        renderDiagram()
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    return () => {
      mounted = false
      observer?.disconnect()
    }
  }, [code])

  // Default scale: fit the column when the diagram is not much wider, but never
  // shrink below 75% — past that the labels stop being readable and panning is
  // the better deal. The zoom buttons still go down to 25%.
  const [fit, setFit] = useState(1)
  useEffect(() => {
    if (!naturalSize) return
    const scroll = scrollRef.current
    if (!scroll) return
    const compute = () => {
      const available = Math.max(160, scroll.clientWidth)
      setFit(Math.max(0.75, Math.min(1, available / naturalSize.w)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [naturalSize])

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

  const scale = fit * zoom
  const sizedStyle: React.CSSProperties = naturalSize
    ? { width: naturalSize.w * scale, height: naturalSize.h * scale }
    : { width: '100%' }

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
        <div style={sizedStyle}>
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

const ALERT_META: Record<string, { cls: string; icon: string }> = {
  NOTE:      { cls: 'callout-note',      icon: 'ℹ️' },
  INFO:      { cls: 'callout-note',      icon: 'ℹ️' },
  WARNING:   { cls: 'callout-warning',   icon: '⚠️' },
  DANGER:    { cls: 'callout-danger',    icon: '🚨' },
  ERROR:     { cls: 'callout-danger',    icon: '🚨' },
  SUCCESS:   { cls: 'callout-success',   icon: '✅' },
  TIP:       { cls: 'callout-tip',       icon: '💡' },
  IMPORTANT: { cls: 'callout-important', icon: '📌' },
}

// Localised callout header labels per site locale (keyed by canonical type above).
const ALERT_LABELS: Record<string, Record<string, string>> = {
  en: { NOTE: 'Note', INFO: 'Info', WARNING: 'Warning', DANGER: 'Danger', ERROR: 'Error', SUCCESS: 'Success', TIP: 'Tip', IMPORTANT: 'Important' },
  pt: { NOTE: 'Nota', INFO: 'Info', WARNING: 'Aviso', DANGER: 'Perigo', ERROR: 'Erro', SUCCESS: 'Sucesso', TIP: 'Dica', IMPORTANT: 'Importante' },
  es: { NOTE: 'Nota', INFO: 'Info', WARNING: 'Advertencia', DANGER: 'Peligro', ERROR: 'Error', SUCCESS: 'Éxito', TIP: 'Consejo', IMPORTANT: 'Importante' },
}

// Locale variants used in translated content → canonical type.
const ALERT_ALIASES: Record<string, string> = {
  NOTA: 'NOTE', DICA: 'TIP', CONSEJO: 'TIP',
  AVISO: 'WARNING', ADVERTENCIA: 'WARNING',
  SUCESSO: 'SUCCESS', 'ÉXITO': 'SUCCESS', EXITO: 'SUCCESS',
  IMPORTANTE: 'IMPORTANT', ATENCAO: 'WARNING', ATENCION: 'WARNING',
}

// Every accepted marker (canonical + locale aliases) for the two regex passes.
const ALERT_MARKER = 'NOTE|INFO|WARNING|DANGER|ERROR|SUCCESS|TIP|IMPORTANT|NOTA|DICA|CONSEJO|AVISO|ADVERTENCIA|SUCESSO|ÉXITO|EXITO|IMPORTANTE|ATENCAO|ATENCION'

function canonicalAlertType(type: string): string {
  const t = type.toUpperCase()
  return ALERT_ALIASES[t] ?? t
}

// Label text comes from lesson markdown (e.g. "**Key Takeaways**") and lands in
// raw HTML, where markdown would render literally — convert emphasis inline.
function renderAlertLabel(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function toCalloutHtml(type: string, title: string, body: string, lang: string): string {
  const canonical = canonicalAlertType(type)
  const meta = ALERT_META[canonical]
  if (!meta) return ''
  const labels = ALERT_LABELS[lang] ?? ALERT_LABELS.en
  const label = title ? renderAlertLabel(title) : labels[canonical] || canonical
  return (
    `<div class="callout ${meta.cls}">\n` +
    `<div class="callout-header"><span class="callout-icon">${meta.icon}</span><span class="callout-label">${label}</span></div>\n` +
    `<div class="callout-body">\n\n${body}\n\n</div>\n` +
    `</div>\n`
  )
}

/**
 * Turns `A · B · C · …` prose runs into a real bullet list.
 *
 * Several courses list 30–40 service names as one paragraph separated by
 * middle dots. Rendered literally that becomes an unreadable wall of text that
 * wraps unpredictably. Converting it to a list is both more readable and more
 * semantically correct.
 *
 * Guards:
 *  - fenced code is skipped entirely;
 *  - headings, tables, blockquotes and existing lists are left alone;
 *  - a run needs at least 5 items and every item must be short, so prose that
 *    happens to contain one or two `·` characters is untouched.
 */
const INLINE_LIST_MIN_ITEMS = 5
const INLINE_LIST_MAX_ITEM_LENGTH = 80

/**
 * Removes a stray `**` left over when a bold run is split across items
 * (`**Basic · Business Support+ · … · Unified Operations**`). Without this
 * the first and last items would render with literal asterisks and could
 * bold the wrong span.
 */
function balanceEmphasis(text: string): string {
  const markers = text.match(/\*\*/g) ?? []
  if (markers.length % 2 === 0) return text
  if (text.startsWith('**')) return text.slice(2)
  if (text.endsWith('**')) return text.slice(0, -2)
  return text
}

/**
 * Escapes the `$` in currency so remark-math cannot read it as LaTeX.
 *
 * The course prose is full of money — `US$ 499.999`, `R$ 1.000`, `$0.015 por
 * shard-hour`. remark-math treats two `$` on one line as an inline math span,
 * so amounts were typeset by KaTeX and the bold markers around them leaked out
 * as literal `*`. A single AWS table row could contain four amounts and render
 * as four broken formulas.
 *
 * The decision is made per *pair*, because that is how remark-math reads them:
 * dollars are paired left to right on each line, and each pair is classified.
 * A pair is currency when it contains markdown emphasis (math never does),
 * ends in a dangling operator (`$0.50-$1.00`), contains words, or is a bare
 * amount. Genuine formulas keep their `$`: they contain `\`, `^`, `_`, braces
 * or a comparison, which prose amounts never do.
 *
 * Display math (`$$ … $$`) is skipped, fenced code and inline code are
 * skipped, and an already-escaped `\$` is left alone.
 */
const CURRENCY_UNIT_RE = /[A-Za-zÀ-ÖØ-öø-ÿ]{3,}/
const AMOUNT_RE = /^\d[\d.,\s]*\d$/
const MATH_SIGNAL_RE = /[\\^_{}=<>]/

function isCurrencySpan(body: string): boolean {
  const s = body.trim()
  if (!s) return false
  // Math never contains markdown emphasis; prose that does was clearly eaten
  // by a stray pair of dollars.
  if (s.includes('**') || s.includes('__')) return true
  // `$0.50-$1.00` pairs as "0.50-", which is not a formula.
  if (/[-+*/=]$/.test(s)) return true
  if (MATH_SIGNAL_RE.test(s)) return false
  const stripped = s
    .replace(/\\(?:text|mathrm|operatorname)\{[^{}]*\}/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
  if (CURRENCY_UNIT_RE.test(stripped)) return true
  // Bare amounts: 0.015, 499.999, 1,500, 10 000 — but not a lone "3".
  return AMOUNT_RE.test(s) && (s.length >= 4 || /[.,]/.test(s))
}

/** Escapes the dollar signs of one currency pair inside a block of text. */
function escapeCurrencyText(text: string): { text: string; changed: boolean } {
  // Inline code is literal: `$` inside it is never a math delimiter and must
  // not gain a backslash.
  const codeSpans: Array<[number, number]> = []
  const codeRe = /`[^`]*`/g
  let codeMatch: RegExpExecArray | null
  while ((codeMatch = codeRe.exec(text)) !== null) {
    codeSpans.push([codeMatch.index, codeMatch.index + codeMatch[0].length])
  }
  const inCode = (i: number) => codeSpans.some(([a, b]) => i >= a && i < b)

  const positions: number[] = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '$') continue
    if (inCode(i)) continue
    if (i > 0 && text[i - 1] === '\\') continue
    if (text[i + 1] === '$' || (i > 0 && text[i - 1] === '$')) {
      // Display-math delimiter: never a currency sign.
      i++
      continue
    }
    positions.push(i)
  }
  if (positions.length < 2) return { text, changed: false }

  const escape = new Set<number>()
  for (let k = 0; k + 1 < positions.length; k += 2) {
    const open = positions[k]
    const close = positions[k + 1]
    if (isCurrencySpan(text.slice(open + 1, close))) {
      escape.add(open)
      escape.add(close)
    }
  }
  if (escape.size === 0) return { text, changed: false }

  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (escape.has(i)) out += '\\'
    out += text[i]
  }
  return { text: out, changed: true }
}

function escapeCurrency(md: string): string {
  const lines = md.split('\n')
  const output = [...lines]
  let inFence = false
  let fenceChar = ''
  // remark-math pairs dollars across a whole paragraph, which may wrap over
  // several source lines. Pairing line by line missed those, so consecutive
  // prose lines are collected into one block first.
  let block: number[] = []

  const flush = () => {
    if (block.length === 0) return
    const joined = block.map(i => output[i]).join('\n')
    const { text, changed } = escapeCurrencyText(joined)
    if (changed) {
      const parts = text.split('\n')
      block.forEach((lineIndex, i) => {
        output[lineIndex] = parts[i]
      })
    }
    block = []
  }

  lines.forEach((line, index) => {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line)
    if (fence) {
      flush()
      if (!inFence) {
        inFence = true
        fenceChar = fence[1][0]
      } else if (line.trim().startsWith(fenceChar.repeat(3))) {
        inFence = false
      }
      return
    }
    if (inFence) return

    const trimmed = line.trim()
    if (trimmed === '') {
      flush()
      return
    }
    // A list item is its own paragraph: pairing dollars across sibling items
    // would escape the wrong pair.
    if (/^([-*+]|\d+[.)])\s/.test(trimmed)) {
      flush()
      block.push(index)
      return
    }
    // Blocks that never continue across lines are still processed, but on
    // their own: a table row is a complete paragraph in GFM.
    if (/^[|#<]/.test(trimmed)) {
      flush()
      block = [index]
      flush()
      return
    }

    block.push(index)
  })
  flush()

  return output.join('\n')
}

function preprocessInlineLists(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inFence = false
  let fenceChar = ''

  /**
   * Splits `**Query federation (11):** MySQL` into its label and first item.
   * Returns `null` when the line has no usable lead-in.
   */
  function splitLeadIn(raw: string): { label: string; rest: string } | null {
    const colon = raw.indexOf(':')
    if (colon < 1 || colon > 120) return null
    let label = raw.slice(0, colon + 1)
    let rest = raw.slice(colon + 1)
    // Closing emphasis after the colon belongs to the label.
    const closing = /^[*_`]+/.exec(rest)
    if (closing) {
      label += closing[0]
      rest = rest.slice(closing[0].length)
    }
    // Unbalanced emphasis would corrupt the Markdown, so leave it alone.
    if (label.startsWith('**') && !label.endsWith('**')) return null
    rest = rest.replace(/^[\s]+/, '')
    return rest ? { label: label.trim(), rest } : null
  }

  for (const line of lines) {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line)
    if (fence) {
      if (!inFence) {
        inFence = true
        fenceChar = fence[1][0]
      } else if (line.trim().startsWith(fenceChar.repeat(3))) {
        inFence = false
      }
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }

    const trimmed = line.trim()
    // Leave block-level markdown alone.
    if (/^(#{1,6}\s|>|\||[-*+]\s|\d+[.)]\s|<\/?[a-z])/i.test(trimmed)) {
      out.push(line)
      continue
    }

    const parts = line
      .split('·')
      .map(part => part.trim())
      .filter(Boolean)

    // Some runs are introduced by a label: `**Query federation (11):** a · b · c`.
    // Keep the label as its own paragraph and list only the items after it.
    let label: string | null = null
    let items = parts
    const leadIn = splitLeadIn(parts[0] ?? '')
    if (leadIn) {
      label = leadIn.label
      items = [leadIn.rest, ...parts.slice(1)]
    }

    // A run can end with the start of new prose on the same line:
    // `… · **z** = high CPU frequency. After the dash, …`. Keep that sentence
    // as a paragraph after the list instead of as a giant list item.
    let trailing: string | null = null
    const last = items[items.length - 1] ?? ''
    if (last.length > INLINE_LIST_MAX_ITEM_LENGTH) {
      const sentence = new RegExp(
        `^(.{1,${INLINE_LIST_MAX_ITEM_LENGTH}}?[.!?])\\s+(.{20,})$`
      ).exec(last)
      if (sentence) {
        items = [...items.slice(0, -1), sentence[1]]
        trailing = sentence[2]
      }
    }

    const qualifies =
      items.length >= INLINE_LIST_MIN_ITEMS - (label ? 1 : 0) &&
      items.every(part => part.length > 0 && part.length <= INLINE_LIST_MAX_ITEM_LENGTH)

    if (!qualifies) {
      out.push(line)
      continue
    }

    out.push('')
    if (label) out.push(label, '')
    for (const part of items) {
      out.push(`- ${balanceEmphasis(part.replace(/[.;:,]+$/, ''))}`)
    }
    if (trailing) out.push('', trailing)
    out.push('')
  }

  return out.join('\n')
}

/**
 * Drops a leading `# Heading` that repeats the title the page already shows.
 * Without this the lesson title appeared twice: once as the page `h1` and once
 * as the first heading inside the content card.
 */
function stripDuplicateTitle(md: string, pageTitle?: string): string {
  if (!pageTitle) return md
  const match = /^\s*#\s+(.+?)\s*(?:\n|$)/.exec(md)
  if (!match) return md
  const normalise = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  if (normalise(match[1]) !== normalise(pageTitle)) return md
  return md.slice(match[0].length).replace(/^\s*\n/, '')
}

function preprocessAlerts(md: string, lang: string): string {
  let result = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Pass 1: blockquote format  > [!TYPE]
  //   > [!WARNING]
  //   > Body line 1
  //   > Body line 2
  result = result.replace(
    new RegExp(`^> \\[!(${ALERT_MARKER})\\][ \\t]*\\n((?:[ \\t]*>[ \\t]?[^\\n]*\\n?)*)`, 'gim'),
    (match: string, type: string, rest: string) => {
      const body = rest
        .split('\n')
        .map((line: string) => line.replace(/^[ \t]*>[ \t]?/, ''))
        .filter((line: string) => line.trim() !== '')
        .join('\n')

      return toCalloutHtml(type, '', body, lang)
    }
  )

  // Pass 2: plain format  [!TYPE] on its own line
  //   [!WARNING]
  //   Body content continues until next alert, heading, or `---`
  result = result.replace(
    new RegExp(`^\\[!(${ALERT_MARKER})\\]([^\\n]*)\\n([\\s\\S]*?)(?=\\n\\n|\\n\\[!|(?![\\s\\S]))`, 'gm'),
    (match: string, type: string, titleLine: string, rest: string) => {
      const body = rest.trim()
      return toCalloutHtml(type, titleLine.trim(), body, lang)
    }
  )

  return result
}

export default function MarkdownRenderer({
  content,
  lang = 'en',
  dict,
  pageTitle,
}: MarkdownRendererProps) {
  const processedContent = preprocessAlerts(
    preprocessInlineLists(escapeCurrency(stripDuplicateTitle(content, pageTitle))),
    lang
  )

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeHeadingIds, rehypeKatex]}
      components={{
        h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground">{children}</h1>,
        h2: ({ children, id }) => <h2 id={id} className="text-3xl font-bold mb-4 mt-6 text-foreground border-b pb-2 scroll-mt-24">{children}</h2>,
        h3: ({ children, id }) => <h3 id={id} className="text-2xl font-semibold mb-3 mt-5 text-foreground scroll-mt-24">{children}</h3>,
        h4: ({ children }) => <h4 className="text-xl font-semibold mb-2 mt-4 text-foreground">{children}</h4>,

        p: ({ children }) => <p className="mb-4 leading-7 text-foreground/90">{children}</p>,

        ul: ({ children }) => <ul className="list-disc mb-4 space-y-2 pl-6">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal mb-4 space-y-2 pl-6">{children}</ol>,
        li: ({ children }) => <li className="leading-7 text-foreground/90">{children}</li>,

        pre: ({ children }) => (
          // Scrolls within its own block. `overflow-visible` would let a long
          // code line widen the whole page.
          <div className="not-prose my-0 overflow-x-auto">{children}</div>
        ),

        code: ({ node, className, children, ...props }) => {
          const match = /language-([a-z0-9_+-]+)/i.exec(className || '')
          const langRaw = match ? match[1].toLowerCase() : null
          const language = langRaw ? (langMap[langRaw] ?? langRaw) : null

          if (language) {
            const codeString = String(children).replace(/\n$/, '')

            if (language === 'mermaid') {
              return <MermaidDiagram code={codeString} />
            }

            if (language === 'math') {
              return <MathBlock tex={codeString} />
            }

            if (language === 'video') {
              try {
                const config = JSON.parse(codeString) as VideoConfig
                return <VideoEmbed config={config} />
              } catch (e) {
                return (
                  <div className="my-6 rounded-xl border border-danger/40 bg-danger-soft p-4 text-sm text-danger-foreground">
                    Invalid video config: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'phet') {
              try {
                const config = JSON.parse(codeString)
                return (
                  <PhETEmbed
                    slug={config.slug}
                    title={config.title}
                    language={config.language}
                  />
                )
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid PhET config: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'plot') {
              try {
                const config = JSON.parse(codeString)
                return (
                  <SciencePlot
                    type={config.type}
                    title={config.title}
                    xLabel={config.xLabel}
                    yLabel={config.yLabel}
                    data={config.data}
                    dataKeys={config.dataKeys}
                    colors={config.colors}
                    height={config.height}
                    xKey={config.xKey}
                  />
                )
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid plot config: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'molecule') {
              try {
                const config = JSON.parse(codeString)
                return (
                  <MoleculeViewer
                    pdbId={config.pdbId}
                    style={config.style}
                    color={config.color}
                    height={config.height}
                    label={config.label}
                    background={config.background}
                  />
                )
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid molecule config: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'dragdrop') {
              try {
                const config = JSON.parse(codeString)
                return (
                  <DragOrderQuestion
                    question={config.question}
                    items={config.items}
                    correctOrder={config.correctOrder}
                    explanation={config.explanation}
                    dict={dict}
                  />
                )
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid dragdrop config: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'matching') {
              try {
                const config = JSON.parse(codeString)
                return (
                  <MatchingQuestion
                    question={config.question}
                    pairs={config.pairs}
                    explanation={config.explanation}
                    dict={dict}
                  />
                )
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid matching config: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'fillblank') {
              try {
                const config = JSON.parse(codeString)
                return (
                  <FillBlankQuestion
                    question={config.question}
                    template={config.template}
                    answers={config.answers}
                    distractors={config.distractors}
                    explanation={config.explanation}
                    dict={dict}
                  />
                )
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid fillblank config: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'question') {
              try {
                const questionData: LessonQuestion = JSON.parse(codeString)
                return <QuestionBlock data={questionData} dict={dict} />
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid question format: {(e as Error).message}
                  </div>
                )
              }
            }

            if (language === 'interactive') {
              try {
                const config = JSON.parse(codeString)
                if (!config.type) {
                  throw new Error('Missing interactive type')
                }
                if (config.type === 'matching') {
                  return (
                    <MatchingQuestion
                      question={config.title}
                      pairs={config.pairs}
                      explanation={[config.instructions, config.answer].filter(Boolean).join('\n\n')}
                      dict={dict}
                    />
                  )
                }
                if (config.type === 'fillblank') {
                  return (
                    <FillBlankQuestion
                      question={config.title}
                      instructions={config.instructions}
                      items={config.items}
                      explanation={[config.explanation, config.answer].filter(Boolean).join('\n\n') || undefined}
                      dict={dict}
                    />
                  )
                }
                if (config.type === 'dragdrop') {
                  return (
                    <BucketDropQuestion
                      question={config.title}
                      instructions={config.instructions}
                      buckets={config.buckets}
                      explanation={config.explanation}
                      dict={dict}
                    />
                  )
                }
                throw new Error(`Unknown interactive type: ${config.type}`)
              } catch (e) {
                return (
                  <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
                    Invalid interactive config: {(e as Error).message}
                  </div>
                )
              }
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

        

        table: ({ children }) => (
          <div
            className="table-scroll my-6 overflow-x-auto overscroll-contain rounded-xl border border-border"
            // Scrollable regions need a name and a tab stop so keyboard users
            // can reach the scrollbars (WCAG 2.1.1).
            role="region"
            aria-label="Table: scroll inside this box to see all rows and columns"
            tabIndex={0}
          >
            {/* Width comes from `.prose-measure table` in globals.css: it sizes
                to its content so columns keep a readable measure, and this box
                scrolls when the table is wider or taller than the page. */}
            <table className="text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface-sunken">{children}</thead>,
        th: ({ children }) => (
          <th className="border-b border-border px-4 py-2.5 text-left font-semibold text-foreground">
            {/* `max-width` is ignored on table cells, so the measure lives on
                a wrapper element. */}
            <div className="prose-cell">{children}</div>
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-border-subtle px-4 py-2.5 text-foreground/90">
            <div className="prose-cell">{children}</div>
          </td>
        ),

        hr: () => <hr className="my-8 border-border" />,

        img: ({ src, alt, title }) => (
          <LessonImage src={src ?? ''} alt={alt ?? ''} caption={title} />
        ),

        a: ({ href, children, ...props }) => {
          const url = typeof href === 'string' ? href : ''
          // A bare YouTube/Vimeo link in prose becomes a real player.
          if (parseVideoUrl(url)) {
            return (
              <VideoEmbed
                config={{ url, title: typeof children === 'string' ? children : 'Video' }}
              />
            )
          }
          const external = /^https?:\/\//i.test(url)
          return (
            <a
              href={url}
              {...props}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary/80"
            >
              {children}
            </a>
          )
        },

        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {processedContent}
    </ReactMarkdown>
  )
}
