# Course JSON Schema

## Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `area` | string | Course category | `"Computer Science"` |
| `en.title` | string | English title | `"Introduction to Programming"` |
| `en.description` | string | English description (1-2 sentences) | `"Learn the fundamentals..."` |

## Optional Fields

| Field | Type | Convention | Example |
|-------|------|------------|---------|
| `difficulty` | string | Lowercase: `beginner`, `intermediate`, `advanced` | `"beginner"` |
| `en.difficulty` | string | Capitalized: `Beginner`, `Intermediate`, `Advanced` | `"Beginner"` |
| `author` | string | Author name | `"NUniversity"` |
| `duration` | string | Human-readable duration | `"4 weeks"` |
| `icon` | string | Icon identifier | `"code"` |
| `pt.*` | object | Portuguese translations | See below |
| `es.*` | object | Spanish translations | See below |

## Locale Object

Each locale (`en`, `pt`, `es`) contains:

```json
{
  "title": "Localized Title",
  "description": "Localized description",
  "difficulty": "Capitalized Difficulty",
  "duration": "Localized Duration"
}
```

## Validation Rules

1. `difficulty` must be lowercase (`beginner`, `intermediate`, `advanced`)
2. `en.difficulty` must be capitalized (`Beginner`, `Intermediate`, `Advanced`)
3. `area`, `en.title`, and `en.description` are required
4. Each locale section should have `title` and `description`
5. `author` should be `"NUniversity"` for new courses

## Example

```json
{
  "area": "Artificial Intelligence",
  "author": "NUniversity",
  "difficulty": "intermediate",
  "duration": "4 weeks",
  "icon": "database",
  "en": {
    "title": "Agent Knowledge Bases and Memory",
    "description": "Design persistent memory and knowledge systems for AI agents.",
    "difficulty": "Intermediate",
    "duration": "4 Weeks"
  },
  "pt": {
    "title": "Bases de Conhecimento e Memória para Agentes",
    "description": "Projete sistemas de memória persistente e conhecimento para agentes de IA.",
    "difficulty": "Intermediário",
    "duration": "4 Semanas"
  },
  "es": {
    "title": "Bases de Conocimiento y Memoria para Agentes",
    "description": "Diseña sistemas de memoria persistente y conocimiento para agentes de IA.",
    "difficulty": "Intermedio",
    "duration": "4 Semanas"
  }
}
```
