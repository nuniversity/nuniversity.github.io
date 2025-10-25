// app/[lang]/games/vocabulary/[slug]/vocabulary-game-client.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trophy, RotateCcw, CheckCircle2, XCircle, Clock, Star } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { VocabularyGame, VocabularyWord } from '@/lib/games/get-game-content'
import Link from 'next/link'

interface VocabularyGameClientProps {
  lang: Locale
  game: VocabularyGame
  dict: any
}

interface Card {
  id: string
  wordId: string
  text: string
  type: 'source' | 'target'
  isMatched: boolean
}

export function VocabularyGameClient({ lang, game, dict }: VocabularyGameClientProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const [numPairs, setNumPairs] = useState(8)
  const [gameWords, setGameWords] = useState<VocabularyWord[]>([])

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [game, numPairs])

  // Timer
  useEffect(() => {
    if (startTime && !isComplete) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, isComplete])

  function initializeGame() {
    // Shuffle and take random words for the game
    const shuffledWords = [...game.words].sort(() => Math.random() - 0.5)
    const selectedWords = shuffledWords.slice(0, numPairs)
    setGameWords(selectedWords)
    
    // Create cards for source and target languages
    const sourceCards: Card[] = selectedWords.map(word => ({
      id: `source-${word.id}`,
      wordId: word.id,
      text: word.source,
      type: 'source',
      isMatched: false
    }))

    const targetCards: Card[] = selectedWords.map(word => ({
      id: `target-${word.id}`,
      wordId: word.id,
      text: word.target,
      type: 'target',
      isMatched: false
    }))

    // Shuffle cards
    const allCards = [...sourceCards, ...targetCards].sort(() => Math.random() - 0.5)
    setCards(allCards)
    setSelectedCards([])
    setMatchedPairs(new Set())
    setScore(0)
    setAttempts(0)
    setStartTime(Date.now())
    setElapsedTime(0)
    setIsComplete(false)
  }

  function handleCardClick(card: Card) {
    // Ignore if already matched or already selected
    if (card.isMatched || selectedCards.some(c => c.id === card.id)) {
      return
    }

    // Ignore if two cards already selected
    if (selectedCards.length >= 2) {
      return
    }

    const newSelectedCards = [...selectedCards, card]
    setSelectedCards(newSelectedCards)

    // Check for match when two cards are selected
    if (newSelectedCards.length === 2) {
      setAttempts(prev => prev + 1)
      
      const [first, second] = newSelectedCards
      
      // Check if they match (same wordId, different types)
      if (first.wordId === second.wordId && first.type !== second.type) {
        // Match found!
        setTimeout(() => {
          setMatchedPairs(prev => {
            const newSet = new Set(prev)
            newSet.add(first.wordId)
            return newSet
          })
          setCards(prevCards => 
            prevCards.map(c => 
              c.wordId === first.wordId ? { ...c, isMatched: true } : c
            )
          )
          setScore(prev => prev + 10)
          setSelectedCards([])

          // Check if game is complete
          if (matchedPairs.size + 1 === numPairs) {
            setIsComplete(true)
          }
        }, 600)
      } else {
        // No match
        setTimeout(() => {
          setSelectedCards([])
        }, 1000)
      }
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const accuracy = attempts > 0 ? Math.round((matchedPairs.size / attempts) * 100) : 0
  const maxPairs = Math.min(game.words.length, 12) // Maximum 12 pairs (24 cards)
  const minPairs = 4 // Minimum 4 pairs (8 cards)

  return (
    <div className="container-custom py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/${lang}/games`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
              <p className="text-muted-foreground">{game.description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Total words available: {game.words.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={initializeGame}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </button>
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Game Settings</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="flex items-center gap-3">
              <span className="text-muted-foreground">Number of pairs:</span>
              <input
                type="range"
                min={minPairs}
                max={maxPairs}
                value={numPairs}
                onChange={(e) => setNumPairs(Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="font-semibold text-lg w-8">{numPairs}</span>
            </label>
            <span className="text-sm text-muted-foreground">
              ({numPairs * 2} cards total)
            </span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">Score</span>
            </div>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Time</span>
            </div>
            <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Matches</span>
            </div>
            <p className="text-2xl font-bold">{matchedPairs.size}/{numPairs}</p>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Accuracy</span>
            </div>
            <p className="text-2xl font-bold">{accuracy}%</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <AnimatePresence>
            {cards.map((card) => {
              const isSelected = selectedCards.some(c => c.id === card.id)
              const isMatched = card.isMatched
              
              return (
                <motion.button
                  key={card.id}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={!isMatched ? { scale: 1.05 } : {}}
                  whileTap={!isMatched ? { scale: 0.95 } : {}}
                  onClick={() => handleCardClick(card)}
                  disabled={isMatched}
                  className={`
                    relative aspect-square rounded-2xl p-4 flex items-center justify-center text-center font-semibold text-lg
                    transition-all duration-300 border-2
                    ${isMatched 
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 cursor-default' 
                      : isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-card border-border hover:border-primary'
                    }
                    ${card.type === 'source' ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20' : ''}
                  `}
                >
                  {isMatched && (
                    <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-green-600" />
                  )}
                  <span className="break-words">{card.text}</span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Completion Modal */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setIsComplete(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border rounded-2xl p-8 max-w-md w-full text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                <p className="text-muted-foreground mb-6">
                  You've completed the game!
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Final Score</span>
                    <span className="font-bold text-xl">{score}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-bold">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-bold">{accuracy}%</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsComplete(false)
                      initializeGame()
                    }}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                  >
                    Play Again
                  </button>
                  <Link
                    href={`/${lang}/games`}
                    className="flex-1 px-6 py-3 rounded-lg border font-semibold hover:bg-muted transition-colors text-center"
                  >
                    More Games
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-3">How to Play</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Click on cards to select them</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Match words in {game.language_pair.source.toUpperCase()} with their {game.language_pair.target.toUpperCase()} translations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Find all matching pairs to complete the game</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Try to complete with the highest accuracy in the shortest time!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}