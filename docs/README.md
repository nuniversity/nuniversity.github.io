# Nuniversity Documentation

> Full documentation is available in [**INDEX.md**](./INDEX.md) — the master navigation hub.

---

## Documentation Structure

```text
docs/
├── INDEX.md                     ← start here
├── architecture/
│   ├── ARCHITECTURE.md          # current system design, data flow, key decisions
│   └── COMPONENTS.md            # curated component reference
├── features/
│   ├── CONTENT-MANAGEMENT.md    # courses, tools, library, games, activities
│   ├── INTERNATIONALIZATION.md  # locale routing, dictionaries, SEO
│   ├── ROADMAPS.md              # learning paths, progress tracking
│   ├── GAMES.md                 # game schemas and quality
│   ├── MARKDOWN-RENDERER.md     # enhanced Markdown features
│   ├── PRACTICE-MASTERY.md      # FSRS, mastery, practice engine
│   └── LANGUAGE-COURSES.md      # language-course app
├── operations/
│   ├── DEPLOYMENT.md            # GitHub Pages today; Cloudflare Pages in M2
│   ├── TESTING.md               # Vitest, Playwright, pytest harness
│   ├── CONTRIBUTING.md          # PR process, code style, commits
│   └── GATE-WAIVERS.md          # active content-gate waiver manifest (CI-enforced)
├── ai/
│   ├── AGENTS.md                # agent system + mandatory design principles
│   └── OPENCODE-HARNESS.md      # deterministic agentic harness
├── milestone-m2/                # current milestone: architecture, decisions, plan, runbook
├── assessment/
│   └── 2026-10-28-courses-learning-engine/   # active learning-engine plan (phases 4–6 pending)
├── archive/                     # HISTORICAL — superseded audits and plans (do not follow)
├── stem-curriculum/             # STEM roadmap
├── stem-courses/                # STEM course design documents (planned courses)
├── aws-courses/                 # AWS/Databricks course + quiz designs
├── getting-started/
│   └── GETTING-STARTED.md       # local setup and troubleshooting
└── _private/                    # gitignored: open security findings and probes
```

> **Note:** `docs/_private/` is excluded from git by the repository's `_*/` ignore rule. It holds
> security registers with open findings and must stay private until those items are fixed.

---

© 2026 Nuniversity. All Rights Reserved.
