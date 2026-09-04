---
title: "Instalação e Primeira Configuração"
description: "Instale o OpenCode em seu sistema e configure-o com seu primeiro provedor LLM. Configure chaves de API, verifique a instalação e execute seu primeiro comando."
order: 2
duration: "30 min"
difficulty: "beginner"
---

# Instalação e Primeira Configuração

## Pré-requisitos

Antes de instalar o OpenCode, certifique-se de ter:

| Requisito | Versão Mínima | Como Verificar |
|-----------|---------------|----------------|
| Node.js | 18.0+ | `node --version` |
| npm | 8.0+ | `npm --version` |
| Git | 2.0+ | `git --version` |

> [!NOTE]
> OpenCode é uma aplicação Node.js distribuída via npm. Ele executa em macOS, Linux e Windows.

---

## Instalação

### Usando npm (Recomendado)

```bash
npm install -g opencode
```

### Usando yarn

```bash
yarn global add opencode
```

### Usando pnpm

```bash
pnpm add -g opencode
```

### Verificar Instalação

```bash
opencode --version
```

Saída esperada:
```
opencode v1.x.x
```

> [!TIP]
> Se você vir "command not found", certifique-se de que o diretório global do npm está em seu PATH.

---

## Configuração Inicial

### Passo 1: Criar Diretório de Configuração

```bash
mkdir -p .opencode
```

### Passo 2: Criar opencode.json

Crie `opencode.json` na raiz do seu projeto:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Assistente de codificação de propósito geral"
    }
  }
}
```

### Passo 3: Configurar Chaves de API

Crie um arquivo `.env` na raiz do seu projeto:

```bash
# OpenAI
OPENAI_API_KEY=sk-sua-chave-api-aqui

# Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-sua-chave-api-aqui

# Google (opcional)
GOOGLE_API_KEY=sua-chave-api-google-aqui
```

> [!WARNING]
> Nunca comprometa chaves de API no controle de versão. Adicione `.env` ao seu arquivo `.gitignore`.

---

## Configuração de Provedores

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

### Google

```json
{
  "providers": {
    "google": {
      "apiKey": "${GOOGLE_API_KEY}",
      "model": "gemini-pro"
    }
  }
}
```

---

## Primeira Execução

### Iniciar OpenCode

```bash
opencode
```

Você deve ver:

```
OpenCode v1.x.x
Type your message or /help for commands
>
```

### Testar a Conexão

Digite uma mensagem simples:

```
> Olá, você pode me ajudar com meu código?
```

Se bem-sucedido, a IA responderá com uma saudação e perguntará como pode ajudar.

---

## Localizações de Arquivos de Configuração

O OpenCode procura configuração nesta ordem:

| Prioridade | Localização | Finalidade |
|------------|-------------|------------|
| 1 | `.opencode/config.json` | Específico do projeto (preferido) |
| 2 | `opencode.json` | Específico do projeto (legado) |
| 3 | `~/.config/opencode/config.json` | Padrões do usuário |

> [!TIP]
> Use `.opencode/config.json` para projetos em equipe. Você pode versionar seletivamente enquanto mantém dados sensíveis em `.env`.

---

## Comandos Básicos

| Comando | Descrição |
|---------|-----------|
| `opencode` | Iniciar sessão interativa |
| `opencode --version` | Mostrar versão |
| `opencode --help` | Mostrar ajuda |
| `opencode config` | Abrir configuração |
| `opencode providers` | Listar provedores disponíveis |

---

## Solução de Problemas

### Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| "Command not found" | npm PATH não configurado | Execute `npm config get prefix` e adicione ao PATH |
| "Invalid API key" | Formato de chave incorreto | Verifique se a chave começa com `sk-` (OpenAI) ou `sk-ant-` (Anthropic) |
| "Rate limit exceeded" | Muitas solicitações | Aguarde ou atualize seu plano de API |
| "Model not found" | Nome do modelo incorreto | Verifique a documentação do provedor para nomes de modelos válidos |

---

## Practice Questions

```question
{
  "id": "oc-install-q1",
  "type": "multiple-choice",
  "question": "Qual é a versão mínima do Node.js necessária para o OpenCode?",
  "options": [
    "14.0+",
    "16.0+",
    "18.0+",
    "20.0+"
  ],
  "correct": 2,
  "explanation": "O OpenCode requer a versão 18.0 ou superior do Node.js para desempenho e compatibilidade ideais."
}
```

```question
{
  "id": "oc-install-q2",
  "type": "multiple-choice",
  "question": "Onde você deve armazenar as chaves de API para o OpenCode?",
  "options": [
    "No arquivo opencode.json",
    "Em variáveis de ambiente ou arquivo .env",
    "Em um arquivo config.json",
    "Diretamente no seu código"
  ],
  "correct": 1,
  "explanation": "As chaves de API devem ser armazenadas em variáveis de ambiente ou em um arquivo .env, nunca em código ou arquivos de configuração que possam ser comprometidos no controle de versão."
}
```

```question
{
  "id": "oc-install-q3",
  "type": "multiple-choice",
  "question": "Qual localização de arquivo de configuração é recomendada para projetos em equipe?",
  "options": [
    "opencode.json na raiz do projeto",
    ".opencode/config.json",
    "~/.config/opencode/config.json",
    "~/.opencode/config.json"
  ],
  "correct": 1,
  "explanation": ".opencode/config.json é preferido para projetos em equipe porque pode ser versionado seletivamente enquanto mantém dados sensíveis separados."
}
```

```question
{
  "id": "oc-install-q4",
  "type": "multiple-choice",
  "question": "Qual comando inicia uma sessão interativa do OpenCode?",
  "options": [
    "opencode start",
    "opencode run",
    "opencode",
    "opencode init"
  ],
  "correct": 2,
  "explanation": "Executar 'opencode' sem argumentos inicia uma sessão interativa onde você pode digitar mensagens e receber respostas da IA."
}
```

```question
{
  "id": "oc-install-q5",
  "type": "multiple-choice",
  "question": "Quais gerenciadores de pacotes podem ser usados para instalar o OpenCode?",
  "options": [
    "Apenas npm",
    "Apenas npm e yarn",
    "npm, yarn e pnpm",
    "pip e npm"
  ],
  "correct": 2,
  "explanation": "O OpenCode pode ser instalado usando npm, yarn ou pnpm — todos os três são gerenciadores de pacotes suportados."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- OpenCode requer Node.js 18+ e pode ser instalado via npm, yarn ou pnpm
- A configuração é armazenada em `opencode.json` ou `.opencode/config.json`
- Chaves de API devem ser armazenadas em variáveis de ambiente ou arquivos `.env`
- A localização `.opencode/config.json` é preferida para projetos em equipe
- Execute `opencode` para iniciar uma sessão interativa
- Múltiplos provedores LLM (OpenAI, Anthropic, Google) são suportados
