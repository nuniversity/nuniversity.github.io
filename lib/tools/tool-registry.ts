/**
 * Slugs with a registered React implementation.
 *
 * Kept in a plain module (no `next/dynamic`) so the Server Component page can
 * read it. The client loader maps these slugs to dynamically imported
 * components; content folders without a component fall back to a localised
 * "coming soon" message.
 */
export const TOOL_SLUGS = [
  'llm-prompt-builder',
  'brain-writing-session',
  'swot-matrix',
  'eisenhower-matrix',
  'pomodoro-timer',
  'unit-converter',
  'decision-matrix',
  'flashcard-maker',
  'regex-tester',
  'habit-tracker',
] as const

export type ToolSlug = (typeof TOOL_SLUGS)[number]

export function hasToolComponent(slug: string): slug is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(slug)
}
