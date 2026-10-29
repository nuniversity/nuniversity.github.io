'use client'

import { useMemo, useState } from 'react'
import Link from '@/components/navigation/AppLink'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { CefrLevel, LocalizedText, SkillArea } from '@/lib/language-courses/types'
import { tpl } from '@/lib/languages/format'

export interface PracticeLesson {
  unit: string
  unitTitle: LocalizedText
  cefr: CefrLevel
  lesson: string
  title: LocalizedText
  goal: LocalizedText
  skills: SkillArea[]
}

interface PracticeChooserProps {
  lang: Locale
  courseId: string
  lessons: PracticeLesson[]
  dict: any
}

const SKILL_ORDER: SkillArea[] = [
  'reading',
  'listening',
  'writing',
  'speaking',
  'vocabulary',
  'grammar',
]

const LEVEL_ORDER: CefrLevel[] = ['A1', 'A2', 'B1']

const SKILL_CLASSES: Record<SkillArea, string> = {
  reading: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  listening: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  writing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  speaking: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  vocabulary: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  grammar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
}

/**
 * Subject/level/skill chooser for a language course.
 *
 * The course stays a linear path, but learners who want to revise one theme
 * (a unit), one CEFR level, or one skill can jump straight to a lesson that
 * trains it. The index is built at export time from the lesson steps, so a new
 * lesson or a new skill appears here without UI changes.
 */
export function PracticeChooser({ lang, courseId, lessons, dict }: PracticeChooserProps) {
  const t = dict?.languageCourse ?? {}
  const labels: Record<SkillArea, string> = {
    reading: t.reading || 'Reading',
    listening: t.listening || 'Listening',
    writing: t.writing || 'Writing',
    speaking: t.speaking || 'Speaking',
    vocabulary: t.vocabulary_skill || 'Vocabulary',
    grammar: t.grammar || 'Grammar',
  }

  const [level, setLevel] = useState<'all' | CefrLevel>('all')
  const [unit, setUnit] = useState<'all' | string>('all')
  const [skill, setSkill] = useState<'all' | SkillArea>('all')

  const levels = useMemo(
    () => LEVEL_ORDER.filter((value) => lessons.some((lesson) => lesson.cefr === value)),
    [lessons]
  )
  const subjects = useMemo(() => {
    const seen = new Map<string, LocalizedText>()
    for (const lesson of lessons) seen.set(lesson.unit, lesson.unitTitle)
    return Array.from(seen.entries())
  }, [lessons])
  const skills = useMemo(
    () => SKILL_ORDER.filter((value) => lessons.some((lesson) => lesson.skills.includes(value))),
    [lessons]
  )

  const filtered = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          (level === 'all' || lesson.cefr === level) &&
          (unit === 'all' || lesson.unit === unit) &&
          (skill === 'all' || lesson.skills.includes(skill))
      ),
    [lessons, level, unit, skill]
  )

  const localized = (value: LocalizedText) => value[lang] || value.en

  return (
    <section
      className="mb-8 rounded-2xl border bg-card p-5"
      data-testid="language-practice-chooser"
      aria-labelledby="language-practice-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="language-practice-title" className="flex items-center gap-2 text-lg font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.practice_title || 'Practice by level and subject'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.practice_hint ||
              'Pick a level, a subject and a skill to find a matching exercise.'}
          </p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {tpl(t.practice_count || '{n} exercises', { n: filtered.length })}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-foreground-muted">
          {t.cefr || 'Level'}
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as 'all' | CefrLevel)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="all">{t.all_levels || 'All levels'}</option>
            {levels.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-foreground-muted">
          {t.subject || 'Subject'}
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="all">{t.all_subjects || 'All subjects'}</option>
            {subjects.map(([slug, title]) => (
              <option key={slug} value={slug}>
                {localized(title)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-foreground-muted">
          {t.skill || 'Skill'}
          <select
            value={skill}
            onChange={(event) => setSkill(event.target.value as 'all' | SkillArea)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="all">{t.all_skills || 'All skills'}</option>
            {skills.map((value) => (
              <option key={value} value={value}>
                {labels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((lesson) => (
          <li key={`${lesson.unit}/${lesson.lesson}`}>
            <Link
              href={`/${lang}/languages/courses/${courseId}/${lesson.unit}/${lesson.lesson}/`}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold">
                {lesson.cefr}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{localized(lesson.title)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {localized(lesson.unitTitle)} · {localized(lesson.goal)}
                </span>
              </span>
              <span className="flex flex-wrap gap-1">
                {lesson.skills.map((value) => (
                  <span
                    key={value}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SKILL_CLASSES[value]}`}
                  >
                    {labels[value]}
                  </span>
                ))}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-4 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {t.practice_empty || 'No exercise matches these filters yet.'}
        </p>
      )}
    </section>
  )
}
