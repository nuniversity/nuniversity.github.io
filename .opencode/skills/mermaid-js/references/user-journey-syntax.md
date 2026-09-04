# Mermaid.js User Journey Reference

## Basic Syntax
```
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

## Score
- 1 — Worst experience
- 5 — Best experience

## Structure
- `journey` — Diagram keyword
- `title` — Optional title
- `section` — Groups tasks
- `Task name: <score>: <actors>` — Task definition
