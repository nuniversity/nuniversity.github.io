'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { ArrowLeft, RotateCcw, Download, Upload, BarChart3, Sparkles, Eye, EyeOff, Volume2 } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { VocabularyGame, VocabularyWord } from '@/lib/games/get-game-content'
import Link from 'next/link'

interface FlashcardGameClientProps {
  lang: Locale
  game: VocabularyGame
  dict: any
}

interface FlashcardProgress {
  streak: number
  totalReviews: number
  lastReviewed: number
}

type StudyMode = 'all' | 'new' | 'learning' | 'learned'

const LEARNED_THRESHOLD = 3
const SWIPE_THRESHOLD = 100

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

function migrateOldFormat(data: Record<string, any>): { result: Record<string, FlashcardProgress>; migrated: boolean } {
  let migrated = false
  const result: Record<string, FlashcardProgress> = {}
  for (const [wordId, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && ('ease' in value || 'repetitions' in value)) {
      migrated = true
      const v = value as any
      const reps = v.repetitions ?? 0
      result[wordId] = {
        streak: reps >= LEARNED_THRESHOLD ? LEARNED_THRESHOLD : reps > 0 ? reps : 0,
        totalReviews: reps,
        lastReviewed: v.lastReviewed ?? v.nextReview ?? Date.now(),
      }
    } else if (value && typeof value === 'object' && 'streak' in value) {
      result[wordId] = value as FlashcardProgress
    }
  }
  return { result, migrated }
}

const cardVariants = {
  center: { x: 0, rotate: 0, opacity: 1, scale: 1 },
  exitRight: { x: 600, opacity: 0, rotate: 20, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const } },
  exitLeft: { x: -600, opacity: 0, rotate: -20, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const } },
}

export function FlashcardGameClient({ lang, game, dict }: FlashcardGameClientProps) {
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showPronunciation, setShowPronunciation] = useState(true)
  const [showExample, setShowExample] = useState(true)
  const [studyMode, setStudyMode] = useState<StudyMode>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, incorrect: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [importKey, setImportKey] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<number | null>(null)

  const fc = dict?.games?.flashcards ?? {}
  const storageKey = `flashcard_progress_${game.id}`
  const hasMountedRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const didDragRef = useRef(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12])
  const dragOpacity = useTransform(x, [-250, 0, 250], [0.5, 1, 0.5])
  const forgotOpacity = useTransform(x, [-200, -50], [1, 0])
  const rememberOpacity = useTransform(x, [50, 200], [0, 1])

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const raw = JSON.parse(saved)
        const { result, migrated } = migrateOldFormat(raw)
        setProgress(result)
        if (migrated) {
          setFeedback({ type: 'success', message: fc.import_migrated ?? 'Progress updated to new format!' })
        }
      } catch {}
    }
    hasMountedRef.current = true
  }, [storageKey])

  useEffect(() => {
    if (!hasMountedRef.current) return
    localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [progress, storageKey])

  const categories = useMemo(() => {
    const cats = new Set(game.words.map(w => w.context))
    return ['all', ...Array.from(cats)]
  }, [game.words])

  const contextLabels = game.contextLabels ?? {}

  // Stable shuffled order: only re-shuffles when mode or category changes, NOT on every progress update
  const [shuffledIds, setShuffledIds] = useState<string[]>([])
  const prevModeRef = useRef<string>('')
  const prevCategoryRef = useRef<string>('')

  useEffect(() => {
    const modeKey = `${studyMode}-${selectedCategory}`
    if (prevModeRef.current === modeKey && shuffledIds.length > 0) return
    prevModeRef.current = modeKey
    const words = game.words.filter(w => selectedCategory === 'all' || w.context === selectedCategory)
    // "learning" preserves original order; "new" and "learned" are shuffled
    if (studyMode === 'learning') {
      setShuffledIds(words.map(w => w.id))
    } else {
      setShuffledIds(shuffleArray(words.map(w => w.id)))
    }
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsComplete(false)
  }, [studyMode, selectedCategory, game.words])

  const filteredWords = useMemo(() => {
    const wordMap = new Map(game.words.map(w => [w.id, w]))
    return shuffledIds
      .map(id => wordMap.get(id)!)
      .filter(Boolean)
      .filter(w => {
        switch (studyMode) {
          case 'new': return !progress[w.id]
          case 'learning': return progress[w.id] && progress[w.id].streak < LEARNED_THRESHOLD
          case 'learned': return progress[w.id] && progress[w.id].streak >= LEARNED_THRESHOLD
          default: return true
        }
      })
  }, [shuffledIds, game.words, studyMode, progress])

  const currentWord = filteredWords[currentIndex]

  useEffect(() => {
    if (filteredWords.length > 0 && currentIndex >= filteredWords.length) {
      setIsComplete(true)
    } else if (filteredWords.length > 0 && currentIndex < filteredWords.length) {
      setIsComplete(false)
    }
  }, [currentIndex, filteredWords.length])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  const handleSwipe = (direction: number) => {
    if (!currentWord || isAnimatingRef.current) return
    isAnimatingRef.current = true

    const prev = progress[currentWord.id]
    const newStreak = direction > 0 ? (prev?.streak ?? 0) + 1 : 0

    setProgress(p => ({
      ...p,
      [currentWord.id]: {
        streak: newStreak,
        totalReviews: (prev?.totalReviews ?? 0) + 1,
        lastReviewed: Date.now(),
      }
    }))

    setSessionStats(s => ({
      ...s,
      reviewed: s.reviewed + 1,
      correct: direction > 0 ? s.correct + 1 : s.correct,
      incorrect: direction < 0 ? s.incorrect + 1 : s.incorrect,
    }))

    setIsFlipped(false)
    setSwipeDirection(direction)

    setTimeout(() => {
      setCurrentIndex(i => i + 1)
      setSwipeDirection(null)
      isAnimatingRef.current = false
    }, 50)
  }

  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (isAnimatingRef.current) return

    if (info.offset.x > SWIPE_THRESHOLD) {
      didDragRef.current = true
      setTimeout(() => { didDragRef.current = false }, 100)
      handleSwipe(1)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      didDragRef.current = true
      setTimeout(() => { didDragRef.current = false }, 100)
      handleSwipe(-1)
    }
  }

  const handleCardClick = () => {
    if (didDragRef.current) return
    setIsFlipped(prev => !prev)
  }

  const doReset = () => {
    setProgress({})
    setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 })
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsComplete(false)
  }

  const resetProgress = () => {
    if (confirm(fc.reset_confirm ?? 'Reset all progress?')) {
      doReset()
      setFeedback({ type: 'success', message: fc.reset_success ?? 'Progress reset!' })
    }
  }

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${game.id}-progress.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
    setFeedback({ type: 'success', message: fc.export_success ?? 'Progress exported!' })
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string)
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
          throw new Error('Invalid format')
        }
        const { result, migrated } = migrateOldFormat(raw)
        setProgress(result)
        setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 })
        setCurrentIndex(0)
        setIsFlipped(false)
        setIsComplete(false)
        setFeedback({
          type: 'success',
          message: migrated
            ? (fc.import_migrated ?? 'Progress imported and updated to new format!')
            : (fc.import_success ?? 'Progress imported successfully!')
        })
      } catch {
        setFeedback({ type: 'error', message: fc.import_error ?? 'Failed to import: invalid file format' })
      }
      setImportKey(k => k + 1)
    }
    reader.onerror = () => {
      setFeedback({ type: 'error', message: fc.import_error ?? 'Failed to read file' })
      setImportKey(k => k + 1)
    }
    reader.readAsText(file)
  }

  const stats = useMemo(() => {
    const total = game.words.length
    const newCount = game.words.filter(w => !progress[w.id]).length
    const learning = game.words.filter(w => progress[w.id] && progress[w.id].streak < LEARNED_THRESHOLD).length
    const learned = game.words.filter(w => progress[w.id] && progress[w.id].streak >= LEARNED_THRESHOLD).length
    return { total, newCount, learning, learned }
  }, [game.words, progress])

  const getGoogleImagesUrl = (word: string) => `https://www.google.com/search?q=${encodeURIComponent(`${word} + significado`)}&tbm=isch`
  const getPronunciationUrl = (word: string, fromLang: string, toLang: string) => {
    const params = new URLSearchParams({
      sl: fromLang,
      tl: toLang,
      text: word,
      op: 'translations',
      hl: lang,
    })
    return `https://translate.google.com/?${params.toString()}`
  }

  const boxConfigs = [
    { mode: 'all' as StudyMode, count: stats.total, label: fc.mode_all ?? 'All', color: 'indigo', bgActive: 'bg-indigo-600', borderActive: 'border-indigo-600', textActive: 'text-indigo-600' },
    { mode: 'new' as StudyMode, count: stats.newCount, label: fc.new ?? 'New', color: 'green', bgActive: 'bg-green-600', borderActive: 'border-green-600', textActive: 'text-green-600' },
    { mode: 'learning' as StudyMode, count: stats.learning, label: fc.learning ?? 'Learning', color: 'blue', bgActive: 'bg-blue-600', borderActive: 'border-blue-600', textActive: 'text-blue-600' },
    { mode: 'learned' as StudyMode, count: stats.learned, label: fc.learned ?? 'Learned', color: 'purple', bgActive: 'bg-purple-600', borderActive: 'border-purple-600', textActive: 'text-purple-600' },
  ]

  if (showStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {feedback.message}
          </div>
        )}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setShowStats(false)} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-2xl font-bold">{fc.statistics ?? 'Statistics'}</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: fc.total ?? 'Total', value: stats.total, color: 'text-indigo-600' },
                { label: fc.new ?? 'New', value: stats.newCount, color: 'text-green-600' },
                { label: fc.learning ?? 'Learning', value: stats.learning, color: 'text-blue-600' },
                { label: fc.learned ?? 'Learned', value: stats.learned, color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{fc.current_session ?? 'Current Session'}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><div className="text-2xl font-bold text-indigo-600">{sessionStats.reviewed}</div><div className="text-xs text-gray-500">{fc.reviewed ?? 'Reviewed'}</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div><div className="text-xs text-gray-500">{fc.correct ?? 'Correct'}</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div><div className="text-xs text-gray-500">{fc.errors ?? 'Errors'}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.message}
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href={`/${lang}/games`} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold flex-1 truncate">{game.title}</h1>
          <div className="flex gap-1">
            <button onClick={() => setShowStats(true)} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><BarChart3 className="w-4 h-4" /></button>
            <button onClick={exportProgress} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><Download className="w-4 h-4" /></button>
            <label className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"><Upload className="w-4 h-4" /><input key={importKey} type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
            <button onClick={resetProgress} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {boxConfigs.map(box => {
            const isActive = studyMode === box.mode
            return (
              <button
                key={box.mode}
                onClick={() => setStudyMode(box.mode)}
                className={`flex-1 py-3 px-2 rounded-xl text-center transition-all duration-200 cursor-pointer select-none ${
                  isActive
                    ? `${box.bgActive} text-white shadow-lg ring-2 ring-offset-2 ring-${box.color}-300 dark:ring-${box.color}-700`
                    : `bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-${box.color}-400 hover:shadow-md active:scale-95`
                }`}
              >
                <div className={`text-2xl font-extrabold ${isActive ? 'text-white' : box.textActive}`}>{box.count}</div>
                <div className={`text-[11px] font-semibold mt-0.5 ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>{box.label}</div>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 mb-4">
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? (fc.all_categories ?? 'All categories') : (contextLabels[c]?.[lang] ?? c)}</option>)}
          </select>
        </div>

        {filteredWords.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
            <h2 className="text-xl font-bold mb-2">{fc.no_cards ?? 'No cards available'}</h2>
            <p className="text-gray-500">{fc.no_cards_hint ?? 'Try another mode or category.'}</p>
          </div>
        ) : isComplete ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            <h2 className="text-2xl font-bold mb-2">{fc.session_complete ?? 'Session complete!'}</h2>
            <p className="text-gray-500 mb-2">{t(fc.reviewed_n_cards ?? 'You reviewed {n} cards this session.', { n: sessionStats.reviewed })}</p>
            <p className="text-sm text-gray-400 mb-6">{t(fc.n_correct_n_errors ?? '{n} correct \u00b7 {n} errors', { n: sessionStats.correct, n2: sessionStats.incorrect })}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setCurrentIndex(0); setIsComplete(false); setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 }) }} className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">{fc.restart ?? 'Restart'}</button>
              <button onClick={() => setShowStats(true)} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">{fc.view_statistics ?? 'View Statistics'}</button>
            </div>
          </div>
        ) : currentWord ? (
          <div>
            <div className="text-center mb-3">
              <span className="text-sm text-gray-500">{t(fc.progress_of ?? '{current} of {total}', { current: currentIndex + 1, total: filteredWords.length })}</span>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                <div className="h-1.5 bg-indigo-600 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / filteredWords.length) * 100}%` }} />
              </div>
            </div>

            <div style={{ touchAction: 'pan-y' }} className="mb-6">
              <AnimatePresence mode="wait" custom={swipeDirection}>
                <motion.div
                  key={currentIndex}
                  variants={cardVariants}
                  initial="center"
                  animate="center"
                  exit={swipeDirection !== null ? (swipeDirection > 0 ? 'exitRight' : 'exitLeft') : 'center'}
                  custom={swipeDirection}

                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  dragMomentum={false}
                  onDragEnd={onDragEnd}
                  style={{ x, rotate, opacity: dragOpacity }}
                  whileDrag={{ scale: 1.02, cursor: 'grabbing' }}

                  onClick={handleCardClick}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 min-h-[320px] flex flex-col items-center justify-center text-center border-2 border-indigo-200 dark:border-indigo-800 relative cursor-grab active:cursor-grabbing select-none"
                >
                  <motion.div
                    style={{ opacity: forgotOpacity }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-bold text-lg pointer-events-none"
                  >
                    {fc.forgot ?? 'Forgot'}
                  </motion.div>
                  <motion.div
                    style={{ opacity: rememberOpacity }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 font-bold text-lg pointer-events-none"
                  >
                    {fc.remember ?? 'Remember'}
                  </motion.div>

                  {!isFlipped ? (
                    <>
                      <div className="absolute top-3 right-3 flex gap-1">
                        <a href={getPronunciationUrl(currentWord.source, game.language_pair.source, game.language_pair.target)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600" title={fc.listen_pronunciation ?? 'Listen pronunciation'}>
                          <Volume2 className="w-5 h-5" />
                        </a>
                        <a href={getGoogleImagesUrl(currentWord.source)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600" title={fc.view_images ?? 'View images'}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        </a>
                      </div>
                      {currentWord.emoji && <span className="text-5xl mb-4">{currentWord.emoji}</span>}
                      <h2 className="text-3xl font-bold mb-3">{currentWord.source}</h2>
                      {showPronunciation && currentWord.pronunciation && <p className="text-sm text-indigo-600 dark:text-indigo-400 italic mb-2">🗣 {currentWord.pronunciation}</p>}
                      <p className="text-sm text-gray-400">{fc.tap_to_translate ?? 'Tap to see translation'}</p>
                    </>
                  ) : (
                    <>
                      <div className="absolute top-3 right-3 flex gap-1">
                        <a href={getPronunciationUrl(currentWord.target, game.language_pair.target, game.language_pair.source)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-purple-600" title={fc.listen_pronunciation ?? 'Listen pronunciation'}>
                          <Volume2 className="w-5 h-5" />
                        </a>
                      </div>
                      {currentWord.emoji && <span className="text-4xl mb-3">{currentWord.emoji}</span>}
                      <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">{currentWord.target}</h2>
                      <p className="text-lg text-gray-500 mb-2">{currentWord.source}</p>
                      {currentWord.pronunciation && <p className="text-sm text-indigo-600 dark:text-indigo-400 italic mb-2">🗣 {currentWord.pronunciation}</p>}
                      {showExample && currentWord.example && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl max-w-sm">
                          <p className="text-sm italic text-gray-600 dark:text-gray-300">&ldquo;{currentWord.example}&rdquo;</p>
                          {currentWord.exampleTranslation && <p className="text-xs text-gray-400 mt-1">{currentWord.exampleTranslation}</p>}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{fc.categories_label ?? 'Categories:'} {currentWord.context}</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <button onClick={() => setShowPronunciation(!showPronunciation)} className={`p-2 rounded-lg text-xs ${showPronunciation ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {showPronunciation ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} {fc.pronunciation ?? 'Pronunciation'}
              </button>
              <button onClick={() => setShowExample(!showExample)} className={`p-2 rounded-lg text-xs ${showExample ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {showExample ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} {fc.example ?? 'Example'}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-2">{fc.swipe_hint ?? '← Forgot · Remember →'}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
