// lib/games/get-game-content.ts
import fs from 'fs'
import path from 'path'
import { type Locale } from '@/lib/i18n/config'

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
  type: 'grammar' | 'math' | 'coding' | 'physics' | 'logic' | 'fun' | 'science' | 'puzzles' | 'conversation'
}

export interface GameFileData {
  title: string
  description: string
  locales?: {
    [locale: string]: {
      title?: string
      description?: string
    }
  }
}

interface GameListItem extends GameFileData {
  id: string
  difficulty: string
}

const gamesDirectory = path.join(process.cwd(), 'content/games')

/**
 * Get all available games metadata, deterministically ordered by category and
 * id so hub rendering never depends on `fs.readdirSync` enumeration order
 * (which is platform-dependent).
 */
export async function getAllGames(locale?: string): Promise<GameMetadata[]> {
  const games: GameMetadata[] = []

  try {
    // Check if games directory exists
    if (!fs.existsSync(gamesDirectory)) {
      return games
    }

    // Get all game type directories (coding, conversation, physics, etc.)
    const gameTypes = fs.readdirSync(gamesDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort()

    for (const gameType of gameTypes) {
      const gameTypePath = path.join(gamesDirectory, gameType)
      const gameFiles = fs.readdirSync(gameTypePath)
        .filter(file => file.endsWith('.json'))
        .sort()

      for (const file of gameFiles) {
        const filePath = path.join(gameTypePath, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const gameData: GameListItem = JSON.parse(fileContent)

        if (locale && gameData.locales?.[locale]) {
          const loc = gameData.locales[locale]
          if (loc.title) gameData.title = loc.title
          if (loc.description) gameData.description = loc.description
        }

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

  return games.sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug))
}

/**
 * Generic getter for any game type
 */
export async function getGameFile<T extends GameFileData>(type: string, slug: string, locale?: string): Promise<T | null> {
  try {
    const filePath = path.join(gamesDirectory, type, `${slug}.json`)
    if (!fs.existsSync(filePath)) return null
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const game: T = JSON.parse(fileContent)

    if (locale && game.locales?.[locale]) {
      const loc = game.locales[locale]
      if (loc.title) game.title = loc.title
      if (loc.description) game.description = loc.description
    }

    return game
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
 * Get all games by category.
 */
export async function getGamesByCategory(category: string, locale?: string): Promise<GameMetadata[]> {
  const allGames = await getAllGames(locale)
  return allGames.filter(game => game.category === category)
}
