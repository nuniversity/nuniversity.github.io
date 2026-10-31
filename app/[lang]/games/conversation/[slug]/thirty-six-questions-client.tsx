'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, Users, User, SkipForward, Clock, Download, RotateCcw, Play, Pause, Eye, ChevronRight, Sparkles } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { ConversationGame } from '@/lib/games/get-game-content'
import { tpl } from '@/lib/games/tpl'
import { useInterval } from '@/lib/games/use-timer'
import Link from '@/components/navigation/AppLink'

interface ThirtySixQuestionsClientProps {
  lang: Locale
  game: ConversationGame
  dict: any
}

type GameMode = 'solo' | 'duo'
type GamePhase = 'config' | 'set-intro' | 'playing' | 'set-complete' | 'final-reflection' | 'complete'

interface AnswerEntry {
  player0?: string
  player1?: string
}

interface Answers {
  [questionId: string]: AnswerEntry
}

interface SessionStats {
  answered: number
  skipped: number
  startTime: number
  endTime?: number
}

export function ThirtySixQuestionsClient({ lang, game, dict }: ThirtySixQuestionsClientProps) {
  const conv = dict?.games?.conversation ?? {}

  const [gameMode, setGameMode] = useState<GameMode>('duo')
  const [gamePhase, setGamePhase] = useState<GamePhase>('config')
  // Seeded from the localized placeholders so Portuguese/Spanish players stop
  // seeing hardcoded English 'Player 1'/'Player 2' defaults in turns and exports.
  const [playerNames, setPlayerNames] = useState<[string, string]>(() => [
    conv.player1_placeholder || 'Player 1',
    conv.player2_placeholder || 'Player 2',
  ])
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
  const [answerText, setAnswerText] = useState('')
  const [stats, setStats] = useState<SessionStats>({
    answered: 0,
    skipped: 0,
    startTime: Date.now(),
  })

  // Eye gaze timer state
  const [gazeSeconds, setGazeSeconds] = useState(0)
  const [gazeRunning, setGazeRunning] = useState(false)

  // Elapsed wall-clock time, rounded to the nearest second per tick
  const [elapsed, setElapsed] = useState(0)

  const currentSet = game.sets[currentSetIndex]
  const currentQuestion = currentSet?.questions[currentQuestionIndex]
  const totalQuestions = game.sets.reduce((sum, s) => sum + s.questions.length, 0)
  const globalQuestionIndex = game.sets.slice(0, currentSetIndex).reduce((sum, s) => sum + s.questions.length, 0) + currentQuestionIndex

  const gazeDuration = game.finalExercise?.durationSeconds ?? 240

  // Elapsed timer: interval driven by a stable phase condition; the tick reads
  // the seconds from a Date.now() anchor, so no effect churn per tick, and the
  // timer pauses cleanly when the phase leaves playing.
  useInterval(() => {
    setElapsed(Math.floor((Date.now() - stats.startTime) / 1000))
  }, gamePhase === 'playing' || gamePhase === 'final-reflection' ? 1000 : null)

  // Eye gaze timer: `gazeRunning` is the only dependency; reaching the cap
  // stops the interval by flipping the flag (the tick no longer fires at all —
  // previously the interval kept re-arming every second including after skip).
  useInterval(() => {
    setGazeSeconds((prev) => {
      if (prev >= gazeDuration - 1) {
        setGazeRunning(false)
        return gazeDuration
      }
      return prev + 1
    })
  }, gazeRunning ? 1000 : null)

  // Hard stop: entering the results screen always stops the gaze timer, even
  // if the user skipped part-way through (the previous bug kept the interval
  // ticking invisibly until the cap).
  useEffect(() => {
    if (gamePhase !== 'final-reflection') {
      setGazeRunning(false)
    }
  }, [gamePhase])

  // Reset the elapsed display when a fresh session starts.
  useEffect(() => {
    setElapsed(0)
  }, [stats.startTime])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const advanceFromQuestion = (player: number, questionIndex: number, setIndex: number) => {
    if (gameMode === 'duo' && player === 0) {
      setCurrentPlayer(1)
      setAnswerText('')
      return
    }
    setCurrentPlayer(0)
    setAnswerText('')
    if (questionIndex < currentSet.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else if (setIndex < game.sets.length - 1) {
      setGamePhase('set-complete')
    } else {
      setGamePhase('final-reflection')
    }
  }

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !answerText.trim()) return
    const qId = currentQuestion.id
    const entry: AnswerEntry = { ...answers[qId] }
    if (gameMode === 'solo' || currentPlayer === 0) entry.player0 = answerText
    else entry.player1 = answerText
    setAnswers({ ...answers, [qId]: entry })
    setStats((s) => ({ ...s, answered: s.answered + 1 }))
    advanceFromQuestion(currentPlayer, currentQuestionIndex, currentSetIndex)
  }

  const handleSkip = () => {
    if (!currentQuestion) return
    setSkippedQuestions((prev) => new Set(prev).add(currentQuestion.id))
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }))
    advanceFromQuestion(currentPlayer, currentQuestionIndex, currentSetIndex)
  }

  // Duo-mode skip currently advances both players past the same question; the
  // notification below makes that visible instead of silently dropping player
  // 2's turn.
  const [duoSkipNotice, setDuoSkipNotice] = useState(false)
  const handleSkipWithNotice = () => {
    if (gameMode === 'duo' && currentPlayer === 0) {
      setDuoSkipNotice(true)
    } else {
      setDuoSkipNotice(false)
    }
    handleSkip()
  }

  const handleStart = () => {
    setStats({ answered: 0, skipped: 0, startTime: Date.now() })
    setElapsed(0)
    setDuoSkipNotice(false)
    setGamePhase('set-intro')
  }

  const handleSetIntroContinue = () => {
    setGamePhase('playing')
    setCurrentQuestionIndex(0)
    setCurrentPlayer(0)
    setAnswerText('')
  }

  const handleSetCompleteContinue = () => {
    setCurrentSetIndex((prev) => prev + 1)
    setGamePhase('set-intro')
  }

  const handleEyeGazeComplete = () => {
    setGazeRunning(false)
    setGamePhase('complete')
    setStats((s) => ({ ...s, endTime: Date.now() }))
  }

  const handleExport = () => {
    const questionsById = buildQuestionMap(game)
    const exportData = {
      game: game.title,
      mode: gameMode,
      players: gameMode === 'duo' ? playerNames : [playerNames[0]],
      date: new Date().toISOString(),
      answers: Object.entries(answers).map(([qId, a]) => ({
        question: questionsById.get(qId)?.text,
        // Consistent flat schema between solo and duo. In duo mode the second
        // player's answer may legitimately be absent (skipped turns).
        player0: a.player0,
        player1: gameMode === 'duo' ? a.player1 : undefined,
      })),
      skipped: Array.from(skippedQuestions).map((qId) => ({
        question: questionsById.get(qId)?.text,
      })),
      stats: {
        answered: stats.answered,
        skipped: stats.skipped,
        totalTime: formatTime(elapsed),
      },
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `36-questions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const handleRestart = () => {
    setGamePhase('config')
    setCurrentSetIndex(0)
    setCurrentQuestionIndex(0)
    setCurrentPlayer(0)
    setAnswers({})
    setSkippedQuestions(new Set())
    setAnswerText('')
    setStats({ answered: 0, skipped: 0, startTime: Date.now() })
    setGazeSeconds(0)
    setGazeRunning(false)
    setElapsed(0)
    setDuoSkipNotice(false)
  }

  const chrome = 'min-h-[60vh] py-12'
  const card = 'bg-card border rounded-2xl shadow-sm'
  const gradientText = 'from-rose-500 to-pink-600'

  // --- RENDER: Config ---
  if (gamePhase === 'config') {
    return (
      <div className={`${chrome} bg-gradient-to-b from-rose-50/40 to-transparent dark:from-rose-950/10`}>
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {conv.back_to_games ?? 'Back to Games'}
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${card} p-8`}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
                <p className="text-muted-foreground">{game.description}</p>
              </div>

              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">{conv.choose_mode ?? 'Choose Mode'}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGameMode('duo')}
                    aria-pressed={gameMode === 'duo'}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      gameMode === 'duo'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <Users className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">{conv.duo_mode ?? 'Duo'}</div>
                    <div className="text-xs text-muted-foreground mt-1">{conv.duo_description ?? 'Take turns with a partner'}</div>
                  </button>
                  <button
                    onClick={() => setGameMode('solo')}
                    aria-pressed={gameMode === 'solo'}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      gameMode === 'solo'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">{conv.solo_mode ?? 'Solo'}</div>
                    <div className="text-xs text-muted-foreground mt-1">{conv.solo_description ?? 'Reflect on each question'}</div>
                  </button>
                </div>
              </div>

              {/* Player Names */}
              <div className="mb-6 space-y-3">
                <label className="block text-sm font-medium">{conv.player_names ?? 'Player Names'}</label>
                <input
                  type="text"
                  aria-label={`${conv.player_names ?? 'Player Names'} 1`}
                  value={playerNames[0]}
                  onChange={(e) => setPlayerNames((prev) => [e.target.value, prev[1]])}
                  placeholder={conv.player1_placeholder ?? 'Player 1'}
                  className="w-full px-4 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {gameMode === 'duo' && (
                  <input
                    type="text"
                    aria-label={`${conv.player_names ?? 'Player Names'} 2`}
                    value={playerNames[1]}
                    onChange={(e) => setPlayerNames((prev) => [prev[0], e.target.value])}
                    placeholder={conv.player2_placeholder ?? 'Player 2'}
                    className="w-full px-4 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                )}
              </div>

              {/* Set Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">{conv.start_from ?? 'Start From'}</label>
                <div className="space-y-2">
                  {game.sets.map((set, idx) => (
                    <button
                      key={set.id}
                      onClick={() => setCurrentSetIndex(idx)}
                      aria-pressed={currentSetIndex === idx}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        currentSetIndex === idx
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <span className="font-medium">{set.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {set.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${gradientText} text-white font-semibold hover:opacity-90 transition-all`}
              >
                {conv.begin ?? 'Begin'}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER: Set Intro ---
  if (gamePhase === 'set-intro') {
    return (
      <div className={`${chrome} bg-gradient-to-b from-rose-50/40 to-transparent dark:from-rose-950/10`}>
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${card} p-8 text-center`}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 mb-6">
                <span className="text-3xl font-bold text-white">{currentSetIndex + 1}</span>
              </div>

              <h2 className="text-3xl font-bold mb-2">{currentSet.name}</h2>
              <h3 className="text-xl text-muted-foreground mb-4">{currentSet.subtitle}</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">{currentSet.description}</p>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Clock className="w-4 h-4" />
                <span>{currentSet.questions.length} {conv.questions ?? 'questions'}</span>
              </div>

              <button
                onClick={handleSetIntroContinue}
                className={`px-8 py-3 rounded-xl bg-gradient-to-r ${gradientText} text-white font-semibold hover:opacity-90 transition-all`}
              >
                {conv.start_set ?? 'Start'} {currentSet.name}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER: Playing ---
  if (gamePhase === 'playing' && currentQuestion) {
    const questionKey = `${currentQuestion.id}-${currentPlayer}`

    return (
      <div className={`${chrome} bg-gradient-to-b from-rose-50/40 to-transparent dark:from-rose-950/10`}>
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link href={`/${lang}/games`} aria-label={conv.back_to_games ?? 'Back to Games'} className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span role="timer">{formatTime(elapsed)}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300`}>
                  {currentSet.name}
                </span>
                <span>{globalQuestionIndex + 1} / {totalQuestions}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((globalQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Player Turn Indicator (Duo mode) */}
            {gameMode === 'duo' && (
              <motion.div
                key={questionKey}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                aria-live="polite"
                className="text-center mb-4"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-medium">
                  <User className="w-4 h-4" />
                  {playerNames[currentPlayer]}{conv.s_turn ?? "'s turn"}
                </span>
                {duoSkipNotice && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {tpl(conv.duo_skip_notice ?? 'Question skipped for both players', {})}
                  </p>
                )}
              </motion.div>
            )}

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={questionKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`${card} p-8 mb-6`}
              >
                <div className="text-sm text-muted-foreground mb-3">
                  {conv.question ?? 'Question'} {currentQuestion.number}
                </div>
                <h2 className="text-xl font-semibold mb-6 leading-relaxed">{currentQuestion.text}</h2>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  aria-label={conv.type_answer ?? 'Type your answer here...'}
                  placeholder={conv.type_answer ?? 'Type your answer here...'}
                  className="w-full h-32 px-4 py-3 rounded-xl border bg-muted/20 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
                />

                <div className="flex gap-3">
                  <button
                    onClick={handleSkipWithNotice}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border text-muted-foreground hover:bg-muted transition-all"
                  >
                    <SkipForward className="w-4 h-4" />
                    {conv.skip ?? 'Skip'}
                  </button>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!answerText.trim()}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${gradientText} text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                  >
                    {conv.next ?? 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {skippedQuestions.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    {tpl(conv.skipped_n ?? "You've skipped {n} questions", { n: skippedQuestions.size })}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER: Set Complete ---
  if (gamePhase === 'set-complete') {
    return (
      <div className={`${chrome} bg-gradient-to-b from-rose-50/40 to-transparent dark:from-rose-950/10`}>
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${card} p-8 text-center`}
              aria-live="polite"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold mb-2">{conv.set_complete ?? 'Set Complete!'}</h2>
              <p className="text-muted-foreground mb-6">
                {tpl(conv.completed_set ?? 'You completed {set}', { set: currentSet.name })}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.answered}</div>
                  <div className="text-xs text-muted-foreground">{conv.answered ?? 'Answered'}</div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-muted-foreground">{stats.skipped}</div>
                  <div className="text-xs text-muted-foreground">{conv.skipped ?? 'Skipped'}</div>
                </div>
              </div>

              <button
                onClick={handleSetCompleteContinue}
                className={`px-8 py-3 rounded-xl bg-gradient-to-r ${gradientText} text-white font-semibold hover:opacity-90 transition-all`}
              >
                {conv.continue ?? 'Continue'} → {game.sets[currentSetIndex + 1]?.name}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER: Final Reflection (Eye Gaze) ---
  if (gamePhase === 'final-reflection') {
    const remaining = gazeDuration - gazeSeconds
    const progress = gazeDuration > 0 ? gazeSeconds / gazeDuration : 0
    const circumference = 2 * Math.PI * 90

    return (
      <div className={`${chrome} bg-gradient-to-b from-rose-50/40 to-transparent dark:from-rose-950/10`}>
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${card} p-8 text-center`}
            >
              <Eye className="w-12 h-12 mx-auto mb-4 text-rose-500" />
              <h2 className="text-3xl font-bold mb-2">{game.finalExercise.title}</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">{game.finalExercise.description}</p>

              {/* Timer Circle */}
              <div className="relative inline-flex items-center justify-center mb-8">
                <svg className="w-48 h-48 -rotate-90" aria-hidden="true">
                  <circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="none"
                    stroke="url(#gaze-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - progress) }}
                    transition={{ duration: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="gaze-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold" role="timer">{formatTime(remaining)}</span>
                  <span className="text-sm text-muted-foreground">{conv.remaining ?? 'remaining'}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center mb-6">
                <button
                  onClick={() => setGazeRunning(!gazeRunning)}
                  aria-pressed={gazeRunning}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${gradientText} text-white font-semibold hover:opacity-90 transition-all`}
                >
                  {gazeRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {gazeRunning ? (conv.pause ?? 'Pause') : (conv.start ?? 'Start')}
                </button>
                <button
                  onClick={() => {
                    setGazeSeconds(0)
                    setGazeRunning(false)
                  }}
                  aria-label={conv.restart ?? 'Reset'}
                  className="px-4 py-3 rounded-xl border hover:bg-muted transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleEyeGazeComplete}
                className="text-muted-foreground hover:text-primary text-sm underline"
              >
                {conv.skip_to_end ?? 'Skip to results'}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER: Complete ---
  if (gamePhase === 'complete') {
    return (
      <div className={`${chrome} bg-gradient-to-b from-rose-50/40 to-transparent dark:from-rose-950/10`}>
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${card} p-8 text-center`}
              aria-live="polite"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 mb-6"
              >
                <Heart className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold mb-2">{conv.session_complete ?? 'Session Complete!'}</h2>
              <p className="text-muted-foreground mb-8">
                {tpl(conv.thank_you ?? 'Thank you for sharing this experience with {name}', {
                  name: gameMode === 'duo' ? playerNames.join(' & ') : playerNames[0],
                })}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.answered}</div>
                  <div className="text-xs text-muted-foreground">{conv.answered ?? 'Answered'}</div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-muted-foreground">{stats.skipped}</div>
                  <div className="text-xs text-muted-foreground">{conv.skipped ?? 'Skipped'}</div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-primary">{formatTime(elapsed)}</div>
                  <div className="text-xs text-muted-foreground">{conv.time ?? 'Time'}</div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border hover:bg-muted transition-all"
                >
                  <Download className="w-4 h-4" />
                  {conv.export_answers ?? 'Download Answers'}
                </button>
                <button
                  onClick={handleRestart}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${gradientText} text-white font-semibold hover:opacity-90 transition-all`}
                >
                  <RotateCcw className="w-4 h-4" />
                  {conv.play_again ?? 'Play Again'}
                </button>
              </div>

              <Link
                href={`/${lang}/games`}
                className="inline-flex items-center gap-2 mt-4 text-muted-foreground hover:text-primary"
              >
                {conv.more_games ?? 'More Games'}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

/** id → question lookup, built once per export call instead of per entry. */
function buildQuestionMap(game: ConversationGame): Map<string, { text: string }> {
  const map = new Map<string, { text: string }>()
  for (const set of game.sets) {
    for (const q of set.questions) map.set(q.id, q)
  }
  return map
}
