import fs from 'fs'
import path from 'path'
import { type Locale } from '@/lib/i18n/config'
import type { QuizData, QuizSummary } from './types'

const quizzesDirectory = path.join(process.cwd(), 'content/quizzes')

export async function getAllQuizzes(locale?: Locale): Promise<QuizSummary[]> {
  const quizzes: QuizSummary[] = []

  try {
    if (!fs.existsSync(quizzesDirectory)) {
      return quizzes
    }

    const quizFiles = fs.readdirSync(quizzesDirectory)
      .filter(file => file.endsWith('.json'))

    for (const file of quizFiles) {
      const filePath = path.join(quizzesDirectory, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const quiz: QuizData = JSON.parse(fileContent)

      if (locale && quiz.locales?.[locale]) {
        const loc = quiz.locales[locale]
        if (loc.title) quiz.title = loc.title
        if (loc.description) quiz.description = loc.description
      }

      quizzes.push({
        id: quiz.id,
        slug: quiz.slug,
        kind: quiz.kind,
        category: quiz.category,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        topic: quiz.topic,
        certification: quiz.certification,
        durationSeconds: quiz.durationSeconds,
        passingScore: quiz.passingScore,
        domains: quiz.domains,
        allocations: quiz.allocations,
        locales: quiz.locales,
        questionCount: quiz.questions.length,
      })
    }
  } catch (error) {
    console.error('Error reading quizzes:', error)
  }

  return quizzes
}

export async function getQuiz(slug: string, locale?: Locale): Promise<QuizData | null> {
  try {
    const filePath = path.join(quizzesDirectory, `${slug}.json`)

    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const quiz: QuizData = JSON.parse(fileContent)

    if (locale && quiz.locales?.[locale]) {
      const loc = quiz.locales[locale]
      if (loc.title) quiz.title = loc.title
      if (loc.description) quiz.description = loc.description
    }

    return quiz
  } catch (error) {
    console.error(`Error reading quiz ${slug}:`, error)
    return null
  }
}
