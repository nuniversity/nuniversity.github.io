// lib/games/get-game-content.ts
import fs from 'fs'
import path from 'path'
import { type Locale } from '@/lib/i18n/config'

export interface LocalizedString {
  [locale: string]: string
}

export interface VocabularyWord {
  id: string
  source: string
  target: string
  context: string
  emoji?: string
  pronunciation?: string
  example?: string
  exampleTranslation?: string
  imageUrl?: string
  isExpression?: boolean
  level?: 'A1' | 'A2' | 'B1'
}

export interface VocabularyGame {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  gameType?: 'memory' | 'flashcards'
  language_pair: {
    source: string
    target: string
  }
  words: VocabularyWord[]
  sourceLanguage?: string
  targetLanguage?: string
  locales?: {
    [locale: string]: {
      title?: string
      description?: string
      sourceLanguage?: string
      targetLanguage?: string
    }
  }
  contextLabels?: {
    [context: string]: LocalizedString
  }
}

export interface QuizQuestion {
  id: string
  domain: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface MockExamDomainGroup {
  label: string
  color: string
  subdomains: string[]
}

export interface MockExamConfig {
  durationSeconds: number
  passingScore: number
  allocations: Record<string, number>
  domainGroups: Record<string, MockExamDomainGroup>
}

export interface QuizGame {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  topic: string
  certification: string
  mockExam?: MockExamConfig
  questions: QuizQuestion[]
}

export interface ConversationQuestion {
  id: string
  number: number
  text: string
}

export interface ConversationSet {
  id: number
  name: string
  subtitle: string
  description: string
  color: string
  questions: ConversationQuestion[]
}

export interface FinalExercise {
  title: string
  description: string
  durationSeconds: number
}

export interface ConversationGame {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  sets: ConversationSet[]
  finalExercise: FinalExercise
  locales?: {
    [locale: string]: {
      title?: string
      description?: string
      sets?: Array<{
        name?: string
        subtitle?: string
        description?: string
        questions?: Array<{ text?: string }>
      }>
      finalExercise?: {
        title?: string
        description?: string
      }
    }
  }
}

export interface GameMetadata {
  slug: string
  title: string
  description: string
  category: string
  difficulty: string
  type: 'vocabulary' | 'grammar' | 'math' | 'coding' | 'physics' | 'logic' | 'fun' | 'quiz' | 'science' | 'puzzles' | 'conversation'
}

const gamesDirectory = path.join(process.cwd(), 'content/games')

/**
 * Get all available games metadata
 */
export async function getAllGames(): Promise<GameMetadata[]> {
  const games: GameMetadata[] = []
  
  try {
    // Check if games directory exists
    if (!fs.existsSync(gamesDirectory)) {
      return games
    }

    // Get all game type directories (vocabulary, grammar, quiz, etc.)
    const gameTypes = fs.readdirSync(gamesDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const gameType of gameTypes) {
      const gameTypePath = path.join(gamesDirectory, gameType)
      const gameFiles = fs.readdirSync(gameTypePath)
        .filter(file => file.endsWith('.json'))

      for (const file of gameFiles) {
        const filePath = path.join(gameTypePath, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const gameData = JSON.parse(fileContent)

        games.push({
          slug: gameData.id,
          title: gameData.title,
          description: gameData.description,
          category: gameType,
          difficulty: gameData.difficulty,
          type: gameType as GameMetadata['type']
        })
      }
    }
  } catch (error) {
    console.error('Error reading games:', error)
  }

  return games
}

/**
 * Get vocabulary game by slug, with locale merging
 */
export async function getVocabularyGame(slug: string, locale?: string): Promise<VocabularyGame | null> {
  try {
    const filePath = path.join(gamesDirectory, 'vocabulary', `${slug}.json`)
    
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
    }

    return game
  } catch (error) {
    console.error(`Error reading vocabulary game ${slug}:`, error)
    return null
  }
}

/**
 * Get quiz game by slug
 */
export async function getQuizGame(slug: string): Promise<QuizGame | null> {
  try {
    const filePath = path.join(gamesDirectory, 'quiz', `${slug}.json`)
    
    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error(`Error reading quiz game ${slug}:`, error)
    return null
  }
}

/**
 * Generic getter for any game type
 */
export async function getGameFile<T>(type: string, slug: string): Promise<T | null> {
  try {
    const filePath = path.join(gamesDirectory, type, `${slug}.json`)
    if (!fs.existsSync(filePath)) return null
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error(`Error reading ${type} game ${slug}:`, error)
    return null
  }
}

/**
 * Get conversation game by slug, with locale merging
 */
export async function getConversationGame(slug: string, locale?: string): Promise<ConversationGame | null> {
  try {
    const filePath = path.join(gamesDirectory, 'conversation', `${slug}.json`)
    
    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const game: ConversationGame = JSON.parse(fileContent)

    if (locale && game.locales?.[locale]) {
      const loc = game.locales[locale]
      if (loc.title) game.title = loc.title
      if (loc.description) game.description = loc.description
      if (loc.sets) {
        for (let i = 0; i < loc.sets.length && i < game.sets.length; i++) {
          const locSet = loc.sets[i]
          if (locSet.name) game.sets[i].name = locSet.name
          if (locSet.subtitle) game.sets[i].subtitle = locSet.subtitle
          if (locSet.description) game.sets[i].description = locSet.description
          if (locSet.questions) {
            for (let j = 0; j < locSet.questions.length && j < game.sets[i].questions.length; j++) {
              if (locSet.questions[j].text) game.sets[i].questions[j].text = locSet.questions[j].text!
            }
          }
        }
      }
      if (loc.finalExercise) {
        if (loc.finalExercise.title) game.finalExercise.title = loc.finalExercise.title
        if (loc.finalExercise.description) game.finalExercise.description = loc.finalExercise.description
      }
    }

    return game
  } catch (error) {
    console.error(`Error reading conversation game ${slug}:`, error)
    return null
  }
}

/**
 * Get all games by category
 */
export async function getGamesByCategory(category: string): Promise<GameMetadata[]> {
  const allGames = await getAllGames()
  return allGames.filter(game => game.category === category)
}
