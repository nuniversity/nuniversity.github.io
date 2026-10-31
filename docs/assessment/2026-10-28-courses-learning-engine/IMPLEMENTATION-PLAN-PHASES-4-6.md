# Courses Learning Engine — Implementation Plan, Phases 4–6

- **Date:** 2026-10-28
- **Status:** Approved direction, ready for implementation **after Phases 0–3 are verified**
- **Predecessor:** `docs/assessment/2026-10-28-courses-learning-engine/IMPLEMENTATION-PLAN.md` (Phases 0–3) — read its §0 protocol first; the same rules apply here.
- **Scope:** Phase 4 (multimodal & interactivity), Phase 5 (course-writer skill v2), Phase 6 (resource fabric, roadmap mastery, rollout, CI).
- **Locked decisions carried forward:** JavaScript-only code runner (no Pyodide, no CDN); everything static; no hard locks on progression; no new runtime dependencies.

---

## 0. Execution protocol (delta from the Phases 0–3 plan)

1. **Do not start any step here until Phases 0–3 pass their Definition of Done.** This plan builds on: `lib/practice/types.ts`, `lib/practice/record.ts`, `lib/practice/fsrs.ts`, `lib/practice/cards.ts`, `components/lessons/PracticeRecorder.tsx`, `components/lessons/LessonMasteryHint.tsx`, the question index (`public/question-index/<lang>/<course>.json`), and `ts-fsrs`.
2. Read every file a step names before editing it. If a file differs from a quote below, adapt to the real file and preserve the step's intent.
3. One step = one unit of work. Never touch `content/courses/**` in Phases 4–5 except where a step explicitly says so.
4. Run each `VERIFY` block. Two failures for the same reason → log to `.scratch/learning-engine/PROGRESS.md` and move to the next `INDEPENDENT` step.
5. **Security rule (non-negotiable):** learner-authored JavaScript may run only inside the sandboxed iframe described in P4-S1. No component may call `eval`/`new Function`/`Function` outside `public/code-sandbox-worker.js`. No new `'unsafe-eval'` may be added to `lib/security/csp.mjs`.
6. Global gates at the end of each phase: `npm run test`, `npm run lint`, `npm run build` (this includes CSP and CSS verification), and `python -m pytest .opencode/skills/course-writer/tests -q` when a step touches the skill.

**Why the sandbox exists:** `lib/security/csp.mjs` intentionally has no `'unsafe-eval'`. A dedicated sandbox page with its own CSP (`'unsafe-eval'`) loaded in `<iframe sandbox="allow-scripts">` gives an opaque origin that cannot read cookies, localStorage, or the parent DOM. `scripts/verify-csp.mjs` walks every HTML file and requires the standard directives and origins to survive — the sandbox page policy is the standard policy **plus** `'unsafe-eval'` in `script-src` and `worker-src 'self'`, so the gate passes.

---

## 1. New infrastructure conventions

### 1.1 Fence dispatch pattern (matches existing renderer)

`components/markdown/MarkdownRenderer.tsx` routes fenced blocks by **fence language**, not by a JSON `type` field. Adding a fence requires three edits, always in this order:

1. `langMap` entry: `newfence: 'newfence',`
2. An `if (language === 'newfence') { ... }` branch before the generic fallback (`return (<div className="relative my-6 ...">` syntax-highlighted block).
3. A component import at the top.

The JSON parse branch must follow the existing pattern — `try { const config = JSON.parse(codeString); return <Component .../> } catch (e) { return (<div className="my-6 p-4 border border-red-500 ...">Invalid newfence config: {(e as Error).message}</div>) }`.

### 1.2 Validator patterns (`validate_lesson.py`)

- Blocks are collected with `re.finditer(r"```(\w+)\n(.*?)```", content, re.DOTALL)`.
- Per-fence schema violations are **errors** (exit 2); missing-optional richness features are **warnings** (exit 1).
- Any new fence language must also be added to `INTERACTIVE_FENCES` (the prose scanner treats fenced JSON as prose, which is intended — question text is read aloud).
- Run always with `OPENCODE_FILE_PATH=<file> python3 .opencode/skills/course-writer/scripts/validate_lesson.py`.

### 1.3 Sandbox files live in `public/`

Next copies `public/` verbatim into `out/`; `scripts/postbuild.mjs` `ensureCsp()` skips HTML files that already carry a CSP meta tag, so the sandbox page keeps its own policy. `scripts/verify-csp.mjs` will still validate it (that is the point of P4-S1's VERIFY step).

### 1.4 Requirements on authored content (implemented in Phase 5, used in Phase 6)

| Fence | JSON shape | Rules |
|---|---|---|
| `codeexercise` | `{id, title, instructions, language:"javascript", starter, solution, tests:[{name, call, expected}], explanation?}` | `language` must be `"javascript"`; 2–6 tests; no `fetch`/`XMLHttpRequest`/`WebSocket`/`importScripts`/`eval` in any string; `expected` must be JSON-serializable |
| `glossary` | `{terms:[{term, definition}]}` | 3–12 terms; definitions are 1–2 sentences; placed before the first use of the terms |
| `resources` | `{heading?, items:[{type, title, url, source?, minutes?}]}` | `type` ∈ library types (`video`, `ebook`, `course`, `blog`, `repository`, `podcast`, `article`); `url` must start with `https://`; 1–8 items |

---

## 2. Step index

| Step | Phase | Summary | Files | Depends on |
|---|---|---|---|---|
| P4-S1 | 4 | JS sandbox + runner + `codeexercise` block | `public/code-sandbox.html`, `public/code-sandbox.js`, `public/code-sandbox-worker.js`, `lib/code/harness.ts`, `lib/code/run-javascript.ts`, `components/markdown/CodeExerciseBlock.tsx`, `MarkdownRenderer.tsx`, tests | Phase 0–3 done |
| P4-S2 | 4 | Focus mode (segmenting) | `lib/lessons/focus-mode.ts`, `components/lessons/FocusModeToggle.tsx`, lesson `page.tsx` | — |
| P4-S3 | 4 | `glossary` fence | `components/markdown/GlossaryBlock.tsx`, `MarkdownRenderer.tsx` | — |
| P4-S4 | 4 | Media coverage report + validator warning | `scripts/report-media-coverage.mjs`, `validate_lesson.py` | — |
| P4-S5 *(optional)* | 4 | TTS playback speed | `components/lessons/LessonAudio.tsx` | — |
| P5-S1 | 5 | `guide.md` schemas for 3 new fences | `references/guide.md` | P4-* |
| P5-S2 | 5 | `skill.md` v2: tables, quality bars, Mayer/UDL checklist | `skill.md` | P5-S1 |
| P5-S3 | 5 | Validator v2 | `validate_lesson.py` | P4-S1, P4-S3, P6-S1 schema |
| P5-S4 | 5 | Skill tests | `tests/test_validate_lesson.py` | P5-S3 |
| P5-S5 | 5 | Quiz-bank export (single source of truth) | `scripts/export-quiz-bank.mjs` | question index |
| P6-S1 | 6 | `resources` fence + renderer | `components/markdown/ResourcesBlock.tsx`, `MarkdownRenderer.tsx` | P5-S3 |
| P6-S2 | 6 | Roadmap mastery requirement (soft) | `lib/roadmaps/types.ts`, `get-roadmap-content.ts`, `components/roadmaps/RoadmapStepCard.tsx` | — |
| P6-S3 | 6 | CI content gate | `scripts/validate-courses.mjs`, `.github/workflows/nextjs.yml` | P5-S3 |
| P6-S4 | 6 | Rollout waves + coverage reports | `scripts/report-content-coverage.mjs`, content edits | all above |
| P6-S5 | 6 | Docs | `docs/features/*.md` | all above |

---

## 3. Phase 4 — Multimodal & interactivity

> **STATUS (2026-10-28, after decision audit):** decisions D9 (sandbox), D10 (quiz schema) and the CSP constraint below were validated. **Read the revision block in P4-S1 first — it supersedes the three-file sandbox design in that step.** Phase 0–3 are implemented; Phases 4–6 remain.

### P4-S1 — JavaScript code exercises (sandboxed)

> **REVISION (supersedes subsections 1–3 below).** Two findings changed the design:
> 1. The global CSP's `frame-src` does **not** include `'self'`, so a same-origin sandbox iframe would be blocked. `lib/security/csp.mjs` must change `frame-src` to `frame-src 'self' ${REMOTE.phet} ${REMOTE.youtube} ${REMOTE.vimeo}` (add `'self'` only).
> 2. One HTML file is enough, and it avoids questions about `'self'` inside an opaque-origin document: inline the controller and evaluate code on the sandbox page's own thread.
>
> **IMPLEMENTED (2026-10-28, final):** `public/code-sandbox.html` is the single file; there is **no worker and no blob URL**. Eval runs inline on the sandbox page's thread (the 3s parent timeout reloads the iframe, which terminates runaway code). `scripts/verify-csp.mjs` has an explicit `code-sandbox.html` branch that asserts `'unsafe-eval'`, `connect-src 'none'`, and no external scripts instead of the shared required-origin checks. See `docs/features/MARKDOWN-RENDERER.md`.
>
> **Final `public/code-sandbox.html`:**
>
> ```html
> <!doctype html>
> <html lang="en">
> <head>
> <meta charset="utf-8"/>
> <meta name="robots" content="noindex"/>
> <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://formspree.io https://files.rcsb.org; frame-src https://phet.colorado.edu https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; form-action 'self' https://formspree.io; upgrade-insecure-requests"/>
> <title>Code sandbox</title>
> </head>
> <body>
> <script>
> const WORKER_SOURCE = `
> function deepEqual(a, b) {
>   if (a === b) return true;
>   if (typeof a !== typeof b) return false;
>   if (a === null || b === null || typeof a !== 'object') return Number.isNaN(a) && Number.isNaN(b);
>   if (Array.isArray(a) !== Array.isArray(b)) return false;
>   const ka = Object.keys(a), kb = Object.keys(b);
>   if (ka.length !== kb.length) return false;
>   return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
> }
> function show(v) { try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); } }
> self.onmessage = (event) => {
>   const { code, tests } = event.data || {};
>   if (typeof code !== 'string' || !Array.isArray(tests)) { self.postMessage({ type: 'error', error: 'Invalid payload' }); return; }
>   const results = [];
>   for (const test of tests) {
>     const name = typeof test.name === 'string' ? test.name : 'test';
>     const call = typeof test.call === 'string' ? test.call : '';
>     try {
>       const run = new Function('"use strict";\\n' + code + '\\n;return (' + call + ');');
>       const value = run();
>       results.push({ name, passed: deepEqual(value, test.expected), actual: show(value) });
>     } catch (e) {
>       results.push({ name, passed: false, error: String((e && e.message) || e) });
>     }
>   }
>   self.postMessage({ type: 'done', results });
> };
> `;
> let worker = null;
> function stopWorker() { if (worker) { worker.terminate(); worker = null; } }
> window.addEventListener('message', (event) => {
>   const data = event.data;
>   if (!data || typeof data !== 'object' || typeof data.nonce !== 'string') return;
>   stopWorker();
>   try { worker = new Worker(URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))); }
>   catch { parent.postMessage({ nonce: data.nonce, type: 'error', error: 'Worker unavailable' }, '*'); return; }
>   worker.onmessage = (msg) => { parent.postMessage({ nonce: data.nonce, ...(msg.data || {}) }, '*'); stopWorker(); };
>   worker.onerror = () => { parent.postMessage({ nonce: data.nonce, type: 'error', error: 'Sandbox worker crashed' }, '*'); stopWorker(); };
>   worker.postMessage({ code: data.code, tests: data.tests });
> });
> </script>
> </body>
> </html>
> ```
>
> **Component iframe:** `<iframe ref={iframeRef} src="/code-sandbox.html" sandbox="allow-scripts" referrerPolicy="no-referrer" title="Code sandbox" className="hidden" />`
>
> **Runner hardening:** in `createSandboxRunner`'s message listener, ignore events unless `event.source === iframe.contentWindow`. Keep the 3 s timeout and the iframe reload on timeout.
>
> **Verification:** `npm run build` must show `verify-csp: ... pages carry a valid Content-Security-Policy` with the sandbox page included; the global policy file must still contain no `'unsafe-eval'`.

#### 1. Sandbox page — `public/code-sandbox.html` (SUPERSEDED by the revision above)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="robots" content="noindex"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://formspree.io https://files.rcsb.org; frame-src https://phet.colorado.edu https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; form-action 'self' https://formspree.io; upgrade-insecure-requests"/>
<title>Code sandbox</title>
</head>
<body>
<script src="/code-sandbox.js"></script>
</body>
</html>
```

Note: `scripts/verify-csp.mjs` requires every HTML file to carry the standard directives and origins. This policy contains all of them, plus `'unsafe-eval'` and `worker-src`. Do not remove the Formspree/rcsb/PhET/YouTube/Vimeo origins — the verifier will fail.

#### 2. Sandbox controller — `public/code-sandbox.js` (SUPERSEDED — inlined in the revision above)

```js
/* Runs inside <iframe sandbox="allow-scripts">. Opaque origin: no storage,
   cookies, or parent-DOM access. Receives {nonce, code, tests} and replies
   {nonce, type:'done'|'error', results?, error?}. A worker enforces the
   timeout from the parent side. */
let worker = null

function stopWorker() {
  if (worker) {
    worker.terminate()
    worker = null
  }
}

window.addEventListener('message', (event) => {
  const data = event.data
  if (!data || typeof data !== 'object' || typeof data.nonce !== 'string') return
  stopWorker()
  const { nonce, code, tests } = data
  if (typeof code !== 'string' || !Array.isArray(tests)) {
    parent.postMessage({ nonce, type: 'error', error: 'Invalid sandbox payload' }, '*')
    return
  }
  try {
    worker = new Worker('/code-sandbox-worker.js')
  } catch (e) {
    parent.postMessage({ nonce, type: 'error', error: 'Worker unavailable' }, '*')
    return
  }
  worker.onmessage = (msg) => {
    const payload = msg.data
    if (!payload || typeof payload !== 'object') return
    parent.postMessage({ nonce, ...payload }, '*')
    stopWorker()
  }
  worker.onerror = () => {
    parent.postMessage({ nonce, type: 'error', error: 'Sandbox worker crashed' }, '*')
    stopWorker()
  }
  worker.postMessage({ code, tests })
})
```

#### 3. Worker — `public/code-sandbox-worker.js` (SUPERSEDED — inlined in the revision above)

```js
/* Evaluates learner code with new Function. Each test call is compiled
   separately so one throwing test cannot hide the others. */
function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null || typeof a !== 'object') return Number.isNaN(a) && Number.isNaN(b)
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]))
}

function show(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

self.onmessage = (event) => {
  const { code, tests } = event.data || {}
  if (typeof code !== 'string' || !Array.isArray(tests)) {
    self.postMessage({ type: 'error', error: 'Invalid payload' })
    return
  }
  const results = []
  for (const test of tests) {
    const name = typeof test.name === 'string' ? test.name : 'test'
    const call = typeof test.call === 'string' ? test.call : ''
    try {
      const run = new Function(`"use strict";\n${code}\n;return (${call});`)
      const value = run()
      results.push({ name, passed: deepEqual(value, test.expected), actual: show(value) })
    } catch (e) {
      results.push({ name, passed: false, error: String((e && e.message) || e) })
    }
  }
  self.postMessage({ type: 'done', results })
}
```

#### 4. Pure harness helpers + unit tests

**Create** `lib/code/harness.ts`:

```ts
export interface CodeTestConfig {
  name: string
  call: string
  expected: unknown
}

export interface CodeTestResult {
  name: string
  passed: boolean
  actual?: unknown
  error?: string
}

/** Names that must never appear in authored exercise code (defence in depth). */
const FORBIDDEN_API = /\b(fetch|XMLHttpRequest|WebSocket|importScripts|eval|Function)\s*\(/

/** Author-time guard used by the validator and the client before sending code. */
export function containsForbiddenApi(source: string): boolean {
  return FORBIDDEN_API.test(source)
}

/** Stable cache-busting nonce for one run. */
export function newNonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
```

**Create** `tests/lib/code-harness.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { containsForbiddenApi } from '@/lib/code/harness'

describe('containsForbiddenApi', () => {
  it('flags network and eval entry points', () => {
    expect(containsForbiddenApi('fetch("/x")')).toBe(true)
    expect(containsForbiddenApi('eval("2+2")')).toBe(true)
    expect(containsForbiddenApi('new Function("return 1")')).toBe(true)
  })
  it('allows ordinary code and words containing the substrings', () => {
    expect(containsForbiddenApi('const fetched = [1,2].reduce((a,b)=>a+b,0)')).toBe(false)
    expect(containsForbiddenApi('function sum(nums){return nums.length}')).toBe(false)
  })
})
```

#### 5. Parent-side runner — `lib/code/run-javascript.ts` (exact)

```ts
import type { CodeTestConfig, CodeTestResult } from './harness'
import { newNonce } from './harness'

interface RunMessage {
  type: 'done' | 'error'
  nonce: string
  results?: CodeTestResult[]
  error?: string
}

const TIMEOUT_MS = 3000

/**
 * Drives the sandbox iframe via postMessage. One iframe per block; the iframe
 * is reloaded on timeout, which terminates its worker.
 */
export interface SandboxRunner {
  run: (code: string, tests: CodeTestConfig[]) => Promise<CodeTestResult[] | { error: string }>
  dispose: () => void
}

export function createSandboxRunner(iframe: HTMLIFrameElement): SandboxRunner {
  const pending = new Map<string, { resolve: (value: CodeTestResult[] | { error: string }) => void; timer: ReturnType<typeof setTimeout> }>()

  const onMessage = (event: MessageEvent<RunMessage>) => {
    const data = event.data
    if (!data || typeof data.nonce !== 'string') return
    const entry = pending.get(data.nonce)
    if (!entry) return
    clearTimeout(entry.timer)
    pending.delete(data.nonce)
    if (data.type === 'done' && Array.isArray(data.results)) entry.resolve(data.results)
    else entry.resolve({ error: data.error || 'Sandbox error' })
  }

  window.addEventListener('message', onMessage)

  return {
    run(code, tests) {
      return new Promise((resolve) => {
        const nonce = newNonce()
        const timer = setTimeout(() => {
          pending.delete(nonce)
          iframe.src = iframe.src // reload: kills the worker
          resolve({ error: 'Time limit exceeded (3s). Check for an infinite loop.' })
        }, TIMEOUT_MS)
        pending.set(nonce, { resolve, timer })
        iframe.contentWindow?.postMessage({ nonce, code, tests }, '*')
      })
    },
    dispose() {
      window.removeEventListener('message', onMessage)
      for (const entry of pending.values()) clearTimeout(entry.timer)
      pending.clear()
    },
  }
}
```

#### 6. Component — `components/markdown/CodeExerciseBlock.tsx` (exact)

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Code2, Play, RotateCcw, XCircle } from 'lucide-react'
import { useLessonScoreWidget } from '@/components/lessons/LessonScoreContext'
import { containsForbiddenApi, type CodeTestConfig, type CodeTestResult } from '@/lib/code/harness'
import { createSandboxRunner, type SandboxRunner } from '@/lib/code/run-javascript'

export interface CodeExerciseConfig {
  id: string
  title: string
  instructions: string
  language: 'javascript'
  starter: string
  solution?: string
  tests: CodeTestConfig[]
  explanation?: string
}

interface CodeExerciseBlockProps {
  data: CodeExerciseConfig
  dict?: any
}

export default function CodeExerciseBlock({ data, dict }: CodeExerciseBlockProps) {
  const t = dict?.codeExercise
  const [code, setCode] = useState(data.starter)
  const [results, setResults] = useState<CodeTestResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const runnerRef = useRef<SandboxRunner | null>(null)
  const { scoreId, register, report } = useLessonScoreWidget('codeexercise')

  useEffect(() => {
    register({ id: scoreId, label: data.title, total: data.tests.length })
  }, [register, scoreId, data.title, data.tests.length])

  useEffect(() => {
    if (!results) return
    report({
      id: scoreId,
      label: data.title,
      total: data.tests.length,
      correct: results.filter((r) => r.passed).length,
      missed: results.filter((r) => !r.passed).map((r) => r.name),
      answered: true,
      key: data.id,
    })
  }, [report, scoreId, data.id, data.title, data.tests.length, results])

  useEffect(() => () => runnerRef.current?.dispose(), [])

  const run = async () => {
    if (!iframeRef.current) return
    setError(null)
    if (containsForbiddenApi(code)) {
      setError(t?.forbidden || 'Remove network or eval calls: exercises run in a closed sandbox.')
      return
    }
    if (!runnerRef.current) runnerRef.current = createSandboxRunner(iframeRef.current)
    setRunning(true)
    const outcome = await runnerRef.current.run(code, data.tests)
    setRunning(false)
    if (Array.isArray(outcome)) setResults(outcome)
    else {
      setError(outcome.error)
      setResults(null)
    }
  }

  const reset = () => {
    setCode(data.starter)
    setResults(null)
    setError(null)
  }

  const passed = results?.filter((r) => r.passed).length ?? 0

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm" data-audio-skip>
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3 text-sm font-semibold">
        <Code2 className="h-4 w-4 text-primary" />
        {data.title}
        <span className="ml-auto text-xs font-normal text-muted-foreground">{data.language}</span>
      </div>
      <div className="space-y-3 p-4 sm:p-6">
        <p className="text-sm text-foreground/80">{data.instructions}</p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={Math.min(16, Math.max(6, code.split('\n').length + 1))}
          className="w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={t?.editor || 'Code editor'}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={run} disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Play className="h-4 w-4" />
            {running ? (t?.running || 'Running…') : (t?.run || 'Run tests')}
          </button>
          <button type="button" onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            <RotateCcw className="h-4 w-4" />
            {t?.reset || 'Reset'}
          </button>
        </div>
        <iframe ref={iframeRef} src="/code-sandbox.html" sandbox="allow-scripts" title="Code sandbox" className="hidden" />
        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
        {results && (
          <div aria-live="polite" className="space-y-1">
            <p className="text-sm font-medium">
              {passed}/{data.tests.length} {t?.passed || 'tests passed'}
            </p>
            {results.map((r) => (
              <p key={r.name} className={`flex items-start gap-2 text-sm ${r.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {r.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <XCircle className="mt-0.5 h-4 w-4" />}
                <span>
                  {r.name}
                  {!r.passed && (r.error ? `: ${r.error}` : `: got ${JSON.stringify(r.actual)}`)}
                </span>
              </p>
            ))}
            {passed === data.tests.length && data.explanation && (
              <p className="pt-2 text-sm text-foreground/80">{data.explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 7. Renderer dispatch

In `MarkdownRenderer.tsx`: import `CodeExerciseBlock, { type CodeExerciseConfig }`; add `codeexercise: 'codeexercise',` to `langMap`; add this branch before the generic fallback:

```tsx
if (language === 'codeexercise') {
  try {
    const config = JSON.parse(codeString) as CodeExerciseConfig
    return <CodeExerciseBlock data={config} dict={dict} />
  } catch (e) {
    return (
      <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
        Invalid codeexercise config: {(e as Error).message}
      </div>
    )
  }
}
```

VERIFY:
```bash
npx tsc --noEmit && npm run test && npm run build
# build must pass verify-csp: the sandbox page's policy is validated too.
```
Manual: create a scratch lesson? No — content edits are out of scope here. Instead use the dev server console:
```js
// in the browser on any page containing a code exercise (added in Phase 6 rollout)
// confirm no CSP errors in the console and that results render
```

### P4-S2 — Focus mode (segmenting + coherence)

`CONTEXT:` lesson `page.tsx` header row (`<div className="flex items-center gap-3 mb-4 flex-wrap">`), `components/lessons/LessonScoreContext.tsx`

**Create** `lib/lessons/focus-mode.ts`:

```ts
/**
 * Focus mode hides every top-level `##` section except the opening hook
 * section and the Key Takeaways section. Segmenting and coherence principles:
 * the learner sees the same lesson in a shorter, self-paced form without a
 * second copy of the content.
 */
export function collectFocusSections(root: HTMLElement): HTMLElement[][] {
  const headings = Array.from(root.querySelectorAll<HTMLElement>(':scope > h2'))
  const groups: HTMLElement[][] = []
  for (const heading of headings) {
    const group: HTMLElement[] = [heading]
    let node = heading.nextElementSibling
    while (node && !(node instanceof HTMLElement && node.tagName === 'H2')) {
      if (node instanceof HTMLElement) group.push(node)
      node = node.nextElementSibling
    }
    groups.push(group)
  }
  return groups
}

/** Applies/removes focus mode; returns a cleanup function. */
export function applyFocusMode(root: HTMLElement, enabled: boolean): () => void {
  const groups = collectFocusSections(root)
  if (groups.length === 0) return () => {}
  const first = groups[0]
  const hidden: HTMLElement[] = []
  groups.forEach((group, index) => {
    const keep = index === 0 || /Key Takeaways/i.test(group[0].textContent ?? '')
    for (const el of group) {
      if (keep || !enabled) continue
      if (!el.dataset.focusOriginalDisplay) el.dataset.focusOriginalDisplay = el.style.display
      el.style.display = 'none'
      hidden.push(el)
    }
  })
  if (enabled) {
    for (const el of hidden) el.dataset.focusHidden = 'true'
  } else {
    for (const el of groups.flat()) {
      if (el.dataset.focusOriginalDisplay !== undefined) {
        el.style.display = el.dataset.focusOriginalDisplay
        delete el.dataset.focusOriginalDisplay
      }
    }
  }
  return () => applyFocusMode(root, false)
}
```

**Create** `components/lessons/FocusModeToggle.tsx`:

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'
import { applyFocusMode } from '@/lib/lessons/focus-mode'

/** Toggles the condensed lesson view. Chrome only (data-audio-skip). */
export default function FocusModeToggle({ dict }: { dict?: any }) {
  const [enabled, setEnabled] = useState(false)

  const root = useCallback(() => document.querySelector<HTMLElement>('[data-lesson-content]'), [])

  useEffect(() => {
    const el = root()
    if (!el) return
    const cleanup = applyFocusMode(el, enabled)
    return () => {
      cleanup()
    }
  }, [enabled, root])

  return (
    <button
      type="button"
      data-audio-skip
      aria-pressed={enabled}
      onClick={() => setEnabled((v) => !v)}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
    >
      {enabled ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
      {enabled
        ? dict?.lesson?.focus_off || 'Show full lesson'
        : dict?.lesson?.focus_on || 'Focus mode'}
    </button>
  )
}
```

**Edit** lesson `page.tsx`: inside the header flex row (the one containing difficulty/duration/reading time), add `<FocusModeToggle dict={dict} />` as the last child.

VERIFY:
```bash
npx tsc --noEmit && npm run build
# manual: open a lesson, toggle Focus mode: only the first section and Key Takeaways remain; toggle again restores everything.
```

### P4-S3 — Glossary fence (pre-training principle)

**Create** `components/markdown/GlossaryBlock.tsx`:

```tsx
'use client'

import { BookMarked } from 'lucide-react'

export interface GlossaryTerm {
  term: string
  definition: string
}

export interface GlossaryConfig {
  terms: GlossaryTerm[]
}

export default function GlossaryBlock({ data, dict }: { data: GlossaryConfig; dict?: any }) {
  return (
    <div className="my-8 rounded-xl border bg-muted/30 p-4 sm:p-6" data-audio-skip>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <BookMarked className="h-4 w-4 text-primary" />
        {dict?.glossary?.title || 'Key terms'}
      </p>
      <dl className="space-y-2">
        {data.terms.map((t) => (
          <details key={t.term} className="group rounded-lg border bg-card px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">{t.term}</summary>
            <dd className="mt-1 text-sm text-foreground/80">{t.definition}</dd>
          </details>
        ))}
      </dl>
    </div>
  )
}
```

Renderer edits (same pattern as P4-S1 §7): import `GlossaryBlock`; add `glossary: 'glossary'` to `langMap`; add the `if (language === 'glossary')` branch parsing `JSON.parse(codeString)`.

Do **not** add glossary prose to the audio reader; the component is `data-audio-skip` by design (terms are support material, not lesson prose).

VERIFY:
```bash
npx tsc --noEmit && npm run build
```

### P4-S4 — Media coverage reporting

**Create** `scripts/report-media-coverage.mjs`:

```js
#!/usr/bin/env node
/** Read-only report: how many lessons per course embed an image or video,
 *  and how many media files exist for that course. Used for roadmapping. */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const COURSES = path.join(ROOT, 'content', 'courses')
const MEDIA = path.join(ROOT, 'content', 'media')

function mediaFiles(slug) {
  const dir = path.join(MEDIA, slug)
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir, { recursive: true }).filter((f) => fs.statSync(path.join(dir, f)).isFile()).length
}

let total = 0
let withMedia = 0
for (const slug of fs.readdirSync(COURSES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const localeDir = path.join(COURSES, slug, 'en')
  if (!fs.existsSync(localeDir)) continue
  const lessons = fs.readdirSync(localeDir).filter((f) => f.endsWith('.md'))
  let covered = 0
  for (const file of lessons) {
    const content = fs.readFileSync(path.join(localeDir, file), 'utf8')
    total += 1
    if (/!\[[^\]]*\]\([^)]+\)/.test(content) || /```video\b/.test(content)) {
      covered += 1
      withMedia += 1
    }
  }
  const files = mediaFiles(slug)
  if (lessons.length > 0) {
    const pct = Math.round((covered / lessons.length) * 100)
    const flag = pct < 50 ? '  <-- needs media' : ''
    console.log(`${slug.padEnd(42)} ${String(covered).padStart(3)}/${String(lessons.length).padStart(3)} lessons (${pct}%), ${files} file(s)${flag}`)
  }
}
console.log(`\nTotal lessons with embedded media: ${withMedia}/${total}`)
```

Add to `package.json` scripts: `"report:media": "node scripts/report-media-coverage.mjs"`.

Also add a **warning** (not error) to `validate_lesson.py` inside `validate_body`: no image markdown and no `video` fence → `warnings.append("No image or video embed — add one where it aids understanding (Mayer multimedia principle)")`.

VERIFY:
```bash
node scripts/report-media-coverage.mjs | tail -5
OPENCODE_FILE_PATH=content/courses/sql-beginner/en/01-what-is-sql-rdbms.md python3 .opencode/skills/course-writer/scripts/validate_lesson.py; echo "exit=$?"
# expected: report prints a table; validator returns 0/1/2 based on the file, with the media warning visible.
```

### P4-S5 (optional) — TTS playback speed

`CONTEXT:` `components/lessons/LessonAudio.tsx` (utterance rate is hard-coded to `1` near line 287; controls are in the component's render return)

If a clear control cluster exists in the render output:
1. Add state `const [rate, setRate] = useState(1)`.
2. Replace `utterance.rate = 1` with `utterance.rate = rate`.
3. Render three buttons (`0.8x`, `1x`, `1.25x`) next to the existing audio controls, with `aria-pressed` and `data-audio-skip`.
4. If the control cluster cannot be identified safely, **skip this step and record it as deferred** — do not restructure the component.

VERIFY: `npx tsc --noEmit && npm run build`; manual: change speed, confirm playback follows it.

---

## 4. Phase 5 — course-writer skill v2

### P5-S1 — `references/guide.md`: schemas for three fences

Append three sections after the existing interactive component sections (before "Media and video" guidance), using the exact table style of the file. Content:

````markdown
### Code Exercises (JavaScript only)

**Tag:** ` ```codeexercise `

```json
{
  "id": "js-01-ex1",
  "title": "Sum an array",
  "instructions": "Write a function sum(nums) that returns the total.",
  "language": "javascript",
  "starter": "function sum(nums) {\n  // your code here\n}",
  "solution": "function sum(nums) {\n  return nums.reduce((a, b) => a + b, 0)\n}",
  "tests": [
    {"name": "empty array", "call": "sum([])", "expected": 0},
    {"name": "three numbers", "call": "sum([1, 2, 3])", "expected": 6}
  ],
  "explanation": "reduce folds the array into a single running total."
}
```

Rules: `language` MUST be `"javascript"` (the runner is JS-only); 2–6 deterministic tests; `expected` must be JSON-serializable; code strings must not contain `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `eval`, or `Function(`; the exercise runs inside a closed sandbox with no network or storage access.

### Key Terms (Glossary)

**Tag:** ` ```glossary `

```json
{
  "terms": [
    {"term": "Idempotency", "definition": "Repeating the same operation produces the same result."},
    {"term": "Shard", "definition": "A horizontal partition of a data stream or table."}
  ]
}
```

Rules: 3–12 terms; place before the first use of the terms (pre-training principle); definitions of 1–2 sentences.

### Further Resources

**Tag:** ` ```resources `

```json
{
  "heading": "Dig deeper",
  "items": [
    {"type": "video", "title": "Kinesis in 10 minutes", "url": "https://www.youtube.com/watch?v=...", "source": "YouTube", "minutes": 10},
    {"type": "ebook", "title": "Designing Data-Intensive Applications", "url": "https://dataintensive.net/", "source": "O'Reilly"}
  ]
}
```

Rules: `type` uses the Library resource types (`video`, `ebook`, `course`, `blog`, `repository`, `podcast`, `article`); `url` must start with `https://`; 1–8 items; only link resources you have verified exist.
````

VERIFY: `grep -c "codeexercise" .opencode/skills/course-writer/references/guide.md` → ≥ 2.

### P5-S2 — `skill.md`: tables, quality bars, pedagogy checklist

1. In the "Interactive Components" tableadd rows:

```markdown
| `codeexercise` | In-browser JS exercise (sandboxed) | `id`, `title`, `instructions`, `language: "javascript"`, `starter`, `tests[{name,call,expected}]`, `solution?`, `explanation?` |
| `glossary` | Key-terms accordion | `terms[{term,definition}]` |
| `resources` | Library cross-links | `heading?`, `items[{type,title,url,source?,minutes?}]` |
```

2. In "Quality Bars", add these rows:

```markdown
| Code exercise (programming courses) | — | ≥1 per hands-on lesson, JS-only |
| Glossary block (concept-dense lessons) | — | ≥1 before the first use of new terms |
| `resources` block | — | ≥1 per course, linking real Library items |
```

3. Append a new section **before** "Validation & Exit Codes":

```markdown
## Pedagogy Checklist (evidence-based, enforced by review)

Every lesson must satisfy the six strategies where they apply:

1. **Retrieval practice** — ≥5 `question` blocks (divergent options, explanations that say why the top distractor traps).
2. **Spaced practice** — questions carry stable `id` values so the platform's FSRS review queue can schedule them.
3. **Interleaving** — the Practice Questions section includes at least one question from an earlier lesson's skill.
4. **Elaboration** — at least one "why" or "how" explanation per major concept, not just a definition.
5. **Dual coding** — a diagram, plot, or image for every mechanism with three or more parts.
6. **Concrete examples** — worked examples with real numbers, dated where prices or versions are involved.

Mayer checklist (multimedia):
- Coherence: remove decorative visuals that do not teach.
- Signaling: headings and callouts mark the essentials.
- Segmenting: long topics are split into `##` sections that can stand alone.
- Pre-training: `glossary` before first use; prerequisites stated in the hook.
- Spatial/temporal contiguity: labels and explanations sit next to the visual they describe.

UDL checklist (learner variability):
- Representation: the lesson works as text, as audio (voice-first rules), and as diagrams.
- Engagement: at least one choice point (worked example vs exercise, or an optional `resources` block).
- Action & expression: at least one non-MCQ interaction (matching, fillblank, dragdrop, or codeexercise) in hands-on lessons.
- Accessibility: no meaning is carried by color alone; tables have header rows; alt text is descriptive.
```

VERIFY: `grep -c "Pedagogy Checklist" .opencode/skills/course-writer/skill.md` → 1.

### P5-S3 — Validator v2

`CONTEXT:` `validate_lesson.py` (read fully; the patterns are established)

1. Extend constants:

```python
INTERACTIVE_BLOCK_TYPES = {"math", "phet", "plot", "molecule", "dragdrop", "matching", "fillblank", "codeexercise", "glossary", "resources"}
INTERACTIVE_FENCES = {"question", "matching", "fillblank", "dragdrop", "plot", "video", "phet", "molecule", "interactive", "codeexercise", "glossary", "resources"}
FORBIDDEN_CODE_API = re.compile(r"\b(fetch|XMLHttpRequest|WebSocket|importScripts|eval|Function)\s*\(")
```

2. In `validate_interactive_blocks`, after the JSON parse and the existing question-type check, add:

```python
            if lang == "codeexercise":
                errors.extend(_validate_codeexercise(parsed))
            elif lang == "glossary":
                errors.extend(_validate_glossary(parsed))
            elif lang == "resources":
                errors.extend(_validate_resources(parsed))
```

3. Add the three helpers above `validate_interactive_blocks`:

```python
def _validate_codeexercise(parsed) -> list[str]:
    errors = []
    if not isinstance(parsed, dict):
        return ["codeexercise: config must be a JSON object"]
    for field in ("id", "title", "instructions", "starter", "language", "tests"):
        if field not in parsed:
            errors.append(f"codeexercise: missing '{field}'")
    if parsed.get("language") != "javascript":
        errors.append("codeexercise: 'language' must be 'javascript' (JS-only runner)")
    tests = parsed.get("tests")
    if not isinstance(tests, list) or not (2 <= len(tests) <= 6):
        errors.append("codeexercise: 'tests' must be a list of 2-6 test objects")
    else:
        for i, test in enumerate(tests):
            if not isinstance(test, dict) or not all(k in test for k in ("name", "call", "expected")):
                errors.append(f"codeexercise: test {i} must have name, call, expected")
    blob = json.dumps(parsed)
    if FORBIDDEN_CODE_API.search(blob):
        errors.append("codeexercise: forbidden network/eval API in code or tests")
    return errors


def _validate_glossary(parsed) -> list[str]:
    if not isinstance(parsed, dict) or not isinstance(parsed.get("terms"), list):
        return ["glossary: expected {'terms': [...]}"]
    terms = parsed["terms"]
    if not (3 <= len(terms) <= 12):
        return ["glossary: 'terms' must contain 3-12 entries"]
    errors = []
    for i, term in enumerate(terms):
        if not isinstance(term, dict) or not isinstance(term.get("term"), str) or not isinstance(term.get("definition"), str):
            errors.append(f"glossary: term {i} must have string 'term' and 'definition'")
    return errors


def _validate_resources(parsed) -> list[str]:
    if not isinstance(parsed, dict) or not isinstance(parsed.get("items"), list):
        return ["resources: expected {'items': [...]}"]
    items = parsed["items"]
    if not (1 <= len(items) <= 8):
        return ["resources: 'items' must contain 1-8 entries"]
    allowed = {"video", "ebook", "course", "blog", "repository", "podcast", "article"}
    errors = []
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"resources: item {i} must be an object")
            continue
        if item.get("type") not in allowed:
            errors.append(f"resources: item {i} type must be one of {sorted(allowed)}")
        if not isinstance(item.get("title"), str) or not item.get("title"):
            errors.append(f"resources: item {i} needs a non-empty title")
        url = item.get("url")
        if not isinstance(url, str) or not url.startswith("https://"):
            errors.append(f"resources: item {i} url must start with https://")
    return errors
```

4. Media warning in `validate_body` (after the takeaways check):

```python
    has_media = bool(re.search(r"!\[[^\]]*\]\([^)]+\)", content)) or bool(re.search(r"```video\b", content))
    if not has_media:
        warnings.append(
            "No image or video embed (Mayer multimedia principle): add one where it aids understanding"
        )
```

VERIFY with fixtures:
```bash
mkdir -p .scratch/learning-engine/fixtures
cat > .scratch/learning-engine/fixtures/code-bad.md <<'EOF'
---
title: T
description: D
order: 1
duration: 5 minutes
difficulty: beginner
---

# T

```codeexercise
{"id":"x-01-e1","title":"t","instructions":"i","language":"python","starter":"","tests":[{"name":"a","call":"1","expected":1}]}
```
EOF
OPENCODE_FILE_PATH=.scratch/learning-engine/fixtures/code-bad.md python3 .opencode/skills/course-writer/scripts/validate_lesson.py; echo "exit=$?"
# expected: exit=2 with language/tests errors
```

### P5-S4 — Skill tests for the new rules

`CONTEXT:` `.opencode/skills/course-writer/tests/test_validate_lesson.py` (mirror its existing fixture style; it already imports the validator module or runs it via subprocess — follow that pattern exactly)

Add test cases covering: (a) `codeexercise` with `language: "python"` → error; (b) `codeexercise` with `fetch(` in starter → error; (c) `glossary` with 2 terms → error; (d) `resources` with `http://` url → error; (e) a lesson with no media → warning (not error). Keep each fixture minimal (the existing file shows the shortest acceptable lesson).

VERIFY:
```bash
python -m pytest .opencode/skills/course-writer/tests -q
OPENCODE_SKILL_DIR=$(pwd)/.opencode/skills/course-writer python3 .opencode/skills/course-writer/tests/skill_tester.py; echo "exit=$?"
# expected: pytest green; skill_tester exit 0
```

### P5-S5 — Quiz-bank export (single source of truth)

`CONTEXT:` `content/quizzes/aws-aif-c01.json` shape (id, slug, kind, category, title, description, difficulty, topic, certification, durationSeconds, passingScore, mockQuestionCount, domains, allocations, questions[{id, subdomain, type:"mcq", question, options, correct, explanation}]); `scripts/build-question-index.mjs` output.

**Create** `scripts/export-quiz-bank.mjs`:

```js
#!/usr/bin/env node
/**
 * Converts the generated lesson question index into the Quizzes app JSON
 * shape, so lesson fences stay the single source of truth. Writes to
 * `.scratch/question-bank/<course>.json` by default; pass --write to write
 * `content/quizzes/<course>.json` (never overwrite an existing file unless
 * --force is also passed).
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const INDEX_DIR = path.join(ROOT, 'public', 'question-index', 'en')
const OUT_DIR = path.join(ROOT, '.scratch', 'question-bank')
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')

function lessonSubdomains(questions) {
  return [...new Set(questions.map((q) => q.lesson))].sort()
}

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const file of fs.readdirSync(INDEX_DIR).filter((f) => f.endsWith('.json'))) {
  const index = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, file), 'utf8'))
  if (index.count === 0) continue
  const lessons = lessonSubdomains(index.questions)
  const perLesson = Math.floor(100 / lessons.length)
  const domains = [{
    id: '1.0',
    name: index.course,
    color: 'blue',
    subdomains: lessons,
  }]
  const allocations: Record<string, number> = {}
  lessons.forEach((lesson, i) => {
    allocations[lesson] = i === lessons.length - 1 ? 100 - perLesson * (lessons.length - 1) : perLesson
  })
  const payload = {
    id: index.course,
    slug: index.course,
    kind: 'practice',
    category: 'course-practice',
    title: index.course,
    description: `Practice questions extracted from the ${index.course} course lessons.`,
    difficulty: 'intermediate',
    topic: 'Course',
    certification: '',
    durationSeconds: 1800,
    passingScore: 70,
    mockQuestionCount: Math.min(20, index.count),
    domains,
    allocations,
    questions: index.questions.map((q) => ({
      id: q.id,
      subdomain: q.lesson,
      type: 'mcq',
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation ?? '',
    })),
  }
  const target = path.join(OUT_DIR, `${index.course}.json`)
  fs.writeFileSync(target, JSON.stringify(payload, null, 2))
  if (WRITE) {
    const dest = path.join(ROOT, 'content', 'quizzes', `${index.course}.json`)
    if (fs.existsSync(dest) && !FORCE) {
      console.log(`skip (exists): content/quizzes/${index.course}.json`)
    } else {
      fs.writeFileSync(dest, JSON.stringify(payload, null, 2))
      console.log(`wrote: content/quizzes/${index.course}.json`)
    }
  }
}
console.log(`Quiz bank exported to ${path.relative(ROOT, OUT_DIR)}`)
```

Add script: `"export:quizzes": "node scripts/export-quiz-bank.mjs"`.

VERIFY:
```bash
node scripts/build-question-index.mjs && npm run export:quizzes
ls .scratch/question-bank | head -3
node -e "const j=require('./.scratch/question-bank/sql-beginner.json'); console.log(j.kind, j.questions.length, j.questions[0].id)"
```

### P5-S6 — Phase 5 gate

```bash
npm run test && npm run lint && npm run build
python -m pytest .opencode/skills/course-writer/tests -q
```

---

## 5. Phase 6 — Resource fabric, roadmap mastery, rollout, CI

### P6-S1 — `resources` fence (Library cross-linking)

**Create** `components/markdown/ResourcesBlock.tsx`:

```tsx
'use client'

import { BookOpen, ExternalLink, FileText, Github, GraduationCap, Headphones, Newspaper, Video } from 'lucide-react'

interface ResourceItem {
  type: 'video' | 'ebook' | 'course' | 'blog' | 'repository' | 'podcast' | 'article'
  title: string
  url: string
  source?: string
  minutes?: number
}

export interface ResourcesConfig {
  heading?: string
  items: ResourceItem[]
}

const ICONS = {
  video: Video,
  ebook: BookOpen,
  course: GraduationCap,
  blog: FileText,
  repository: Github,
  podcast: Headphones,
  article: Newspaper,
} as const

export default function ResourcesBlock({ data, dict }: { data: ResourcesConfig; dict?: any }) {
  return (
    <div className="my-8 rounded-xl border bg-card p-4 sm:p-6" data-audio-skip>
      <p className="mb-3 text-sm font-semibold">{data.heading || dict?.resources?.title || 'Dig deeper'}</p>
      <ul className="space-y-2">
        {data.items.map((item) => {
          const Icon = ICONS[item.type] ?? FileText
          return (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {item.source && <span className="hidden text-xs text-muted-foreground sm:inline">{item.source}</span>}
                {typeof item.minutes === 'number' && <span className="text-xs text-muted-foreground">{item.minutes} min</span>}
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

Renderer dispatch: import; add `resources: 'resources'` to `langMap`; add the parse branch (same pattern).

VERIFY: `npx tsc --noEmit && npm run build`.

### P6-S2 — Roadmap mastery requirement (soft)

`CONTEXT:` `lib/roadmaps/types.ts`, `lib/roadmaps/get-roadmap-content.ts` (`parseSteps`), `components/roadmaps/RoadmapStepCard.tsx`

1. `types.ts`: add `mastery?: number` to `RoadmapStep` (comment: "recommended practice mastery before the next step, 0-100; advisory only").
2. `get-roadmap-content.ts` in `parseSteps`: add `const masteryMatch = stepContent.match(/- mastery:\s*(\d+)/)` and include `mastery: masteryMatch ? Number(masteryMatch[1]) : undefined` in the pushed step object.
3. `RoadmapStepCard.tsx`: where step metadata chips are rendered, add when `step.mastery` is set:

```tsx
{typeof step.mastery === 'number' && (
  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
    {step.mastery}% mastery recommended
  </span>
)}
```

This is **advisory**: no unlock logic, no blocking. Client-side practice mastery already exists; a later phase may compare it, but not here.

Optional content example (only if the operator asks for content edits): add `- mastery: 70` to steps in `content/roadmaps/*/en.md`. The parser tolerates its absence.

VERIFY: `npx tsc --noEmit && npm run build`; open `/en/roadmaps/intro-to-software-engineering/` → existing steps render unchanged (no mastery lines yet).

### P6-S3 — CI content gate

**Create** `scripts/validate-courses.mjs`:

```js
#!/usr/bin/env node
/** Runs the course-writer validators over every course. Exit 2 fails CI. */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = process.cwd()
const COURSES = path.join(ROOT, 'content', 'courses')
const VALIDATOR = path.join(ROOT, '.opencode', 'skills', 'course-writer', 'scripts', 'validate_course.py')
const VALIDATOR_LESSON = path.join(ROOT, '.opencode', 'skills', 'course-writer', 'scripts', 'validate_lesson.py')
const PY = process.env.PYTHON || 'python3'

let failed = 0
let warned = 0

for (const slug of fs.readdirSync(COURSES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const dir = path.join(COURSES, slug)
  const courseJson = path.join(dir, 'course.json')
  if (!fs.existsSync(courseJson)) continue
  const courseRun = spawnSync(PY, [VALIDATOR], { env: { ...process.env, OPENCODE_FILE_PATH: courseJson }, encoding: 'utf8' })
  if (courseRun.status === 2) {
    failed += 1
    console.error(`[course] ${slug}: FAIL\n${courseRun.stderr}`)
  } else if (courseRun.status === 1) {
    warned += 1
  }
  for (const locale of fs.existsSync(path.join(dir, 'en')) ? fs.readdirSync(path.join(dir, 'en')).filter((f) => f.endsWith('.md')) : []) {
    const lesson = path.join(dir, 'en', locale)
    const run = spawnSync(PY, [VALIDATOR_LESSON], { env: { ...process.env, OPENCODE_FILE_PATH: lesson }, encoding: 'utf8' })
    if (run.status === 2) {
      failed += 1
      console.error(`[lesson] ${slug}/${locale}: FAIL\n${run.stderr}`)
    } else if (run.status === 1) {
      warned += 1
    }
  }
}

console.log(`validate-courses: ${failed} failure(s), ${warned} warning file(s)`)
process.exit(failed > 0 ? 2 : 0)
```

Add script: `"validate:courses": "node scripts/validate-courses.mjs"`.

**Edit** `.github/workflows/nextjs.yml`: after the "Content validators" step, insert:

```yaml
      - name: Course-writer validators
        run: |
          node scripts/build-question-index.mjs
          npm run validate:courses
```

Note: index build must run first because P5-S5's export is not part of CI; only the index is needed by later phases.

VERIFY locally (this may take a while; report failures rather than editing content):
```bash
npm run validate:courses; echo "exit=$?"
# exit 2 = existing content violates a rule; record the list, do not mass-edit content in this step.
```

### P6-S4 — Rollout waves + coverage reports

**Create** `scripts/report-content-coverage.mjs`: for every English lesson, output one row per course with counts of `question`, `codeexercise`, `glossary`, `resources`, `mermaid`, image/video, and lessons missing `skills` frontmatter (parse the YAML block between `---` markers with a simple regex for `skills:`).

Add script: `"report:coverage": "node scripts/report-content-coverage.mjs"`.

Rollout waves (content edits happen **only** when the operator requests each wave):

| Wave | Courses | Required per course |
|---|---|---|
| 1 | `aws-aif-c01`, `aws-clf-c02`, `aws-dea-c01`, `snowpro-core-cof-c03`, `aws-data-lakehouse` | `skills` on every lesson; `glossary` in concept-dense lessons; `resources` block linking Library items |
| 2 | The 7 roadmap courses (`processes-flowchart` … `agentic-ai-development`) | Above + ≥1 `codeexercise` per hands-on lesson (JS-only; Python lessons use a JS-equivalent pseudocode exercise or skip with a note) |
| 3 | All remaining courses | `skills` coverage ≥80%; validator rc ≤ 1; media coverage report reviewed |

Per-wave checklist: `npm run report:coverage` → edit lessons (via the course-writer skill workflow, not freehand) → `OPENCODE_FILE_PATH` validation per lesson → `npm run validate:courses` → `npm run build`.

**Constraint:** Python-heavy courses (`python-beginner`, `python-intermediate`, `python-advanced`, `spark-*`, `sql-*`) must **not** get misleading JS exercises. For those, prefer `fillblank`/`dragdrop`/`matching` until a future Python runner phase.

### P6-S5 — Documentation

Update:
1. `docs/features/MARKDOWN-RENDERER.md` — add `codeexercise`, `glossary`, `resources` to the fence table, with the sandbox security note.
2. `docs/features/PRACTICE-MASTERY.md` — add a "Content requirements" section: stable question ids, `skills` frontmatter, and how review cards are seeded.
3. `docs/features/CONTENT-MANAGEMENT.md` — add the new frontmatter fields and the validator commands (`npm run validate:courses`, `report:coverage`, `report:media`).

VERIFY: final gates
```bash
npm run test && npm run lint && npm run build
python -m pytest .opencode/skills/course-writer/tests -q
npm run validate:courses   # rc 0 expected for a compliant tree
```

---

## 6. Risks & rollback

| Risk | Mitigation |
|---|---|
| `'unsafe-eval'` weakens site CSP | Only the sandbox page carries it; the page is loaded in `<iframe sandbox="allow-scripts">` (opaque origin) and contains no site data. Global policy in `lib/security/csp.mjs` is untouched. `verify-csp` still gates the build. |
| Sandbox iframe keeps a worker alive after unmount | `runner.dispose()` removes listeners; timeout reloads the iframe, which terminates the worker. Component unmount cleanup calls `dispose`. |
| Code exercises on Python courses mislead learners | Rollout rule: JS-only exercises only on JS-capable courses; Python courses use other interaction types. |
| New validator rules break old courses | New rules are schema checks only on fences that already exist; missing media → warning; missing `skills` → warning from Phase 1. CI fails only on exit 2. |
| Question-bank export overwrites curated quizzes | Default writes to `.scratch/`; `--write` refuses to overwrite without `--force`. |
| Focus mode hides content unexpectedly | Purely presentational toggle, fully reversible; original `display` values restored; no storage writes. |
| Roadmap mastery becomes a hard lock by accident | P6-S2 adds display only; no unlock logic anywhere; documented as advisory. |

Rollback: revert the phase's files. Runtime behavior returns to the Phase 0–3 baseline; no storage keys or schemas are modified by Phases 4–6.

## 7. Definition of Done (Phases 4–6)

- [ ] P4-S1 sandbox works in dev and in the built export; no CSP errors; `verify-csp` passes; timeout kills runaway loops.
- [ ] Focus mode, glossary, and resources render and restore correctly; renderer handles invalid JSON with the standard error card.
- [ ] `npm run report:media` and `npm run report:coverage` produce readable reports.
- [ ] Validator v2: new fences validate; old courses still return rc ≤ 1; skill tests green.
- [ ] `.github/workflows/nextjs.yml` runs `validate:courses` and fails on rc 2.
- [ ] Roadmap mastery chips display when present and are advisory only.
- [ ] Docs updated; full gates green; no content edits outside a requested rollout wave.
