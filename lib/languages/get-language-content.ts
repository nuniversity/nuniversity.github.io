// lib/languages/get-language-content.ts
import fs from 'fs'
import path from 'path'
import type { LanguagePair, VocabularyGame } from './types'

const languagesDirectory = path.join(process.cwd(), 'content', 'languages', 'vocabulary')

export interface LanguageActivity {
  slug: string
  title: string
  description: string
  category: string
  difficulty: string
  languagePair: LanguagePair
  gameType: 'matching' | 'flashcards'
  wordCount: number
  localesAvailable: string[]
}

export async function getPairForSlug(slug: string): Promise<string | null> {
  try {
    const filePath = path.join(languagesDirectory, `${slug}.json`)

    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const game: VocabularyGame = JSON.parse(fileContent)

    if (!game.language_pair?.source || !game.language_pair?.target) {
      return null
    }

    return `${game.language_pair.source}-${game.language_pair.target}`
  } catch (error) {
    console.error(`Error reading language activity ${slug}:`, error)
    return null
  }
}

export async function getAllPairs(): Promise<string[]> {
  const pairs = new Set<string>()

  try {
    if (!fs.existsSync(languagesDirectory)) {
      return []
    }

    const activityFiles = fs.readdirSync(languagesDirectory)
      .filter(file => file.endsWith('.json'))

    for (const file of activityFiles) {
      const filePath = path.join(languagesDirectory, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const game: VocabularyGame = JSON.parse(fileContent)

      if (game.language_pair?.source && game.language_pair?.target) {
        pairs.add(`${game.language_pair.source}-${game.language_pair.target}`)
      }
    }
  } catch (error) {
    console.error('Error reading language pairs:', error)
  }

  return Array.from(pairs).sort()
}

export async function getAllLanguageActivities(locale?: string): Promise<LanguageActivity[]> {
  const activities: LanguageActivity[] = []

  try {
    if (!fs.existsSync(languagesDirectory)) {
      return activities
    }

    const activityFiles = fs.readdirSync(languagesDirectory)
      .filter(file => file.endsWith('.json'))

    for (const file of activityFiles) {
      const filePath = path.join(languagesDirectory, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const game: VocabularyGame = JSON.parse(fileContent)

      if (locale && game.locales?.[locale]) {
        const loc = game.locales[locale]
        if (loc.title) game.title = loc.title
        if (loc.description) game.description = loc.description
        if (loc.sourceLanguage) game.sourceLanguage = loc.sourceLanguage
        if (loc.targetLanguage) game.targetLanguage = loc.targetLanguage
      }

      activities.push({
        slug: game.id,
        title: game.title,
        description: game.description,
        category: game.category,
        difficulty: game.difficulty,
        languagePair: game.language_pair,
        gameType: game.gameType ?? 'matching',
        wordCount: game.words.length,
        localesAvailable: Object.keys(game.locales ?? {}).sort(),
      })
    }
  } catch (error) {
    console.error('Error reading language activities:', error)
  }

  return activities
}

export async function getLanguageActivity(slug: string, locale?: string): Promise<VocabularyGame | null> {
  try {
    const filePath = path.join(languagesDirectory, `${slug}.json`)

    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const game: VocabularyGame = JSON.parse(fileContent)

    if (locale && game.locales?.[locale]) {
      const loc = game.locales[locale]
      if (loc.title) game.title = loc.title
      if (loc.description) game.description = loc.description
      if (loc.sourceLanguage) game.sourceLanguage = loc.sourceLanguage
      if (loc.targetLanguage) game.targetLanguage = loc.targetLanguage
      if (loc.contextLabels) game.contextLabels = loc.contextLabels
    }

    return game
  } catch (error) {
    console.error(`Error reading language activity ${slug}:`, error)
    return null
  }
}
