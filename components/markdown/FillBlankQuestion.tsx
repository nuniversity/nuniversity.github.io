'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, XCircle, PenLine } from 'lucide-react'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function parseTemplate(template: string) {
  const parts: Array<{ type: 'text' | 'blank'; value: string }> = []
  const regex = /\{\{(\d+)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', value: template.slice(lastIndex, match.index) })
    parts.push({ type: 'blank', value: match[1] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < template.length) parts.push({ type: 'text', value: template.slice(lastIndex) })
  return parts
}

function WordChip({ id, label, isPlaced }: { id: string; label: string; isPlaced?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging || isPlaced ? 0.4 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-full border-2 border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all select-none touch-none hover:border-primary/50 hover:shadow ${isDragging ? 'z-50 scale-105 shadow-lg' : ''}`}
    >
      {label}
    </div>
  )
}

function InlineBlank({ blankId, placedWord, isCorrect, feedback, isOver, setNodeRef }: {
  blankId: string; placedWord: string | null; isCorrect?: boolean; feedback: 'idle' | 'correct' | 'incorrect'; isOver: boolean; setNodeRef: (node: HTMLElement | null) => void
}) {
  let border = 'border-dashed border-muted-foreground/40'
  let bg = 'bg-muted/20'
  if (feedback !== 'idle' && placedWord) {
    border = isCorrect ? 'border-solid border-green-500' : 'border-solid border-red-500'
    bg = isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
  } else if (isOver) {
    border = 'border-solid border-primary'
    bg = 'bg-primary/5'
  } else if (placedWord) {
    border = 'border-solid border-primary/40'
    bg = 'bg-primary/5'
  }
  return (
    <span
      ref={setNodeRef}
      className={`inline-flex min-w-[5rem] items-center justify-center rounded-md border-2 px-3 py-1 mx-0.5 text-sm font-medium transition-all align-bottom ${border} ${bg} ${isOver ? 'scale-105' : ''}`}
    >
      {placedWord ?? <span className="text-xs text-muted-foreground">blank</span>}
    </span>
  )
}

interface FillBlankQuestionProps {
  question: string
  template: string
  answers: Record<string, string>
  distractors?: string[]
  explanation?: string
}

export default function FillBlankQuestion({ question, template, answers, distractors = [], explanation }: FillBlankQuestionProps) {
  const parts = useMemo(() => parseTemplate(template), [template])
  const blankIds = useMemo(() => parts.filter(p => p.type === 'blank').map(p => p.value), [parts])
  const allWords = useMemo(() => [...Object.values(answers), ...distractors], [answers, distractors])

  const [bankWords, setBankWords] = useState<string[]>(() => shuffle(allWords))
  const [slots, setSlots] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setBankWords(shuffle(allWords))
    setSlots({})
    setFeedback('idle')
  }, [allWords])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const word = active.id as string
    const targetId = over.id as string
    if (!targetId.startsWith('blank-')) return
    const blankId = targetId.replace('blank-', '')
    setSlots(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key] === word) delete next[key]
      }
      next[blankId] = word
      return next
    })
    setFeedback('idle')
  }, [])

  const handleCheck = useCallback(() => {
    const isCorrect = Object.entries(answers).every(([blankId, correctWord]) => slots[blankId] === correctWord)
    setFeedback(isCorrect ? 'correct' : 'incorrect')
  }, [slots, answers])

  const handleTryAgain = useCallback(() => {
    setBankWords(shuffle(allWords))
    setSlots({})
    setFeedback('idle')
  }, [allWords])

  const placedWords = new Set(Object.values(slots))
  const activeWord = activeId ?? null

  const renderedTemplate = parts.map((part, i) => {
    if (part.type === 'text') return <span key={`t-${i}`} className="text-foreground">{part.value}</span>
    const blankId = part.value
    return <InlineBlankWrapper key={`b-${blankId}`} blankId={blankId} placedWord={slots[blankId] ?? null} isCorrect={feedback !== 'idle' ? slots[blankId] === answers[blankId] : undefined} feedback={feedback} />
  })

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <PenLine className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Fill in the Blanks</span>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <p className="font-medium text-foreground">{question}</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="rounded-xl border-2 border-border bg-muted/20 p-6 text-base leading-relaxed">
            <p className="whitespace-pre-wrap">{renderedTemplate}</p>
          </div>

          <div className="mt-4">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Word Bank — drag words into the blanks above:</p>
            <div className="flex flex-wrap gap-2">
              {bankWords.map(word => (
                <WordChip key={word} id={word} label={word} isPlaced={placedWords.has(word)} />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeWord ? (
              <div className="rounded-full border-2 border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-foreground shadow-xl">
                {activeWord}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {feedback !== 'idle' && (
          <div
            role="status"
            aria-live="polite"
            className={`p-4 rounded-lg ${feedback === 'correct' ? 'bg-green-50 dark:bg-green-950/30 border border-green-200' : 'bg-red-50 dark:bg-red-950/30 border border-red-200'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {feedback === 'correct'
                ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : <XCircle className="w-5 h-5 text-red-600" />
              }
              <span className="font-semibold text-sm text-foreground">
                {feedback === 'correct' ? 'Perfect — all blanks filled correctly!' : 'Some blanks are wrong — red blanks have incorrect answers.'}
              </span>
            </div>
            {explanation && <p className="text-sm text-muted-foreground mt-1">{explanation}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {feedback !== 'correct' && (
            <button onClick={handleCheck} className="px-6 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Check Answers
            </button>
          )}
          <button onClick={handleTryAgain} className="px-6 py-2 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-accent transition-colors">
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

function InlineBlankWrapper({ blankId, placedWord, isCorrect, feedback }: {
  blankId: string; placedWord: string | null; isCorrect?: boolean; feedback: 'idle' | 'correct' | 'incorrect'
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `blank-${blankId}` })
  return <InlineBlank blankId={blankId} placedWord={placedWord} isCorrect={isCorrect} feedback={feedback} isOver={isOver} setNodeRef={setNodeRef} />
}
