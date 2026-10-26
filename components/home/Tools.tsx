'use client'

import Link from 'next/link'
import { ArrowRight, Code, type LucideIcon } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import type { ToolMetadata } from '@/lib/tools/get-tool-content'
import { getToolIcon } from '@/lib/tools/tool-icons'

const iconBgMap: Record<string, string> = {
  'productivity': 'bg-amber-500',
  'study': 'bg-blue-500',
  'artificial_intelligence': 'bg-cyan-500',
  'mathematics': 'bg-orange-500',
  'coding': 'bg-emerald-500',
  'logic': 'bg-rose-400',
  'physics': 'bg-teal-500',
  'collaboration': 'bg-sky-400',
  'business_strategy': 'bg-yellow-500',
  'uncategorized': 'bg-slate-500',
}

function getIcon(icon?: string): LucideIcon {
  return getToolIcon(icon, Code)
}

function getIconBg(category: string): string {
  const key = category?.toLowerCase().replace(/\s+/g, '_') || 'uncategorized'
  return iconBgMap[key] || iconBgMap['uncategorized']
}

interface ToolsProps {
  lang: Locale
  dict: Dictionary
  tools: ToolMetadata[]
}

export default function Tools({ lang, dict, tools }: ToolsProps) {
  const displayTools = tools.slice(0, 8)

  return (
    <section className="section bg-background">
      <div className="container-custom">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {dict.tools?.sectionTitle || 'Powerful Learning'}{' '}
            <span className="text-gradient">{dict.tools?.sectionTitleHighlight || 'Tools'}</span>
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">
            {dict.tools?.subtitle ||
              'Access professional-grade tools right in your browser. No downloads, no setup required.'}
          </p>
        </div>

        <ul className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displayTools.map((tool, index) => {
            const Icon = getIcon(tool.icon)

            return (
              <li key={tool.slug} style={{ '--i': index } as React.CSSProperties}>
                <Link
                  href={`/${lang}/tools/${tool.slug}`}
                  className="card card-hover group flex h-full flex-col p-5"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110 ${getIconBg(tool.category)}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <h3 className="mt-4 text-base font-bold text-foreground">{tool.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground-muted">
                    {tool.description}
                  </p>

                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-section-tools">
                    {dict.tools?.try_tool || 'Try it now'}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-12 text-center">
          <Link href={`/${lang}/tools`} className="btn btn-secondary group">
            <span>{dict.tools?.view_all || 'View All Tools'}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
