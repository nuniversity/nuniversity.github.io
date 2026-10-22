'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, Layers } from 'lucide-react'

interface BucketDropQuestionProps {
  question: string
  instructions?: string
  buckets: Array<{ label: string; items: string[] }>
  explanation?: string
  dict?: any
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function BucketDropQuestion({ question, instructions, buckets, explanation, dict }: BucketDropQuestionProps) {
  const w = dict?.widgets
  const b = w?.bucket_drop
  const allItems = useMemo(() => buckets.flatMap(bucket => bucket.items), [buckets])
  const [order, setOrder] = useState<string[]>(() => shuffle(allItems))
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const pool = order.filter(item => !(item in placements))
  const correctLabelOf = (item: string) => buckets.find(bucket => bucket.items.includes(item))?.label
  const isItemCorrect = (item: string) => {
    const bucketLabel = placements[item]
    if (!bucketLabel) return false
    const bucket = buckets.find(candidate => candidate.label === bucketLabel)
    return !!bucket && bucket.items.includes(item)
  }

  const placedItemsOf = (label: string) => order.filter(item => placements[item] === label)
  const isBucketCorrect = (label: string) => {
    const bucket = buckets.find(candidate => candidate.label === label)
    if (!bucket) return false
    return placedItemsOf(label).every(isItemCorrect) && bucket.items.every(item => placements[item] === label)
  }

  const correctCount = allItems.filter(isItemCorrect).length
  const allCorrect = correctCount === allItems.length

  const clearFeedback = () => {
    if (checked) setChecked(false)
  }

  const handlePoolClick = (item: string) => {
    clearFeedback()
    setSelected(prev => (prev === item ? null : item))
  }

  const handleBucketClick = (label: string) => {
    if (!selected) return
    clearFeedback()
    setPlacements(prev => ({ ...prev, [selected]: label }))
    setSelected(null)
  }

  const handleReturnClick = (item: string) => {
    clearFeedback()
    setSelected(null)
    setPlacements(prev => {
      const next = { ...prev }
      delete next[item]
      return next
    })
  }

  const handleCheck = () => setChecked(true)

  const handleTryAgain = () => {
    setOrder(shuffle(allItems))
    setPlacements({})
    setSelected(null)
    setChecked(false)
  }

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{b?.title || 'Sort into Buckets'}</span>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <p className="font-medium text-foreground">{question}</p>
          {instructions && <p className="text-sm text-muted-foreground mt-1">{instructions}</p>}
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">{b?.instruction || 'Items — click an item, then click a bucket to place it:'}</p>
          <div className="flex flex-wrap gap-2">
            {pool.map(item => (
              <button
                key={item}
                type="button"
                aria-pressed={selected === item}
                onClick={() => handlePoolClick(item)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium shadow-sm transition-all ${
                  selected === item
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                    : 'border-primary/30 bg-primary/5 text-foreground hover:border-primary/50 hover:shadow'
                }`}
              >
                {item}
                {checked && (
                  <span className="block text-xs font-normal text-muted-foreground">{(w?.correct_label || 'Correct: {label}').replace('{label}', '')}{correctLabelOf(item)}</span>
                )}
              </button>
            ))}
            {pool.length === 0 && <p className="text-sm text-muted-foreground">{b?.empty_pool || 'All items placed.'}</p>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {buckets.map(bucket => {
            const placed = placedItemsOf(bucket.label)
            const bucketState = !checked ? null : isBucketCorrect(bucket.label)
            return (
              <div
                key={bucket.label}
                role="button"
                tabIndex={0}
                aria-label={(b?.bucket_aria || 'Bucket: {label}').replace('{label}', bucket.label)}
                onClick={() => handleBucketClick(bucket.label)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleBucketClick(bucket.label)
                  }
                }}
                className={`rounded-xl border-2 px-4 py-3 transition-all ${
                  bucketState === null
                    ? 'border-dashed border-border bg-muted/20 hover:border-primary/50'
                    : bucketState
                      ? 'border-solid border-green-500 bg-green-50 dark:bg-green-950/30'
                      : 'border-solid border-red-500 bg-red-50 dark:bg-red-950/30'
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{bucket.label}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {placed.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={event => {
                        event.stopPropagation()
                        handleReturnClick(item)
                      }}
                      className="rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary hover:shadow"
                    >
                      {item}
                      {checked && !isItemCorrect(item) && (
                        <span className="block text-xs font-normal text-red-600">{(w?.correct_label || 'Correct: {label}').replace('{label}', '')}{correctLabelOf(item)}</span>
                      )}
                    </button>
                  ))}
                </div>
                {placed.length === 0 && <p className="text-xs text-muted-foreground mt-1">{b?.empty_bucket || 'Empty — click to place the selected item'}</p>}
              </div>
            )
          })}
        </div>

        {checked && (
          <div
            role="status"
            aria-live="polite"
            className={`p-4 rounded-lg ${allCorrect ? 'bg-green-50 dark:bg-green-950/30 border border-green-200' : 'bg-red-50 dark:bg-red-950/30 border border-red-200'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {allCorrect
                ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : <XCircle className="w-5 h-5 text-red-600" />
              }
              <span className="font-semibold text-sm text-foreground">
                {allCorrect
                  ? (w?.all_correct || 'All correct!')
                  : (b?.score_feedback || '{count} / {total} correct — red items are in the wrong bucket or still unplaced.').replace('{count}', String(correctCount)).replace('{total}', String(allItems.length))}
              </span>
            </div>
            {explanation && <p className="text-sm text-muted-foreground mt-1">{explanation}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!checked && (
            <button onClick={handleCheck} className="px-6 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              {w?.check_answers || 'Check Answers'}
            </button>
          )}
          <button onClick={handleTryAgain} className="px-6 py-2 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-accent transition-colors">
            {w?.try_again || 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  )
}
