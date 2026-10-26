/**
 * Prepares lesson Markdown for reading aloud.
 *
 * Removes the parts that do not make sense spoken — code fences, tables,
 * diagram sources, HTML tags, image syntax and link URLs — and flattens the
 * remaining Markdown into plain sentences.
 */
export function buildSpokenText(markdown: string): string {
  return (
    markdown
      // Fenced blocks (code, diagrams, interactive configs).
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      // Inline code.
      .replace(/`[^`\n]+`/g, ' ')
      // Tables.
      .replace(/^\s*\|.*\|\s*$/gm, ' ')
      // Separator rows.
      .replace(/^\s*[-:| ]{3,}\s*$/gm, ' ')
      // Images.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      // Links — keep the label, drop the URL.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // HTML tags.
      .replace(/<[^>]+>/g, ' ')
      // Callout markers.
      .replace(/^>\s*\[!\w+\]\s*$/gm, ' ')
      .replace(/^>\s?/gm, '')
      // Heading hashes and emphasis markers.
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~]{1,3}/g, '')
      // Horizontal rules.
      .replace(/^\s*(-{3,}|\*{3,})\s*$/gm, ' ')
      // Collapse whitespace.
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}
