'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Code, Clock, Brain, BookOpen, CalendarCheck, type LucideIcon } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import type { ToolMetadata } from '@/lib/tools/get-tool-content'

const iconMap: Record<string, LucideIcon> = {
  code: Code,
  clock: Clock,
  brain: Brain,
  'book-open': BookOpen,
  'calendar-check': CalendarCheck,
}

const iconBgMap: Record<string, string> = {
  'Productivity': 'bg-green-500',
  'Study & Learning': 'bg-blue-500',
  'Artificial Intelligence': 'bg-purple-500',
  'Mathematics': 'bg-orange-500',
  'Coding & Programming': 'bg-indigo-500',
  'Logic & Puzzles': 'bg-pink-500',
  'Physics': 'bg-teal-500',
  'Collaboration & Teamwork': 'bg-cyan-500',
  'Business Strategy': 'bg-yellow-600',
  'uncategorized': 'bg-gray-500',
}

function getIcon(icon?: string): LucideIcon {
  if (icon && iconMap[icon]) return iconMap[icon]
  return Code
}

function getIconBg(category: string): string {
  return iconBgMap[category] || iconBgMap['uncategorized']
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

interface ToolsProps {
  lang: Locale
  dict: Dictionary
  tools: ToolMetadata[]
}

export default function Tools({ lang, dict, tools }: ToolsProps) {
  const displayTools = tools.slice(0, 8)

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container-custom">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Learning{' '}
            <span className="text-gradient">Tools</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {dict.tools?.subtitle || 'Access professional-grade tools right in your browser. No downloads, no setup required.'}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {displayTools.map((tool) => {
            const Icon = getIcon(tool.icon)

            return (
              <motion.div
                key={tool.slug}
                variants={cardVariants}
              >
                <Link
                  href={`/${lang}/tools/${tool.slug}`}
                  className="group block bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 card-hover h-full"
                >
                  <div className={`w-12 h-12 rounded-xl ${getIconBg(tool.category)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {tool.description}
                  </p>

                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
                    <span>{dict.tools?.try_tool || 'Try it now'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href={`/${lang}/tools`}
            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            <span>{dict.tools?.title ? `View all ${dict.tools?.total_tools || 'tools'}` : 'View all tools'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
