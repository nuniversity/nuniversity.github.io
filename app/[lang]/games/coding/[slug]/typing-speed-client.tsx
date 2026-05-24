'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, Clock, Keyboard, Code, CheckCircle2, XCircle } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from 'next/link'

interface TypingSpeedClientProps {
  lang: Locale
  game: any
  dict: any
}

export function TypingSpeedClient({ lang, game, dict }: TypingSpeedClientProps) {
  const [snippets, setSnippets] = useState<any[]>([])
  const [currentSnippet, setCurrentSnippet] = useState<any>(null)
  const [userInput, setUserInput] = useState('')
  const [gameMode, setGameMode] = useState<'config' | 'playing' | 'complete'>('config')
  const [selectedLang, setSelectedLang] = useState('python')
  const [duration, setDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [charTyped, setCharTyped] = useState(0)
  const [charCorrect, setCharCorrect] = useState(0)
  const [snippetsDone, setSnippetsDone] = useState(0)
  const [score, setScore] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const startGame = () => {
    setGameMode('playing')
    setIsReady(false)
    setCountdown(3)
    setTimeLeft(duration)
    setCharTyped(0)
    setCharCorrect(0)
    setSnippetsDone(0)
    setScore(0)
    setUserInput('')
    loadNewSnippet()

    // Countdown
    const cd = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(cd)
          setIsReady(true)
          startTimeRef.current = Date.now()
          if (textareaRef.current) textareaRef.current.focus()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (gameMode === 'playing' && isReady && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameMode('complete')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameMode, isReady, timeLeft])

  useEffect(() => {
    const all = game.snippets[selectedLang] || []
    setSnippets(all)
  }, [selectedLang, game])

  const loadNewSnippet = () => {
    const all = game.snippets[selectedLang] || []
    const snippet = all[Math.floor(Math.random() * all.length)]
    setCurrentSnippet(snippet)
    setUserInput('')
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isReady || !currentSnippet) return
    const val = e.target.value
    setUserInput(val)

    let correct = 0
    for (let i = 0; i < val.length && i < currentSnippet.code.length; i++) {
      if (val[i] === currentSnippet.code[i]) correct++
    }
    setCharTyped(val.length)
    setCharCorrect(correct)

    if (val.length >= currentSnippet.code.length) {
      const accuracy = correct / currentSnippet.code.length
      setScore(prev => prev + Math.round(10 * accuracy))
      setSnippetsDone(prev => prev + 1)
      setTimeout(loadNewSnippet, 300)
    }
  }

  const wpm = useMemo(() => {
    const elapsed = (duration - timeLeft) / 60
    if (elapsed <= 0) return 0
    return Math.round((charTyped / 5) / elapsed)
  }, [charTyped, duration, timeLeft])

  const accuracy = charTyped > 0 ? Math.round((charCorrect / charTyped) * 100) : 100

  const renderHighlightedCode = () => {
    if (!currentSnippet) return null
    const code = currentSnippet.code
    const input = userInput
    const chars: React.ReactNode[] = []
    for (let i = 0; i < code.length; i++) {
      if (i < input.length) {
        chars.push(
          <span key={i} className={input[i] === code[i] ? 'text-green-500' : 'text-red-500 bg-red-100 dark:bg-red-900/30'}>
            {code[i]}
          </span>
        )
      } else if (i === input.length) {
        chars.push(<span key={i} className="animate-pulse bg-primary/30 text-primary">{code[i]}</span>)
      } else {
        chars.push(<span key={i} className="text-gray-400 dark:text-gray-600">{code[i]}</span>)
      }
    }
    return chars
  }

  const allLanguages = Object.keys(game.snippets)

  return (
    <div className="container-custom py-12">
      <div className="max-w-3xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
            <Keyboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Game Setup</h2>
            <div className="mb-6">
              <label className="block font-medium mb-3">Language</label>
              <div className="flex flex-wrap gap-2">
                {allLanguages.map((lang: string) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-6 py-3 rounded-xl font-medium capitalize transition-all ${selectedLang === lang ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label className="block font-medium mb-3">Duration</label>
              <div className="flex gap-2">
                {game.durations.map((d: number) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${duration === d ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startGame} className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold hover:shadow-lg transition-all">
              Start Typing!
            </button>
          </div>
        )}

        {gameMode === 'playing' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" /> Time</div>
                <div className="text-xl font-bold">{timeLeft}s</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Keyboard className="w-3 h-3" /> WPM</div>
                <div className="text-xl font-bold">{wpm}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><CheckCircle2 className="w-3 h-3" /> Accuracy</div>
                <div className="text-xl font-bold">{accuracy}%</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Code className="w-3 h-3" /> Done</div>
                <div className="text-xl font-bold">{snippetsDone}</div>
              </div>
            </div>

            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${(timeLeft / duration) * 100}%` }} />
            </div>

            {!isReady && countdown > 0 ? (
              <div className="bg-card border rounded-2xl p-20 text-center">
                <div className="text-8xl font-bold text-primary animate-pulse">{countdown}</div>
                <p className="text-muted-foreground mt-4">Get ready to type...</p>
              </div>
            ) : (
              <div className="bg-card border rounded-2xl overflow-hidden">
                {/* Code Display */}
                <div className="bg-gray-900 text-green-400 p-6 font-mono text-sm leading-relaxed overflow-x-auto min-h-[200px] whitespace-pre">
                  {currentSnippet ? renderHighlightedCode() : 'Loading...'}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={handleInput}
                    placeholder="Type the code above here..."
                    className="w-full h-32 px-4 py-3 rounded-lg border border-border bg-muted/30 font-mono text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto my-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{wpm}</div>
                <div className="text-sm text-muted-foreground">WPM</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 rounded-xl p-4 border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{charTyped}</div>
                <div className="text-sm text-muted-foreground">Chars</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 rounded-xl p-4 border border-amber-200">
                <div className="text-3xl font-bold text-amber-600">{snippetsDone}</div>
                <div className="text-sm text-muted-foreground">Snippets</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={startGame} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">Play Again</button>
              <Link href={`/${lang}/games`} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors text-center">More Games</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
