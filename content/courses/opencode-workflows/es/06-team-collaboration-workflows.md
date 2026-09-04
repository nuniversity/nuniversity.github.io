---
title: "Flujos de Trabajo de Colaboración en Equipo"
description: "Configura OpenCode para uso en equipo. Aprende a compartir configuraciones, acceso basado en roles, patrones colaborativos y cómo mantener consistencia en tu equipo de desarrollo."
order: 6
duration: "45 min"
difficulty: "intermediate"
---

# Flujos de Trabajo de Colaboración en Equipo

## ¿Por Qué Configuración en Equipo?

| Beneficio | Descripción |
|---------|-------------|
| **Consistencia** | Mismo comportamiento en todo el equipo |
| **Compartir conocimiento** | Habilidades y prompts compartidos |
| **Seguridad** | Permisos controlados |
| **Auditabilidad** | Rastrear uso de IA |

---

## Compartir Configuración

### Estrategia de Control de Versiones

```
your-project/
├── .opencode/
│   ├── config.json          # ✅ Commit (team config)
│   ├── skills/              # ✅ Commit (shared skills)
│   └── memory/              # ❌ Don't commit (personal)
├── opencode.json            # ✅ Commit (legacy format)
└── .env                     # ❌ Don't commit (secrets)
```

### .gitignore

```gitignore
# OpenCode
.env
.opencode/memory/
.opencode/sessions/
*.log
```

### Configuración Compartida

Crea `.opencode/config.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Team coding assistant"
    }
  },
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *", "pytest *"],
      "deny": ["sudo *", "rm -rf /"]
    }
  ],
  "skills": {
    "code-review": {
      "manifest": ".opencode/skills/code-review/skill.yaml"
    }
  }
}
```

---

## Configuración Basada en Roles

### Diferentes Roles, Diferentes Configuraciones

Crea archivos de configuración específicos por rol:

```bash
.config/
├── opencode-developer.json
├── opencode-reviewer.json
└── opencode-lead.json
```

### Uso

```bash
# Developer mode
opencode --config .config/opencode-developer.json

# Reviewer mode
opencode --config .config/opencode-reviewer.json
```

---

## Habilidades Compartidas

### Crear Habilidades del Equipo

```
.opencode/skills/
├── code-review/
│   ├── skill.yaml
│   └── skill.md
├── api-design/
│   ├── skill.yaml
│   └── skill.md
└── testing/
    ├── skill.yaml
    └── skill.md
```

### Compartir vía Git

```bash
git add .opencode/skills/
git commit -m "Add team skills"
git push
```

---

## Patrones Colaborativos

### Flujo de Trabajo de Revisión de Código

```mermaid
flowchart TD
    A[Developer writes code] --> B[Runs local checks]
    B --> C[Commits changes]
    C --> D[CI/CD runs tests]
    D --> E[Reviewer uses OpenCode]
    E --> F{Approved?}
    F -->|Yes| G[Merge]
    F -->|No| H[Feedback]
    H --> A
```

### Programación en Pareja

```
> Switch to pair mode
> Load shared project context
> Let's work on the authentication module together
```

### Transferencia de Conocimiento

```
> Summarize our architecture decisions into a memory file
> Create a guide for new developers
```

---

## Mejores Prácticas de Seguridad

### Aislamiento de Permisos

```json
{
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm test", "npm run lint"],
      "deny": ["npm publish", "git push --force"]
    },
    {
      "tool": "write",
      "allow": ["src/**", "tests/**"],
      "deny": [".env", "secrets/**", "*.key"]
    }
  ]
}
```

### Gestión de Secretos

| Práctica | Implementación |
|----------|----------------|
| Usar variables de entorno | `${API_KEY}` en configuración |
| Nunca commitear secretos | Agregar .env a .gitignore |
| Rotar regularmente | Actualizar claves mensualmente |
| Auditar acceso | Registrar todas las llamadas a la API |

---

## Monitoreo y Auditoría

### Habilitar Registro

```json
{
  "logging": {
    "enabled": true,
    "level": "info",
    "file": "opencode-audit.log"
  }
}
```

### Rastrear Uso

```bash
# View audit log
tail -f opencode-audit.log

# Search for specific actions
grep "bash" opencode-audit.log
```

---

## Incorporando Nuevos Miembros del Equipo

### Lista de Verificación

1. Clonar repositorio
2. Instalar OpenCode
3. Copiar `.env.example` a `.env`
4. Agregar claves API
5. Ejecutar `opencode` para verificar

### Documentación

Crea `docs/opencode-setup.md`:

```markdown
# OpenCode Setup

## Prerequisites
- Node.js 18+
- API key from OpenAI or Anthropic

## Setup
1. npm install -g opencode
2. cp .env.example .env
3. Add your API key to .env
4. opencode --version

## Usage
- `opencode` - Start interactive session
- `opencode run "task"` - Run single prompt
```

---

## Practice Questions

```question
{
  "id": "oc-team-q1",
  "type": "multiple-choice",
  "question": "Which files should be committed to version control?",
  "options": [
    ".env and opencode.json",
    "opencode.json and .opencode/skills/",
    ".opencode/memory/ and .env",
    "All files in .opencode/"
  ],
  "correct": 1,
  "explanation": "Commit configuration files and shared skills, but never commit secrets (.env) or personal memory files."
}
```

```question
{
  "id": "oc-team-q2",
  "type": "multiple-choice",
  "question": "How do you share skills with your team?",
  "options": [
    "Copy them manually",
    "Commit them to version control",
    "Email them",
    "Use a separate skill server"
  ],
  "correct": 1,
  "explanation": "Store skills in .opencode/skills/ and commit them to version control so all team members have access."
}
```

```question
{
  "id": "oc-team-q3",
  "type": "multiple-choice",
  "question": "What is the benefit of role-based configuration?",
  "options": [
    "Faster performance",
    "Different permissions for different roles",
    "Lower cost",
    "Simpler setup"
  ],
  "correct": 1,
  "explanation": "Role-based configuration allows different permissions and behaviors for developers, reviewers, and leads."
}
```

```question
{
  "id": "oc-team-q4",
  "type": "multiple-choice",
  "question": "How do you prevent accidental deletion of production data?",
  "options": [
    "Use a different AI model",
    "Add deny rules for dangerous commands",
    "Disable bash tool entirely",
    "Use a VPN"
  ],
  "correct": 1,
  "explanation": "Add deny rules for dangerous commands like 'rm -rf /' and 'sudo' to prevent accidental data loss."
}
```

```question
{
  "id": "oc-team-q5",
  "type": "multiple-choice",
  "question": "What should you do when onboarding a new team member?",
  "options": [
    "Give them admin access",
    "Walk through setup checklist and documentation",
    "Skip setup, they'll figure it out",
    "Create a custom model for them"
  ],
  "correct": 1,
  "explanation": "A structured onboarding checklist and documentation ensures consistent setup and reduces friction."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Versiona la configuración compartida y habilidades, pero no los secretos
- La configuración basada en roles proporciona permisos apropiados para cada miembro del equipo
- Las habilidades compartidas en `.opencode/skills/` aseguran comportamiento consistente
- Las reglas de denegación previenen operaciones peligrosas como push forzado o eliminación de datos
- Habilita el registro para pistas de auditoría y seguimiento de uso
- Documenta los procedimientos de configuración para nuevos miembros del equipo
- Los archivos de memoria personales no deben versionarse
