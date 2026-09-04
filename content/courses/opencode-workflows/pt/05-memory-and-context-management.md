---
title: "Gerenciamento de Memória e Contexto"
description: "Gerencie memória e contexto em sessões do OpenCode. Aprenda como manter estado entre conversas, usar arquivos de memória e otimizar contexto para melhores resultados."
order: 5
duration: "45 min"
difficulty: "intermediate"
---

# Gerenciamento de Memória e Contexto

## Entendendo Contexto

Contexto é a informação que a IA lembra durante uma sessão:

| Tipo de Contexto | Descrição | Persistência |
|-------------|-------------|-------------|
| **Conversa** | Histórico de chat | Apenas na sessão |
| **Conteúdo de Arquivo** | Arquivos lidos | Até ser limpo |
| **Projeto** | Estrutura do projeto | Apenas na sessão |
| **Arquivos de Memória** | Armazenamento persistente | Entre sessões |

---

## Memória de Conversa

### Ver Histórico

```
> /history
```

### Salvar Sessão

```
> /save project-setup
```

### Carregar Sessão

```
> /load project-setup
```

### Limpar Contexto

```
> /clear
```

---

## Arquivos de Memória

Arquivos de memória persistem informações entre sessões.

### Memória do Projeto

Crie `.opencode/memory/project.md`:

```markdown
# Project Memory

## Architecture
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL

## Conventions
- Use camelCase for variables
- Use PascalCase for components
- All API endpoints prefixed with /api/

## Decisions
- 2024-01-15: Chose PostgreSQL over MongoDB for ACID compliance
```

### Memória Pessoal

Crie `~/.config/opencode/memory/personal.md`:

```markdown
# Personal Memory

## Preferences
- Preferred model: gpt-4o
- Coding style: Functional programming
- Testing: Jest with 80% coverage minimum

## Shortcuts
- Use /clear between topics
- Always review AI suggestions before applying
```

---

## Carregando Memória

### Carregamento Automático

Configure o carregamento automático em `opencode.json`:

```json
{
  "memory": {
    "autoLoad": [
      ".opencode/memory/project.md",
      ".opencode/memory/conventions.md"
    ]
  }
}
```

### Carregamento Manual

```
> Load the project memory file at .opencode/memory/project.md
```

---

## Otimização de Contexto

### Quando o Contexto Fica Grande Demais

**Sintomas:**
- Respostas lentas
- IA esquece instruções iniciais
- Avisos de limite de tokens

**Soluções:**

1. **Limpe e recarregue o essencial**:
```
> /clear
> Load .opencode/memory/project.md
> We're working on the authentication module
```

2. **Use subagentes para tarefas isoladas**:
```
> Have the test-agent write tests for the login function
```

3. **Resuma conversas longas**:
```
> Summarize what we've discussed so far into a memory file
```

### Gerenciamento da Janela de Contexto

```
> /verbose
Context: 15234 tokens (47% of 32k limit)
```

**Melhores Práticas:**

| Situação | Ação |
|-----------|--------|
| Contexto > 70% | Limpe e recarregue o essencial |
| Mudando de tópico | Limpe a conversa |
| Projeto complexo | Use arquivos de memória |
| Múltiplas tarefas | Use subagentes |

---

## Estrutura de Arquivos de Memória

### Formato Recomendado

```markdown
# [Memory Type] Memory

## [Section]
- Key point
- Key point

## [Section]
- Key point
```

### Convenções de Nomenclatura

| Arquivo | Finalidade |
|------|---------|
| `project.md` | Arquitetura e decisões do projeto |
| `conventions.md` | Padrões e convenções de código |
| `decisions.md` | Registros de decisões arquiteturais |
| `todo.md` | Tarefas atuais e prioridades |
| `learned.md` | Coisas aprendidas durante sessões |

---

## Usando Memória em Prompts

### Referenciar Memória

```
> According to our project memory, what database are we using?
```

### Atualizar Memória

```
> Update the project memory to note we've switched from MongoDB to PostgreSQL
```

### Criar a partir da Sessão

```
> Save our conversation about the API design to .opencode/memory/api-design.md
```

---

## Melhores Práticas

### Higiene de Memória

| Prática | Benefício |
|----------|---------|
| Atualizações regulares | Mantém a memória precisa |
| Seções claras | Fácil para encontrar informações |
| Data das decisões | Acompanha a evolução |
| Remover desatualizados | Previne confusão |

### Gerenciamento de Contexto

| Prática | Benefício |
|----------|---------|
| Limpar entre tópicos | Previne contaminação cruzada |
| Carregar apenas o essencial | Reduz uso de tokens |
| Usar subagentes | Isola tarefas complexas |
| Monitorar tamanho do contexto | Evita limites |

---

## Practice Questions

```question
{
  "id": "oc-memory-q1",
  "type": "multiple-choice",
  "question": "Where should you store project-specific memory files?",
  "options": [
    "~/.config/opencode/memory/",
    ".opencode/memory/",
    "src/memory/",
    "tmp/memory/"
  ],
  "correct": 1,
  "explanation": "Project-specific memory files belong in .opencode/memory/ within the project directory."
}
```

```question
{
  "id": "oc-memory-q2",
  "type": "multiple-choice",
  "question": "What is the benefit of memory files over conversation history?",
  "options": [
    "They're faster to load",
    "They persist across sessions",
    "They use fewer tokens",
    "They're automatically updated"
  ],
  "correct": 1,
  "explanation": "Memory files persist across sessions, while conversation history is lost when the session ends."
}
```

```question
{
  "id": "oc-memory-q3",
  "type": "multiple-choice",
  "question": "When should you clear the conversation context?",
  "options": [
    "Never",
    "Only when switching topics",
    "Every 10 messages",
    "When responses are slow"
  ],
  "correct": 1,
  "explanation": "Clear conversation when switching topics to prevent cross-contamination between unrelated discussions."
}
```

```question
{
  "id": "oc-memory-q4",
  "type": "multiple-choice",
  "question": "What should you do when context exceeds 70% of the limit?",
  "options": [
    "Use a larger model",
    "Clear and reload only essentials",
    "Add more memory files",
    "Restart OpenCode"
  ],
  "correct": 1,
  "explanation": "When context gets too large, clear it and reload only the essential memory files needed for the current task."
}
```

```question
{
  "id": "oc-memory-q5",
  "type": "multiple-choice",
  "question": "How do you update memory files during a session?",
  "options": [
    "Edit them manually outside OpenCode",
    "Ask OpenCode to update them",
    "Memory files cannot be updated",
    "Use the /memory-update command"
  ],
  "correct": 1,
  "explanation": "You can ask OpenCode to update memory files, and it will use the edit tool to make changes."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Arquivos de memória persistem informações entre sessões, ao contrário do histórico de conversas
- Armazene memória do projeto em `.opencode/memory/` dentro do projeto
- Limpe a conversa ao mudar de tópico para prevenir contaminação cruzada
- Monitore o tamanho do contexto e recarregue o essencial quando exceder 70%
- Use seções descritivas nos arquivos de memória para fácil recuperação
- Arquivos de memória devem ser datados e atualizados regularmente
- Subagentes ajudam a isolar tarefas complexas do contexto principal
