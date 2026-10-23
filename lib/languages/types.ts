// lib/languages/types.ts
export interface LocalizedString {
  [locale: string]: string
}

export interface LanguagePair {
  source: string
  target: string
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
  gameType?: 'matching' | 'flashcards'
  language_pair: LanguagePair
  words: VocabularyWord[]
  sourceLanguage?: string
  targetLanguage?: string
  locales?: {
    [locale: string]: {
      title?: string
      description?: string
      sourceLanguage?: string
      targetLanguage?: string
      contextLabels?: {
        [context: string]: LocalizedString
      }
    }
  }
  contextLabels?: {
    [context: string]: LocalizedString
  }
}
