import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const sandboxHtml = fs.readFileSync(path.join(ROOT, 'public', 'code-sandbox.html'), 'utf8')
const globalCsp = fs.readFileSync(path.join(ROOT, 'lib', 'security', 'csp.mjs'), 'utf8')

describe('code sandbox invariants', () => {
  it('is self-contained and carries the only unsafe-eval', () => {
    expect(sandboxHtml).toContain("'unsafe-eval'")
    expect(sandboxHtml).toContain("connect-src 'none'")
    expect(sandboxHtml).toContain('event.source !== parent')
    expect(sandboxHtml).not.toMatch(/<script\s+src=/i)
  })

  it('keeps the global policy free of unsafe-eval', () => {
    expect(globalCsp).toContain("script-src 'self' 'unsafe-inline'")
    expect(globalCsp).not.toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
    expect(globalCsp).toContain("frame-src 'self'")
  })

  it('contains no eval/new Function in app code outside the sandbox page', () => {
    const files = [
      ...walk(path.join(ROOT, 'components')),
      ...walk(path.join(ROOT, 'lib')),
      ...walk(path.join(ROOT, 'app')),
    ].filter((file) => /\.(ts|tsx)$/.test(file))

    const offenders = files.filter((file) => {
      const source = fs.readFileSync(file, 'utf8')
      return /new Function\s*\(/.test(source) || /\beval\s*\(/.test(source)
    })
    expect(offenders).toEqual([])
  })
})
