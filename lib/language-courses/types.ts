/**
 * LanguageCourse content schema.
 *
 * A language course trains listening, reading, writing and speaking through a
 * sequence of interactive steps. The whole course is data: adding a new
 * language pair means adding JSON under `content/language-courses/<course>/`,
 * with zero UI changes.
 *
 * Naming: `source` is the learner's language (L1), `target` is the language
 * being learned (L2). Word pairs are learning material and are never
 * translated; every other user-visible string is a `LocalizedText`.
 */

export interface LocalizedText {
  en: string
  pt: string
  es?: string
}

export type SkillArea = 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary'

export type CefrLevel = 'A1' | 'A2' | 'B1'

// ---------------------------------------------------------------------------
// Vocabulary bank (vocab.json) — the single source of truth for words.
// ---------------------------------------------------------------------------

export interface VocabItem {
  /** Stable per-course id (`w001`...). Never renumbered: FSRS keys use it. */
  id: string
  /** Target-language word or chunk (the thing being learned). */
  source: string
  /** L1 translation. */
  target: string
  pos?: 'noun' | 'verb' | 'adj' | 'adv' | 'phrase' | 'expr' | 'prep' | 'pron' | 'num' | 'other'
  emoji?: string
  /** Target-language example sentence. */
  example?: string
  /** L1 translation of the example. */
  exampleTarget?: string
  /** Memory hook shown on the intro card (keyword method / dual coding). */
  mnemonic?: LocalizedText
  level: CefrLevel
  topics: string[]
}

// ---------------------------------------------------------------------------
// Grammar points (course.json registry) — referenced by `tip` steps.
// ---------------------------------------------------------------------------

export interface GrammarPoint {
  id: string
  title: LocalizedText
  /** The pattern at a glance, e.g. `I am / You are / He is ...`. */
  pattern: string
  /** Up to three short sentences. Prose-safe (no dashes that TTS skips). */
  tip: LocalizedText
  /** L1 contrast: the habit that causes the mistake. */
  compare?: { pt: string; en: string; note: LocalizedText }
  examples: Array<{ en: string; pt: string }>
}

// ---------------------------------------------------------------------------
// Steps — the typed building blocks of a lesson.
// ---------------------------------------------------------------------------

export interface StepBase {
  id: string
  /** Which skill this step trains (feeds the mastery model). */
  skill?: SkillArea
}

/** Graded general-knowledge fact card (CLIL: content the learner cares about). */
export interface KnowledgeStep extends StepBase {
  type: 'knowledge'
  title: LocalizedText
  /** Target-language text, 2–4 short sentences. */
  text: string
  translation: LocalizedText
  emoji?: string
}

/** Dialogue or short story: target-language lines, each with an L1 translation. */
export interface InputStep extends StepBase {
  type: 'input'
  title?: LocalizedText
  lines: Array<{
    speaker: string
    text: string
    translation: string
    /** Preferred voice gender for this speaker (heuristic name match + pitch fallback). */
    gender?: 'male' | 'female'
    /**
     * Target forms to bold in this line (textual input enhancement, Lee &
     * Huang 2008): draws noticing to the grammar the lesson teaches. Use
     * sparingly (1-2 forms per line) so meaning processing stays primary.
     */
    enhance?: string[]
  }>
}

/** Introduces 4–6 new vocabulary items (ids into vocab.json). */
export interface VocabStep extends StepBase {
  type: 'vocab'
  vocabIds: string[]
}

/** Grammar pattern card rendered from a course.json grammar point. */
export interface TipStep extends StepBase {
  type: 'tip'
  grammarId: string
}

/** Multiple choice: translation or meaning. */
export interface SelectStep extends StepBase {
  type: 'select'
  prompt: LocalizedText
  question: string
  options: string[]
  correct: number
  explanation?: LocalizedText
  /** Optional spoken version of the question text. */
  speak?: string
}

/** Match pairs (word to translation). */
export interface MatchStep extends StepBase {
  type: 'match'
  prompt: LocalizedText
  pairs: Array<{ source: string; target: string }>
}

/** Listen and choose what you heard. */
export interface ListenStep extends StepBase {
  type: 'listen'
  prompt: LocalizedText
  /** Text spoken by the speech engine. */
  audio: string
  options: string[]
  correct: number
  /** Max replays before the learner must answer. Default 3. */
  maxPlays?: number
}

/** Listen and type what you heard (dictation). */
export interface DictationStep extends StepBase {
  type: 'dictation'
  audio: string
  answer: string
  hint?: LocalizedText
}

/** Assemble the target-language sentence from a word bank. */
export interface BuildStep extends StepBase {
  type: 'build'
  prompt: LocalizedText
  /** L1 sentence to translate. */
  source: string
  /** Target-language answer. */
  answer: string
  /** Bank includes the answer's words plus 2–3 distractors. */
  bank: string[]
}

/** Cloze with options. */
export interface FillBlankStep extends StepBase {
  type: 'fillblank'
  /** Sentence containing `___` for the blank. */
  sentence: string
  options: string[]
  correct: number
  translation?: LocalizedText
  explanation?: LocalizedText
}

/**
 * Structured-input grammar item (Processing Instruction): the learner must
 * interpret the target-language sentence, and the correct interpretation is
 * impossible without processing the target form. Options are L1 meanings.
 */
export interface GrammarStep extends StepBase {
  type: 'grammar'
  prompt: LocalizedText
  question: string
  options: LocalizedText[]
  correct: number
  explanation?: LocalizedText
  /** Speak the question sentence when the step opens. Default true. */
  speak?: boolean
}

/** Minimal-pairs listening discrimination (L1 interference training). */
export interface PairsStep extends StepBase {
  type: 'pairs'
  prompt: LocalizedText
  trials: Array<{ audio: string; choiceA: string; choiceB: string; correct: 'a' | 'b' }>
}

/** Repeat after the audio (shadowing). Self-checked: never machine-graded. */
export interface SpeakStep extends StepBase {
  type: 'speak'
  prompt: LocalizedText
  lines: Array<{ text: string; translation: string }>
  mode: 'shadow' | 'read'
}

/** Weaves due spaced-repetition vocabulary into the lesson. */
export interface ReviewStep extends StepBase {
  type: 'review'
  /** How many due items to weave. Default 3. */
  count?: number
}

/** Quiz question (unit reviews). */
export interface QuizStep extends StepBase {
  type: 'quiz'
  question: LocalizedText
  options: string[]
  correct: number
  explanation?: LocalizedText
}

export type Step =
  | KnowledgeStep
  | InputStep
  | VocabStep
  | TipStep
  | SelectStep
  | MatchStep
  | ListenStep
  | DictationStep
  | BuildStep
  | FillBlankStep
  | GrammarStep
  | PairsStep
  | SpeakStep
  | ReviewStep
  | QuizStep

export type StepType = Step['type']

// ---------------------------------------------------------------------------
// Lesson / unit / course manifests.
// ---------------------------------------------------------------------------

export interface LanguageLesson {
  /** `${courseId}::${unit}::${slug}` */
  id: string
  slug: string
  /** Unit slug this lesson belongs to. */
  unit: string
  order: number
  title: LocalizedText
  /** Can-do statement shown before the lesson starts. */
  goal: LocalizedText
  objectives: string[]
  /** New vocabulary introduced here. */
  vocabIds: string[]
  /** Older vocabulary deliberately re-retrieved here. */
  reviewVocabIds?: string[]
  grammarIds?: string[]
  xp: number
  steps: Step[]
  /** Per-locale overrides of title/goal when the default differs. */
  locales?: Record<string, { title?: string; goal?: string }>
}

export interface UnitManifest {
  slug: string
  order: number
  title: LocalizedText
  description: LocalizedText
  emoji?: string
  cefr: CefrLevel
  objectives: string[]
  lessons: Array<{ slug: string; title: LocalizedText; kind?: 'core' | 'reading' | 'review' }>
}

export interface LanguageCourseMeta {
  id: string
  name: LocalizedText
  description: LocalizedText
  /** Learner's language (L1), e.g. `pt`. */
  source: string
  /** Language being learned (L2), e.g. `en`. */
  target: string
  cefrTarget: CefrLevel
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  emoji?: string
  /**
   * Flag artwork for the language pair, as `/flags/<code>.svg` file codes
   * (`br`, `gb`, `us`, `es`, ...). Flag emojis render as plain letter codes
   * on Windows, so real SVG flags are preferred when a flag distinction
   * matters (e.g. Brazil → United Kingdom).
   */
  flags?: { source: string; target: string }
  units: UnitManifest[]
  grammar: GrammarPoint[]
  locales?: Record<string, { name?: string; description?: string }>
}

/** Pair key used in storage and vocab indexes, e.g. `pt-en`. */
export function coursePairKey(course: Pick<LanguageCourseMeta, 'source' | 'target'>): string {
  return `${course.source}-${course.target}`
}

/** Speech-synthesis key for a word item: `lang::<pair>::<vocabId>`. */
export function vocabCardKey(pair: string, vocabId: string): string {
  return `lang::${pair}::${vocabId}`
}
