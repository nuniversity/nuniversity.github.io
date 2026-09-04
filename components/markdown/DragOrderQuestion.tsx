'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CheckCircle2, XCircle, ListOrdered } from 'lucide-react'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function SortableItem({ id, label, isCorrect, feedback }: {
  id: string; label: string; isCorrect: boolean; feedback: 'idle' | 'correct' | 'incorrect'
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  let border = 'border-border'
  let bg = 'bg-card'
  if (feedback !== 'idle') {
    border = isCorrect ? 'border-green-500' : 'border-red-500'
    bg = isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-colors select-none touch-none ${border} ${bg} ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-foreground flex-1">{label}</span>
      {feedback !== 'idle' && (
        isCorrect
          ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
      )}
    </div>
  )
}

interface DragOrderQuestionProps {
  question: string
  items: string[]
  correctOrder: string[]
  explanation?: string
}

export default function DragOrderQuestion({ question, items, correctOrder, explanation }: DragOrderQuestionProps) {
  const [currentItems, setCurrentItems] = useState<string[]>(() => shuffle(items))
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setCurrentItems(shuffle(items))
    setFeedback('idle')
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      setCurrentItems(prev => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  const handleCheck = useCallback(() => {
    const isCorrect = currentItems.every((item, i) => item === correctOrder[i])
    setFeedback(isCorrect ? 'correct' : 'incorrect')
  }, [currentItems, correctOrder])

  const handleTryAgain = useCallback(() => {
    setCurrentItems(shuffle(items))
    setFeedback('idle')
  }, [items])

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <ListOrdered className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Ordering Question</span>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <p className="font-medium text-foreground">{question}</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={currentItems} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {currentItems.map((item, index) => (
                <SortableItem
                  key={item}
                  id={item}
                  label={item}
                  isCorrect={feedback !== 'idle' && item === correctOrder[index]}
                  feedback={feedback}
                />
              ))}
            </div>
          </SortableContext>
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
                {feedback === 'correct' ? 'Correct!' : 'Not quite — red items are in the wrong position.'}
              </span>
            </div>
            {explanation && <p className="text-sm text-muted-foreground mt-1">{explanation}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {feedback !== 'correct' && (
            <button onClick={handleCheck} className="px-6 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Check Order
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
