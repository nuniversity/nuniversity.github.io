# NUniversity AI Agent System

## Overview

NUniversity uses specialized AI agents to generate publication-ready course content and interactive quiz data. Each agent is defined by a prompt template and produces validated Markdown or JSON output.

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

## Quality Assurance Pipeline

```mermaid
flowchart TD
    Start[Generated Content]

    Start --> Format{Format Valid?}

    Format -->|Markdown| YAML{Frontmatter<br/>valid?}
    Format -->|JSON| JSON{JSON.parse<br/>passes?}
    Format -->|No| Reject[Reject & Regenerate]

    YAML -->|No| Reject
    YAML -->|Yes| H1{H1 matches<br/>title?}
    JSON -->|No| Reject
    JSON -->|Yes| IDs{Sequential IDs,<br/>no duplicates?}

    H1 -->|No| Reject
    H1 -->|Yes| MinCount{Minimum question<br/>count met?}

    IDs -->|No| Reject
    IDs -->|Yes| MinCount

    MinCount -->|No| Reject
    MinCount -->|Yes| Content[Content Review]

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

## Future: OpenCode Integration

NUniversity will integrate these agents into OpenCode for automated workflows.

### Current State

```
.opencode/
  hooks/       # (empty - future: pre-commit validation hooks)
  skills/      # (empty - future: agent trigger skills)
  memory/      # (empty - future: shared context across agents)
```

- `@opencode-ai/plugin` is installed
- Agent prompts are stored in `agents/` directory

### Planned Integration

```mermaid
flowchart LR
    Trigger[OpenCode Skill Trigger] --> Agent[Agent Prompt Loaded]
    Agent --> Context[Memory + File Context]
    Context --> Generate[Content Generated]
    Generate --> Hook[Pre-commit Hook<br/>validates output]
    Hook --> Commit[Auto-commit if valid]
    Hook --> Reject[Reject if invalid]

    style Trigger fill:#9b59b6,color:#fff
    style Hook fill:#e67e22,color:#fff
```

**Future capabilities:**
- Skills in `.opencode/skills/` that trigger agents via `/skill` commands
- Pre-commit hooks in `.opencode/hooks/` for automated validation
- Shared memory in `.opencode/memory/` for cross-agent context (course structure, terminology glossary)
- Agent-to-agent pipelines: Course Writer generates lesson, Game Builder auto-generates quiz from lesson content

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
