# CI/CD Pipeline Stages Reference

Mirrors `.github/workflows/nextjs.yml` — the Deploy Next.js site to Pages workflow.

## Stage 1: Install dependencies

**Command:** `npm ci`

Installs dependencies from `package-lock.json`. Equivalent to `npm install` but faster and deterministic.

**Requires:** `package.json`, `package-lock.json`

---

## Stage 2: Run tests

**Command:** `npx vitest run`

Runs all Vitest test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, etc.).

**Requires:** `package.json`, `vitest.config.ts`

---

## Stage 3: Build with Next.js

**Command:** `npx next build`

Runs the full Next.js production build including TypeScript compilation, page generation, and static export to `./out`.

**Requires:** `package.json`, `next.config.js`

**Note:** This stage takes 2-5 minutes due to 42 courses × 906 lessons.

---

## Stage 4: Deploy (not simulated)

The deploy step uploads `./out` to GitHub Pages. This is not simulated locally — it only runs on GitHub Actions.

---

## Pipeline Config

**File:** `.github/workflows/nextjs.yml`

- Triggers on push to `main` branch
- Uses Node.js 20
- Caches `.next/cache`
- Concurrency group: `pages` (no cancel in-progress)
