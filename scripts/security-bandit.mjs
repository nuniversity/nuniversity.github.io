#!/usr/bin/env node
/**
 * Runs Bandit on the Python touched by a commit.
 *
 * Wired into lint-staged for `*.py`, so `git commit` fails when staged Python
 * introduces a MEDIUM or HIGH severity finding. Low findings (asserts,
 * `subprocess` without a shell) are frequent and deliberate in this repo, so
 * they do not block a commit; run `npm run security:bandit` to see them.
 *
 * Configuration comes from `[tool.bandit]` in pyproject.toml — the same file
 * `.pre-commit-config.yaml` points at. Tests are skipped: they pass fixture
 * paths such as "/tmp/t.md" as values, which Bandit reports as insecure temp
 * file usage (B108) even though nothing is written there.
 *
 * Usage:
 *   node scripts/security-bandit.mjs                 # whole repository
 *   node scripts/security-bandit.mjs a.py b.py       # specific files (lint-staged)
 *   SKIP_BANDIT=1 git commit ...                     # escape hatch
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const argv = process.argv.slice(2)

const isPython = file => /\.py$/i.test(file)
const isTestPath = file =>
  /(^|\/)(tests?|__tests__)(\/|$)/i.test(file) ||
  /(^|\/)test_[^/]*\.py$/i.test(file) ||
  /(^|\/)conftest\.py$/i.test(file)

/** Directories scanned when no file list is supplied. */
const FULL_SCAN = ['.opencode', 'scripts', 'agents', 'tests']

const manualRun = argv.length === 0
const staged = argv.filter(file => isPython(file) && !isTestPath(file) && existsSync(file))

if (!manualRun && staged.length === 0) {
  // Nothing security-relevant changed (only tests, or no Python at all).
  process.exit(0)
}

if (process.env.SKIP_BANDIT === '1') {
  console.warn('security:bandit — skipped (SKIP_BANDIT=1)')
  process.exit(0)
}

/** Finds a working Bandit, preferring the project virtualenv. */
function resolveBandit() {
  const candidates = [
    { command: path.join(ROOT, '.venv/bin/bandit'), baseArgs: [] },
    { command: path.join(ROOT, '.venv/bin/python'), baseArgs: ['-m', 'bandit'] },
    { command: path.join(ROOT, '.venv/Scripts/bandit.exe'), baseArgs: [] },
    { command: 'bandit', baseArgs: [] },
    { command: 'python3', baseArgs: ['-m', 'bandit'] },
  ]

  for (const candidate of candidates) {
    if (candidate.command.includes('/') && !existsSync(candidate.command)) continue
    const probe = spawnSync(candidate.command, [...candidate.baseArgs, '--version'], {
      stdio: 'ignore',
    })
    if (probe.status === 0) return candidate
  }
  return null
}

const bandit = resolveBandit()

if (!bandit) {
  console.error(
    [
      '',
      'security:bandit — Bandit is not installed, so Python security checks cannot run.',
      '',
      'Install the Python dev dependencies:',
      '  uv sync --extra dev',
      '  # or',
      '  python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"',
      '',
      'To commit without this check once:',
      '  SKIP_BANDIT=1 git commit ...',
      '',
    ].join('\n')
  )
  process.exit(1)
}

/** Every non-test Python file under the given directories. */
function collectPython(dirs) {
  const files = []
  const walk = dir => {
    for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const relative = path.posix.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (['__pycache__', 'node_modules', '.venv', 'venv', '.git'].includes(entry.name)) continue
        walk(relative)
      } else if (isPython(entry.name) && !isTestPath(relative)) {
        files.push(relative)
      }
    }
  }
  for (const dir of dirs) {
    if (existsSync(path.join(ROOT, dir))) walk(dir)
  }
  return files
}

const targets = manualRun ? collectPython(FULL_SCAN) : staged

if (targets.length === 0) {
  console.log('security:bandit — no Python files to check')
  process.exit(0)
}
const config = existsSync(path.join(ROOT, 'pyproject.toml')) ? ['-c', 'pyproject.toml'] : []

console.log(
  `security:bandit — checking ${targets.length} Python file${targets.length === 1 ? '' : 's'}` +
    (manualRun ? ' (tests excluded)' : '')
)

const result = spawnSync(
  bandit.command,
  [
    ...bandit.baseArgs,
    ...config,
    '--severity-level',
    'medium',
    '-q',
    '-f',
    'txt',
    ...targets,
  ],
  { stdio: 'inherit', cwd: ROOT }
)

if (result.error) {
  console.error(`security:bandit — failed to run Bandit: ${result.error.message}`)
  process.exit(1)
}

if (result.status !== 0) {
  console.error(
    [
      '',
      'security:bandit — MEDIUM or HIGH severity finding(s) above.',
      'Fix them, or add a justified `# nosec BXXX` comment on the line.',
      'To commit anyway: SKIP_BANDIT=1 git commit ...',
      '',
    ].join('\n')
  )
}

process.exit(result.status ?? 1)
