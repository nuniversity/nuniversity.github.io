import {
  Atom,
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  CalendarCheck,
  Clock,
  Code,
  Grid3x3,
  Lightbulb,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const TOOL_ICONS: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  'bar-chart': BarChart3,
  'grid-3x3': Grid3x3,
  'book-open': BookOpen,
  'calendar-check': CalendarCheck,
  brain: Brain,
  clock: Clock,
  code: Code,
  calculator: Calculator,
  atom: Atom,
}

export function getToolIcon(name?: string, fallback: LucideIcon = Wrench): LucideIcon {
  if (name && TOOL_ICONS[name]) return TOOL_ICONS[name]
  return fallback
}
