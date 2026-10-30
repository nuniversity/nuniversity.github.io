/**
 * Browser download helpers.
 *
 * A single implementation replaces six copy-pasted blob blocks, adds the
 * `document.body.appendChild` step older Firefox builds need for synthetic
 * clicks, and sanitises user-provided filenames so a project name containing
 * `/`, emoji or control characters cannot produce an invalid download.
 */

/** Makes a user string safe for use as a filename stem. */
export function sanitizeFilename(input: string, fallback = 'untitled'): string {
  const cleaned = (input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80)
  return cleaned || fallback
}

/** Triggers a download for a Blob without navigating away from the page. */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Revoke on the next task so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Downloads plain text with an explicit MIME type. */
export function downloadText(
  text: string,
  filename: string,
  mime = 'text/plain;charset=utf-8'
): void {
  downloadBlob(new Blob([text], { type: mime }), filename)
}

/** Downloads pretty-printed JSON. */
export function downloadJson(data: unknown, filename: string): void {
  downloadText(JSON.stringify(data, null, 2), filename, 'application/json;charset=utf-8')
}

/** Downloads CSV. */
export function downloadCsv(csv: string, filename: string): void {
  downloadText(csv, filename, 'text/csv;charset=utf-8')
}
