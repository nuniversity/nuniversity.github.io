export function splitAnswer(blankCount: number, answer: string): string[] {
  const trimmed = answer.trim()

  if (blankCount <= 1) return [trimmed]

  const splitters = [', ', '; ']
  for (const separator of splitters) {
    const parts = trimmed.split(separator).map(part => part.trim())
    if (parts.length === blankCount) return parts
  }

  const numeric = trimmed.match(/\d+(?:\.\d+)?/g)
  if (numeric && numeric.length === blankCount) return numeric

  if (blankCount === 1) return [trimmed]

  return Array.from({ length: blankCount }, () => trimmed)
}
