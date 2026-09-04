# NUniversity AI Agent System

## Core Principle

**Deterministic Agentic Harness**: Build the most deterministic harness possible by creating deterministic AI agentic development pipelines based on deterministic skills, hooks, plugins, and tools. Let the uncertainty and decision-making stay with the LLM models — they call or loop into engineering using deterministic solutions.

### Design Principles (All Mandatory)

| # | Principle | Rule | Full Reference |
|---|-----------|------|----------------|
| 1 | **Test-Driven Development (TDD)** | Every script, hook, tool, and skill is built using Red-Green-Refactor. 90% coverage minimum. Tests are written before implementation. | `OPENCODE-HARNESS.md` §1.1 |
| 2 | **Domain-Driven Design (DDD)** | Model the harness around NUniversity's domain. Each skill is a bounded context. Ubiquitous language in code, tests, docs. | `OPENCODE-HARNESS.md` §1.2 |
| 3 | **Clean Architecture** | Dependencies point inward. Entities → Business Rules → Adapters → Frameworks. No inner layer imports from outer layers. | `OPENCODE-HARNESS.md` §1.3 |
| 4 | **SOLID Principles** | SRP (one thing per script), OCP (extend, don't modify), LSP (hooks are interchangeable), ISP (focused skill triggers), DIP (depend on exit codes, not implementations). | `OPENCODE-HARNESS.md` §1.4 |
| 5 | **Clean Code** | Descriptive naming, small functions (20 lines max), docstrings on public functions, errors to stderr, no dead code. | `OPENCODE-HARNESS.md` §1.5 |
| 6 | **Spec-Driven Design (SDD)** | Specifications are the source of truth. Spec → Schema → Tests → Implementation. Every code line traces to a spec requirement. | `OPENCODE-HARNESS.md` §1.6 |

### Development Tool Stack

All deterministic components use a standardized tool chain:
- **Python**: `uv` (packages), `ruff` (lint+format), `pytest` (tests), `bandit` (security)
- **JavaScript/TypeScript**: `fnm` (Node.js), `eslint` (lint), `vitest` (tests), `playwright` (E2E)
- **Bash**: `shellcheck` (lint), `shfmt` (format)
- **All**: `pre-commit` (git hooks), enforced via CI/CD

## Overview

NUniversity uses specialized AI agents to generate publication-ready course content and interactive quiz data. Each agent is defined by a prompt template and produces validated Markdown or JSON output.

### Available Skills

| Skill | Purpose | Triggers |
|-------|---------|----------|
| `skill-builder` | Meta-skill for creating new skills | `.opencode/skills/**` |
| `course-writer` | Generates lesson files | `content/courses/**` |
| `game-builder` | Generates game JSON files | `content/games/**` |
| `i18n-translator` | Handles localization | `dictionaries/**` |
| `platform-engineer` | TypeScript/Next.js guidance | `lib/**`, `src/**` |
| `mermaid-js` | Creates and validates diagrams | `**/*.md`, `docs/**` |
| `tailwind-css` | CSS utility class management | `**/*.tsx`, `src/**` |

```mermaid
flowchart TB
    Author[Content Author]
    CW[Course Writer Agent]
    GB[Game Builder Agent]

    Author -->|calls with template| CW
    Author -->|calls with template| GB

    CW -->|Markdown + YAML| MD[Lesson Files]
    GB -->|JSON| JSON[Game Data Files]

    MD --> Validate[npm run dev]
    JSON --> Validate

    Validate --> Visual[Visual Check]
    Visual --> Commit[Git Commit]
    Commit --> Deploy[GitHub Actions Deploy]
    Deploy --> Site[nuniversity.github.io]

    style CW fill:#4a90d9,color:#fff
    style GB fill:#7b68ee,color:#fff
    style Deploy fill:#2ecc71,color:#fff
```

---

## Course Writer Agent

**Location:** `agents/COURSE-WRITER-AGENT-PROMPT.md`

Produces publication-ready Markdown lesson files with structured YAML frontmatter and enhanced Markdown formatting.

### Output Format

```mermaid
flowchart TD
    subgraph "Lesson File Structure"
        YAML["YAML Frontmatter\n---\ntitle:\ndescription:\norder:\ndifficulty:\nduration:\n---"]
        Title["# Lesson Title"]
        Intro["Introductory paragraph"]
        Body["Lesson body\n- Theory sections\n- Code examples\n- Diagrams\n- Tables"]
        Practice["Practice Questions\n5-10 questions"]
        Takeaways["Key Takeaways"]
    end

    YAML --> Title --> Intro --> Body --> Practice --> Takeaways

    subgraph "Enhanced Markdown Features"
        Alert["Alert Boxes\nNOTE, WARNING, DANGER\nSUCCESS, TIP, IMPORTANT"]
        Code["Code Blocks\nwith language IDs"]
        Diagrams["ASCII / Mermaid Diagrams"]
        Tables["Data Tables"]
        Bold["Bolded Key Terms"]
    end

    Body -.-> Alert
    Body -.-> Code
    Body -.-> Diagrams
    Body -.-> Tables
    Body -.-> Bold

    style YAML fill:#f9e79f,color:#000
    style Alert fill:#d5f5e3,color:#000
    style Code fill:#d6eaf8,color:#000
```

### Quality Checklist

| Check | Description |
|-------|-------------|
| Frontmatter validation | All required fields present and valid |
| H1 matching | Title in frontmatter matches H1 heading |
| Exam objective mapping | Lesson maps to certification exam objectives |
| Key terms bolded | Domain-specific terms are **bolded** on first use |
| Architecture diagrams | Complex concepts include visual diagrams |
| Warning boxes | Potential pitfalls marked with `[!WARNING]` or `[!CAUTION]` |
| Practice questions | 5-10 questions per lesson |
| Key takeaways | Summary section at end |

### Templates

| Template | Purpose |
|----------|---------|
| Single lesson | Generate one lesson file |
| New course | Create `course.json` manifest + initial lessons |
| Full domain | Generate all lessons for a certification domain |
| Translate lesson | Translate existing lesson to another language |

### Recommended LLM Configuration

- **Temperature:** 0.3 -- 0.5 (balanced creativity and accuracy)
- **Max tokens:** 4000 -- 8000 per lesson

---

## Game Builder Agent

**Location:** `agents/GAME-BUILDER-AGENT-PROMPT.md`

Produces publication-ready JSON game files for quizzes and vocabulary exercises.

### Output Format

```mermaid
flowchart TD
    subgraph "Quiz JSON Structure"
        Meta["Metadata\ncourseId, domainId\ntype, difficulty"]
        Questions["Questions Array\n- id (sequential)\n- scenario question\n- 4 options\n- correctIndex\n- explanation\n- examObjective"]
    end

    Meta --> Questions

    subgraph "Vocabulary JSON Structure"
        VMeta["Metadata\ntype: vocabulary\ndomain, language"]
        Pairs["Word Pairs Array\n- id (sequential)\n- term / definition\n- category\n- difficulty\n- context sentence"]
    end

    VMeta --> Pairs

    subgraph "Question Types"
        Scenario["Scenario-Based\nReal-world context"]
        Conceptual["Conceptual\nTheory-based"]
        Applied["Applied\nHands-on scenarios"]
    end

    Questions -.-> Scenario
    Questions -.-> Conceptual
    Questions -.-> Applied

    style Meta fill:#e8daef,color:#000
    style VMeta fill:#d5f5e3,color:#000
    style Questions fill:#d6eaf8,color:#000
```

### Quality Checklist

| Check | Description |
|-------|-------------|
| Valid JSON | Passes `JSON.parse()` without errors |
| Sequential IDs | `id` fields are sequential starting from 0 |
| No duplicates | No duplicate questions or word pairs |
| Minimum counts | 40 questions for certification quizzes, 50 word pairs for vocabulary |
| 4-option format | Each question has exactly 4 options |
| Detailed explanations | Every question includes an explanation field |
| Domain coverage | Questions distributed across sub-topics |
| Difficulty distribution | Mix of easy, medium, hard questions |

### Templates

| Template | Purpose |
|----------|---------|
| Certification quiz | Full-length practice exam (40+ questions) |
| Domain drill | Focused quiz on a single domain |
| General knowledge | Broad topic coverage |
| Technical skills | Hands-on skill assessment |
| Vocabulary game | Term-definition matching (50+ pairs) |
| Expand existing quiz | Add questions to an existing quiz file |

### Recommended LLM Configuration

- **Temperature:** 0.2 -- 0.4 (more deterministic for accuracy)
- **Max tokens:** 8000 -- 16000 (larger JSON payloads)

---

## Agent Integration Workflow

```mermaid
sequenceDiagram
    participant Author as Content Author
    participant Agent as AI Agent (LLM)
    participant FS as File System
    participant Dev as Dev Server
    participant Git as Git / GitHub
    participant CI as GitHub Actions
    participant Site as Production Site

    Author->>Agent: Call with template + context
    Agent->>Agent: Generate content (Markdown or JSON)
    Agent->>FS: Write output file
    Agent->>Author: Return generated file path

    Author->>Dev: npm run dev
    Dev->>Dev: Build & preview

    Author->>Dev: Visual inspection
    Note over Author,Dev: Check formatting,<br/>links, rendering

    Author->>Git: git add + commit
    Git->>Git: Push to repository

    Git->>CI: Trigger deployment
    CI->>CI: Build site
    CI->>Site: Deploy to GitHub Pages

    Note over Site: Content live at<br/>nuniversity.github.io
```

---

## Quality Assurance Pipeline (TDD-Enforced)

```mermaid
flowchart TD
    Start[Generated Content / Code]

    Start --> TDD{Tests written<br/>first?}
    TDD -->|No| Reject[Reject: TDD required]
    TDD -->|Yes| PreCommit[Pre-commit hooks]

    PreCommit --> Lint{Linting passes?}

    Lint -->|Python| Ruff[ruff check + format]
    Lint -->|JS/TS| ESLint[eslint]
    Lint -->|Bash| ShellCheck[shellcheck + shfmt]

    Ruff --> RuffPass{ruff passes?}
    ESLint --> ESLintPass{eslint passes?}
    ShellCheck --> SCPass{shellcheck passes?}

    RuffPass -->|No| FixLint[Fix lint errors]
    ESLintPass -->|No| FixLint
    SCPass -->|No| FixLint
    FixLint --> Start

    RuffPass -->|Yes| Security[bandit security scan]
    ESLintPass -->|Yes| Security
    SCPass -->|Yes| Security

    Security --> SecPass{bandit passes?}
    SecPass -->|No| FixSec[Fix security issues]
    FixSec --> Start

    SecPass -->|Yes| Tests[Run tests]

    Tests -->|Python| Pytest[pytest]
    Tests -->|JS/TS| Vitest[vitest]

    Pytest --> PyPass{pytest passes?}
    Vitest --> VPass{vitest passes?}

    PyPass -->|No| FixTest[Fix test failures]
    VPass -->|No| FixTest
    FixTest --> Start

    PyPass -->|Yes| Content[Content Review]
    VPass -->|Yes| Content

    Content --> ExamObj{Exam objectives<br/>mapped?}
    ExamObj -->|No| Fix[Add mappings]
    ExamObj -->|Yes| KeyTerms{Key terms<br/>bolded?}

    Fix --> KeyTerms
    KeyTerms -->|No| Fix2[Bold key terms]
    KeyTerms -->|Yes| Diagrams{Diagrams<br/>present?}

    Fix2 --> Diagrams
    Diagrams -->|No| Fix3[Add diagrams]
    Diagrams -->|Yes| Practice{Practice questions<br/>5-10?}

    Fix3 --> Practice
    Practice -->|No| Fix4[Add questions]
    Practice -->|Yes| Pass[Content Approved]

    Fix4 --> Pass

    Pass --> Dev[npm run dev<br/>visual check]
    Dev --> Deploy[Commit & Deploy]

    style Reject fill:#e74c3c,color:#fff
    style TDD fill:#e74c3c,color:#fff
    style Pass fill:#2ecc71,color:#fff
    style Deploy fill:#27ae60,color:#fff
```

---

## LLM Configuration Guide

| Parameter | Course Writer Agent | Game Builder Agent | Notes |
|-----------|-------------------|-------------------|-------|
| **Temperature** | 0.3 -- 0.5 | 0.2 -- 0.4 | Lower = more deterministic |
| **Max tokens** | 4000 -- 8000 | 8000 -- 16000 | JSON payloads need more room |
| **Top-p** | 0.9 | 0.9 | Standard for both |
| **Frequency penalty** | 0.0 | 0.0 | Avoid repetitive content |
| **Presence penalty** | 0.0 | 0.0 | Allow technical repetition |

**General Guidelines:**
- Use lower temperature for quiz/exam content where accuracy is critical
- Use higher temperature for lesson prose and explanations
- Increase max tokens for full-domain or full-course generation
- Test with a small sample before batch generation

---

## OpenCode Integration

NUniversity uses OpenCode for automated deterministic workflows.

### Current State

```
.opencode/
├── hooks/          # 5 Python-based validation hooks
├── skills/         # 9 skills (skill-builder, course-writer, game-builder, etc.)
├── plugins/        # nuniversity-plugin
├── memory/         # MEMORY.md with project state
└── package.json    # @opencode-ai/plugin dependency
```

### Dev Tool Stack

All code uses a standardized tool chain enforced via pre-commit hooks and CI:

| Language | Linter | Formatter | Tester | Security |
|----------|--------|-----------|--------|----------|
| Python | `ruff` | `ruff format` | `pytest` | `bandit` |
| JS/TS | `eslint` | `prettier` | `vitest` | — |
| Bash | `shellcheck` | `shfmt` | — | — |

### Integration Flow

```mermaid
flowchart LR
    Trigger[OpenCode Skill Trigger] --> Agent[Agent Prompt Loaded]
    Agent --> Context[Memory + File Context]
    Context --> Generate[Content Generated]
    Generate --> TDD[TDD: Tests Written First]
    TDD --> Hook[Pre-commit Hooks validate]
    Hook --> Lint[ruff + eslint + shellcheck]
    Lint --> Security[bandit security scan]
    Security --> Test[pytest + vitest]
    Test --> Commit[Auto-commit if valid]
    Hook --> Reject[Reject if invalid]

    style Trigger fill:#9b59b6,color:#fff
    style TDD fill:#e74c3c,color:#fff
    style Hook fill:#e67e22,color:#fff
    style Security fill:#f39c12,color:#fff
```

**Current capabilities:**
- Skills in `.opencode/skills/` that trigger agents via context matching
- Pre-commit hooks in `.opencode/hooks/` for automated validation
- Shared memory in `.opencode/memory/` for cross-agent context
- TDD enforcement: all scripts must have tests written first
- Quality gates: ruff, eslint, shellcheck, bandit, pytest, vitest

---

## Agent Prompt Reference

### Using the Prompts

Each agent prompt is a self-contained instruction file. To use:

1. **Read the prompt file** for context and instructions
2. **Provide the template** (which template to use)
3. **Supply context** (course name, domain, topic, existing content references)
4. **Run in your LLM** (ChatGPT, Claude, or via OpenCode)

### Prompt Locations

| Agent | File |
|-------|------|
| Course Writer | `agents/COURSE-WRITER-AGENT-PROMPT.md` |
| Game Builder | `agents/GAME-BUILDER-AGENT-PROMPT.md` |

### Example Usage

**Course Writer -- Single Lesson:**
```
Use the Course Writer Agent prompt.
Template: Single lesson
Context: Course "AZ-900 Azure Fundamentals", Domain "Cloud Concepts",
Topic "What is Cloud Computing", Difficulty: Beginner
```

**Game Builder -- Certification Quiz:**
```
Use the Game Builder Agent prompt.
Template: Certification quiz
Context: Course "AZ-900 Azure Fundamentals", Domain "Cloud Concepts",
40 questions, difficulty distribution: 30% easy, 50% medium, 20% hard
```
