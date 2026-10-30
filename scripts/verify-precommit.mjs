#!/usr/bin/env node
/**
 * Runs the full Husky pre-commit pipeline against the current working tree
 * without staging anything in the real index and without creating a commit.
 *
 * lint-staged and gitleaks need a staged diff, so this script builds one in a
 * throw-away index (`GIT_INDEX_FILE`). Your real index is never read or
 * modified; failures are reported through the normal exit code.
 *
 * Usage:
 *   npm run verify:precommit
 *   SKIP_INTEGRATION=1 npm run verify:precommit   # skip artifact + E2E
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const indexDir = mkdtempSync(path.join(os.tmpdir(), 'nuniversity-precommit-'))
const env = { ...process.env, GIT_INDEX_FILE: path.join(indexDir, 'index') }

function run(command, args, options = {}) {
  return spawnSync(command, args, { stdio: 'inherit', env, ...options })
}

try {
  if (run('git', ['read-tree', 'HEAD']).status !== 0) {
    console.error('verify:precommit — could not create the temporary index')
    process.exit(1)
  }
  if (run('git', ['add', '-A']).status !== 0) {
    console.error('verify:precommit — could not stage the working tree in the temporary index')
    process.exit(1)
  }

  const result = run('sh', [path.join(process.cwd(), '.husky', 'pre-commit')])
  if (result.error) {
    console.error(`verify:precommit — ${result.error.message}`)
    process.exit(1)
  }
  process.exit(result.status ?? 1)
} finally {
  rmSync(indexDir, { recursive: true, force: true })
}
