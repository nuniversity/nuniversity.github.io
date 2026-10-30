#!/usr/bin/env node
/**
 * Dependency supply-chain gate for commits that touch package.json or the
 * lockfile.
 *
 * 1. `npm audit signatures` verifies registry signatures/provenance, catching
 *    tampered or republished packages before they are committed.
 * 2. `npm audit --omit=dev --audit-level=high` blocks a lockfile that brings a
 *    high/critical production advisory (the known low KaTeX findings do not
 *    fail this gate).
 * 3. Prints the top-level dependency lines added by the staged package.json so
 *    a new package is visible in the commit output.
 *
 * Escape hatch: SKIP_SECURITY_LOCKFILE=1 git commit ...
 */
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const SKIP = process.env.SKIP_SECURITY_LOCKFILE === '1'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.error) {
    console.error(`security:lockfile — could not run ${command}: ${result.error.message}`)
    return false
  }
  return result.status === 0
}

const DEP_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']

function readGitJson(spec) {
  const result = spawnSync('git', ['show', spec], { encoding: 'utf8' })
  if (result.status !== 0) return null
  try {
    return JSON.parse(result.stdout)
  } catch {
    return null
  }
}

/** Top-level dependency changes between HEAD and the staged package.json. */
function stagedDependencyChanges() {
  const previous = readGitJson('HEAD:package.json')
  const next = readGitJson(':package.json')
  if (!previous || !next) return []

  const changes = []
  for (const section of DEP_SECTIONS) {
    const before = previous[section] ?? {}
    const after = next[section] ?? {}
    const names = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const name of names) {
      if (!(name in before)) changes.push(`+ ${section}: ${name}@${after[name]}`)
      else if (!(name in after)) changes.push(`- ${section}: ${name}@${before[name]}`)
      else if (before[name] !== after[name]) {
        changes.push(`~ ${section}: ${name} ${before[name]} -> ${after[name]}`)
      }
    }
  }
  return changes
}

if (SKIP) {
  console.warn('security:lockfile — skipped (SKIP_SECURITY_LOCKFILE=1)')
  process.exit(0)
}

const added = stagedDependencyChanges()
if (added.length > 0) {
  console.log('security:lockfile — top-level dependency changes in this commit:')
  for (const line of added) console.log(`  ${line}`)
}

console.log('security:lockfile — verifying registry signatures')
if (!run('npm', ['audit', 'signatures'])) {
  console.error(
    'security:lockfile — signature verification failed. Refusing to commit a dependency tree ' +
      'that cannot be authenticated.\n' +
      'If this is a transient registry outage, retry; to bypass once: ' +
      'SKIP_SECURITY_LOCKFILE=1 git commit ...'
  )
  process.exit(1)
}

console.log('security:lockfile — checking production advisories (high/critical)')
if (!run('npm', ['audit', '--omit=dev', '--audit-level=high'])) {
  console.error(
    'security:lockfile — the staged dependency tree has a high or critical production advisory.\n' +
      'Update the package (or document an accepted risk) before committing.'
  )
  process.exit(1)
}

console.log('security:lockfile — ok')
