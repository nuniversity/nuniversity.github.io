'use client'

import { CheckCircle2, XCircle, ChevronUp, ChevronDown, X } from 'lucide-react'
import type { QuizQuestion, QuizResponse } from '@/lib/quizzes/types'
import { emptyResponse, gradeAnswer, isAnswered, responseFor } from '@/lib/quizzes/grade'

export interface QuestionBodyProps {
  question: QuizQuestion
  response?: QuizResponse | null
  onChange?: (response: QuizResponse) => void
  mode?: 'interactive' | 'reveal'
  dict?: any
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

function letterLabel(index: number): string {
  return String.fromCharCode(65 + index)
}

function optionLetterClass(state: 'correct' | 'wrong' | 'idle'): string {
  if (state === 'correct') return 'bg-green-500 text-white'
  if (state === 'wrong') return 'bg-red-500 text-white'
  return 'bg-muted text-muted-foreground'
}

function SingleAnswerView({ question, response, onChange, mode, dict }: Required<Pick<QuestionBodyProps, 'question' | 'mode'>> & { response: QuizResponse; onChange?: (r: QuizResponse) => void; dict?: any }) {
  const selected = response.type === 'mcq' || response.type === 'tf' ? response.selected : null
  const correct = (question as Extract<QuizQuestion, { type: 'mcq' | 'tf' }>).correct
  const revealed = mode === 'reveal'
  const correctSet = new Set([correct])

  return (
    <div className="space-y-3" role="radiogroup" aria-label={dict?.quizzes?.body?.q_group || 'Answer options'}>
      {question.options.map((option, idx) => {
        const isCorrect = correctSet.has(idx)
        const isSelected = selected === idx
        let state: 'correct' | 'wrong' | 'idle' = 'idle'
        if (revealed) {
          if (isCorrect) state = 'correct'
          else if (isSelected) state = 'wrong'
        }
        const cls =
          state === 'correct'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : state === 'wrong'
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : revealed
            ? 'border-border bg-background opacity-50'
            : isSelected
            ? 'border-primary bg-primary/10'
            : 'border-border bg-background hover:border-primary hover:bg-muted/50 cursor-pointer'
        return (
          <button
            key={idx}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={revealed}
            onClick={() => onChange?.({ type: question.type === 'tf' ? 'tf' : 'mcq', selected: idx })}
            className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${cls}`}
          >
            <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${optionLetterClass(state)}`}>
              {letterLabel(idx)}
            </span>
            <span className="flex-1 font-medium break-words">{option}</span>
            {state === 'correct' && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
            {state === 'wrong' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}

function MultiAnswerView({ question, response, onChange, mode, dict }: Required<Pick<QuestionBodyProps, 'question' | 'mode'>> & { response: QuizResponse; onChange?: (r: QuizResponse) => void; dict?: any }) {
  const selected = response.type === 'multi' ? response.selected : []
  const correct = question.type === 'multi' ? question.correct : []
  const revealed = mode === 'reveal'
  const correctSet = new Set(correct)
  const selectedSet = new Set(selected)

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {dict?.quizzes?.body?.q_select_all || 'Select all that apply'}
      </p>
      <div className="space-y-3" role="group" aria-label={dict?.quizzes?.body?.q_select_all || 'Select all that apply'}>
        {question.options.map((option, idx) => {
          const isCorrect = correctSet.has(idx)
          const isSelected = selectedSet.has(idx)
          let state: 'correct' | 'wrong' | 'idle' = 'idle'
          if (revealed) {
            if (isCorrect) state = 'correct'
            else if (isSelected) state = 'wrong'
          }
          const cls =
            state === 'correct'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : state === 'wrong'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : revealed
              ? 'border-border bg-background opacity-50'
              : isSelected
              ? 'border-primary bg-primary/10 cursor-pointer'
              : 'border-border bg-background hover:border-primary hover:bg-muted/50 cursor-pointer'
          return (
            <button
              key={idx}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={revealed}
              onClick={() => {
                const next = isSelected ? selected.filter(v => v !== idx) : [...selected, idx]
                next.sort((a, b) => a - b)
                onChange?.({ type: 'multi', selected: next })
              }}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${cls}`}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${optionLetterClass(state)}`}>
                {letterLabel(idx)}
              </span>
              <span className="flex-1 font-medium break-words">{option}</span>
              {state === 'correct' && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
              {state === 'wrong' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function OrderingView({ question, response, onChange, mode, dict }: Required<Pick<QuestionBodyProps, 'question' | 'mode'>> & { response: QuizResponse; onChange?: (r: QuizResponse) => void; dict?: any }) {
  const sequence = response.type === 'ordering' ? response.sequence : []
  const revealed = mode === 'reveal'
  const correct = question.type === 'ordering' ? question.correct : []
  const isCorrect = revealed && gradeAnswer(question, response)
  const available = question.options
    .map((option, index) => ({ option, index }))
    .filter(entry => !sequence.includes(entry.index))

  const move = (position: number, delta: number) => {
    const target = position + delta
    if (target < 0 || target >= sequence.length) return
    const next = [...sequence]
    const tmp = next[position]
    next[position] = next[target]
    next[target] = tmp
    onChange?.({ type: 'ordering', sequence: next })
  }

  return (
    <div>
      <div className="mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {dict?.quizzes?.body?.q_available || 'Available responses'}
        </p>
        <div className="flex flex-wrap gap-2 min-h-[2.75rem] rounded-xl border border-dashed border-border p-2">
          {available.length === 0 && (
            <span className="text-xs text-muted-foreground self-center">
              {dict?.quizzes?.body?.q_all_used || 'All responses placed'}
            </span>
          )}
          {available.map(({ option, index }) => (
            <button
              key={index}
              type="button"
              disabled={revealed}
              onClick={() => onChange?.({ type: 'ordering', sequence: [...sequence, index] })}
              className="text-sm font-medium px-3 py-2 rounded-lg border-2 border-border bg-background hover:border-primary hover:bg-muted/50 transition-all break-words"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {dict?.quizzes?.body?.q_your_order || 'Your order'}
        </p>
        <div className="space-y-2 rounded-xl border-2 border-border bg-muted/30 p-2 min-h-[3.5rem]">
          {sequence.length === 0 && (
            <p className="text-xs text-muted-foreground p-2 text-center">
              {dict?.quizzes?.body?.q_add_hint || 'Select a response above to add it to your order'}
            </p>
          )}
          {sequence.map((optionIndex, position) => {
            const itemState: 'correct' | 'wrong' | 'idle' = revealed
              ? correct[position] === optionIndex ? 'correct' : 'wrong'
              : 'idle'
            return (
              <div
                key={`${optionIndex}-${position}`}
                className={`flex items-center gap-2 p-2.5 rounded-lg border-2 bg-background ${
                  itemState === 'correct' ? 'border-green-500' : itemState === 'wrong' ? 'border-red-500' : 'border-border'
                }`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${optionLetterClass(itemState)}`}>
                  {position + 1}
                </span>
                <span className="flex-1 text-sm font-medium break-words">{question.options[optionIndex]}</span>
                {!revealed && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      aria-label={tpl(dict?.quizzes?.body?.q_up || 'Move up {n}', { n: position + 1 })}
                      disabled={position === 0}
                      onClick={() => move(position, -1)}
                      className="p-1.5 rounded-md border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={tpl(dict?.quizzes?.body?.q_down || 'Move down {n}', { n: position + 1 })}
                      disabled={position === sequence.length - 1}
                      onClick={() => move(position, 1)}
                      className="p-1.5 rounded-md border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={tpl(dict?.quizzes?.body?.q_remove || 'Remove {n}', { n: position + 1 })}
                      onClick={() => onChange?.({ type: 'ordering', sequence: sequence.filter((_, i) => i !== position) })}
                      className="p-1.5 rounded-md border hover:bg-muted hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {revealed && !isCorrect && correct.length > 0 && (
        <div className="mt-3 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-3">
          <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1.5">
            {dict?.quizzes?.body?.q_correct_order || 'Correct order'}
          </p>
          <ol className="space-y-1">
            {correct.map((optionIndex, position) => (
              <li key={optionIndex} className="text-sm text-foreground/80 break-words">
                {position + 1}. {question.options[optionIndex]}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function MatchingView({ question, response, onChange, mode, dict }: Required<Pick<QuestionBodyProps, 'question' | 'mode'>> & { response: QuizResponse; onChange?: (r: QuizResponse) => void; dict?: any }) {
  const pairs = response.type === 'matching' ? response.pairs : []
  const revealed = mode === 'reveal'
  const correct = question.type === 'matching' ? question.correct : []
  const promptCount = question.type === 'matching' ? question.prompts.length : 0

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {dict?.quizzes?.body?.q_match_hint || 'Match each prompt to the correct response'}
      </p>
      {Array.from({ length: promptCount }, (_, promptIndex) => {
        const assigned = pairs[promptIndex] ?? null
        const state: 'correct' | 'wrong' | 'idle' = revealed
          ? correct[promptIndex] === assigned ? 'correct' : 'wrong'
          : 'idle'
        return (
          <div
            key={promptIndex}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border-2 bg-background ${
              state === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : state === 'wrong' ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-border'
            }`}
          >
            <span className="flex-1 text-sm font-medium break-words min-w-0">
              {question.type === 'matching' ? question.prompts[promptIndex] : ''}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={assigned === null ? '' : String(assigned)}
                disabled={revealed}
                aria-label={tpl(dict?.quizzes?.body?.q_match_select || 'Match for prompt {n}', { n: promptIndex + 1 })}
                onChange={event => {
                  const value = event.target.value
                  const next = [...pairs]
                  next[promptIndex] = value === '' ? null : Number(value)
                  onChange?.({ type: 'matching', pairs: next })
                }}
                className="text-sm rounded-lg border-2 border-border bg-background px-3 py-2 min-w-[10rem] focus:outline-none focus:border-primary disabled:opacity-70"
              >
                <option value="">{dict?.quizzes?.body?.q_match_placeholder || 'Select a match…'}</option>
                {question.options.map((option, optionIndex) => (
                  <option key={optionIndex} value={String(optionIndex)}>{option}</option>
                ))}
              </select>
              {state === 'correct' && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
              {state === 'wrong' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            </div>
          </div>
        )
      })}
      {revealed && question.type === 'matching' && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-3">
          <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1.5">
            {dict?.quizzes?.body?.q_correct_pairs || 'Correct matches'}
          </p>
          <ul className="space-y-1">
            {question.prompts.map((prompt, promptIndex) => (
              <li key={promptIndex} className="text-sm text-foreground/80 break-words">
                {prompt} → {question.options[correct[promptIndex]]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function QuestionBody({ question, response, onChange, mode = 'interactive', dict }: QuestionBodyProps) {
  const normalized = responseFor(question, response ?? null)
  const interactiveProps = { question, response: normalized, onChange, mode, dict }

  if (question.type === 'multi') {
    return <MultiAnswerView {...interactiveProps} />
  }
  if (question.type === 'ordering') {
    return <OrderingView {...interactiveProps} />
  }
  if (question.type === 'matching') {
    return <MatchingView {...interactiveProps} />
  }
  return <SingleAnswerView {...interactiveProps} />
}

export function questionResponseState(question: QuizQuestion, response: QuizResponse | null): 'blank' | 'staged' | 'checked-correct' | 'checked-wrong' {
  if (!isAnswered(question, response)) return 'blank'
  if (gradeAnswer(question, response)) return 'checked-correct'
  return 'checked-wrong'
}

export { emptyResponse }
