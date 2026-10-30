import { describe, expect, it } from 'vitest'
import {
  UNIT_CATEGORIES,
  convertUnit,
  formatUnitValue,
  getCommonConversions,
} from '@/lib/tools/units'
import { parseCsv, toCsv, csvToRecords } from '@/lib/tools/csv'
import { calculateStreak } from '@/lib/tools/streak'
import { localDateKey, parseDateKey, daysBetween, isDateKey } from '@/lib/tools/date'
import { reviewCard, isCardDue, DEFAULT_EASE } from '@/lib/tools/srs'
import { evaluateRegex, highlightMatches } from '@/lib/tools/regex'
import { appendBlankSlots, prepareNextRound, rotateIdeas, trimIdeas } from '@/lib/tools/brainwriting'
import { createId } from '@/lib/tools/ids'
import { interpolate } from '@/lib/tools/template'
import { breakMinutesFor, cycleProgress, isLongBreakDue } from '@/lib/tools/pomodoro'
import { buildStudyQueue } from '@/lib/tools/flashcards'

describe('unit conversion', () => {
  it('converts length with full-precision factors', () => {
    expect(convertUnit('length', 'miles', 'kilometers', 1)).toBeCloseTo(1.609344, 9)
    expect(convertUnit('length', 'inches', 'centimeters', 1)).toBeCloseTo(2.54, 12)
  })

  it('converts radians without the truncated factor', () => {
    const degrees = convertUnit('angle', 'radians', 'degrees', Math.PI)
    expect(degrees).toBeCloseTo(180, 9)
    expect(convertUnit('angle', 'radians', 'degrees', 3)).toBeCloseTo(171.8873385, 6)
  })

  it('handles affine temperature scales', () => {
    expect(convertUnit('temperature', 'celsius', 'fahrenheit', 0)).toBeCloseTo(32, 9)
    expect(convertUnit('temperature', 'fahrenheit', 'celsius', 212)).toBeCloseTo(100, 9)
    expect(convertUnit('temperature', 'celsius', 'kelvin', -273.15)).toBeCloseTo(0, 9)
    expect(convertUnit('temperature', 'kelvin', 'fahrenheit', 0)).toBeCloseTo(-459.67, 6)
  })

  it('rejects unknown units and non-finite input', () => {
    expect(convertUnit('length', 'parsecs', 'meters', 1)).toBeNull()
    expect(convertUnit('nope', 'meters', 'feet', 1)).toBeNull()
    expect(convertUnit('length', 'meters', 'feet', Number.NaN)).toBeNull()
  })

  it('never renders NaN or infinity', () => {
    expect(formatUnitValue(Number.POSITIVE_INFINITY)).toBe('')
    expect(formatUnitValue(Number.NaN)).toBe('')
    expect(formatUnitValue(0)).toBe('0')
  })

  it('computes common conversions from the same factors', () => {
    const [first] = getCommonConversions('length')
    expect(first.from).toBe('kilometers')
    expect(Number(first.result.replace(',', '.'))).toBeCloseTo(0.621371, 5)
    expect(getCommonConversions('unknown')).toEqual([])
  })

  it('keeps every category internally consistent', () => {
    for (const [category, definition] of Object.entries(UNIT_CATEGORIES)) {
      for (const unit of Object.keys(definition.units)) {
        const roundTrip = convertUnit(category, unit, unit, 42)
        expect(roundTrip).toBeCloseTo(42, 6)
      }
    }
  })
})

describe('CSV', () => {
  it('parses quoted fields, commas and embedded newlines', () => {
    const rows = parseCsv('quadrant,item\nstrengths,"Cost, USD"\nthreats,"Line one\nLine two"')
    expect(rows).toEqual([
      ['quadrant', 'item'],
      ['strengths', 'Cost, USD'],
      ['threats', 'Line one\nLine two'],
    ])
  })

  it('parses unquoted values containing spaces', () => {
    expect(parseCsv('doFirst,Very important task,false')).toEqual([
      ['doFirst', 'Very important task', 'false'],
    ])
  })

  it('handles CRLF and escaped quotes', () => {
    expect(parseCsv('a,b\r\n"say ""hi""",2\r\n')).toEqual([
      ['a', 'b'],
      ['say "hi"', '2'],
    ])
  })

  it('round-trips through the writer', () => {
    const rows = [
      ['Quadrant', 'Task'],
      ['doFirst', 'Write "final" report, now'],
    ]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })

  it('maps records case-insensitively', () => {
    expect(csvToRecords('Quadrant,Task\nstrengths,Good team')).toEqual([
      { quadrant: 'strengths', task: 'Good team' },
    ])
  })
})

describe('local dates', () => {
  it('formats the local calendar day, not the UTC day', () => {
    const evening = new Date(2026, 0, 5, 23, 30)
    expect(localDateKey(evening)).toBe('2026-01-05')
    expect(parseDateKey('2026-01-05')?.getDate()).toBe(5)
  })

  it('rejects malformed keys', () => {
    expect(parseDateKey('2026-13-40')).toBeInstanceOf(Date)
    expect(isDateKey('2026-1-5')).toBe(false)
    expect(daysBetween('2026-01-01', '2026-01-03')).toBe(2)
  })
})

describe('streaks', () => {
  const today = '2026-03-10'

  it('counts consecutive days ending today', () => {
    expect(calculateStreak(['2026-03-10', '2026-03-09', '2026-03-08'], today)).toBe(3)
  })

  it('keeps yesterday-only streaks alive', () => {
    expect(calculateStreak(['2026-03-09', '2026-03-08'], today)).toBe(2)
  })

  it('breaks on a gap', () => {
    expect(calculateStreak(['2026-03-10', '2026-03-08'], today)).toBe(1)
  })

  it('is zero for an old history', () => {
    expect(calculateStreak(['2026-03-01'], today)).toBe(0)
  })

  it('ignores duplicates and invalid keys', () => {
    expect(calculateStreak(['2026-03-10', '2026-03-10', 'nope'], today)).toBe(1)
  })
})

describe('SM-2 scheduling', () => {
  const fresh = {
    ease: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    nextReview: 0,
    lastReviewed: null,
  }
  const day = 86_400_000

  it('schedules first successful review one day out', () => {
    const next = reviewCard(fresh, 3, 1000)
    expect(next.repetitions).toBe(1)
    expect(next.interval).toBe(1)
    expect(next.nextReview).toBe(1000 + day)
    expect(next.ease).toBeCloseTo(2.36, 2)
  })

  it('uses the 6-day second interval', () => {
    const next = reviewCard({ ...fresh, repetitions: 1, interval: 1 }, 4, 0)
    expect(next.interval).toBe(6)
  })

  it('leaves ease unchanged when the recall fails', () => {
    const next = reviewCard({ ...fresh, ease: 2.5, repetitions: 4, interval: 10 }, 1, 0)
    expect(next.ease).toBe(2.5)
    expect(next.repetitions).toBe(0)
    expect(next.interval).toBe(0)
    expect(next.relearn).toBe(true)
    expect(isCardDue(next, 0)).toBe(true)
  })

  it('clamps ease to the SM-2 floor and ceiling', () => {
    let card = { ...fresh } as import('@/lib/tools/srs').CardSchedule
    for (let i = 0; i < 20; i += 1) card = reviewCard(card, 3, i)
    expect(card.ease).toBeGreaterThanOrEqual(1.3)
    for (let i = 0; i < 20; i += 1) card = reviewCard(card, 5, i)
    expect(card.ease).toBeLessThanOrEqual(3.0)
  })

  it('treats new cards as due and future cards as not due', () => {
    expect(isCardDue(fresh, 0)).toBe(true)
    const later = reviewCard(fresh, 5, 10_000)
    expect(isCardDue(later, 10_000)).toBe(false)
    expect(isCardDue(later, later.nextReview + 1)).toBe(true)
  })
})

describe('regex engine', () => {
  const base = { replacement: '', showReplace: false, flags: 'g' }

  it('reports every zero-length match like matchAll', () => {
    const result = evaluateRegex({ ...base, pattern: 'a*', testString: 'ba b' })
    expect(result.matchCount).toBe(5)
    expect(result.matches.map((m) => m.index)).toEqual([0, 1, 2, 3, 4])
  })

  it('supports an empty replacement', () => {
    const result = evaluateRegex({
      ...base,
      pattern: '\\d+',
      testString: 'a1b22',
      replacement: '',
      showReplace: true,
    })
    expect(result.replaced).toBe('ab')
  })

  it('supports capture groups in replacements', () => {
    const result = evaluateRegex({
      ...base,
      pattern: '(\\w+)@(\\w+)',
      testString: 'a@b',
      replacement: '$2@$1',
      showReplace: true,
    })
    expect(result.replaced).toBe('b@a')
  })

  it('returns engine errors instead of throwing', () => {
    const result = evaluateRegex({ ...base, pattern: '(', testString: 'x' })
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('stops at the match cap', () => {
    const result = evaluateRegex({ ...base, pattern: 'a', testString: 'a'.repeat(600) })
    expect(result.matchCount).toBe(500)
    expect(result.truncated).toBe(true)
  })

  it('highlights matches without dropping text', () => {
    const segments = highlightMatches('abc', [{ full: 'b', index: 1 }])
    expect(segments.map((s) => s.text).join('')).toBe('abc')
    expect(segments.filter((s) => s.isMatch)).toHaveLength(1)
  })
})

describe('brain-writing rotation', () => {
  const sheets = { A: ['a1'], B: ['b1'], C: ['c1'] }

  it('moves each sheet to the next participant', () => {
    expect(rotateIdeas(sheets)).toEqual({ A: ['b1'], B: ['c1'], C: ['a1'] })
  })

  it('appends fresh slots after rotation', () => {
    expect(prepareNextRound(sheets, 2)).toEqual({
      A: ['b1', '', ''],
      B: ['c1', '', ''],
      C: ['a1', '', ''],
    })
  })

  it('keeps a single participant sheet intact', () => {
    expect(rotateIdeas({ A: ['only'] })).toEqual({ A: ['only'] })
    expect(appendBlankSlots({ A: [] }, 1)).toEqual({ A: [''] })
  })

  it('trims blanks for export', () => {
    expect(trimIdeas({ A: ['keep', '  ', ''] })).toEqual({ A: ['keep'] })
  })
})

describe('ids and templates', () => {
  it('never repeats an id in a tight loop', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => createId()))
    expect(ids.size).toBe(2000)
  })

  it('interpolates named placeholders and leaves unknown ones', () => {
    expect(interpolate('Round {current} / {total}', { current: 1, total: 3 })).toBe('Round 1 / 3')
    expect(interpolate('{missing} {n}', { n: 2 })).toBe('{missing} 2')
    expect(interpolate('no vars')).toBe('no vars')
  })
})

describe('pomodoro cadence', () => {
  it('schedules long breaks after the 4th, 8th and 12th sessions', () => {
    expect(isLongBreakDue(0)).toBe(false)
    expect(isLongBreakDue(3)).toBe(false)
    expect(isLongBreakDue(4)).toBe(true)
    expect(isLongBreakDue(5)).toBe(false)
    expect(isLongBreakDue(8)).toBe(true)
    expect(isLongBreakDue(12)).toBe(true)
  })

  it('picks the matching break duration', () => {
    expect(breakMinutesFor(3, 5, 15)).toBe(5)
    expect(breakMinutesFor(4, 5, 15)).toBe(15)
  })

  it('tracks the four-session cycle', () => {
    expect(cycleProgress(0)).toBe(0)
    expect(cycleProgress(3)).toBe(3)
    expect(cycleProgress(4)).toBe(0)
    expect(cycleProgress(9)).toBe(1)
  })
})

describe('flashcard study queue', () => {
  const card = (id: number, repetitions: number, nextReview: number) => ({
    id,
    ease: 2.5,
    interval: 1,
    repetitions,
    nextReview,
    lastReviewed: null,
  })

  it('never queues a new card twice', () => {
    const queue = buildStudyQueue([card(1, 0, 0)], 1000)
    expect(queue.map((item) => item.id)).toEqual([1])
  })

  it('includes one copy of due and new cards', () => {
    const queue = buildStudyQueue(
      [card(1, 0, 0), card(2, 2, 500), card(3, 2, 5000)],
      1000
    )
    expect(queue.map((item) => item.id).sort()).toEqual([1, 2])
  })

  it('falls back to a free review when nothing is due', () => {
    const queue = buildStudyQueue([card(1, 3, 9999)], 1000)
    expect(queue.map((item) => item.id)).toEqual([1])
  })
})
