import type { LessonQuestion } from '@/components/markdown/QuestionBlock'

const QUESTION_FENCE = '```question'
const FENCE_CLOSE = '```'

function isOpener(line: string): boolean {
  return line.trimEnd() === QUESTION_FENCE
}

function isCloser(line: string): boolean {
  return line.trimEnd() === FENCE_CLOSE
}

function isQuestionLike(value: unknown): value is LessonQuestion {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function extractExamQuestions(content: string): LessonQuestion[] {
  const questions: LessonQuestion[] = []
  if (!content) return questions

  const lines = content.split('\n')
  let index = 0

  while (index < lines.length) {
    if (!isOpener(lines[index])) {
      index += 1
      continue
    }

    const body: string[] = []
    let cursor = index + 1
    while (cursor < lines.length && !isCloser(lines[cursor])) {
      body.push(lines[cursor])
      cursor += 1
    }

    try {
      const parsed: unknown = JSON.parse(body.join('\n'))
      if (isQuestionLike(parsed)) {
        questions.push(parsed)
      }
    } catch {
    }

    index = cursor + 1
  }

  return questions
}
