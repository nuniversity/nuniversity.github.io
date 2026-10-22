export type QuizKind = 'certification' | 'practice' | 'course-exam'

export type QuizQuestionType = 'mcq' | 'multi' | 'tf'

export interface QuizQuestion {
  id: string
  subdomain: string
  type: QuizQuestionType
  question: string
  options: string[]
  correct: number
  explanation: string
}

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
