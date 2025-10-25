// lib/games/get-game-content.ts
import fs from 'fs'
import path from 'path'
import { type Locale } from '@/lib/i18n/config'

export interface VocabularyWord {
  id: string
  source: string
  target: string
  context: string
}

export interface VocabularyGame {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  language_pair: {
    source: string
    target: string
  }
  words: VocabularyWord[]
}

export interface GameMetadata {
  slug: string
  title: string
  description: string
  category: string
  difficulty: string
  type: 'vocabulary' | 'grammar' | 'math' | 'coding' | 'physics' | 'logic' | 'fun'
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

    // Get all game type directories (vocabulary, grammar, etc.)
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
 * Get vocabulary game by slug
 */
export async function getVocabularyGame(slug: string): Promise<VocabularyGame | null> {
  try {
    const filePath = path.join(gamesDirectory, 'vocabulary', `${slug}.json`)
    
    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error(`Error reading vocabulary game ${slug}:`, error)
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