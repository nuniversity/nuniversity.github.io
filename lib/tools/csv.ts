/**
 * Small RFC-4180 CSV reader/writer.
 *
 * The tools previously parsed CSV with
 * `(".*?"|[^",\s]+)(?=\s*,|\s*$)`, which truncated any unquoted value
 * containing a space ("Very important task" became "Very") and could not read
 * embedded newlines. This implementation handles quoted fields, escaped
 * quotes (`""`), CRLF and embedded delimiters/newlines.
 */

export type CsvCell = string | number | boolean | null | undefined

/** Parses CSV text into rows of raw string cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  // Strip a UTF-8 BOM so the first header cell matches.
  if (text.charCodeAt(0) === 0xfeff) i = 1

  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }

  while (i < text.length) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }

    if (char === '"' && field.length === 0) {
      inQuotes = true
      i += 1
      continue
    }
    if (char === ',') {
      endField()
      i += 1
      continue
    }
    if (char === '\r') {
      if (text[i + 1] === '\n') i += 1
      endRow()
      i += 1
      continue
    }
    if (char === '\n') {
      endRow()
      i += 1
      continue
    }
    field += char
    i += 1
  }

  // Ignore a trailing newline, but keep a final row without one.
  if (field.length > 0 || row.length > 0) endRow()

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

/** Escapes one cell for CSV output. */
export function escapeCsvCell(value: CsvCell): string {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

/** Serialises rows to CSV with CRLF line endings. */
export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}

/** Maps raw CSV rows (header + body) to objects keyed by lower-cased header. */
export function csvToRecords(text: string): Record<string, string>[] {
  const [header, ...body] = parseCsv(text)
  if (!header) return []
  const keys = header.map((key) => key.trim().toLowerCase())
  return body.map((cells) => {
    const record: Record<string, string> = {}
    keys.forEach((key, index) => {
      if (key) record[key] = cells[index] ?? ''
    })
    return record
  })
}
