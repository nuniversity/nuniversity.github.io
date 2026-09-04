---
title: "Configuração Básica com opencode.json"
description: "Configure o OpenCode usando opencode.json. Aprenda o schema de configuração, agentes, provedores, permissões e como personalizar o comportamento para seus projetos."
order: 5
duration: "45 min"
difficulty: "beginner"
---

# Configuração Básica com opencode.json

## Localizações de Arquivos de Configuração

O OpenCode procura configuração nesta ordem:

| Prioridade | Localização | Finalidade |
|------------|-------------|------------|
| 1 | `.opencode/config.json` | Específico do projeto (preferido) |
| 2 | `opencode.json` | Específico do projeto (legado) |
| 3 | `~/.config/opencode/config.json` | Padrões do usuário |

> [!TIP]
> Para novos projetos, use `.opencode/config.json`. O `opencode.json` na raiz é mantido por compatibilidade retroativa.

---

## Estrutura de Configuração Básica

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {},
  "providers": {},
  "permissions": [],
  "skills": {}
}
```

---

## Configurando Agentes

Agentes são assistentes de IA com modelos e comportamentos específicos.

### Agente Simples

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Assistente de codificação de propósito geral"
    }
  }
}
```

### Múltiplos Agentes

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Assistente de codificação de propósito geral"
    },
    "reviewer": {
      "model": "claude-sonnet-4-20250514",
      "description": "Especialista em revisão de código"
    },
    "fast": {
      "model": "gpt-4o-mini",
      "description": "Tarefas rápidas e perguntas simples"
    }
  }
}
```

### Agente com Prompt Personalizado

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Engenheiro de software sênior",
      "prompt": "Você é um engenheiro de software sênior com mais de 10 anos de experiência. Foque em código limpo e manutenível. Sempre considere casos extremos e tratamento de erros."
    }
  }
}
```

---

## Configurando Provedores

Provedores definem como o OpenCode se conecta a serviços LLM.

### OpenAI

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o"
    }
  }
}
```

### Anthropic

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "model": "claude-sonnet-4-20250514"
    }
  }
}
```

### Múltiplos Provedores

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    },
    "google": {
      "apiKey": "${GOOGLE_API_KEY}"
    }
  }
}
```

---

## Configurando Permissões

Permissões controlam quais ações os agentes podem realizar.

### Permissões Básicas

```json
{
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *", "pip *"],
      "deny": ["rm -rf /", "sudo *"]
    },
    {
      "tool": "write",
      "allow": ["src/**", "docs/**"],
      "deny": [".env", "secrets/**"]
    }
  ]
}
```

### Regras de Permissão

| Regra | Descrição |
|-------|-----------|
| `tool` | A ferramenta a ser controlada |
| `allow` | Padrões que são permitidos |
| `deny` | Padrões que são bloqueados |
| Ordem | Regras de negação são verificadas primeiro |

---

## Configurando Habilidades

Habilidades são pacotes de instruções reutilizáveis.

```json
{
  "skills": {
    "react-component": {
      "manifest": "skills/react-component/skill.yaml",
      "autoLoad": true,
      "matchPattern": "react component|jsx"
    },
    "python-helper": {
      "manifest": "skills/python-helper/skill.yaml",
      "autoLoad": false
    }
  }
}
```

| Opção | Descrição |
|-------|-----------|
| `manifest` | Caminho para o arquivo de manifesto da habilidade |
| `autoLoad` | Carregar automaticamente quando o padrão corresponder |
| `matchPattern` | Padrão regex para acionar carregamento automático |

---

## Configurando Servidores MCP

Servidores MCP conectam o OpenCode a ferramentas e serviços externos.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["mcp-server-fs.js"],
      "env": {
        "ALLOWED_PATHS": "/home/user/projects"
      }
    },
    "database": {
      "command": "python",
      "args": ["mcp-server-db.py"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

---

## Exemplo Completo

Aqui está um `opencode.json` completo para um projeto típico:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Assistente de codificação principal",
      "prompt": "Você é um desenvolvedor sênior. Foque em código limpo e testável."
    },
    "reviewer": {
      "model": "claude-sonnet-4-20250514",
      "description": "Especialista em revisão de código"
    }
  },
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  },
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *", "pytest *"],
      "deny": ["rm -rf *", "sudo *"]
    },
    {
      "tool": "write",
      "allow": ["src/**", "tests/**", "docs/**"],
      "deny": [".env", "secrets/**", "*.key"]
    }
  ],
  "skills": {
    "customize-opencode": {
      "manifest": ".opencode/skills/customize-opencode/skill.yaml"
    }
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## Validação

O OpenCode valida sua configuração na inicialização. Erros comuns:

| Erro | Causa | Solução |
|------|-------|---------|
| "Invalid JSON" | Erro de sintaxe | Verifique a formatação JSON |
| "Unknown provider" | Provedor não suportado | Verifique a documentação do provedor |
| "Invalid model" | Nome do modelo incorreto | Verifique se o modelo existe |
| "Permission conflict" | Regras sobrepostas | Revise a ordem das permissões |

---

## Substituição de Variáveis de Ambiente

Use `${VARIABLE_NAME}` para referenciar variáveis de ambiente:

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    }
  }
}
```

Isso mantém dados sensíveis fora dos seus arquivos de configuração.

---

## Practice Questions

```question
{
  "id": "oc-config-q1",
  "type": "multiple-choice",
  "question": "Qual localização de configuração é recomendada para novos projetos?",
  "options": [
    "opencode.json na raiz do projeto",
    ".opencode/config.json",
    "~/.config/opencode/config.json",
    "~/.opencode/config.json"
  ],
  "correct": 1,
  "explanation": ".opencode/config.json é a localização recomendada para novos projetos, pois mantém a configuração organizada e pode ser versionada seletivamente."
}
```

```question
{
  "id": "oc-config-q2",
  "type": "multiple-choice",
  "question": "Como você referencia variáveis de ambiente no opencode.json?",
  "options": [
    "{{VARIABLE}}",
    "$VARIABLE",
    "${VARIABLE}",
    "%VARIABLE%"
  ],
  "correct": 2,
  "explanation": "Use a sintaxe ${VARIABLE_NAME} para referenciar variáveis de ambiente no opencode.json, o que mantém dados sensíveis fora dos arquivos de configuração."
}
```

```question
{
  "id": "oc-config-q3",
  "type": "multiple-choice",
  "question": "O que acontece quando um comando de permissão corresponde a regras de allow e deny ao mesmo tempo?",
  "options": [
    "Allow tem precedência",
    "Deny tem precedência",
    "A primeira regra vence",
    "Um erro é lançado"
  ],
  "correct": 1,
  "explanation": "As regras de deny são verificadas primeiro. Se um comando corresponde a padrões de allow e deny ao mesmo tempo, a regra de deny tem precedência por segurança."
}
```

```question
{
  "id": "oc-config-q4",
  "type": "multiple-choice",
  "question": "O que a opção autoLoad faz para habilidades?",
  "options": [
    "Carrega a habilidade na inicialização",
    "Carrega a habilidade quando o padrão corresponde",
    "Carrega a habilidade manualmente",
    "Desativa a habilidade"
  ],
  "correct": 1,
  "explanation": "Quando autoLoad é true, a habilidade é carregada automaticamente quando a entrada do usuário corresponde ao regex matchPattern."
}
```

```question
{
  "id": "oc-config-q5",
  "type": "multiple-choice",
  "question": "Qual campo é necessário para definir um agente?",
  "options": [
    "model e prompt",
    "model e description",
    "name e version",
    "model e constraints"
  ],
  "correct": 1,
  "explanation": "Um agente requer no mínimo model (qual LLM usar) e description (usado para roteamento). Todos os outros campos são opcionais."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Use `.opencode/config.json` para novos projetos (preferido em relação ao `opencode.json` na raiz)
- Agentes requerem pelo menos os campos `model` e `description`
- Variáveis de ambiente são referenciadas usando a sintaxe `${VARIABLE_NAME}`
- Regras de deny sempre têm precedência sobre regras de allow nas permissões
- Habilidades podem ser carregadas automaticamente quando a entrada do usuário corresponde a um padrão
- Servidores MCP rodam como processos separados e comunicam via JSON-RPC
- OpenCode valida sua configuração na inicialização e reporta erros
