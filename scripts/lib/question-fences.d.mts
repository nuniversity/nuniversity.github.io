export interface ExtractedQuestion {
  index: number
  data: {
    id?: string
    type?: string
    question: string
    options: string[]
    correct: number
    explanation?: string
  }
}

export function extractQuestionFences(markdown: string): ExtractedQuestion[]
