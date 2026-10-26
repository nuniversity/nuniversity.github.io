export type QuizKind = 'certification' | 'practice' | 'course-exam'

export type QuizQuestionType = 'mcq' | 'multi' | 'tf' | 'ordering' | 'matching'

interface QuizQuestionBase {
  id: string
  subdomain: string
  question: string
  explanation: string
}

export interface SingleAnswerQuizQuestion extends QuizQuestionBase {
  type: 'mcq' | 'tf'
  options: string[]
  correct: number
}

export interface MultiAnswerQuizQuestion extends QuizQuestionBase {
  type: 'multi'
  options: string[]
  correct: number[]
}

export interface OrderingQuizQuestion extends QuizQuestionBase {
  type: 'ordering'
  options: string[]
  correct: number[]
}

export interface MatchingQuizQuestion extends QuizQuestionBase {
  type: 'matching'
  options: string[]
  prompts: string[]
  correct: number[]
}

export type QuizQuestion =
  | SingleAnswerQuizQuestion
  | MultiAnswerQuizQuestion
  | OrderingQuizQuestion
  | MatchingQuizQuestion

export type QuizResponse =
  | { type: 'mcq' | 'tf'; selected: number | null }
  | { type: 'multi'; selected: number[] }
  | { type: 'ordering'; sequence: number[] }
  | { type: 'matching'; pairs: (number | null)[] }

export interface QuizDomain {
  id: string
  name: string
  color: string
  subdomains: string[]
}

export interface QuizLocaleBlock {
  title?: string
  description?: string
}

export interface QuizData {
  id: string
  slug: string
  kind: QuizKind
  category: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topic: string
  certification: string
  durationSeconds: number
  passingScore: number
  mockQuestionCount?: number
  domains: QuizDomain[]
  allocations: Record<string, number>
  questions: QuizQuestion[]
  locales?: {
    [locale: string]: QuizLocaleBlock
  }
}

export type QuizSummary = Omit<QuizData, 'questions'> & {
  questionCount: number
}

export interface UserAnswer {
  questionId: string
  subdomain: string
  response: QuizResponse | null
  isCorrect: boolean
  timeSpent: number
}
