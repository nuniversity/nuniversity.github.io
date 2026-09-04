'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function DraggableChip({ id, label, isPlaced }: { id: string; label: string; isPlaced?: boolean }) {
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
      className={`cursor-grab rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all select-none touch-none hover:border-primary/50 hover:shadow ${isDragging ? 'z-50 scale-105 shadow-lg' : ''}`}
    >
      {label}
    </div>
  )
}

function DroppableSlot({ id, leftLabel, matchedAnswer, isCorrect, feedback, isOver }: {
  id: string; leftLabel: string; matchedAnswer: string | null; isCorrect?: boolean; feedback: 'idle' | 'correct' | 'incorrect'; isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id })
  let border = 'border-dashed border-border'
  let bg = 'bg-muted/30'
  if (feedback !== 'idle' && matchedAnswer) {
    border = isCorrect ? 'border-solid border-green-500' : 'border-solid border-red-500'
    bg = isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
  } else if (isOver) {
    border = 'border-solid border-primary'
    bg = 'bg-primary/5'
  } else if (matchedAnswer) {
    border = 'border-solid border-primary/40'
    bg = 'bg-primary/5'
  }
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-1 items-center rounded-lg border-2 border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm">
        {leftLabel}
      </div>
      <div className="flex items-center px-1">
        <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 items-center justify-center rounded-lg border-2 px-4 py-3 text-sm transition-all ${border} bg ${isOver ? 'scale-[1.02]' : ''}`}
      >
        {matchedAnswer ?? <span className="text-xs text-muted-foreground">Drop here</span>}
      </div>
    </div>
  )
}

interface MatchingQuestionProps {
  question: string
  pairs: Array<{ left: string; right: string }>
  explanation?: string
}

export default function MatchingQuestion({ question, pairs, explanation }: MatchingQuestionProps) {
  const [rightOrder, setRightOrder] = useState<string[]>(() => shuffle(pairs.map(p => p.right)))
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  useEffect(() => {
    setRightOrder(shuffle(pairs.map(p => p.right)))
    setPlacements({})
    setFeedback('idle')
  }, [pairs])

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
    setOverId(null)
    if (!over) return
    const answerLabel = active.id as string
    const slotId = over.id as string
    if (!slotId.startsWith('slot-')) return
    setPlacements(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key] === answerLabel) delete next[key]
      }
      next[slotId] = answerLabel
      return next
    })
    setFeedback('idle')
  }, [])

  const handleCheck = useCallback(() => {
    const isCorrect = pairs.every((pair, idx) => placements[`slot-${idx}`] === pair.right)
    setFeedback(isCorrect ? 'correct' : 'incorrect')
  }, [pairs, placements])

  const handleTryAgain = useCallback(() => {
    setRightOrder(shuffle(pairs.map(p => p.right)))
    setPlacements({})
    setFeedback('idle')
  }, [pairs])

  const placedAnswers = new Set(Object.values(placements))
  const activeAnswer = activeId ? rightOrder.find(r => r === activeId) ?? activeId : null

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <ArrowRightLeft className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Matching Question</span>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <p className="font-medium text-foreground">{question}</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-3">
            {pairs.map((pair, idx) => {
              const slotId = `slot-${idx}`
              return (
                <DroppableSlot
                  key={idx}
                  id={slotId}
                  leftLabel={pair.left}
                  matchedAnswer={placements[slotId] ?? null}
                  isCorrect={feedback !== 'idle' ? placements[slotId] === pair.right : undefined}
                  feedback={feedback}
                  isOver={overId === slotId}
                />
              )
            })}
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Drag answers from here:</p>
            <div className="flex flex-wrap gap-3">
              {rightOrder.map(answer => (
                <DraggableChip key={answer} id={answer} label={answer} isPlaced={placedAnswers.has(answer)} />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeAnswer ? (
              <div className="rounded-lg border-2 border-primary bg-primary/10 px-4 py-2.5 text-sm font-medium text-foreground shadow-xl">
                {activeAnswer}
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
                {feedback === 'correct' ? 'All correct!' : 'Some matches are wrong — red slots have incorrect answers.'}
              </span>
            </div>
            {explanation && <p className="text-sm text-muted-foreground mt-1">{explanation}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {feedback !== 'correct' && (
            <button onClick={handleCheck} className="px-6 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Check Matches
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
