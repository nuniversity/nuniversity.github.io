# Project Memory - Nuniversity

## Core Principle

**Deterministic Agentic Harness**: Build the most deterministic harness possible by creating deterministic AI agentic development pipelines based on deterministic skills, hooks, plugins, and tools. Let the uncertainty and decision-making stay with the LLM models — they call or loop into engineering using deterministic solutions.

The harness is the foundation of reliability. The LLM models are the agents of flexibility.

### Design Principles (All Mandatory)

1. **TDD**: Red-Green-Refactor cycle. Tests written before implementation. 90% coverage minimum.
2. **DDD**: Bounded contexts (each skill). Ubiquitous language (lesson, course, quiz). Aggregates (Course→lessons, Game→gameplay, Quiz→questions in the Quizzes app).
3. **Clean Architecture**: Dependencies point inward. Entities→Business Rules→Adapters→Frameworks.
4. **SOLID**: SRP (one thing per script), OCP (extend, don't modify), LSP (hooks interchangeable), ISP (focused triggers), DIP (exit code abstraction).
5. **Clean Code**: Descriptive names, small functions, docstrings, errors to stderr, no dead code.
6. **Spec-Driven Design**: Specs are source of truth. Spec→Schema→Tests→Implementation.

### Development Tool Stack

| Language | Linter | Formatter | Tester | Security |
|----------|--------|-----------|--------|----------|
| Python | `ruff` | `ruff format` | `pytest` | `bandit` |
| JS/TS | `eslint` | `prettier` | `vitest` | — |
| Bash | `shellcheck` | `shfmt` | — | — |
| All | `pre-commit` (git hooks) | | | |

Config: `pyproject.toml` (ruff, pytest, bandit), `.pre-commit-config.yaml`

## Project Status
- **38 courses** across programming, AI/ML, data engineering, architecture
- **7 games** (6 categories: coding, conversation, logic, math, physics, puzzles)
- **1 quiz** (content/quizzes/snowpro-core-cof-c03.json) — Quizzes app at /[lang]/quizzes/ (hub, detail, redirect stubs from /games/quiz/*)
- **10 tools** (decision matrices, timers, habit trackers, prompt builders)
- **3 languages** (English, Portuguese, Spanish)
- 3 language dictionaries (en.json, es.json, pt.json)
- **Phase 4 (Quizzes app)**: complete 2026-10-22
- **Phase 5 (Languages app)**: complete 2026-10-23 — 5 vocabulary activities moved to content/languages/vocabulary/, hub/pair/player routes at /[lang]/languages/, languages.* i18n, v1:lang-* storage, validate-languages hook, noindex stubs at /games/vocabulary/*
- **Phase 6 (Learning experience)**: complete 2026-10-24 — progress + gamification stores (v1:profile XP/badges/streaks, recordAndEmit bus), lesson outline/progress/feedback/score summary + resume surfaces, ⌘K search (prebuild JSON index 515/596/563 + matcher + lazy palette), rehype-sanitize N6 chain + mermaid strict (F-090/F-091, SEC-01/02 closed), ProfileChip/AwardToaster, /[lang]/quizzes/certificates/; vitest 1209/116, pytest 566 @81.04%, verify_out +~25 probes (51-probe leak audit), ci_sim 16/16, build 1624 pages

## Current Sprint Focus
- Python-based deterministic agentic harness
- Skill-builder meta-skill for creating new skills (95% complete)
- Content validation via hooks
- Quick wins: pyproject.toml, pre-commit, register skills, cleanup

## Architecture Decisions
- Next.js App Router with `[lang]` dynamic routing
- MDX/MD content in `/content/` directory structure
- JSON-based game definitions with category folders
- Tool definitions as standalone JSON files
- Python-based hooks with deterministic exit codes (0=pass, 1=warn, 2=blocking)
- Each hook/skill has its own folder with scripts/, examples/, assets/, references/

## Directory Structure
```
content/
├── courses/        # 38 course directories
├── games/          # 6 game category directories (7 games)
├── languages/      # Languages app vocabulary JSON (5 activities)
├── library/        # en/pt content
├── quizzes/        # Quizzes app JSON (moved from games/quiz)
├── roadmaps/       # Learning paths
└── tools/          # 10 interactive tools
dictionaries/       # Language translation files
```

## OpenCode Harness Structure
```
.opencode/
├── hooks/
│   ├── validate-frontmatter/
│   │   ├── scripts/validate_frontmatter.py
│   │   ├── examples/
│   │   ├── assets/hook.json
│   │   └── references/schema.json
│   ├── validate-game-json/     # no longer covers vocabulary
│   ├── validate-languages/     # language activities (blocking)
│   ├── validate-quiz-json/
│   ├── validate-course-json/
│   ├── validate-library/
│   ├── validate-roadmap/
│   ├── validate-tools/
│   ├── check-i18n-parity/
│   └── guard-env-read/
├── skills/
│   ├── skill-builder/        # Meta-skill (95% complete, 36 tests)
│   ├── course-writer/
│   ├── game-builder/
│   ├── i18n-translator/
│   ├── platform-engineer/
│   ├── mermaid-js/
│   ├── tailwind-css/
│   ├── cicd-pipeline/
│   ├── pytest/
│   └── vitest/
├── plugins/
│   └── nuniversity-plugin/   # EMPTY - needs TypeScript implementation
├── memory/MEMORY.md
└── package.json
```

## Hooks (10 total)
- `validate-frontmatter`: Validates Markdown frontmatter for lesson files (blocking)
- `validate-game-json`: Validates game JSON (coding, conversation, logic, math, physics, puzzles)
- `validate-languages`: Validates language activity JSON under content/languages/ (blocking)
- `validate-quiz-json`: Validates content/quizzes/*.json (blocking)
- `validate-course-json`: Validates course.json metadata files (blocking)
- `validate-library`: Validates library resource Markdown frontmatter (blocking)
- `validate-roadmap`: Validates roadmap Markdown files (blocking)
- `validate-tools`: Validates tool Markdown frontmatter (blocking)
- `check-i18n-parity`: Checks dictionary key parity (non-blocking warning)
- `guard-env-read`: Blocks reads of .env files (blocking)

**Note**: 2/10 hooks have dedicated pytest suites (validate-quiz-json, validate-languages; gap to fill)

## Skills (10 implemented)
- `skill-builder`: Meta-skill for creating new skills (95% complete, 4 scripts, 36 tests)
- `course-writer`: Generates lesson files (prompt-only, no scripts)
- `game-builder`: Generates language activity (vocabulary) JSON for content/languages/ (quiz generation moved to the Quizzes app)
- `i18n-translator`: Handles localization (prompt-only, no scripts)
- `platform-engineer`: Guides TypeScript/Next.js development (prompt-only)
- `mermaid-js`: Creates Mermaid.js diagrams (1 script, no tests)
- `tailwind-css`: Tailwind CSS utilities (1 script, no tests)
- `cicd-pipeline`: Simulates the CI/CD pipeline locally (scripts + tests)
- `pytest`: Python test runner (2 scripts, 1 test, registered in opencode.json)
- `vitest`: JS/TS test runner (2 scripts, 1 test, registered in opencode.json)

## Test Coverage
- skill-builder: 36 tests (comprehensive)
- pytest: 13 tests
- vitest: 1 test
- Hooks: 2 suites (validate-quiz-json 9 tests, validate-languages 35 tests) + validate-coverage suite
- mermaid-js: 0 tests (gap)
- tailwind-css: 0 tests (gap)

## Notes for Agents
- Always reference this file before making content changes
- Run frontmatter validation after editing any .md file in content/
- Verify game JSON schema after modifying game definitions; language activities use .opencode/hooks/validate-languages/
- Never expose .env contents in tool outputs
- Maintain consistent frontmatter fields: title, description, order, duration, difficulty
- Use skill-builder when creating new skills
- All scripts must have tests (TDD requirement)
- Exit codes: 0=pass, 1=warn, 2=block
