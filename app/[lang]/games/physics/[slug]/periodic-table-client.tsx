'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Atom } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from '@/components/navigation/AppLink'
import { tpl } from '@/lib/games/tpl'
import { useSafeTimeouts } from '@/lib/games/use-safe-timeouts'
import { getGameBest, saveGameBestIfNew, GAME_ID } from '@/lib/games/storage'

export interface PeriodicElement {
  symbol: string
  name: string
  number: number
  group: number
  period: number
  category: string
  locales?: { [locale: string]: { name?: string } }
}

type Mode = 'symbol-to-name' | 'name-to-symbol' | 'number-to-element' | 'element-to-number'

interface Question {
  prompt: string
  correct: string
  options: string[]
  mode: Mode
}

interface PeriodicTableGameData {
  title: string
  description: string
  modes?: Mode[]
  elements?: PeriodicElement[]
}

interface PeriodicTableClientProps {
  lang: Locale
  game: PeriodicTableGameData
  dict: any
}

function generateOptions(correct: string, allOptions: string[]): string[] {
  const opts = new Set<string>([correct])
  while (opts.size < 4) {
    opts.add(allOptions[Math.floor(Math.random() * allOptions.length)])
  }
  return Array.from(opts).sort(() => Math.random() - 0.5).slice(0, 4).sort(() => Math.random() - 0.5)
}

/**
 * Number distractors sampled *near* the correct value instead of inside
 * `1..elements.length`: with elements numbered up to 92, decoys bounded by 28
 * made the correct answer instantly recognizable (the only option above 28).
 */
function generateNumberOptions(correct: number): string[] {
  const opts = new Set<string>([correct.toString()])
  let guard = 0
  while (opts.size < 4 && guard++ < 100) {
    // ±1..12 window around the correct number, clamped to the valid range.
    const offset = (Math.floor(Math.random() * 24) + 1) - 12
    const candidate = correct + offset + (offset === 0 ? 1 : 0)
    if (candidate >= 1 && candidate <= 118) opts.add(candidate.toString())
  }
  // Exhaustive fallback (paranoia): fill remaining slots with any unique value.
  let candidate = 1
  while (opts.size < 4) {
    opts.add(candidate.toString())
    candidate++
  }
  return Array.from(opts).sort(() => Math.random() - 0.5).slice(0, 4).sort(() => Math.random() - 0.5)
}

export function PeriodicTableClient({ lang, game, dict }: PeriodicTableClientProps) {
  const [selectedModes, setSelectedModes] = useState<Mode[]>(['symbol-to-name', 'name-to-symbol'])
  const [questionCount, setQuestionCount] = useState(10)
  const [gameMode, setGameMode] = useState<'config' | 'playing' | 'complete'>('config')
  const [question, setQuestion] = useState<Question | null>(null)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)

  const { setSafeTimeout, clearAll } = useSafeTimeouts()
  // Stable references so callback/useMemo deps don't change every render.
  const elements = useMemo(() => game.elements ?? [], [game.elements])

  const g = useMemo(() => dict?.games ?? {}, [dict])
  const pt = useMemo(() => g?.periodic_table ?? {}, [g])

  // Element names are localized through the per-element `locales` map in the
  // game JSON; English is the fallback for locales without a translation.
  const elementName = useCallback(
    (element: PeriodicElement) => element.locales?.[lang]?.name || element.name,
    [lang]
  )

  const modeLabels: Record<Mode, string> = useMemo(() => ({
    'symbol-to-name': pt.mode_symbol_name || 'Symbol → Name',
    'name-to-symbol': pt.mode_name_symbol || 'Name → Symbol',
    'number-to-element': pt.mode_number_element || 'Number → Element',
    'element-to-number': pt.mode_element_number || 'Element → Number',
  }), [pt])

  const prompts: Record<Mode, string> = useMemo(() => ({
    'symbol-to-name': pt.prompt_symbol_name || 'What element has the symbol "{symbol}"?',
    'name-to-symbol': pt.prompt_name_symbol || 'What is the symbol for "{name}"?',
    'number-to-element': pt.prompt_number_element || 'Which element has atomic number {number}?',
    'element-to-number': pt.prompt_element_number || 'What is the atomic number of "{name}"?',
  }), [pt])

  // Persist the result exactly once per completed round and refresh the shown
  // best score (the existing best already satisfies score >= bestScore).
  useEffect(() => {
    if (gameMode === 'complete') {
      saveGameBestIfNew(GAME_ID.periodicTable, 'score', score)
      setBestScore(getGameBest(GAME_ID.periodicTable, 'score'))
    }
    if (gameMode === 'config') {
      setBestScore(getGameBest(GAME_ID.periodicTable, 'score'))
    }
  }, [gameMode, score])

  const nextQuestion = useCallback(() => {
    const mode = selectedModes[Math.floor(Math.random() * selectedModes.length)]
    const element = elements[Math.floor(Math.random() * elements.length)]
    let q: Question

    switch (mode) {
      case 'symbol-to-name':
        q = {
          prompt: tpl(prompts['symbol-to-name'], { symbol: element.symbol }),
          correct: elementName(element),
          options: generateOptions(elementName(element), elements.map(elementName)),
          mode,
        }
        break
      case 'name-to-symbol':
        q = {
          prompt: tpl(prompts['name-to-symbol'], { name: elementName(element) }),
          correct: element.symbol,
          options: generateOptions(element.symbol, elements.map((e) => e.symbol)),
          mode,
        }
        break
      case 'number-to-element':
        q = {
          prompt: tpl(prompts['number-to-element'], { number: element.number }),
          correct: elementName(element),
          options: generateOptions(elementName(element), elements.map(elementName)),
          mode,
        }
        break
      case 'element-to-number':
        q = {
          prompt: tpl(prompts['element-to-number'], { name: elementName(element) }),
          correct: element.number.toString(),
          options: generateNumberOptions(element.number),
          mode,
        }
        break
    }
    setQuestion(q)
    setSelectedAnswer(null)
    setShowResult(false)
  }, [selectedModes, elements, prompts, elementName])

  const startGame = () => {
    clearAll()
    setGameMode('playing')
    setScore(0)
    setCorrect(0)
    setAnswered(0)
    setSelectedAnswer(null)
    setShowResult(false)
    nextQuestion()
  }

  const handleAnswer = (answer: string) => {
    if (showResult || !question) return
    setSelectedAnswer(answer)
    setShowResult(true)
    setAnswered((prev) => prev + 1)

    if (answer === question.correct) {
      setScore((prev) => prev + 10)
      setCorrect((prev) => prev + 1)
    }

    setSafeTimeout(() => {
      if (answered + 1 >= questionCount) {
        setGameMode('complete')
      } else {
        nextQuestion()
      }
    }, 1500)
  }

  // `answered` is the single source of truth: the previous implementation kept
  // a redundant `total` counter that was always incremented in lockstep.
  const total = answered
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  const quitGame = () => {
    clearAll()
    setGameMode('config')
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {g.back_to_games || 'Back to Games'}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-red-600 mb-4">
            <Atom className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
          {bestScore !== null && bestScore > 0 && gameMode === 'config' && (
            <p className="text-sm font-semibold text-primary mt-2">🏆 {tpl(g.best_score || 'Best Score: {score}', { score: bestScore })}</p>
          )}
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">{g.game_setup || 'Game Setup'}</h2>
            <div className="mb-6">
              <label className="block font-medium mb-3">{pt.quiz_modes || 'Quiz Modes'}</label>
              <div className="flex flex-wrap gap-2" role="group" aria-label={pt.quiz_modes || 'Quiz Modes'}>
                {(game.modes ?? []).map((mode: Mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]))}
                    aria-pressed={selectedModes.includes(mode)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedModes.includes(mode) ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {modeLabels[mode]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label htmlFor="pt-question-count" className="block font-medium mb-3">{tpl(pt.questions_with_n || 'Questions: {n}', { n: questionCount })}</label>
              <input
                id="pt-question-count"
                type="range"
                min={5}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <button onClick={startGame} disabled={selectedModes.length === 0} className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white text-lg font-bold hover:shadow-lg transition-all disabled:opacity-50">
              {g.start_quiz || 'Start Quiz'}
            </button>
          </div>
        )}

        {gameMode === 'playing' && question && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{tpl(g.question_of || 'Question {current} of {total}', { current: Math.min(answered + 1, questionCount), total: questionCount })}</span>
              <span className="text-sm font-semibold">{tpl(g.score_value || 'Score: {score}', { score })}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all" style={{ width: `${(answered / questionCount) * 100}%` }} />
            </div>

            <motion.div key={question.prompt + answered} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-card border rounded-2xl p-8 text-center mb-6">
              <div className="text-sm text-muted-foreground mb-2">{modeLabels[question.mode]}</div>
              <div className="text-2xl font-bold mb-8">{question.prompt}</div>

              {/* Single column on narrow screens: long localized element names
                  were clipped inside the fixed 2×2 grid. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={modeLabels[question.mode]}>
                {question.options.map((opt, i) => {
                  const isSelected = selectedAnswer === opt
                  const isCorrect = opt === question.correct
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      disabled={showResult}
                      aria-pressed={showResult && isSelected}
                      className={`p-4 rounded-xl text-lg font-semibold border-2 transition-all ${
                        showResult && isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700' :
                        showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700' :
                        isSelected ? 'border-primary bg-primary/10' :
                        'border-border hover:border-primary hover:bg-muted/50'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

              {showResult && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} aria-live="polite" className={`mt-6 text-lg font-semibold flex items-center justify-center gap-2 ${selectedAnswer === question.correct ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAnswer === question.correct ? <><CheckCircle2 className="w-6 h-6" /> {g.correct_exclamation || 'Correct!'}</> : <><XCircle className="w-6 h-6" /> {question.correct}</>}
                </motion.div>
              )}
            </motion.div>

            <button onClick={quitGame} className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> {g.quit || 'Quit'}
            </button>
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center" aria-live="polite">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{g.quiz_complete || 'Quiz Complete!'}</h2>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto my-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{correct}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.correct || 'Correct'}</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 rounded-xl p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{total - correct}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.wrong || 'Wrong'}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">{g.stats?.accuracy || 'Accuracy'}</div>
              </div>
            </div>
            <div className="text-2xl font-bold mb-6">{tpl(g.score_value || 'Score: {score}', { score })}</div>
            {bestScore !== null && score >= bestScore && score > 0 && (
              <p className="text-amber-600 font-semibold mb-4">🏆 {tpl(g.best_score || 'Best Score: {score}', { score: bestScore })} ★</p>
            )}
            <div className="flex gap-3">
              <button onClick={startGame} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">{g.play_again || 'Play Again'}</button>
              <button onClick={quitGame} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors">{g.back_to_games || 'Back to Games'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
