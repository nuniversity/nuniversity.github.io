---
title: "Entendendo a Interface CLI"
description: "Domine a interface de linha de comando do OpenCode. Aprenda todos os comandos, flags, opções disponíveis e como navegar na sessão interativa de forma eficaz."
order: 4
duration: "30 min"
difficulty: "beginner"
---

# Entendendo a Interface CLI

## Estrutura de Comandos

O OpenCode segue uma estrutura CLI padrão:

```bash
opencode [comando] [opções] [argumentos]
```

---

## Comandos Principais

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `opencode` | Iniciar sessão interativa | `opencode` |
| `opencode chat` | Iniciar sessão de chat | `opencode chat` |
| `opencode run` | Executar um único prompt | `opencode run "corrija o bug"` |
| `opencode config` | Gerenciar configuração | `opencode config list` |
| `opencode providers` | Listar provedores LLM | `opencode providers` |
| `opencode skills` | Listar habilidades disponíveis | `opencode skills` |
| `opencode version` | Mostrar versão | `opencode --version` |

---

## Comandos de Sessão Interativa

Uma vez em uma sessão interativa, use estes comandos:

### Navegação

| Comando | Descrição |
|---------|-----------|
| `/help` | Mostrar todos os comandos disponíveis |
| `/quit` ou `/exit` | Sair do OpenCode |
| `/clear` | Limpar conversa atual |
| `/history` | Ver histórico de conversas |
| `/save [nome]` | Salvar sessão em arquivo |
| `/load [nome]` | Carregar sessão salva |

### Gerenciamento de Sessão

| Comando | Descrição |
|---------|-----------|
| `/model [nome]` | Alternar modelo LLM |
| `/agent [nome]` | Alternar agente |
| `/skill [nome]` | Carregar uma habilidade específica |
| `/debug` | Ativar/desativar modo de depuração |
| `/verbose` | Ativar/desativar saída detalhada |

---

## Opções de Linha de Comando

### Opções Globais

| Opção | Descrição |
|-------|-----------|
| `-h, --help` | Mostrar ajuda |
| `-v, --version` | Mostrar versão |
| `-c, --config [caminho]` | Especificar arquivo de configuração |
| `-p, --provider [nome]` | Definir provedor LLM |
| `-m, --model [nome]` | Definir modelo |
| `--debug` | Ativar modo de depuração |
| `--verbose` | Ativar saída detalhada |

### Opções do Comando Run

| Opção | Descrição |
|-------|-----------|
| `-f, --file [caminho]` | Ler entrada de arquivo |
| `-o, --output [caminho]` | Gravar saída em arquivo |
| `--no-color` | Desativar saída colorida |
| `--timeout [ms]` | Definir tempo limite em milissegundos |

---

## Padrões de Uso Exemplos

### Execução de Único Prompt

```bash
opencode run "Explique o que esta função faz"
```

### Ler de Arquivo

```bash
opencode run -f pergunta.txt
```

### Gravar em Arquivo

```bash
opencode run -o resposta.md "Escreva um README para este projeto"
```

### Modo de Depuração

```bash
opencode --debug
```

A saída de depuração mostra:
- Solicitações e respostas da API
- Invocações de ferramentas
- Verificações de permissão
- Decisões de roteamento de agentes

---

## Autocomplete por Tab

O OpenCode suporta autocomplete por tab para:

- Comandos (`/he` → `/help`)
- Caminhos de arquivo (`/read src/ma` → `/read src/main.py`)
- Nomes de modelos (`/model gpt` → `/model gpt-4o`)

---

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Enter` | Enviar mensagem |
| `Ctrl+C` | Cancelar operação atual |
| `Ctrl+D` | Sair da sessão |
| `Ctrl+L` | Limpar tela |
| `Seta para Cima` | Comando anterior |
| `Seta para Baixo` | Próximo comando |
| `Tab` | Autocompletar |

---

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `OPENCODE_CONFIG` | Caminho para arquivo de configuração |
| `OPENCODE_PROVIDER` | Provedor LLM padrão |
| `OPENCODE_MODEL` | Modelo padrão |
| `OPENCODE_DEBUG` | Ativar modo de depuração |
| `OPENAI_API_KEY` | Chave de API OpenAI |
| `ANTHROPIC_API_KEY` | Chave de API Anthropic |
| `GOOGLE_API_KEY` | Chave de API Google |

---

## Practice Questions

```question
{
  "id": "oc-cli-q1",
  "type": "multiple-choice",
  "question": "Qual comando executa o OpenCode com um único prompt sem entrar no modo interativo?",
  "options": [
    "opencode start",
    "opencode exec",
    "opencode run",
    "opencode once"
  ],
  "correct": 2,
  "explanation": "O comando 'opencode run' executa um único prompt e retorna o resultado sem iniciar uma sessão interativa."
}
```

```question
{
  "id": "oc-cli-q2",
  "type": "multiple-choice",
  "question": "Qual opção ativa o modo de depuração pela linha de comando?",
  "options": [
    "--verbose",
    "--debug",
    "--trace",
    "--log"
  ],
  "correct": 1,
  "explanation": "A flag --debug ativa o modo de depuração, que mostra informações detalhadas sobre solicitações de API, invocações de ferramentas e decisões de roteamento."
}
```

```question
{
  "id": "oc-cli-q3",
  "type": "multiple-choice",
  "question": "Como você altera modelos durante uma sessão interativa?",
  "options": [
    "/use nome-do-modelo",
    "/switch nome-do-modelo",
    "/model nome-do-modelo",
    "/set model nome-do-modelo"
  ],
  "correct": 2,
  "explanation": "O comando /model alterna o modelo ativo durante uma sessão interativa."
}
```

```question
{
  "id": "oc-cli-q4",
  "type": "multiple-choice",
  "question": "Qual atalho de teclado cancela a operação atual?",
  "options": [
    "Ctrl+Z",
    "Ctrl+C",
    "Ctrl+X",
    "Esc"
  ],
  "correct": 1,
  "explanation": "Ctrl+C cancela a operação atual, o que é útil quando uma resposta da IA está demorando muito."
}
```

```question
{
  "id": "oc-cli-q5",
  "type": "multiple-choice",
  "question": "O que a flag -f faz no comando run?",
  "options": [
    "Define o formato de saída",
    "Lê entrada de um arquivo",
    "Filtra a saída",
    "Força substituição"
  ],
  "correct": 1,
  "explanation": "A flag -f lê entrada de um arquivo em vez de exigir que você digite o prompt diretamente."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- OpenCode suporta tanto modos interativos quanto de execução de único prompt
- Use `/help` no modo interativo para ver todos os comandos disponíveis
- A flag `--debug` mostra informações detalhadas sobre operações de IA
- Autocomplete por tab funciona para comandos, caminhos de arquivos e nomes de modelos
- Variáveis de ambiente podem configurar padrões para provedor e modelo
- Atalhos de teclado fornecem acesso rápido a ações comuns
- A flag `-f` permite ler prompts de arquivos para processamento em lote
