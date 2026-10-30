'use client'

import { Search, X, Filter, SlidersHorizontal } from 'lucide-react'
import type { DifficultyLevel, ResourceType } from '@/lib/library/types'
import type { LibraryFilterOptions, LibraryFilters, LibrarySort } from '@/lib/library/filters'
import { TYPE_ICON } from './resource-style'

interface LibraryFiltersProps {
  filters: LibraryFilters
  options: LibraryFilterOptions
  sortBy: LibrarySort
  onChange: (next: Partial<LibraryFilters>) => void
  onClear: () => void
  onSort: (sort: LibrarySort) => void
  dict: any
}

export function LibraryFilters({
  filters,
  options,
  sortBy,
  onChange,
  onClear,
  onSort,
  dict,
}: LibraryFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.query.trim()) ||
    Boolean(filters.types.length) ||
    Boolean(filters.categories.length) ||
    Boolean(filters.difficulties.length) ||
    Boolean(filters.platform) ||
    Boolean(filters.language) ||
    filters.freeOnly ||
    filters.withAnalysisOnly

  return (
    <div className="mb-8 space-y-4 rounded-2xl border bg-card p-6">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={dict.library?.search_placeholder || 'Search resources, authors, platforms...'}
          aria-label={dict.library?.search_placeholder || 'Search library'}
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={dict.library?.filter_by || 'Filter by'}>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" aria-hidden="true" />
          {dict.library?.filter_by || 'Filter by'}
        </span>
        {options.types.map((type) => {
          const Icon = TYPE_ICON[type]
          const selected = filters.types.includes(type)
          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange({
                  types: selected ? filters.types.filter((value) => value !== type) : [...filters.types, type],
                })
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {dict.library?.resource_types?.[type] || type}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-muted-foreground">
          {dict.library?.labels?.category || 'Category'}
          <select
            value={filters.categories[0] ?? ''}
            onChange={(event) => onChange({ categories: event.target.value ? [event.target.value] : [] })}
            className="mt-1 block rounded-lg border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">{dict.library?.all_categories || 'All Categories'}</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-muted-foreground">
          {dict.library?.labels?.platform || 'Platform'}
          <select
            value={filters.platform}
            onChange={(event) => onChange({ platform: event.target.value })}
            className="mt-1 block rounded-lg border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">{dict.library?.all_platforms || 'All Platforms'}</option>
            {options.platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-muted-foreground">
          {dict.library?.labels?.language || 'Language'}
          <select
            value={filters.language}
            onChange={(event) => onChange({ language: event.target.value })}
            className="mt-1 block rounded-lg border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">{dict.library?.all_languages || 'All Languages'}</option>
            {options.languages.map((language) => (
              <option key={language} value={language}>
                {language.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-muted-foreground">
          {dict.library?.labels?.difficulty || 'Difficulty'}
          <select
            value={filters.difficulties[0] ?? ''}
            onChange={(event) =>
              onChange({
                difficulties: event.target.value ? [event.target.value as DifficultyLevel] : [],
              })
            }
            className="mt-1 block rounded-lg border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">{dict.library?.all_levels || 'All Levels'}</option>
            {options.difficulties.map((level) => (
              <option key={level} value={level}>
                {dict.library?.difficulty?.[level] || level}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          aria-pressed={filters.freeOnly}
          onClick={() => onChange({ freeOnly: !filters.freeOnly })}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            filters.freeOnly ? 'bg-green-600 text-white' : 'bg-muted hover:bg-muted/80'
          }`}
        >
          {dict.library?.free_only || 'Free only'}
        </button>

        <button
          type="button"
          aria-pressed={filters.withAnalysisOnly}
          onClick={() => onChange({ withAnalysisOnly: !filters.withAnalysisOnly })}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            filters.withAnalysisOnly ? 'bg-section-library text-white' : 'bg-muted hover:bg-muted/80'
          }`}
        >
          {dict.library?.with_analysis || 'With study notes'}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            {dict.library?.clear_filters || 'Clear filters'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {dict.library?.sort_by || 'Sort by'}
          <select
            value={sortBy}
            onChange={(event) => onSort(event.target.value as LibrarySort)}
            className="rounded-lg border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="newest">{dict.library?.sort_options?.newest || 'Newest'}</option>
            <option value="oldest">{dict.library?.sort_options?.oldest || 'Oldest'}</option>
            <option value="title_asc">{dict.library?.sort_options?.title_asc || 'A-Z'}</option>
            <option value="title_desc">{dict.library?.sort_options?.title_desc || 'Z-A'}</option>
            <option value="rating">{dict.library?.sort_options?.rating || 'Rating'}</option>
          </select>
        </label>
      </div>
    </div>
  )
}
