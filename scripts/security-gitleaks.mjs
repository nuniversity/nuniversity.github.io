#!/usr/bin/env node
/**
 * Secret scanning for the pre-commit hook.
 *
 * Runs the official gitleaks release against the staged diff. To avoid
 * executing an arbitrary binary from PATH, the scanner is pinned to one
 * release, downloaded from the official GitHub release, and verified against
 * the SHA-256 published in that release's checksums file before it is ever
 * executed. The verified binary is cached under `node_modules/.cache`.
 *
 * Usage:
 *   node scripts/security-gitleaks.mjs          # staged diff (pre-commit)
 *   node scripts/security-gitleaks.mjs --full   # whole repository
 *
 * Escape hatches:
 *   SKIP_GITLEAKS=1 git commit ...              # skip once
 *   GITLEAKS_BIN=/usr/bin/gitleaks ...          # use a locally installed copy
 *   SECURITY_ENFORCE=1 ...                      # fail if acquisition is impossible
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const VERSION = '8.30.1'
const RELEASE = `v${VERSION}`
const ROOT = process.cwd()
const CONFIG = path.join(ROOT, '.gitleaks.toml')
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'security', `gitleaks-${VERSION}`)

/**
 * Official assets and the SHA-256 values published in
 * gitleaks_<version>_checksums.txt for this release.
 */
const ASSETS = {
  'linux-x64': {
    file: `gitleaks_${VERSION}_linux_x64.tar.gz`,
    sha256: '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb',
  },
  'linux-arm64': {
    file: `gitleaks_${VERSION}_linux_arm64.tar.gz`,
    sha256: 'e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080',
  },
  'darwin-x64': {
    file: `gitleaks_${VERSION}_darwin_x64.tar.gz`,
    sha256: 'dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709',
  },
  'darwin-arm64': {
    file: `gitleaks_${VERSION}_darwin_arm64.tar.gz`,
    sha256: 'b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5',
  },
}

function fail(message) {
  console.error(`security:gitleaks — ${message}`)
  process.exit(1)
}

function warnAndSkip(message) {
  console.warn(`security:gitleaks — ${message}`)
  if (process.env.SECURITY_ENFORCE === '1') process.exit(1)
  console.warn('security:gitleaks — skipping (set SECURITY_ENFORCE=1 to make this fatal)')
  process.exit(0)
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function cacheBinaryPath() {
  return path.join(CACHE_DIR, 'gitleaks')
}

async function installPinnedBinary() {
  const key = `${process.platform}-${process.arch}`
  const asset = ASSETS[key]
  if (!asset) {
    warnAndSkip(
      `no pinned gitleaks asset for ${key}. Install it manually and set GITLEAKS_BIN.`
    )
  }

  const url = `https://github.com/gitleaks/gitleaks/releases/download/${RELEASE}/${asset.file}`
  console.log(`security:gitleaks — fetching ${RELEASE} (${key}) from the official release`)

  let response
  try {
    response = await fetch(url, { redirect: 'follow' })
  } catch (error) {
    warnAndSkip(`download failed: ${error.message}`)
  }
  if (!response.ok) {
    warnAndSkip(`download failed with HTTP ${response.status}`)
  }

  const archive = Buffer.from(await response.arrayBuffer())
  const digest = sha256(archive)
  if (digest !== asset.sha256) {
    fail(
      `checksum mismatch for ${asset.file}\n  expected ${asset.sha256}\n  received ${digest}\n` +
        'Refusing to execute the downloaded binary.'
    )
  }

  mkdirSync(CACHE_DIR, { recursive: true })
  const archivePath = path.join(CACHE_DIR, asset.file)
  writeFileSync(archivePath, archive)

  const extract = spawnSync('tar', ['-xzf', archivePath, '-C', CACHE_DIR, 'gitleaks'], {
    stdio: 'inherit',
  })
  rmSync(archivePath, { force: true })
  if (extract.status !== 0) {
    rmSync(path.join(CACHE_DIR, 'gitleaks'), { force: true })
    warnAndSkip('could not extract the release archive')
  }

  chmodSync(cacheBinaryPath(), 0o755)
  console.log(`security:gitleaks — verified ${VERSION} (sha256 ${asset.sha256.slice(0, 12)}…)`)
}

function resolveBinary() {
  if (process.env.GITLEAKS_BIN) {
    if (!existsSync(process.env.GITLEAKS_BIN)) fail(`GITLEAKS_BIN does not exist`)
    return process.env.GITLEAKS_BIN
  }
  if (existsSync(cacheBinaryPath())) return cacheBinaryPath()
  return null
}

function runGitleaks(binary, full) {
  const args = full
    ? ['dir', '.', '--no-banner', '--redact', '--verbose', '-c', CONFIG, '--max-target-megabytes', '5']
    : ['git', '--pre-commit', '--staged', '--no-banner', '--redact', '--verbose', '-c', CONFIG]

  const result = spawnSync(binary, args, { stdio: 'inherit' })
  if (result.error) fail(result.error.message)
  process.exit(result.status ?? 1)
}

const full = process.argv.includes('--full')

if (process.env.SKIP_GITLEAKS === '1') {
  console.warn('security:gitleaks — skipped (SKIP_GITLEAKS=1)')
  process.exit(0)
}

let binary = resolveBinary()
if (!binary) {
  await installPinnedBinary()
  binary = cacheBinaryPath()
}

runGitleaks(binary, full)
