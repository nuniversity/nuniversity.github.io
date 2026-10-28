// Artifact suite — published size budgets.
// GitHub Pages rejects sites over 1 GB; CI warns above 900 MB.
// (2026-10-28 measurement: 967 MB — above the warning band already.)
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { OUT, OUT_READY, htmlFiles } from './support/helpers.mjs'

const GB = 1_000_000_000
const MB = 1_000_000

function dirSize(dir, acc = 0) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    acc += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size
  }
  return acc
}

describe.skipIf(!OUT_READY)('published size budgets', () => {
  it('total export stays under the 1 GB GitHub Pages hard limit', () => {
    const size = dirSize(OUT)
    // Surfaced in output for the CI log (mirrors the workflow's report).
    console.log(`  published output: ${Math.round(size / MB)} MB`)
    expect(size).toBeLessThan(GB)
  })

  it('warns (console) above the 900 MB operational band', () => {
    const size = dirSize(OUT)
    if (size > 900 * MB) {
      console.warn(
        `  ⚠ out/ is ${Math.round(size / MB)} MB — above the 900 MB warning band, ` +
          `approaching the 1 GB Pages limit. Consider trimming lesson HTML or media.`
      )
    }
    expect(true).toBe(true)
  })

  it('no single page exceeds 2 MB of HTML', () => {
    const heavy = htmlFiles()
      .map((f) => ({ f, size: fs.statSync(f).size }))
      .filter(({ size }) => size > 2 * MB)
      .map(({ f, size }) => `${path.relative(OUT, f)} ${(size / MB).toFixed(2)} MB`)
    // Largest known today: ~1.0 MB (intro-to-data-engineering SQL lesson).
    expect(heavy.join(' | ')).toEqual('')
  })
})
