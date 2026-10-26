// components/home/HeroSearch.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  BookOpen,
  FileText,
  Award,
  Calculator,
  Map as MapIcon,
  Library,
  GamepadIcon,
  Languages,
  CornerDownLeft,
  Loader2,
  X,
} from 'lucide-react'
import { searchDocs, type SearchDoc, type SearchDocType } from '@/lib/search/matcher'
import { resultChips, resultContext } from '@/lib/search/result-meta'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

const TYPE_ICON: Record<SearchDocType, typeof BookOpen> = {
  course: BookOpen,
  lesson: FileText,
  quiz: Award,
  tool: Calculator,
  roadmap: MapIcon,
  library: Library,
  game: GamepadIcon,
  language: Languages,
}

interface HeroSearchProps {
  lang: Locale
  dict: Dictionary
  placeholder: string
  label: string
  /** Extra classes for the field row, e.g. an entrance animation. */
  fieldClassName?: string
  /** Animation delay for the field row. */
  animationDelay?: string
}

/**
 * The hero's search field.
 *
 * It is a real type-ahead: results appear as you type, the index is fetched
 * lazily the first time the field is focused, and Enter opens the highlighted
 * result. It shares the search index and the matcher with the command palette
 * so both surfaces rank results identically.
 */
export default function HeroSearch({
  lang,
  dict,
  placeholder,
  label,
  fieldClassName = '',
  animationDelay,
}: HeroSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const [activated, setActivated] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cacheRef = useRef<Map<string, SearchDoc[]>>(new Map())

  // Load the index the first time the field is used, then cache it per locale.
  useEffect(() => {
    if (!activated || docs !== null) return
    const cached = cacheRef.current.get(lang)
    if (cached) {
      setDocs(cached)
      return
    }
    let cancelled = false
    const controller = new AbortController()
    fetch(`/search-index/${lang}.json`, { signal: controller.signal })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: SearchDoc[]) => {
        if (cancelled) return
        cacheRef.current.set(lang, data)
        setDocs(data)
      })
      .catch(() => {
        if (cancelled) return
        cacheRef.current.set(lang, [])
        setDocs([])
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [activated, docs, lang])

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const results = query.trim() ? (docs ? searchDocs(docs, query, 6) : []) : []

  useEffect(() => {
    setActive(0)
  }, [query])

  const go = useCallback(
    (doc: SearchDoc) => {
      setOpen(false)
      setQuery('')
      if (/^https?:\/\//i.test(doc.url)) {
        window.open(doc.url, '_blank', 'noopener,noreferrer')
      } else {
        router.push(doc.url)
      }
    },
    [router]
  )

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(index => (results.length ? (index + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(index => (results.length ? (index - 1 + results.length) % results.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const doc = results[active]
      if (doc) go(doc)
    } else if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showPanel = open && query.trim().length > 0

  return (
    <div ref={rootRef} className="relative mx-auto mt-9 w-full max-w-xl">
      {/* The field row may be animated, but the results panel is a sibling of
          it rather than a child — an animated ancestor would create a
          stacking context and paint the panel behind later content. */}
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-surface p-2 shadow-sm transition-all duration-200 ${fieldClassName} ${
          showPanel ? 'border-primary/50 shadow-lg shadow-primary/5' : 'border-border'
        }`}
        style={animationDelay ? { animationDelay } : undefined}
      >
        <Search className="ml-2 h-5 w-5 shrink-0 text-foreground-subtle" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={event => {
            setActivated(true)
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setActivated(true)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={label}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="hero-search-results"
          aria-autocomplete="list"
          aria-activedescendant={showPanel && results[active] ? `hero-search-${active}` : undefined}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
          data-testid="hero-search-input"
        />
        {docs === null ? (
          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-foreground-subtle" aria-hidden="true" />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label={dict.search?.close || 'Clear search'}
              className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )
        )}
      </div>

      {showPanel && (
        <div
          id="hero-search-results"
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-[55] mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl animate-slide-down"
        >
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-foreground-muted">
              {docs === null
                ? dict.search?.loading || 'Loading search index…'
                : dict.search?.empty?.replace('{query}', query) || 'No results'}
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto p-1.5">
              {results.map((doc, index) => {
                const Icon = TYPE_ICON[doc.type]
                const context = resultContext(doc)
                const chips = resultChips(doc)
                return (
                  <li key={doc.id}>
                    <button
                      id={`hero-search-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(doc)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ${
                        index === active ? 'bg-primary-soft' : 'hover:bg-surface-sunken'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          index === active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-surface-sunken text-foreground-muted'
                        }`}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {doc.title}
                        </span>
                        {context && (
                          <span className="block truncate text-xs text-section-courses">
                            {context}
                          </span>
                        )}
                        {doc.description && (
                          <span className="block truncate text-xs text-foreground-muted">
                            {doc.description}
                          </span>
                        )}
                        {chips.length > 0 && (
                          <span className="mt-1.5 flex flex-wrap items-center gap-1">
                            {chips.map(chip => (
                              <span
                                key={chip.label}
                                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  chip.tone === 'success'
                                    ? 'bg-success-soft text-success-foreground'
                                    : chip.tone === 'warning'
                                      ? 'bg-warning-soft text-warning-foreground'
                                      : chip.tone === 'danger'
                                        ? 'bg-danger-soft text-danger-foreground'
                                        : 'bg-surface-sunken text-foreground-muted'
                                }`}
                              >
                                {chip.label}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                      {index === active && (
                        <CornerDownLeft className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
