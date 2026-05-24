'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export interface LessonQuestion {
  id: string
  type: 'multiple-choice' | 'true-false'
  question: string
  options: string[]
  correct: number
  explanation?: string
}

interface QuestionBlockProps {
  data: LessonQuestion
}

export default function QuestionBlock({ data }: QuestionBlockProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const handleSelect = (index: number) => {
    if (answered) return
    setSelected(index)
  }

  const handleCheck = () => {
    if (selected === null) return
    setAnswered(true)
  }

  const handleReset = () => {
    setSelected(null)
    setAnswered(false)
  }

  const isCorrect = selected === data.correct

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm w-full max-w-full">
      <div className="bg-muted/50 px-4 sm:px-5 py-3 border-b flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-semibold text-foreground">Practice Question</span>
      </div>

      <div className="p-4 sm:p-6 [&_*]:break-words">
        <p className="font-medium text-foreground mb-4 leading-relaxed">{data.question}</p>

        <div className="space-y-2">
          {data.options.map((option, index) => {
            let variant = 'border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer'

            if (answered) {
              if (index === data.correct) {
                variant = 'border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default'
              } else if (index === selected && !isCorrect) {
                variant = 'border-red-500 bg-red-50 dark:bg-red-950/30 cursor-default'
              } else {
                variant = 'border-border opacity-60 cursor-default'
              }
            } else if (selected === index) {
              variant = 'border-primary bg-primary/5 cursor-pointer'
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                className={`w-full text-left flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors min-w-0 ${variant}`}
              >
                <span className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 ${
                  answered
                    ? index === data.correct
                      ? 'border-green-500 text-green-600 bg-green-100 dark:bg-green-900'
                      : index === selected && !isCorrect
                      ? 'border-red-500 text-red-600 bg-red-100 dark:bg-red-900'
                      : 'border-gray-300 text-gray-400'
                    : selected === index
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {answered && index === data.correct ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : answered && index === selected && !isCorrect ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>
                <span className={`text-sm sm:text-base leading-relaxed break-words hyphens-auto min-w-0 ${
                  answered && index === data.correct
                    ? 'font-medium text-green-800 dark:text-green-200'
                    : answered && index === selected && !isCorrect
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-foreground/90'
                }`}>
                  {option}
                </span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`mt-4 p-4 rounded-lg ${
            isCorrect
              ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
              : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-semibold text-sm ${
                isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {data.explanation && (
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed break-words">{data.explanation}</p>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {!answered ? (
            <button
              onClick={handleCheck}
              disabled={selected === null}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg bg-muted text-foreground hover:bg-accent transition-colors w-full sm:w-auto"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
