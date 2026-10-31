'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ArrowLeft, Clock, Keyboard, Code, CheckCircle2, RotateCcw } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from '@/components/navigation/AppLink'
import { useInterval } from '@/lib/games/use-timer'
import { useSafeTimeouts } from '@/lib/games/use-safe-timeouts'
import { tpl } from '@/lib/games/tpl'
import { getGameBest, saveGameBestIfNew, GAME_ID } from '@/lib/games/storage'

interface Snippet {
  code: string
  language: string
}

interface TypingSpeedClientProps {
  lang: Locale
  game: {
    title: string
    description: string
    durations?: number[]
    languages?: string[]
    snippets?: Record<string, Snippet[]>
  }
  dict: any
}

const TAB_SIZE = '    ' // 4 spaces: snippets are indented with spaces; a real
// Tab character would instantly mismatch every copied-indentation column.

export function TypingSpeedClient({ lang, game, dict }: TypingSpeedClientProps) {
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(null)
  const [userInput, setUserInput] = useState('')
  const [gameMode, setGameMode] = useState<'config' | 'playing' | 'complete'>('config')
  const [selectedLang, setSelectedLang] = useState('python')
  const [duration, setDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isReady, setIsReady] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Cumulative cross-snippet counters. The previous implementation reset
  // charTyped/charCorrect to the current snippet on every advance, which made
  // WPM, accuracy and the final "Chars" stat wrong for every round with more
  // than one snippet.
  const [typed, setTyped] = useState(0)
  const [correct, setCorrect] = useState(0)
  // Counters for the in-progress snippet only.
  const [liveTyped, setLiveTyped] = useState(0)
  const [liveCorrect, setLiveCorrect] = useState(0)
  const [snippetsDone, setSnippetsDone] = useState(0)
  const [score, setScore] = useState(0)
  // Locks the completed snippet so extra keystrokes in the 300 ms advance
  // window cannot double-award points (the snippet-completion race bug).
  const snippetLockedRef = useRef(false)
  const [bestWpm, setBestWpm] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { setSafeTimeout, clearAll } = useSafeTimeouts()

  const g = dict?.games ?? {}
  const ts = g?.typing_speed ?? {}

  // The `languages` field in the game JSON is the source of truth for the
  // language chips; fall back to the snippet keys for robustness.
  const allLanguages = useMemo(
    () => (game.languages?.length ? game.languages : Object.keys(game.snippets ?? {})),
    [game]
  )

  useEffect(() => {
    if (gameMode === 'config') setBestWpm(getGameBest(GAME_ID.typingSpeed, 'wpm'))
  }, [gameMode])

  const pickSnippet = useCallback(() => {
    const all = game.snippets?.[selectedLang] || []
    if (all.length === 0) return null
    return all[Math.floor(Math.random() * all.length)]
  }, [game.snippets, selectedLang])

  const loadNewSnippet = useCallback(() => {
    setCurrentSnippet(pickSnippet())
    setUserInput('')
    setLiveTyped(0)
    setLiveCorrect(0)
    snippetLockedRef.current = false
  }, [pickSnippet])

  const startGame = () => {
    clearAll()
    setGameMode('playing')
    setIsReady(false)
    setCountdown(3)
    setTimeLeft(duration)
    setTyped(0)
    setCorrect(0)
    setLiveTyped(0)
    setLiveCorrect(0)
    setSnippetsDone(0)
    setScore(0)
    setUserInput('')
    snippetLockedRef.current = false
    setCurrentSnippet(pickSnippet())
  }

  // Countdown: one interval, no churn; reaches 0 exactly once.
  useInterval(() => {
    setCountdown((prev) => Math.max(0, prev - 1))
  }, gameMode === 'playing' && countdown > 0 ? 1000 : null)

  // Countdown completion is derived state, not an imperative setTimeout —
  // the previous interval leaked past unmount and focused a dead textarea.
  useEffect(() => {
    if (gameMode === 'playing' && countdown === 0 && !isReady) {
      setIsReady(true)
      textareaRef.current?.focus()
    }
  }, [gameMode, countdown, isReady])

  // Main timer: `delay` never depends on the ticking value, so the interval is
  // created once per game instead of torn down and recreated every second.
  useInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setGameMode('complete')
        return 0
      }
      return prev - 1
    })
  }, gameMode === 'playing' && isReady ? 1000 : null)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isReady || !currentSnippet || snippetLockedRef.current) return
    // Tabs are converted to 4 spaces so indentation never hard-mismatches.
    const val = e.target.value.replace(/\t/g, TAB_SIZE).slice(0, currentSnippet.code.length)
    setUserInput(val)
    setLiveTyped(val.length)

    let correctCount = 0
    for (let i = 0; i < val.length; i++) {
      if (val[i] === currentSnippet.code[i]) correctCount++
    }
    setLiveCorrect(correctCount)

    if (val.length >= currentSnippet.code.length) {
      // Complete the snippet exactly once, then advance.
      snippetLockedRef.current = true
      const accuracy = correctCount / currentSnippet.code.length
      setTyped((prev) => prev + currentSnippet.code.length)
      setCorrect((prev) => prev + correctCount)
      setScore((prev) => prev + Math.round(10 * accuracy))
      setSnippetsDone((prev) => prev + 1)
      setSafeTimeout(loadNewSnippet, 300)
    }
  }

  const totalTyped = typed + liveTyped
  const totalCorrect = correct + liveCorrect

  // Elapsed of the ongoing round: the countdown itself is the clock
  // (elapsed = duration − timeLeft), so no second anchor state is needed.
  const elapsedSeconds = useMemo(
    () => Math.max(0, Math.min(duration, duration - timeLeft)),
    [duration, timeLeft]
  )

  const wpm = useMemo(() => {
    const minutes = elapsedSeconds / 60
    if (minutes <= 0) return 0
    return Math.round((totalTyped / 5) / minutes)
  }, [totalTyped, elapsedSeconds])

  const accuracy = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 100) : 100

  // Persist the best WPM when the round ends.
  useEffect(() => {
    if (gameMode === 'complete' && totalTyped >= 5) {
      const minutes = duration / 60
      const finalWpm = Math.round((totalTyped / 5) / minutes)
      if (saveGameBestIfNew(GAME_ID.typingSpeed, 'wpm', finalWpm)) {
        setBestWpm(finalWpm)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode])

  const quitGame = () => {
    clearAll()
    setGameMode('config')
  }

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

  return (
    <div className="container-custom py-12">
      <div className="max-w-3xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {g.back_to_games || 'Back to Games'}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
            <Keyboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
          {bestWpm !== null && gameMode === 'config' && (
            <p className="text-sm font-semibold text-primary mt-2">{tpl(ts.best_wpm || 'Best WPM: {wpm}', { wpm: bestWpm })}</p>
          )}
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">{g.game_setup || 'Game Setup'}</h2>
            <div className="mb-6">
              <label htmlFor="typing-language" className="block font-medium mb-3">{ts.language || 'Language'}</label>
              <div className="flex flex-wrap gap-2" role="group" aria-label={ts.language || 'Language'}>
                {allLanguages.map((langKey: string) => (
                  <button
                    key={langKey}
                    onClick={() => setSelectedLang(langKey)}
                    aria-pressed={selectedLang === langKey}
                    className={`px-6 py-3 rounded-xl font-medium capitalize transition-all ${selectedLang === langKey ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {langKey}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label htmlFor="typing-duration" className="block font-medium mb-3">{ts.duration || 'Duration'}</label>
              <div className="flex gap-2" role="group" aria-label={ts.duration || 'Duration'}>
                {(game.durations || [30, 60, 120]).map((d: number) => (
                  <button
                    key={d}
                    id={`typing-duration-${d}`}
                    aria-pressed={duration === d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${duration === d ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startGame} className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold hover:shadow-lg transition-all">
              {g.start_typing || 'Start Typing!'}
            </button>
          </div>
        )}

        {gameMode === 'playing' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" /> {g.stats?.time || 'Time'}</div>
                <div className="text-xl font-bold" role="timer" aria-label={`${g.stats?.time || 'Time'}: ${timeLeft}`}>{timeLeft}s</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Keyboard className="w-3 h-3" /> {g.stats?.wpm || 'WPM'}</div>
                <div className="text-xl font-bold">{wpm}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><CheckCircle2 className="w-3 h-3" /> {g.stats?.accuracy || 'Accuracy'}</div>
                <div className="text-xl font-bold">{accuracy}%</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Code className="w-3 h-3" /> {g.stats?.done || 'Done'}</div>
                <div className="text-xl font-bold">{snippetsDone}</div>
              </div>
            </div>

            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${(timeLeft / duration) * 100}%` }} />
            </div>

            {!isReady && countdown > 0 ? (
              <div className="bg-card border rounded-2xl p-20 text-center">
                <div className="text-8xl font-bold text-primary animate-pulse" aria-live="assertive">{countdown}</div>
                <p className="text-muted-foreground mt-4">{ts.get_ready || 'Get ready to type...'}</p>
              </div>
            ) : (
              <div className="bg-card border rounded-2xl overflow-hidden">
                {/* Code Display */}
                <div dir="ltr" className="bg-gray-900 text-green-400 p-6 font-mono text-sm leading-relaxed overflow-x-auto min-h-[200px] whitespace-pre">
                  {currentSnippet ? renderHighlightedCode() : (dict?.common?.loading || 'Loading...')}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={handleInput}
                    aria-label={(ts.type_placeholder || 'Type the code above here...').replace(/\.+$/, '')}
                    placeholder={ts.type_placeholder || 'Type the code above here...'}
                    className="w-full h-32 px-4 py-3 rounded-lg border border-border bg-muted/30 font-mono text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
              </div>
            )}

            <button onClick={quitGame} className="mt-6 w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> {g.quit || 'Quit'}
            </button>
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center" aria-live="polite">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{g.time_s_up || "Time's Up!"}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto my-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{wpm}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.wpm || 'WPM'}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">{g.stats?.accuracy || 'Accuracy'}</div>
              </div>
              <div className="bg-gradient-to-br from-primary-soft to-cyan-50 dark:from-primary/10 rounded-xl p-4 border border-primary/25">
                <div className="text-3xl font-bold text-primary">{totalTyped}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.chars || 'Chars'}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 rounded-xl p-4 border border-amber-200">
                <div className="text-3xl font-bold text-amber-600">{snippetsDone}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.snippets || 'Snippets'}</div>
              </div>
            </div>
            {bestWpm !== null && totalTyped >= 5 && wpm >= bestWpm && (
              <p className="text-amber-600 font-semibold mb-4">{tpl(ts.best_wpm || 'Best WPM: {wpm}', { wpm: bestWpm })}</p>
            )}
            <div className="flex gap-3">
              <button onClick={startGame} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">{g.play_again || 'Play Again'}</button>
              <Link href={`/${lang}/games`} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors text-center">{g.more_games || 'More Games'}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
