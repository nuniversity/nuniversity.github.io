---
id: intro-to-software-engineering
title: "Introduction to Software Engineering"
description: "Complete learning path from fundamental concepts to advanced software development practices. Master processes, algorithms, coding paradigms, architecture, and AI-assisted development."
icon: "Map"
order: 1
difficulty: "beginner"
estimatedDuration: "120 hours"
---

## Step: Processes
- id: processes
- type: course
- contentRef: processes-flowchart/01-what-are-processes
- description: Theoretical foundations of processes and flowcharts. Learn how to think systematically about workflows, decision points, and process optimization.
- prerequisites: []
- conditionals: []
- comments: Understanding processes is fundamental to all software engineering. Before writing code, you must understand the problem and how to break it down into steps.
- ideas: ["Create a flowchart for your morning routine", "Map the process of ordering food at a restaurant", "Document a work process using flowchart symbols"]
- estimatedDuration: 4 hours
- relationships:
  - leadsTo: foundation-of-algorithms
    type: required

## Step: Foundation of Algorithms
- id: foundation-of-algorithms
- type: course
- contentRef: algorithm-foundations/01-what-are-algorithms
- description: Algorithm foundations and quality principles without code. Learn to think algorithmically through conceptual examples, pseudocode, and real-world analogies. Understand what makes an algorithm efficient, readable, and maintainable.
- prerequisites: ["processes"]
- conditionals: []
- comments: No code yet - focus on thinking algorithmically. This conceptual foundation will make learning to code much easier.
- ideas: ["Solve logic puzzles using step-by-step thinking", "Write pseudocode for making a sandwich", "Analyze the algorithm of searching for a word in a dictionary"]
- estimatedDuration: 6 hours
- relationships:
  - leadsTo: computing-imperative-algorithm
    type: required

## Step: Computing Imperative Algorithm
- id: computing-imperative-algorithm
- type: course
- contentRef: computing-imperative-python/01-how-computers-work
- description: How computers work, basic data structures, and imperative algorithms in Python. Learn variables, control flow, loops, functions, and basic data structures through hands-on Python coding.
- prerequisites: ["foundation-of-algorithms"]
- conditionals: []
- comments: This is where you write your first code! Python is chosen for its readability and simplicity. Focus on understanding how the computer executes your instructions.
- ideas: ["Write a program to calculate factorial", "Create a simple calculator", "Implement bubble sort algorithm", "Build a number guessing game"]
- estimatedDuration: 10 hours
- relationships:
  - leadsTo: clean-code-design-patterns
    type: required

## Step: Clean Code & Design Patterns
- id: clean-code-design-patterns
- type: course
- contentRef: clean-code-design-patterns/01-what-is-clean-code
- description: Writing maintainable, readable code and understanding common design patterns. Learn naming conventions, code organization, refactoring techniques, and classic patterns like Singleton, Factory, Observer, and Strategy.
- prerequisites: ["computing-imperative-algorithm"]
- conditionals: []
- comments: Clean code is not just about making it work - it's about making it understandable for humans. Your future self will thank you.
- ideas: ["Refactor a messy piece of code", "Identify design patterns in everyday objects", "Practice meaningful variable naming"]
- estimatedDuration: 8 hours
- relationships:
  - leadsTo: solid-principles-oop
    type: required

## Step: SOLID Principles & OOP
- id: solid-principles-oop
- type: course
- contentRef: solid-principles-oop/01-oop-fundamentals-review
- description: SOLID principles and Object-Oriented Programming paradigm. Master Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles through practical OOP examples.
- prerequisites: ["clean-code-design-patterns"]
- conditionals: []
- comments: SOLID principles are the foundation of good object-oriented design. They help you create flexible, maintainable systems.
- ideas: ["Identify SOLID violations in existing code", "Design a class hierarchy for a library system", "Refactor code to follow Single Responsibility Principle"]
- estimatedDuration: 9 hours
- relationships:
  - leadsTo: clean-architecture
    type: required

## Step: Clean Architecture
- id: clean-architecture
- type: course
- contentRef: clean-architecture/01-what-is-software-architecture
- description: Architectural patterns and separation of concerns. Learn about layers, boundaries, dependency rules, and how to structure applications for testability, maintainability, and independence from frameworks.
- prerequisites: ["solid-principles-oop"]
- conditionals: []
- comments: Architecture is about making decisions that are hard to change later. Good architecture makes your system easier to understand, develop, and maintain.
- ideas: ["Draw the architecture of a familiar application", "Identify boundaries in existing projects", "Practice dependency inversion"]
- estimatedDuration: 7 hours
- relationships:
  - leadsTo: functional-declarative-coding
    type: required

## Step: Functional & Declarative Coding
- id: functional-declarative-coding
- type: course
- contentRef: functional-declarative-coding/01-functional-programming-concepts
- description: Functional programming concepts and declarative paradigms. Learn immutability, pure functions, higher-order functions, map/filter/reduce, and how to think in transformations rather than mutations.
- prerequisites: ["clean-architecture"]
- conditionals: []
- comments: Functional programming offers a different way of thinking about problems. It complements OOP and leads to more predictable, testable code.
- ideas: ["Rewrite imperative code in functional style", "Practice using map, filter, and reduce", "Explore lambda functions and closures"]
- estimatedDuration: 6 hours
- relationships:
  - leadsTo: ddd-software-architecture
    type: required

## Step: DDD & Software Architecture
- id: ddd-software-architecture
- type: course
- contentRef: ddd-software-architecture/01-intro-to-ddd
- description: Domain-Driven Design and advanced software architecture. Learn ubiquitous language, bounded contexts, entities, value objects, aggregates, and how to model complex business domains effectively.
- prerequisites: ["functional-declarative-coding"]
- conditionals: []
- comments: DDD bridges the gap between business requirements and technical implementation. It's essential for building complex enterprise systems.
- ideas: ["Model a simple e-commerce domain", "Identify bounded contexts in a system", "Practice creating ubiquitous language with non-technical stakeholders"]
- estimatedDuration: 10 hours
- relationships:
  - leadsTo: tdd-code-quality
    type: required

## Step: TDD & Code Quality Tools
- id: tdd-code-quality
- type: course
- contentRef: tdd-code-quality-tools/01-intro-to-tdd
- description: Test-Driven Development and code quality ecosystem. Master the Red-Green-Refactor cycle, unit testing, integration testing, pre-commit hooks, linting, code formatting, static analysis, and code scanning tools.
- prerequisites: ["ddd-software-architecture"]
- conditionals: []
- comments: TDD changes how you think about code. Writing tests first leads to better design and gives you confidence to refactor.
- ideas: ["Practice TDD with a simple kata", "Set up pre-commit hooks in a project", "Configure ESLint and Prettier", "Run a code scanning tool on existing code"]
- estimatedDuration: 8 hours
- relationships:
  - leadsTo: agentic-ai-development
    type: required

## Step: Agentic AI Software Development
- id: agentic-ai-development
- type: course
- contentRef: agentic-ai-development/01-intro-to-ai-agents
- description: AI-assisted software development with agents. Learn about AI agents, skills, context management, pipelines, best practices, and how to use OpenCode as a powerful development tool. Master the future of software development.
- prerequisites: ["tdd-code-quality"]
- conditionals: []
- comments: This is the cutting edge of software development. AI agents are transforming how we write, test, and maintain code. Learn to leverage these tools effectively.
- ideas: ["Set up OpenCode for a project", "Create a custom agent skill", "Build an automated code review pipeline", "Experiment with context management strategies"]
- estimatedDuration: 10 hours
- relationships: []
