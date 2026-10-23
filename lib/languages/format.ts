export function pairChipLabel(pair: { source: string; target: string }): string {
  return `${pair.source.toUpperCase()} → ${pair.target.toUpperCase()}`
}

export function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}
