# Software Engineering Mega Course - Remaining Courses Documentation

## Overview

This document describes the remaining 7 courses (4-10) of the **Introduction to Software Engineering** roadmap. These courses are ready to be created following the established pattern from Courses 1-3.

---

## Course Creation Pattern

### Directory Structure
```
content/courses/{course-slug}/
├── course.json                    # Multilingual metadata
├── en/
│   ├── 01-lesson-slug.md         # English lessons
│   ├── 02-lesson-slug.md
│   └── ...
└── pt/
    ├── 01-lesson-slug.md         # Portuguese lessons
    ├── 02-lesson-slug.md
    └── ...
```

### course.json Template
```json
{
  "area": "Software Engineering",
  "author": "NUniversity",
  "difficulty": "intermediate|advanced",
  "duration": "X hours",
  "icon": "code",
  "en": {
    "title": "Course Title",
    "description": "Course description in English",
    "difficulty": "Intermediate|Advanced",
    "duration": "X Hours"
  },
  "pt": {
    "title": "Título do Curso",
    "description": "Descrição do curso em português",
    "difficulty": "Intermediário|Avançado",
    "duration": "X Horas"
  },
  "es": {
    "title": "Título del Curso",
    "description": "Descripción del curso en español",
    "difficulty": "Intermedio|Avanzado",
    "duration": "X Horas"
  }
}
```

### Lesson File Template
```markdown
---
title: "Lesson Title"
description: "Brief lesson description"
order: 1
duration: "45 minutes"
difficulty: "beginner|intermediate|advanced"
---

## Main Topic

Content here...

### Subtopic

More content...

```python
# Code example (for courses 3+)
code here
```

> [!NOTE]
> Important note

> [!TIP]
> Helpful tip

> [!WARNING]
> Warning about common mistakes

> [!SUCCESS]
> Best practice or success tip

## Practice Questions

1. Question 1
2. Question 2
3. Question 3
```

### Mermaid Diagram Requirements
- Use `flowchart TD` or `flowchart LR` for process/algorithm flow
- Use `classDiagram` for OOP concepts, architecture
- Use `sequenceDiagram` for interactions
- Use `graph TD` for relationships
- Always include styling where appropriate
- Minimum 2-3 diagrams per lesson

---

## Course 4: Clean Code & Design Patterns

**Slug:** `clean-code-design-patterns`
**Difficulty:** Intermediate
**Duration:** 8 hours
**Lessons:** 8

### Lesson Structure

| # | Slug | Title | Duration | Key Topics |
|---|------|-------|----------|------------|
| 01 | `what-is-clean-code` | What is Clean Code? | 45 min | Principles, readability, boy scout rule, code smells |
| 02 | `naming-conventions` | Naming Conventions | 50 min | Variables, functions, classes, meaningful names |
| 03 | `functions-done-right` | Functions Done Right | 55 min | Small functions, single responsibility, parameters |
| 04 | `comments-documentation` | Comments & Documentation | 45 min | When to comment, self-documenting code, docstrings |
| 05 | `code-formatting-style` | Code Formatting & Style | 50 min | Consistency, PEP 8, automated tools, refactoring |
| 06 | `intro-design-patterns` | Introduction to Design Patterns | 60 min | What are patterns, Gang of Four, categories |
| 07 | `creational-structural-patterns` | Creational & Structural Patterns | 60 min | Singleton, Factory, Observer, Adapter with examples |
| 08 | `behavioral-patterns` | Behavioral Patterns & Best Practices | 55 min | Strategy, Command, Decorator, anti-patterns |

### Content Guidelines
- **Code Language:** Python (all examples)
- **Mermaid Diagrams:** class diagrams for patterns, flowcharts for decision-making
- **Key Examples:** Before/after code refactoring, pattern implementations
- **Practice:** Code review exercises, refactoring challenges, pattern identification

### Mermaid Diagram Ideas
- `classDiagram` showing Singleton pattern structure
- `flowchart TD` for pattern selection decision tree
- `classDiagram` for Factory pattern hierarchy
- `sequenceDiagram` for Observer pattern interactions
- `graph TD` showing pattern relationships

### Callout Topics
- NOTE: When to use each pattern
- WARNING: Common anti-patterns and over-engineering
- TIP: IDE shortcuts for refactoring
- SUCCESS: Real-world benefits of clean code

---

## Course 5: SOLID Principles & OOP

**Slug:** `solid-principles-oop`
**Difficulty:** Intermediate
**Duration:** 9 hours
**Lessons:** 8

### Lesson Structure

| # | Slug | Title | Duration | Key Topics |
|---|------|-------|----------|------------|
| 01 | `oop-fundamentals-review` | OOP Fundamentals Review | 50 min | Classes, objects, inheritance, polymorphism, encapsulation |
| 02 | `single-responsibility-principle` | Single Responsibility Principle | 60 min | Definition, violations, refactoring, benefits |
| 03 | `open-closed-principle` | Open-Closed Principle | 65 min | Extension vs modification, abstraction, strategy pattern |
| 04 | `liskov-substitution-principle` | Liskov Substitution Principle | 60 min | Substitutability, contract, violations, examples |
| 05 | `interface-segregation-principle` | Interface Segregation Principle | 55 min | Fat interfaces, client-specific interfaces, Python protocols |
| 06 | `dependency-inversion-principle` | Dependency Inversion Principle | 65 min | High/low level modules, dependency injection, IoC |
| 07 | `solid-in-practice` | SOLID in Practice | 70 min | Complete refactoring case study applying all principles |
| 08 | `oop-design-best-practices` | OOP Design Best Practices | 55 min | Composition over inheritance, interfaces, common mistakes |

### Content Guidelines
- **Code Language:** Python (all examples)
- **Mermaid Diagrams:** class diagrams for OOP structures, flowcharts for principle application
- **Key Examples:** Violation → Refactoring pairs, real-world domain models
- **Practice:** Identify SOLID violations, refactor code, design class hierarchies

### Mermaid Diagram Ideas
- `classDiagram` showing SRP violation and fix
- `flowchart TD` for applying SOLID principles step-by-step
- `classDiagram` for OCP with strategy pattern
- `graph TD` showing dependency inversion flow
- `classDiagram` for ISP with segregated interfaces

### Callout Topics
- NOTE: Historical context of SOLID (Robert C. Martin)
- WARNING: Over-applying principles leads to complexity
- TIP: Use type hints and protocols in Python
- SUCCESS: Benefits visible in large codebases

---

## Course 6: Clean Architecture

**Slug:** `clean-architecture`
**Difficulty:** Intermediate
**Duration:** 7 hours
**Lessons:** 7

### Lesson Structure

| # | Slug | Title | Duration | Key Topics |
|---|------|-------|----------|------------|
| 01 | `what-is-software-architecture` | What is Software Architecture? | 50 min | Definition, importance, architectural drivers, trade-offs |
| 02 | `dependency-rule` | The Dependency Rule | 60 min | Inner/outer layers, dependency direction, boundaries |
| 03 | `entities-use-cases` | Entities & Use Cases | 65 min | Business logic, application logic, separation of concerns |
| 04 | `interface-adapters` | Interface Adapters | 60 min | Controllers, presenters, gateways, data transformation |
| 05 | `frameworks-externalities` | Frameworks & Externalities | 55 min | Keeping frameworks at boundaries, testability |
| 06 | `clean-architecture-python` | Clean Architecture in Python | 65 min | Project structure, layer implementation, DI |
| 07 | `real-world-architecture` | Real-World Architecture Example | 70 min | Building a complete application with clean architecture |

### Content Guidelines
- **Code Language:** Python (all examples)
- **Mermaid Diagrams:** Architecture diagrams, layer flow, dependency graphs
- **Key Examples:** Complete layered application, dependency injection patterns
- **Practice:** Design architecture for given requirements, identify boundary violations

### Mermaid Diagram Ideas
- `graph TD` showing clean architecture concentric layers
- `flowchart LR` for dependency flow between layers
- `sequenceDiagram` for request flow through layers
- `classDiagram` for entity and use case structures
- `graph TD` for project structure visualization

### Callout Topics
- NOTE: Uncle Bob's original clean architecture paper
- WARNING: Don't over-engineer simple applications
- TIP: Start with boundaries, implement incrementally
- SUCCESS: Testability improves dramatically with clean architecture

---

## Course 7: Functional & Declarative Coding

**Slug:** `functional-declarative-coding`
**Difficulty:** Intermediate
**Duration:** 6 hours
**Lessons:** 7

### Lesson Structure

| # | Slug | Title | Duration | Key Topics |
|---|------|-------|----------|------------|
| 01 | `functional-programming-concepts` | Functional Programming Concepts | 50 min | Immutability, pure functions, side effects, declarative vs imperative |
| 02 | `first-class-higher-order-functions` | First-Class & Higher-Order Functions | 55 min | Functions as values, map, filter, reduce |
| 03 | `lambda-functions-closures` | Lambda Functions & Closures | 50 min | Anonymous functions, lexical scoping, practical uses |
| 04 | `function-composition` | Function Composition | 55 min | Composing functions, pipelines, point-free style |
| 05 | `immutability-in-practice` | Immutability in Practice | 50 min | Immutable data structures, avoiding mutation, benefits |
| 06 | `declarative-patterns` | Declarative Patterns | 55 min | List comprehensions, generators, expressing intent |
| 07 | `functional-python-real-projects` | Functional Python in Real Projects | 60 min | Combining OOP and FP, when to use each, case studies |

### Content Guidelines
- **Code Language:** Python (all examples)
- **Mermaid Diagrams:** Data flow diagrams, transformation pipelines, comparison charts
- **Key Examples:** Imperative vs functional comparisons, pipeline implementations
- **Practice:** Convert imperative code to functional, build data pipelines

### Mermaid Diagram Ideas
- `flowchart LR` showing data transformation pipeline
- `graph TD` comparing imperative vs declarative approaches
- `sequenceDiagram` for function composition flow
- `flowchart TD` for map/filter/reduce operations
- `graph LR` showing immutability benefits

### Callout Topics
- NOTE: Functional programming origins in lambda calculus
- WARNING: Overusing FP can reduce readability in Python
- TIP: Use `functools` and `itertools` modules
- SUCCESS: FP leads to more testable, predictable code

---

## Course 8: DDD & Software Architecture

**Slug:** `ddd-software-architecture`
**Difficulty:** Advanced
**Duration:** 10 hours
**Lessons:** 8

### Lesson Structure

| # | Slug | Title | Duration | Key Topics |
|---|------|-------|----------|------------|
| 01 | `intro-to-ddd` | Introduction to DDD | 60 min | History, core concepts, strategic vs tactical design |
| 02 | `ubiquitous-language` | Ubiquitous Language | 65 min | Definition, collaboration, examples, avoiding translation |
| 03 | `bounded-contexts` | Bounded Contexts | 70 min | Context mapping, integration patterns, boundaries |
| 04 | `entities-value-objects` | Entities & Value Objects | 65 min | Identity, equality, immutability, when to use each |
| 05 | `aggregates-roots` | Aggregates & Aggregate Roots | 70 min | Consistency boundaries, invariants, transactions |
| 06 | `repositories-domain-services` | Repositories & Domain Services | 65 min | Data access abstraction, business logic placement |
| 07 | `event-driven-architecture` | Event-Driven Architecture | 70 min | Domain events, event sourcing, CQRS basics |
| 08 | `ddd-implementation-python` | DDD Implementation in Python | 75 min | Complete example: e-commerce domain model |

### Content Guidelines
- **Code Language:** Python (all examples)
- **Mermaid Diagrams:** Context maps, aggregate structures, event flows, domain models
- **Key Examples:** Complete domain models, context mapping patterns, event sourcing
- **Practice:** Model a domain, identify aggregates, design bounded contexts

### Mermaid Diagram Ideas
- `graph TD` for bounded context relationships
- `classDiagram` for entity and value object structures
- `sequenceDiagram` for domain event flow
- `flowchart TD` for aggregate consistency boundaries
- `graph LR` for CQRS command/query separation

### Callout Topics
- NOTE: Eric Evans' original DDD book (2003)
- WARNING: DDD adds complexity - use only for complex domains
- TIP: Start with strategic design before tactical
- SUCCESS: DDD aligns code with business understanding

---

## Course 9: TDD & Code Quality Tools

**Slug:** `tdd-code-quality-tools`
**Difficulty:** Intermediate
**Duration:** 8 hours
**Lessons:** 9

### Lesson Structure

| # | Slug | Title | Duration | Key Topics |
|---|------|-------|----------|------------|
| 01 | `intro-to-tdd` | Introduction to TDD | 50 min | Red-Green-Refactor cycle, benefits, mindset shift |
| 02 | `writing-first-tests` | Writing Your First Tests | 55 min | pytest basics, assertions, test structure, fixtures |
| 03 | `unit-testing-best-practices` | Unit Testing Best Practices | 60 min | AAA pattern, test naming, isolation, mocking |
| 04 | `test-coverage-quality` | Test Coverage & Quality | 50 min | Coverage tools, meaningful coverage, vanity metrics |
| 05 | `pre-commit-hooks` | Pre-Commit Hooks | 50 min | Setup, hooks configuration, automated checks |
| 06 | `linting-code-quality` | Linting & Code Quality | 55 min | flake8, pylint, ruff, configuration, CI integration |
| 07 | `code-formatting` | Code Formatting | 45 min | Black, isort, automated formatting, team consistency |
| 08 | `static-analysis-scanning` | Static Analysis & Code Scanning | 55 min | mypy, bandit, sonarqube, security scanning |
| 09 | `complete-cicd-pipeline` | Complete CI/CD Pipeline | 65 min | GitHub Actions, automated testing, quality gates |

### Content Guidelines
- **Code Language:** Python (all examples), YAML for CI/CD
- **Mermaid Diagrams:** TDD cycle, CI/CD pipeline flow, tool integration
- **Key Examples:** Test implementations, configuration files, pipeline YAML
- **Practice:** Write tests for existing code, set up pre-commit, configure CI/CD

### Mermaid Diagram Ideas
- `flowchart TD` for Red-Green-Refactor cycle
- `flowchart LR` for CI/CD pipeline stages
- `sequenceDiagram` for test execution flow
- `graph TD` for tool ecosystem integration
- `flowchart TD` for quality gate decision process

### Callout Topics
- NOTE: Kent Beck's TDD origins
- WARNING: 100% coverage doesn't mean bug-free
- TIP: Start with critical paths, expand gradually
- SUCCESS: TDD leads to better design, not just tests

---

## Course 10: Agentic AI Software Development

**Slug:** `agentic-ai-development`
**Difficulty:** Advanced
**Duration:** 10 hours
**Lessons:** 10

### Lesson Structure

| # | Slug | Title | Duration | Key Topics |
|---|------|-------|----------|------------|
| 01 | `intro-to-ai-agents` | Introduction to AI Agents | 55 min | What are agents, capabilities, use cases in development |
| 02 | `agent-architecture` | Agent Architecture | 60 min | Perception, reasoning, action loops, planning |
| 03 | `skills-capabilities` | Skills & Capabilities | 60 min | Tool use, function calling, skill design |
| 04 | `context-management` | Context Management | 65 min | Context windows, memory, retrieval, summarization |
| 05 | `agent-pipelines` | Agent Pipelines | 60 min | Sequential workflows, parallel execution, error handling |
| 06 | `opencode-development-tool` | OpenCode as Development Tool | 65 min | Setup, configuration, agent creation, workflows |
| 07 | `building-custom-skills` | Building Custom Agent Skills | 60 min | Skill definition, tool integration, testing |
| 08 | `prompt-engineering-agents` | Prompt Engineering for Agents | 60 min | System prompts, few-shot examples, constraints |
| 09 | `best-practices-patterns` | Best Practices & Patterns | 65 min | Reliability, observability, evaluation, human-in-the-loop |
| 10 | `real-world-agent-projects` | Real-World Agent Projects | 70 min | Code generation, review, refactoring, documentation |

### Content Guidelines
- **Code Language:** Python, YAML for agent configs, JSON for contexts
- **Mermaid Diagrams:** Agent architecture, pipeline flows, context management, skill interactions
- **Key Examples:** Agent implementations, skill definitions, pipeline configurations
- **Practice:** Build custom skills, design agent pipelines, integrate with OpenCode

### Mermaid Diagram Ideas
- `flowchart TD` for agent perception-reasoning-action loop
- `sequenceDiagram` for agent-tool interactions
- `flowchart LR` for agent pipeline stages
- `graph TD` for context management architecture
- `classDiagram` for skill and tool structures

### Callout Topics
- NOTE: Rapidly evolving field - verify latest practices
- WARNING: AI agents can make mistakes - always review output
- TIP: Start with narrow, well-defined tasks
- SUCCESS: Agents amplify developer productivity 5-10x

---

## Roadmap Update Required

After creating each course, update the roadmap files:

### English: `content/roadmaps/intro-to-software-engineering/en.md`
### Portuguese: `content/roadmaps/intro-to-software-engineering/pt.md`

Change the `contentRef` for each step from `null` to the course slug:

```yaml
## Step: Clean Code & Design Patterns
- id: clean-code-design-patterns
- type: course
- contentRef: clean-code-design-patterns  # ← Update this
...

## Step: SOLID Principles & OOP
- id: solid-principles-oop
- type: course
- contentRef: solid-principles-oop  # ← Update this
...
```

Continue for all remaining steps (6-10).

---

## Build Verification

After creating all courses:

```bash
npm run build
```

Verify the following routes are generated:
- `/en/courses/clean-code-design-patterns` (and all lessons)
- `/en/courses/solid-principles-oop` (and all lessons)
- `/en/courses/clean-architecture` (and all lessons)
- `/en/courses/functional-declarative-coding` (and all lessons)
- `/en/courses/ddd-software-architecture` (and all lessons)
- `/en/courses/tdd-code-quality-tools` (and all lessons)
- `/en/courses/agentic-ai-development` (and all lessons)

Plus Portuguese versions (`/pt/courses/...`).

---

## Estimated Effort

| Course | Lessons | Lines/Lesson | Total Lines | Estimated Time |
|--------|---------|--------------|-------------|----------------|
| 4. Clean Code | 8 | 350 | ~5,600 | 2-3 hours |
| 5. SOLID & OOP | 8 | 400 | ~6,400 | 2-3 hours |
| 6. Clean Architecture | 7 | 400 | ~5,600 | 2-3 hours |
| 7. Functional Coding | 7 | 350 | ~4,900 | 2 hours |
| 8. DDD | 8 | 450 | ~7,200 | 3-4 hours |
| 9. TDD & Tools | 9 | 350 | ~6,300 | 2-3 hours |
| 10. Agentic AI | 10 | 400 | ~8,000 | 3-4 hours |
| **Total** | **57** | **~385 avg** | **~44,000** | **16-22 hours** |

---

## Quick Start Commands

```bash
# Create directory structure for all remaining courses
mkdir -p content/courses/{clean-code-design-patterns,solid-principles-oop,clean-architecture,functional-declarative-coding,ddd-software-architecture,tdd-code-quality-tools,agentic-ai-development}/{en,pt}

# Create course.json files (use templates above)
# Create lesson files following the pattern from Courses 1-3

# Update roadmap contentRef links
# Run build to verify
npm run build
```

---

## Notes

- All courses should follow the same quality standards as Courses 1-3
- Include Mermaid diagrams in every lesson (minimum 2-3)
- Use GitHub-style callouts consistently
- Provide complete, runnable code examples
- Include 5-8 practice exercises per lesson
- Translate properly to Portuguese (not word-for-word)
- Test build after creating each course to catch errors early
