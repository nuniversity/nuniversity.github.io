---
title: "Fluxos de Trabalho de Colaboração em Equipe"
description: "Configure o OpenCode para uso em equipe. Aprenda compartilhamento de configuração, acesso baseado em funções, padrões colaborativos e como manter consistência em sua equipe de desenvolvimento."
order: 6
duration: "45 min"
difficulty: "intermediate"
---

# Fluxos de Trabalho de Colaboração em Equipe

## Por que Configuração em Equipe?

| Benefício | Descrição |
|---------|-------------|
| **Consistência** | Mesmo comportamento em toda a equipe |
| **Compartilhamento de conhecimento** | Skills e prompts compartilhados |
| **Segurança** | Permissões controladas |
| **Rastreabilidade** | Acompanhar uso da IA |

---

## Compartilhamento de Configuração

### Estratégia de Controle de Versão

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

### Configuração Compartilhada

Crie `.opencode/config.json`:

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

## Configuração Baseada em Funções

### Funções Diferentes, Configs Diferentes

Crie arquivos de configuração específicos para cada função:

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

## Skills Compartilhadas

### Criar Skills de Equipe

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

### Compartilhar via Git

```bash
git add .opencode/skills/
git commit -m "Add team skills"
git push
```

---

## Padrões Colaborativos

### Fluxo de Trabalho de Revisão de Código

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

### Programação em Par

```
> Switch to pair mode
> Load shared project context
> Let's work on the authentication module together
```

### Transferência de Conhecimento

```
> Summarize our architecture decisions into a memory file
> Create a guide for new developers
```

---

## Melhores Práticas de Segurança

### Isolamento de Permissões

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

### Gerenciamento de Segredos

| Prática | Implementação |
|----------|----------------|
| Use variáveis de ambiente | `${API_KEY}` na configuração |
| Nunca commite segredos | Adicione .env ao .gitignore |
| Rotacione regularmente | Atualize chaves mensalmente |
| Audite acesso | Registre todas as chamadas de API |

---

## Monitoramento e Auditoria

### Ativar Registro

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

## Onboarding de Novos Membros da Equipe

### Lista de Verificação

1. Clone o repositório
2. Instale o OpenCode
3. Copie `.env.example` para `.env`
4. Adicione chaves de API
5. Execute `opencode` para verificar

### Documentação

Crie `docs/opencode-setup.md`:

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

- Controle de versão de configuração compartilhada e skills, mas não de segredos
- Configuração baseada em funções fornece permissões apropriadas para cada membro da equipe
- Skills compartilhadas em `.opencode/skills/` garantem comportamento consistente
- Regras de negação previnem operações perigosas como force push ou exclusão de dados
- Ative registro para trilhas de auditoria e rastreamento de uso
- Documente procedimentos de configuração para novos membros da equipe
- Arquivos de memória pessoais não devem ser commitados no controle de versão
