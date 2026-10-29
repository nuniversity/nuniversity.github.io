'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from '@/components/navigation/AppLink'
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type {
  GrammarPoint,
  LanguageCourseMeta,
  LanguageLesson,
  Step,
  UnitManifest,
  VocabItem,
} from '@/lib/language-courses/types'
import { coursePairKey } from '@/lib/language-courses/types'
import {
  LESSON_PASS_PERCENT,
  saveLessonResult,
} from '@/lib/language-courses/storage'
import {
  dueVocabCards,
  scheduleVocab,
} from '@/lib/language-courses/schedule'
import { recordPracticeAnswer } from '@/lib/practice/record'
import { reviewCard } from '@/lib/practice/fsrs'
import { saveReviewCard } from '@/lib/practice/cards'
import type { ReviewCardState } from '@/lib/practice/types'
import { recordAndEmit } from '@/lib/gamification/bus'
import { speak, toSpeechLang } from '@/lib/speech/speech'
import { tpl } from '@/lib/languages/format'
import { StepKnowledge, StepInput, StepTip, StepVocab } from './steps-content'
import { StepFillBlank, StepGrammar, StepListen, StepQuiz, StepSelect } from './steps-choice'
import { StepBuild, StepDictation, StepSpeak } from './steps-production'
import { StepMatch, StepPairs, StepReview } from './steps-interactive'
import { pickText } from './step-ui'
import { SpeechSetupNote } from './speech-setup-note'
import { StepReplayView } from './step-replay'

interface LessonPlayerProps {
  lang: Locale
  course: LanguageCourseMeta
  unit: UnitManifest
  lesson: LanguageLesson
  /** Full course vocab bank: review steps may recall words from other lessons. */
  vocab: VocabItem[]
  grammar: GrammarPoint[]
  /** Pre-computed next lesson/course URL for the finish screen. */
  nextHref: string
  dict: any
}

interface StepScore {
  correct: number
  total: number
}

type Phase = 'playing' | 'replay' | 'done'

const SKILL_LABEL_KEYS: Record<string, string> = {
  listening: 'listening',
  reading: 'reading',
  writing: 'writing',
  speaking: 'speaking',
  grammar: 'grammar',
  vocabulary: 'vocabulary_skill',
}

export function LessonPlayer({
  lang,
  course,
  unit,
  lesson,
  vocab,
  grammar,
  nextHref,
  dict,
}: LessonPlayerProps) {
  const t = dict?.languageCourse ?? {}
  const [phase, setPhase] = useState<Phase>('playing')
  const [index, setIndex] = useState(0)
  const [maxIndex, setMaxIndex] = useState(0)
  const [scores, setScores] = useState<Record<string, StepScore>>({})
  const [replayQueue, setReplayQueue] = useState<number[]>([])
  const [replayCursor, setReplayCursor] = useState(0)
  const finishedRef = useRef(false)

  const vocabById = useMemo(() => {
    const map = new Map<string, VocabItem>()
    for (const item of vocab) map.set(item.id, item)
    return map
  }, [vocab])

  const grammarById = useMemo(() => {
    const map = new Map<string, GrammarPoint>()
    for (const point of grammar) map.set(point.id, point)
    return map
  }, [grammar])

  const pair = coursePairKey(course)

  // Due cards are resolved synchronously when the step becomes active, so the
  // same session never re-serves a card the learner just graded.
  const step = lesson.steps[Math.min(index, lesson.steps.length - 1)]
  const reviewItems = useMemo(
    () => (step?.type === 'review' ? dueVocabCards(pair, new Date()) : []),
    [step, pair]
  )

  // A review step with nothing due disappears; skip it automatically instead
  // of rendering a dead end. (Placed after `advance` is declared: see below.)

  // Ref mirror of scores: the finish transition (same batch as the last
  // step's onResult) needs the fresh totals that state cannot provide yet.
  const scoresRef = useRef<Record<string, StepScore>>({})
  const finalPercentRef = useRef<number | null>(null)

  const onResult = useCallback(
    (stepId: string, correct: boolean) => {
      const current = scoresRef.current
      const existing = current[stepId] ?? { correct: 0, total: 0 }
      const next: Record<string, StepScore> = {
        ...current,
        [stepId]: {
          correct: existing.correct + (correct ? 1 : 0),
          total: existing.total + 1,
        },
      }
      scoresRef.current = next
      setScores(next)
    },
    []
  )

  const advance = useCallback(() => {
    setIndex((current) => current + 1)
  }, [])

  /**
   * Second-chance replay (research: within-session repeated retrieval with
   * immediate corrective feedback, SSLA 2017 + 2022). Missed graded steps are
   * served once more at the end of the lesson; retries record into the
   * mastery store but do not inflate the lesson percent (snapshotted here).
   */
  const finishOrReplay = useCallback(() => {
    const missed = lesson.steps
      .map((s, i) => (scoresRef.current[s.id] && scoresRef.current[s.id].correct < scoresRef.current[s.id].total ? i : -1))
      .filter((i) => i >= 0)
    let correct = 0
    let total = 0
    for (const score of Object.values(scoresRef.current)) {
      correct += score.correct
      total += score.total
    }
    finalPercentRef.current = total > 0 ? Math.round((correct / total) * 100) : 100
    if (missed.length > 0) {
      setReplayQueue(missed)
      setReplayCursor(0)
      setPhase('replay')
    } else {
      setPhase('done')
    }
  }, [lesson.steps])

  // A review step with nothing due disappears; skip it automatically instead
  // of rendering a dead end. Revisited steps (index < maxIndex) render the
  // replay card instead of skipping, so back-navigation never bounces.
  // Reaching past the end routes into finishOrReplay (second-chance pass).
  useEffect(() => {
    if (phase !== 'playing') return
    if (index >= lesson.steps.length) {
      finishOrReplay()
      return
    }
    if (step?.type === 'review' && reviewItems.length === 0 && index >= maxIndex) {
      advance()
    }
  }, [phase, step, reviewItems.length, advance, index, maxIndex, lesson.steps.length, finishOrReplay])

  // Furthest step reached: forward navigation may only re-enter visited steps.
  useEffect(() => {
    setMaxIndex((current) => Math.max(current, index))
  }, [index])

  // Lesson complete: persist progress, schedule vocab into FSRS, award XP.
  // Fires on either completion path (final step done, or a review step
  // auto-skipped past the end) exactly once; `scores` is read from the same
  // render that flipped the trigger, so the last step's answer is included.
  useEffect(() => {
    if (finishedRef.current) return
    if (phase !== 'done' && index < lesson.steps.length) return
    finishedRef.current = true

    let correct = 0
    let total = 0
    for (const score of Object.values(scores)) {
      correct += score.correct
      total += score.total
    }
    const percent = finalPercentRef.current ?? (total > 0 ? Math.round((correct / total) * 100) : 100)
    const passed = percent >= LESSON_PASS_PERCENT

    const { progress } = saveLessonResult(course.id, unit.slug, lesson.slug, percent)

    for (const vocabId of lesson.vocabIds) {
      scheduleVocab(pair, vocabId, course.id, passed, new Date())
    }

    recordAndEmit({
      type: 'language-lesson-complete',
      courseSlug: course.id,
      unitSlug: unit.slug,
      lessonSlug: lesson.slug,
      percent,
    })

    // Every lesson of every unit complete → course-complete XP (once).
    const totalLessons = course.units.reduce(
      (sum, candidate) => sum + candidate.lessons.length,
      0
    )
    let completedLessons = 0
    for (const unitProgress of Object.values(progress.units)) {
      completedLessons += Object.keys(unitProgress.lessons).length
    }
    if (totalLessons > 0 && completedLessons >= totalLessons) {
      recordAndEmit({ type: 'language-course-complete', courseSlug: course.id })
    }
  }, [phase, index, lesson.steps.length, scores, course.id, course.units, unit.slug, lesson.slug, lesson.vocabIds, pair])

  const totalTrials = Object.values(scores).reduce((sum, score) => sum + score.total, 0)
  const totalCorrect = Object.values(scores).reduce((sum, score) => sum + score.correct, 0)
  const percent = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 100
  const skills = useMemo(() => {
    const unique = new Set<string>()
    for (const lessonStep of lesson.steps) if (lessonStep.skill) unique.add(lessonStep.skill)
    return Array.from(unique)
  }, [lesson.steps])

  if (phase === 'done') {
    return (
      <FinishScreen
        lang={lang}
        course={course}
        lesson={lesson}
        t={t}
        percent={percent}
        skills={skills}
        nextHref={nextHref}
      />
    )
  }

  // Transient frame while the finish transition decides between the
  // second-chance replay and the finish screen (resolved in an effect).
  if (phase === 'playing' && index >= lesson.steps.length) {
    return <div className="mx-auto max-w-2xl px-4 py-8" data-testid="lesson-player" />
  }

  const replaying = phase === 'replay'
  const replayStep = replaying ? lesson.steps[replayQueue[replayCursor]] : null
  const renderStep = replaying && replayStep ? replayStep : step

  const handleStepComplete = () => {
    if (replaying && replayStep) {
      // The retry is recorded in the mastery store; the lesson percent was
      // already snapshotted when the replay started.
      recordPracticeAnswer(course.id, lesson.slug, {
        key: `${course.id}::${lesson.slug}::${replayStep.id}`,
        label: pickText(lesson.title, lang),
        skill: replayStep.skill ?? null,
        correct: (scoresRef.current[replayStep.id]?.correct ?? 0) > 0,
      })
      if (replayCursor + 1 < replayQueue.length) {
        setReplayCursor((current) => current + 1)
      } else {
        setPhase('done')
      }
      return
    }
    if (!isRevisit) {
      recordPracticeAnswer(course.id, lesson.slug, {
        key: `${course.id}::${lesson.slug}::${step.id}`,
        label: pickText(lesson.title, lang),
        skill: step.skill ?? null,
        correct: (scoresRef.current[step.id]?.correct ?? 0) > 0,
      })
    }
    if (index + 1 >= lesson.steps.length) {
      finishOrReplay()
    } else {
      advance()
    }
  }

  const isRevisit = index < maxIndex
  const canBack = phase === 'playing' && index > 0
  const canForward = phase === 'playing' && index < maxIndex
  const progress = phase === 'playing' ? Math.round((maxIndex / lesson.steps.length) * 100) : 100

  return (
    <div className="mx-auto max-w-2xl px-4 py-8" data-testid="lesson-player">
      <SpeechSetupNote languages={[course.source, course.target]} dict={dict} uiLang={lang} />
      <header className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link
            href={`/${lang}/languages/courses/${course.id}/`}
            aria-label={t.back_to_course || 'Back to course'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{pickText(lesson.title, lang)}</p>
            <p className="truncate text-xs text-muted-foreground">{pickText(unit.title, lang)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              disabled={!canBack}
              data-testid="step-back"
              aria-label={t.back || 'Back'}
              title={t.back || 'Back'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setIndex(index + 1)}
              disabled={!canForward}
              data-testid="step-forward"
              aria-label={t.forward || 'Forward'}
              title={t.forward || 'Forward'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              →
            </button>
          </div>
          <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
            {tpl(t.steps_left || '{n} steps left', { n: lesson.steps.length - maxIndex })}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" data-testid="lesson-progress-bar">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t[SKILL_LABEL_KEYS[skill] ?? skill] || skill}
            </span>
          ))}
        </div>
      </header>

      {replaying && (
        <div
          className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/30"
          data-testid="replay-banner"
        >
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            🔁 {t.replay_title || 'Fix the mistakes'}
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300/80">
            {t.replay_hint || 'One more try at what you missed. It will not change your score.'}
          </p>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {replayCursor + 1} / {replayQueue.length}
          </p>
        </div>
      )}

      <LessonStepView
        key={replaying ? `replay-${replayCursor}-${renderStep.id}` : renderStep.id}
        step={renderStep}
        lang={lang}
        source={course.source}
        target={course.target}
        t={t}
        vocabById={vocabById}
        grammarById={grammarById}
        reviewItems={reviewItems}
        revisit={isRevisit && !replaying}
        onResult={(correct) => {
          // Revisited steps never record: the score was already taken.
          if (!isRevisit) onResult(renderStep.id, correct)
        }}
        onReviewGrade={(card, knewIt) => {
          // Re-graded revisit cards would double-review in FSRS.
          if (!isRevisit) {
            const { next } = reviewCard(card, knewIt)
            saveReviewCard(next)
          }
        }}
        onComplete={handleStepComplete}
      />
    </div>
  )
}

function LessonStepView(props: {
  step: Step
  lang: string
  source: string
  target: string
  t: any
  vocabById: Map<string, VocabItem>
  grammarById: Map<string, GrammarPoint>
  reviewItems: ReviewCardState[]
  revisit: boolean
  onResult: (correct: boolean) => void
  onReviewGrade: (card: ReviewCardState, knewIt: boolean) => void
  onComplete: () => void
}) {
  const { step, revisit } = props

  // Graded steps already answered switch to the read-only replay view so the
  // score stays honest. Content steps (knowledge, input, tip, vocab) stay
  // interactive: they carry no score. Speak is self-checked, so its replay is
  // the interactive one too (listening again never corrupts anything).
  if (revisit) {
    switch (step.type) {
      case 'knowledge':
      case 'input':
      case 'tip':
      case 'vocab':
      case 'speak':
        break
      default:
        return (
          <StepReplayView
            step={step}
            lang={props.lang}
            source={props.source}
            target={props.target}
            t={props.t}
            onForward={props.onComplete}
          />
        )
    }
  }

  switch (step.type) {
    case 'knowledge':
      return <StepKnowledge {...props} step={step} />
    case 'input':
      return <StepInput {...props} step={step} />
    case 'vocab':
      return <StepVocab {...props} step={step} />
    case 'tip':
      return <StepTip {...props} step={step} />
    case 'select':
      return <StepSelect {...props} step={step} />
    case 'match':
      return <StepMatch {...props} step={step} />
    case 'listen':
      return <StepListen {...props} step={step} />
    case 'dictation':
      return <StepDictation {...props} step={step} />
    case 'build':
      return <StepBuild {...props} step={step} />
    case 'fillblank':
      return <StepFillBlank {...props} step={step} />
    case 'grammar':
      return <StepGrammar {...props} step={step} />
    case 'pairs':
      return <StepPairs {...props} step={step} />
    case 'speak':
      return <StepSpeak {...props} step={step} />
    case 'review':
      return <StepReview {...props} step={step} />
    case 'quiz':
      return <StepQuiz {...props} step={step} />
    default:
      return null
  }
}

function FinishScreen({
  lang,
  course,
  lesson,
  t,
  percent,
  skills,
  nextHref,
}: {
  lang: string
  course: LanguageCourseMeta
  lesson: LanguageLesson
  t: any
  percent: number
  skills: string[]
  nextHref: string
}) {
  const celebrated = useRef(false)
  useEffect(() => {
    if (celebrated.current) return
    celebrated.current = true
    // A spoken cheer closes the loop: output practice ends with input.
    speak(pickText(lesson.title, lang), { lang: toSpeechLang(course.target) })
  }, [course.target, lang, lesson.title])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center" data-testid="lesson-finish">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
        <Trophy className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold">
        {percent === 100 ? t.perfect || 'Perfect!' : t.lesson_complete || 'Lesson complete'}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {t.your_score || 'Your score'}: <span className="font-bold tabular-nums">{percent}%</span>
      </p>
      {skills.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t.skills_trained || 'Skills'}: {skills.join(' · ')}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={`/${lang}/languages/courses/${course.id}/`}
          className="rounded-lg border px-5 py-2.5 font-medium hover:bg-accent"
        >
          {t.back_to_course || 'Back to course'}
        </Link>
        <Link
          href={nextHref}
          data-testid="next-lesson"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t.next_lesson || 'Next lesson'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
