---
name: cicd-pipeline
description: "Simulates the CI/CD pipeline locally — runs install, tests, and build before you commit"
triggers:
  - "**/*.{ts,tsx,js}"
  - "**/package.json"
  - "**/package-lock.json"
version: "1.0.0"
metadata:
  category: "devops"
  audience: "developers"
  difficulty: "beginner"
---

# CI/CD Pipeline Simulator Skill

## Activation Context

Activate when the user wants to run a local CI/CD simulation, check if their changes will pass CI, or run the full install/test/build pipeline. This skill mirrors `.github/workflows/nextjs.yml`.

---

## Instructions

### Step 1: Run the Full Pipeline

Run the pipeline orchestrator script to execute all detected stages:

```bash
python .opencode/skills/cicd-pipeline/scripts/run_pipeline.py
```

The script auto-detects the project type and runs all relevant stages.

### Step 2: Run Specific Stages

To run only certain stages:

```bash
python .opencode/skills/cicd-pipeline/scripts/run_pipeline.py --stage=tests,build
```

Available stages: `install`, `tests`, `build`

### Step 3: Dry Run

To preview what would run without executing:

```bash
python .opencode/skills/cicd-pipeline/scripts/run_pipeline.py --dry-run
```

### Step 4: Verbose Output

For detailed output including stderr from each stage:

```bash
python .opencode/skills/cicd-pipeline/scripts/run_pipeline.py --verbose
```

### Step 5: Interpret Results

- **PASS** — Stage completed successfully
- **FAIL** — Stage failed (blocking — fix before committing)

### Step 6: Fix Failures

When a stage fails:
1. Read the error output for file:line references
2. Fix the issues in the reported files
3. Re-run the pipeline to verify

---

## Pipeline Stages (mirrors .github/workflows/nextjs.yml)

| # | Stage | Tool | Command |
|---|-------|------|---------|
| 1 | Install | npm | `npm ci` |
| 2 | Tests | Vitest | `npx vitest run` |
| 3 | Build | Next.js | `npx next build` |

---

## Output Format

```
╔══════════════════════════════════════════════╗
║          CI/CD Pipeline Simulator            ║
╚══════════════════════════════════════════════╝

[1/3] Install dependencies (npm ci)........ ✅ PASS (12.3s)
[2/3] Run tests (npx vitest run)........... ✅ PASS (3.2s)
[3/3] Build with Next.js (npx next build).. ✅ PASS (45.2s)

══════════════════════════════════════════════
  Result: 3 PASSED, 0 FAILED
  Total time: 60.7s
══════════════════════════════════════════════
```

---

## Quality Rules

- All stages must PASS for the pipeline to succeed
- A single FAIL means the pipeline fails (exit code 2)
- The build stage ignores TypeScript errors when `ignoreBuildErrors: true` is set in `next.config.js`

---

## Exit Codes

- `0` — All stages passed
- `1` — Warnings (not used in this pipeline)
- `2` — One or more stages failed

---

## Reference

See `references/pipeline-stages.md` for detailed documentation of each stage.
