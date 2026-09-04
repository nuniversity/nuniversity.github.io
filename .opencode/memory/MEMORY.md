# Project Memory - Nuniversity

## Core Principle

**Deterministic Agentic Harness**: Build the most deterministic harness possible by creating deterministic AI agentic development pipelines based on deterministic skills, hooks, plugins, and tools. Let the uncertainty and decision-making stay with the LLM models — they call or loop into engineering using deterministic solutions.

The harness is the foundation of reliability. The LLM models are the agents of flexibility.

### Design Principles (All Mandatory)

1. **TDD**: Red-Green-Refactor cycle. Tests written before implementation. 90% coverage minimum.
2. **DDD**: Bounded contexts (each skill). Ubiquitous language (lesson, course, quiz). Aggregates (Course→lessons, Game→questions).
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
- **11 games** (7 categories: coding, logic, math, physics, puzzles, quiz, vocabulary)
- **10 tools** (decision matrices, timers, habit trackers, prompt builders)
- **3 languages** (English, Portuguese, Spanish)
- 3 language dictionaries (en.json, es.json, pt.json)

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
├── games/          # 7 game category directories
├── library/        # en/pt content
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
│   ├── validate-game-json/
│   ├── validate-course-json/
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
│   ├── pytest/
│   └── vitest/
├── plugins/
│   └── nuniversity-plugin/   # EMPTY - needs TypeScript implementation
├── memory/MEMORY.md
└── package.json
```

## Hooks (5 total)
- `validate-frontmatter`: Validates Markdown frontmatter for lesson files (blocking)
- `validate-game-json`: Validates quiz and vocabulary JSON files (blocking)
- `validate-course-json`: Validates course.json metadata files (blocking)
- `check-i18n-parity`: Checks dictionary key parity (non-blocking warning)
- `guard-env-read`: Blocks reads of .env files (blocking)

**Note**: 0/5 hooks have tests (gap to fill)

## Skills (9 implemented)
- `skill-builder`: Meta-skill for creating new skills (95% complete, 4 scripts, 36 tests)
- `course-writer`: Generates lesson files (prompt-only, no scripts)
- `game-builder`: Generates quiz/vocabulary JSON (prompt-only, no scripts)
- `i18n-translator`: Handles localization (prompt-only, no scripts)
- `platform-engineer`: Guides TypeScript/Next.js development (prompt-only)
- `mermaid-js`: Creates Mermaid.js diagrams (1 script, no tests)
- `tailwind-css`: Tailwind CSS utilities (1 script, no tests)
- `pytest`: Python test runner (2 scripts, 1 test, registered in opencode.json)
- `vitest`: JS/TS test runner (2 scripts, 1 test, registered in opencode.json)

## Test Coverage
- skill-builder: 36 tests (comprehensive)
- pytest: 13 tests
- vitest: 1 test
- Hooks: 0 tests (gap)
- mermaid-js: 0 tests (gap)
- tailwind-css: 0 tests (gap)

## Notes for Agents
- Always reference this file before making content changes
- Run frontmatter validation after editing any .md file in content/
- Verify game JSON schema after modifying game definitions
- Never expose .env contents in tool outputs
- Maintain consistent frontmatter fields: title, description, order, duration, difficulty
- Use skill-builder when creating new skills
- All scripts must have tests (TDD requirement)
- Exit codes: 0=pass, 1=warn, 2=block
