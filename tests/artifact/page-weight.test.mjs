// Artifact suite — published size budgets.
// GitHub Pages rejects sites over 1 GB; CI warns above 900 MB.
// (2026-10-28 measurement: 967 MB — above the warning band already.)
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { OUT, OUT_READY, htmlFiles, walk } from './support/helpers.mjs'

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

  it('stays inside the Cloudflare Pages file-count limit', () => {
    const count = walk(OUT).length
    console.log(`  published files: ${count}`)
    expect(count).toBeLessThan(20_000)
  })

  it('no file exceeds the Cloudflare Pages 25 MiB per-file limit', () => {
    const oversized = walk(OUT)
      .map((file) => ({ file, size: fs.statSync(file).size }))
      .filter(({ size }) => size > 25 * 1024 * 1024)
      .map(({ file, size }) => `${path.relative(OUT, file)} ${(size / MB).toFixed(1)} MB`)
    expect(oversized.join(' | ')).toEqual('')
  })

  it('prunes the duplicated RSC .txt payloads', () => {
    const payloads = walk(OUT).filter(
      (file) =>
        file.endsWith('.txt') &&
        !file.endsWith(`${path.sep}robots.txt`) &&
        !file.endsWith(`${path.sep}ads.txt`)
    )
    // Leaving these in doubles the page data and pushed the deploy over 1 GB.
    expect(payloads.map((file) => path.relative(OUT, file))).toEqual([])
  })
})
