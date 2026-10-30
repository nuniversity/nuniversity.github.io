/**
 * Brain-writing sheet mechanics.
 *
 * In 6-3-5 each sheet rotates to the next participant between rounds and the
 * next participant builds on what is already written. The previous component
 * rotated into state and then immediately wiped it, so the rotation was dead
 * code and the "build on previous ideas" method behaved identically to a blank
 * round.
 */

/**
 * Rotates sheets one position: participant at index `i` receives the sheet of
 * participant `i + 1` (last participant wraps to the first).
 */
export function rotateIdeas(
  ideas: Record<string, string[]>
): Record<string, string[]> {
  const participants = Object.keys(ideas)
  if (participants.length < 2) return { ...ideas }
  const rotated: Record<string, string[]> = {}
  participants.forEach((participant, index) => {
    const nextParticipant = participants[(index + 1) % participants.length]
    rotated[participant] = [...ideas[nextParticipant]]
  })
  return rotated
}

/** Appends `slots` empty idea fields to every participant's sheet. */
export function appendBlankSlots(
  ideas: Record<string, string[]>,
  slots: number
): Record<string, string[]> {
  const next: Record<string, string[]> = {}
  for (const [participant, participantIdeas] of Object.entries(ideas)) {
    next[participant] = [
      ...participantIdeas,
      ...Array.from({ length: Math.max(0, slots) }, () => ''),
    ]
  }
  return next
}

/** Prepares the next round: rotate existing sheets, then add fresh slots. */
export function prepareNextRound(
  ideas: Record<string, string[]>,
  slots: number
): Record<string, string[]> {
  return appendBlankSlots(rotateIdeas(ideas), slots)
}

/**
 * Drops inherited blank placeholders from a finished round while keeping all
 * written ideas, so exports contain no empty rows.
 */
export function trimIdeas(ideas: Record<string, string[]>): Record<string, string[]> {
  const next: Record<string, string[]> = {}
  for (const [participant, participantIdeas] of Object.entries(ideas)) {
    next[participant] = participantIdeas.filter((idea) => idea.trim() !== '')
  }
  return next
}
