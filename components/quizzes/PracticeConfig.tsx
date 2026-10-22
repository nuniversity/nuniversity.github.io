'use client'

import { Filter, Target, Shuffle, Star } from 'lucide-react'

interface PracticeConfigProps {
  dict: any
  allDomains: string[]
  selectedDomains: string[]
  availableCount: number
  questionCount: number
  shuffle: boolean
  onToggleDomain: (domain: string) => void
  onSelectAllDomains: () => void
  onClearDomains: () => void
  onQuestionCountChange: (count: number) => void
  onShuffleToggle: () => void
  onStartPractice: () => void
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

export function PracticeConfig({
  dict,
  allDomains,
  selectedDomains,
  availableCount,
  questionCount,
  shuffle,
  onToggleDomain,
  onSelectAllDomains,
  onClearDomains,
  onQuestionCountChange,
  onShuffleToggle,
  onStartPractice,
}: PracticeConfigProps) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-400 text-xl font-bold">P</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1">
            {dict.quizzes?.home?.practice_title || 'Practice Quiz'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {dict.quizzes?.home?.practice_description ||
              'Choose your domains, question count, and get instant feedback after each answer. Perfect for focused study sessions.'}
          </p>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3 h-3" /> {dict.quizzes?.home?.domains || 'Domains'}
              </span>
              <button
                type="button"
                onClick={() =>
                  selectedDomains.length === allDomains.length ? onClearDomains() : onSelectAllDomains()
                }
                className="text-xs text-primary hover:underline"
              >
                {selectedDomains.length === allDomains.length
                  ? dict.quizzes?.home?.deselect_all || 'Deselect all'
                  : dict.quizzes?.home?.select_all || 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allDomains.map(domain => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => onToggleDomain(domain)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    selectedDomains.includes(domain)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary'
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {tpl(dict.quizzes?.home?.available || '{n} questions available', { n: availableCount })}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3 h-3" /> {dict.quizzes?.home?.question_count || 'Questions'}
              </span>
              <input
                type="range"
                min={5}
                max={Math.min(availableCount, 100)}
                step={5}
                value={Math.min(questionCount, availableCount)}
                onChange={e => onQuestionCountChange(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="font-bold text-xl w-8 text-right">{Math.min(questionCount, availableCount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Shuffle className="w-3 h-3" /> {dict.quizzes?.home?.shuffle || 'Shuffle'}
            </span>
            <button
              type="button"
              onClick={onShuffleToggle}
              aria-pressed={shuffle}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${shuffle ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${shuffle ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={onStartPractice}
            disabled={selectedDomains.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            {tpl(dict.quizzes?.home?.start_practice || 'Start Practice — {n} Questions', {
              n: Math.min(questionCount, availableCount),
            })}
          </button>
        </div>
      </div>
    </div>
  )
}
