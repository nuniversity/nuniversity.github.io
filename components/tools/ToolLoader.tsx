'use client'

import dynamicImport from 'next/dynamic'
import type { ComponentType } from 'react'
import { type Locale } from '@/lib/i18n/config'

/**
 * Client boundary for the tool implementations.
 *
 * `next/dynamic` with `ssr: false` is not allowed in a Server Component
 * (enforced by Next 15, warned by 14), so the loader owns the dynamic map and
 * the page stays a plain Server Component.
 */
const toolComponents: Record<string, ComponentType<any>> = {
  'llm-prompt-builder': dynamicImport(() => import('@/components/tools/LLMPromptBuilder'), { ssr: false }),
  'brain-writing-session': dynamicImport(() => import('@/components/tools/BrainWritingSession'), { ssr: false }),
  'swot-matrix': dynamicImport(() => import('@/components/tools/SWOTMatrix'), { ssr: false }),
  'eisenhower-matrix': dynamicImport(() => import('@/components/tools/EisenhowerMatrix'), { ssr: false }),
  'pomodoro-timer': dynamicImport(() => import('@/components/tools/PomodoroTimer'), { ssr: false }),
  'unit-converter': dynamicImport(() => import('@/components/tools/UnitConverter'), { ssr: false }),
  'decision-matrix': dynamicImport(() => import('@/components/tools/DecisionMatrix'), { ssr: false }),
  'flashcard-maker': dynamicImport(() => import('@/components/tools/FlashcardMaker'), { ssr: false }),
  'regex-tester': dynamicImport(() => import('@/components/tools/RegexTester'), { ssr: false }),
  'habit-tracker': dynamicImport(() => import('@/components/tools/HabitTracker'), { ssr: false }),
}

interface ToolLoaderProps {
  slug: string
  lang: Locale
  dict: any
}

export default function ToolLoader({ slug, lang, dict }: ToolLoaderProps) {
  const Component = toolComponents[slug]
  if (!Component) return null
  return <Component lang={lang} dict={dict} />
}
