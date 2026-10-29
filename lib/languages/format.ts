export function pairChipLabel(pair: { source: string; target: string }): string {
  return `${pair.source.toUpperCase()} → ${pair.target.toUpperCase()}`
}

/**
 * Maps a language code to its flag file code (`public/flags/<code>.svg`).
 *
 * Portuguese is the Brazilian variant on this platform (vocab decks and
 * courses target Brazilian learners), so `pt` renders the Brazil flag.
 * Returns `null` for languages without artwork: callers fall back to the
 * text chip.
 */
const FLAG_CODES: Record<string, string> = {
  pt: 'br',
  en: 'gb',
  es: 'es',
  fr: 'fr',
  it: 'it',
  de: 'de',
}

export function flagCodeFor(lang: string): string | null {
  return FLAG_CODES[lang.toLowerCase()] ?? null
}

export function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}
