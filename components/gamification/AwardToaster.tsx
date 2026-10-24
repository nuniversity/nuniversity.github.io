'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, TrendingUp, Zap } from 'lucide-react'
import { onAward, type AwardEvent } from '@/lib/gamification/bus'

interface ToastItem {
  id: number
  kind: 'xp' | 'badge' | 'level'
  text: string
}

interface AwardToasterProps {
  dict: any
}

const TOAST_ICON = { xp: Zap, badge: Award, level: TrendingUp }

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
    template
  )
}

function buildToasts(event: AwardEvent, dict: any): Omit<ToastItem, 'id'>[] {
  const items: Omit<ToastItem, 'id'>[] = []
  if (event.xp > 0) {
    items.push({
      kind: 'xp',
      text: tpl(dict?.gamification?.xp || '{n} XP', { n: `+${event.xp}` }),
    })
  }
  for (const badge of event.badges) {
    const key = badge.replace(/-/g, '_')
    const name = dict?.gamification?.badges?.[key] || badge
    items.push({
      kind: 'badge',
      text: tpl(dict?.gamification?.badges?.awarded || 'Badge earned: {name}', { name }),
    })
  }
  if (event.level > event.previousLevel) {
    items.push({
      kind: 'level',
      text: tpl(dict?.gamification?.level_up || 'Level up! You reached level {n}', { n: event.level }),
    })
  }
  return items
}

export default function AwardToaster({ dict }: AwardToasterProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const off = onAward((event: AwardEvent) => {
      const items = buildToasts(event, dict)
      if (items.length === 0) return
      const withIds = items.map(item => {
        counter.current += 1
        return { ...item, id: counter.current }
      })
      setToasts(prev => [...prev, ...withIds])
      for (const item of withIds) {
        const timer = window.setTimeout(() => {
          setToasts(prev => prev.filter(toast => toast.id !== item.id))
        }, 4500)
        timers.current.push(timer)
      }
    })
    return () => {
      off()
      timers.current.forEach(timer => window.clearTimeout(timer))
      timers.current = []
    }
  }, [dict])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed right-4 top-20 z-[70] flex flex-col items-end gap-2"
      data-testid="award-toaster"
      aria-live="polite"
    >
      {toasts.map(toast => {
        const Icon = TOAST_ICON[toast.kind]
        return (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            data-testid="award-toast"
            className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-lg"
          >
            <Icon className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="text-sm font-medium">{toast.text}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
