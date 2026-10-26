// components/home/StatCounter.tsx
'use client'

import { useCountUp } from '@/lib/hooks/use-count-up'

interface StatCounterProps {
  /** The formatted value, e.g. "49+" or "1.2k+". */
  value: string
}

interface SplitValue {
  number: number
  suffix: string
  /** False when the value carries no number at all and must be rendered as-is. */
  numeric: boolean
}

/**
 * Splits a formatted statistic into its numeric part and its suffix, so the
 * number can be counted up while the suffix stays put.
 */
function splitValue(value: string): SplitValue {
  const match = value.match(/^([\d.,]*)(.*)$/)
  if (!match) return { number: 0, suffix: value, numeric: false }
  const [, rawNumber, suffix] = match
  const normalised = rawNumber.replace(/,/g, '')
  const number = Number.parseFloat(normalised)
  if (!Number.isFinite(number)) return { number: 0, suffix: value, numeric: false }
  return { number, suffix, numeric: true }
}

/** Renders a statistic that counts up when it scrolls into view. */
export function StatCounter({ value }: StatCounterProps) {
  const { number, suffix, numeric } = splitValue(value)
  const { ref, value: current } = useCountUp(number)

  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: number % 1 === 0 ? 0 : 1,
  }).format(current)

  return (
    <span ref={ref} className="tabular">
      {numeric ? `${formatted}${suffix}` : suffix}
    </span>
  )
}

export default StatCounter
