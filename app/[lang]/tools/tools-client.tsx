// app/[lang]/tools/tools-client.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Wrench,
  Sparkles,
  Brain,
  Calculator,
  Code,
  Atom,
  Puzzle,
  Users,
  Briefcase,
  Clock,
  Grid3x3
} from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'

interface Tool {
  slug: string
  title: string
  description: string
  category: string
  icon?: string
}

interface ToolsClientProps {
  lang: Locale
  tools: Tool[]
  dict: any
}

const categoryIcons: Record<string, any> = {
  'artificial_intelligence': Brain,
  'mathematics': Calculator,
  'coding': Code,
  'physics': Atom,
  'logic': Puzzle,
  'uncategorized': Wrench,
  'collaboration': Users,
  'business_strategy': Briefcase,
  'productivity': Clock,
}

const categoryColors: Record<string, string> = {
  'artificial_intelligence': 'from-purple-600 to-pink-600',
  'mathematics': 'from-blue-600 to-cyan-600',
  'coding': 'from-green-600 to-emerald-600',
  'physics': 'from-orange-600 to-red-600',
  'logic': 'from-indigo-600 to-purple-600',
  'uncategorized': 'from-gray-500 to-gray-700',
  'collaboration': 'from-yellow-500 to-amber-600',
  'business_strategy': 'from-teal-600 to-emerald-700',
  'productivity': 'from-rose-500 to-red-600',
}

export function ToolsClient({ lang, tools, dict }: ToolsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    
    return tools.filter((tool) => {
      return !query || 
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
    })
  }, [tools, searchQuery])

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, Tool[]> = {}
    
    for (const tool of filteredTools) {
      const categoryKey = tool.category?.toLowerCase().replace(/\s+/g, '_') ?? 'uncategorized'
      const categoryLabel = dict.tools?.categories?.[categoryKey] ?? tool.category ?? 'Uncategorized'
      
      if (!grouped[categoryLabel]) {
        grouped[categoryLabel] = []
      }
      grouped[categoryLabel].push(tool)
    }
    
    return grouped
  }, [filteredTools, dict])

  const getCategoryIcon = (categoryKey: string) => {
    const key = categoryKey.toLowerCase().replace(/\s+/g, '_')
    return categoryIcons[key] || Wrench
  }

  const getCategoryColor = (categoryKey: string) => {
    const key = categoryKey.toLowerCase().replace(/\s+/g, '_')
    return categoryColors[key] || 'from-gray-600 to-gray-800'
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {dict.tools?.title || 'Tools'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {dict.tools?.subtitle || 'Powerful tools to enhance your learning'}
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span>{tools.length} {dict.tools?.total_tools || 'tools'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{Object.keys(groupedByCategory).length} {dict.tools?.categories_count || 'categories'}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-card border rounded-2xl p-6 mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={dict.tools?.search_placeholder || 'Search tools...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery
                ? dict.tools?.no_results || 'No tools found'
                : dict.tools?.no_tools || 'No tools available yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? dict.tools?.try_different_search || 'Try a different search term'
                : dict.tools?.check_back_soon || 'Check back soon for new tools'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {dict.tools?.clear_search || 'Clear Search'}
              </button>
            )}
          </div>
        )}

        {/* Grouped Tools */}
        <div className="space-y-12">
          {Object.entries(groupedByCategory).map(([category, categoryTools]) => {
            const IconComponent = getCategoryIcon(category)
            const colorClass = getCategoryColor(category)

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">{category}</h2>
                    <p className="text-sm text-muted-foreground">
                      {categoryTools.length} {categoryTools.length === 1 ? 'tool' : 'tools'}
                    </p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTools.map((tool) => {
                    const IconComponent = getCategoryIcon(category)
                    const colorClass = getCategoryColor(category)

                    return (
                      <Link
                        key={tool.slug}
                        href={`/${lang}/tools/${tool.slug}`}
                        className="group block bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                          </div>

                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {tool.title}
                          </h3>

                          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                            {tool.description}
                          </p>
                        </div>

                        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-end">
                          <span className="text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                            {dict.tools?.try_tool || 'Try Tool →'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}