'use client'

import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  BookOpen,
  BookOpenCheck,
  Calculator,
  GamepadIcon,
  Award,
  Map as MapIcon,
  Library,
  Languages,
  FileText,
  ExternalLink,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react'
import { searchDocs, groupDocs, type SearchDoc, type SearchDocType } from '@/lib/search/matcher'
import SearchResultMeta from './SearchResultMeta'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface CommandPaletteProps {
  lang: Locale
  dict: Dictionary
  open: boolean
  onOpen: () => void
  onClose: () => void
}

const TYPE_ICON: Record<SearchDocType, typeof BookOpen> = {
  course: BookOpen,
  lesson: FileText,
  quiz: Award,
  tool: Calculator,
  roadmap: MapIcon,
  library: Library,
  analysis: BookOpenCheck,
  game: GamepadIcon,
  language: Languages,
}

export default function CommandPalette({ lang, dict, open, onOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const cacheRef = useRef<Map<string, SearchDoc[]>>(new Map())
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        const target = event.target as HTMLElement | null
        const typing =
          !!target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable === true)
        const inPalette =
          typeof target?.closest === 'function' &&
          !!target.closest('[data-testid="command-palette"]')
        if (typing && !inPalette) return
        event.preventDefault()
        if (open) onClose()
        else onOpen()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpen, onClose])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const cached = cacheRef.current.get(lang)
    if (cached) {
      setDocs(cached)
      return
    }
    let cancelled = false
    setDocs(null)
    fetch(`/search-index/${lang}.json`)
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`${response.status}`))))
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
    }
  }, [open, lang])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Remember what had focus before opening, and give it back on close.
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null
      return
    }
    const previous = restoreFocusRef.current
    restoreFocusRef.current = null
    if (previous && typeof previous.focus === 'function') {
      previous.focus()
    }
  }, [open])

  // Escape closes the dialog from anywhere inside it, and Tab is trapped
  // inside the dialog so keyboard focus cannot wander into the page behind.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const results = useMemo(
    () => (docs && query.trim() ? searchDocs(docs, query, 8) : []),
    [docs, query]
  )
  const groups = useMemo(() => groupDocs(results), [results])
  const flat = useMemo(() => groups.flatMap(group => group.items), [groups])

  useEffect(() => {
    if (!open || flat.length === 0) return
    document.getElementById(`search-result-${active}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [active, flat, open])

  const navigate = (doc: SearchDoc) => {
    onClose()
    if (/^https?:\/\//i.test(doc.url)) {
      window.open(doc.url, '_blank', 'noopener,noreferrer')
    } else {
      router.push(doc.url)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (flat.length > 0) setActive(index => (index + 1) % flat.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (flat.length > 0) setActive(index => (index - 1 + flat.length) % flat.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const doc = flat[active]
      if (doc) navigate(doc)
    }
  }

  const groupLabel = (type: SearchDocType) => {
    switch (type) {
      case 'course':
        return dict.navigation.courses
      case 'lesson':
        return dict.courses.lessons
      case 'quiz':
        return dict.navigation.quizzes
      case 'tool':
        return dict.navigation.tools
      case 'roadmap':
        return dict.navigation.roadmaps
      case 'library':
        return dict.navigation.library
      case 'game':
        return dict.navigation.games
      case 'language':
        return dict.navigation.languages
    }
  }

  if (!open) return <Fragment />

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" data-testid="command-palette">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={dict.search.trigger}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={flat.length > 0 ? `search-result-${active}` : undefined}
            aria-label={dict.search.trigger}
            placeholder={dict.search.placeholder}
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-foreground-subtle"
            data-testid="search-input"
          />
          {query.trim() && docs && (
            <span className="shrink-0 text-xs text-foreground-muted" data-testid="search-count">
              {dict.search.results.replace('{n}', String(flat.length))}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.search.close || 'Close search'}
            title={dict.search.close || 'Close search'}
            data-testid="search-close"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2" id="search-results" role="listbox" aria-label={dict.search.trigger}>
          {!docs && <p className="px-3 py-4 text-sm text-muted-foreground">{dict.search.loading}</p>}
          {docs && query.trim() && flat.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground" data-testid="search-empty">
              {dict.search.empty.replace('{query}', query)}
            </p>
          )}
          {docs && !query.trim() && (
            <div className="px-3 py-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
                {dict.search.hint_navigate}
              </span>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" />
                {dict.search.hint_open}
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-border bg-surface-sunken px-1 font-sans text-[10px]">Esc</kbd>
                {dict.search.hint_close}
              </span>
            </div>
          )}
          {groups.map(group => (
            <div key={group.type} className="mb-1">
              <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {groupLabel(group.type)}
              </p>
              {group.items.map(doc => {
                const index = flat.indexOf(doc)
                const Icon = TYPE_ICON[doc.type]
                const external = /^https?:\/\//i.test(doc.url)
                return (
                  <button
                    key={doc.id}
                    type="button"
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={index === active}
                    data-active={index === active}
                    data-testid="search-result"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => navigate(doc)}
                    className={`w-full flex items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 ${
                      index === active ? 'bg-primary-soft' : 'hover:bg-surface-sunken'
                    }`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {doc.title}
                      </span>
                      {doc.description && (
                        <span className="block truncate text-xs text-foreground-muted">
                          {doc.description}
                        </span>
                      )}
                      <SearchResultMeta doc={doc} />
                    </span>
                    {external && <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
