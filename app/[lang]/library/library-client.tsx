'use client'

import { useMemo, useState } from 'react'
import { Library, Tag, TrendingUp } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type LibraryResource } from '@/lib/library/types'
import {
  applyLibraryFilters,
  buildLibraryFilterOptions,
  EMPTY_LIBRARY_FILTERS,
  sortLibraryResources,
  type LibraryFilters,
  type LibrarySort,
} from '@/lib/library/filters'
import { searchLibraryResources } from '@/lib/library/search'
import { LibraryCard } from '@/components/library/library-card'
import { LibraryFilters as FilterBar } from '@/components/library/library-filters'

interface LibraryClientProps {
  lang: Locale
  resources: LibraryResource[]
  dict: any
}

export function LibraryClient({ resources, dict }: LibraryClientProps) {
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_LIBRARY_FILTERS)
  const [sortBy, setSortBy] = useState<LibrarySort>('newest')

  const options = useMemo(() => buildLibraryFilterOptions(resources), [resources])
  const filteredResources = useMemo(() => {
    const filtered = applyLibraryFilters(resources, filters)
    return sortLibraryResources(searchLibraryResources(filtered, filters.query), sortBy)
  }, [resources, filters, sortBy])

  const stats = useMemo(
    () => ({
      total: resources.length,
      categories: options.categories.length,
      authors: new Set(resources.map((resource) => resource.author)).size,
    }),
    [resources, options.categories.length]
  )

  const updateFilters = (next: Partial<LibraryFilters>) =>
    setFilters((current) => ({ ...current, ...next }))
  const clearFilters = () => {
    setFilters(EMPTY_LIBRARY_FILTERS)
    setSortBy('newest')
  }

  return (
    <div className="container-custom py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-section-library shadow-lg shadow-black/10">
            <Library className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-4xl font-bold">{dict.library?.title || 'Learning Library'}</h1>
          <p className="text-lg text-muted-foreground">
            {dict.library?.subtitle || 'Curated collection of educational resources from across the web'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Library className="h-4 w-4" aria-hidden="true" />
              {stats.total} {dict.library?.stats?.resources || 'resources'}
            </span>
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4" aria-hidden="true" />
              {stats.categories} {dict.library?.stats?.categories || 'categories'}
            </span>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {stats.authors} {dict.library?.stats?.authors || 'contributors'}
            </span>
          </div>
        </div>

        <FilterBar
          filters={filters}
          options={options}
          sortBy={sortBy}
          onChange={updateFilters}
          onClear={clearFilters}
          onSort={setSortBy}
          dict={dict}
        />

        <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
          {(dict.library?.showing ?? 'Showing {shown} of {total} resources')
            .replace('{shown}', String(filteredResources.length))
            .replace('{total}', String(resources.length))}
        </p>

        {filteredResources.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Library className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              {dict.library?.no_results || 'No resources found'}
            </h2>
            <p className="mb-4 text-muted-foreground">
              {dict.library?.try_different_filters || 'Try adjusting your filters'}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg bg-primary px-6 py-2 text-primary-foreground transition-opacity hover:opacity-90"
            >
              {dict.library?.clear_filters || 'Clear filters'}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <LibraryCard key={`${resource.type}-${resource.id}`} resource={resource} dict={dict} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
