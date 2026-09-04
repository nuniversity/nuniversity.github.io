---
title: "Sua Primeira Sessão de Codificação com IA"
description: "Percorra uma sessão completa de codificação assistida por IA usando OpenCode. Aprenda a fazer perguntas, revisar sugestões de código e aplicar alterações ao seu projeto."
order: 3
duration: "45 min"
difficulty: "beginner"
---

# Sua Primeira Sessão de Codificação com IA

## Iniciando uma Sessão

Inicie o OpenCode no diretório do seu projeto:

```bash
cd seu-projeto
opencode
```

O agente de IA detectará automaticamente o tipo do seu projeto e fornecerá assistência relevante.

---

## Entendendo a Interface

```
OpenCode v1.x.x
Connected to: gpt-4o
Project: seu-projeto
>
```

| Elemento | Descrição |
|----------|-----------|
| `>` prompt | Pronto para sua entrada |
| `Connected to:` | Mostra o provedor LLM ativo |
| `Project:` | Diretório de trabalho atual |

### Comandos de Entrada

| Comando | Ação |
|---------|------|
| Digitar mensagem | Enviar para IA |
| `/help` | Mostrar comandos disponíveis |
| `/quit` ou `/exit` | Sair do OpenCode |
| `/clear` | Limpar conversa |
| `/history` | Mostrar histórico de conversas |

---

## Exemplo de Sessão: Corrigindo um Bug

Vamos percorrer um cenário do mundo real — corrigindo um bug em uma função Python.

### Passo 1: Descrever o Problema

```
> Tenho uma função que calcula a média de uma lista, mas ela está retornando 
  resultados errados para listas vazias. Você pode me ajudar a corrigi-la?
```

### Passo 2: Compartilhar o Código

```
> Aqui está a função:
  
  def calculate_average(numbers):
      total = sum(numbers)
      return total / len(numbers)
```

### Passo 3: Obter a Correção

A IA analisará seu código e sugerirá:

```
O problema é que dividir por zero (quando a lista está vazia) lança um 
ZeroDivisionError. Aqui está a versão corrigida:

def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
```

### Passo 4: Aplicar a Alteração

```
> Você pode aplicar esta correção ao meu arquivo em src/utils.py?
```

O OpenCode usará a ferramenta `edit` para atualizar seu arquivo.

---

## Trabalhando com Arquivos

### Lendo Arquivos

```
> Leia o conteúdo de src/main.py
```

O OpenCode usa a ferramenta `read` para buscar o conteúdo dos arquivos e exibi-los.

### Buscando em Arquivos

```
> Encontre todos os arquivos Python que importam requests
```

O OpenCode usa `grep` para buscar conteúdo em arquivos.

```
> Encontre todos os arquivos de configuração neste projeto
```

O OpenCode usa `glob` para encontrar arquivos por padrão.

### Criando Arquivos

```
> Crie um novo arquivo Python em src/helpers.py com uma função para validar endereços de email
```

O OpenCode usa a ferramenta `write` para criar novos arquivos.

---

## Melhores Práticas para Prompts

### Seja Específico

| ❌ Vago | ✅ Específico |
|---------|--------------|
| "Corrija meu código" | "Corrija o ZeroDivisionError em calculate_average() quando a lista está vazia" |
| "Adicione uma função" | "Adicione uma função Python que valida endereços de email usando regex" |
| "Otimize isso" | "Otimize esta consulta SQL para usar um índice em vez de varredura completa da tabela" |

### Forneça Contexto

```
> Estou trabalhando em uma API REST Django. O modelo User tem campos: id, email, 
  name, created_at. Preciso de uma função para verificar se um usuário está ativo 
  (criado nos últimos 30 dias).
```

### Faça Perguntas de Acompanhamento

```
> Você pode explicar por que usou datetime.timedelta em vez de dateutil.relativedelta?
```

---

## Usando Ferramentas Efetivamente

### A Ferramenta read

```
> Leia src/config.py e explique o que cada configuração faz
```

### A Ferramenta bash

```
> Execute os testes no meu projeto usando pytest
```

### A Ferramenta grep

```
> Busque todos os comentários TODO no código-fonte
```

### A Ferramenta glob

```
> Encontre todos os arquivos JavaScript no diretório src/components
```

---

## Tratando Erros

### Quando a IA Não Entende

```
> Preciso melhorar a coisa
```

Se a IA pedir esclarecimentos, forneça mais detalhes:

```
> Desculpe, quero dizer que preciso otimizar a consulta de banco de dados no UserViewSet 
  para reduzir o número de consultas de 5 para 1.
```

### Quando a IA Comete Erros

```
> Isso não está totalmente correto. A função deve retornar uma tupla de (média, contagem), 
  não apenas a média.
```

---

## Salvando e Carregando Sessões

### Salvar Sessão

```
> /save minha-sessao
```

### Carregar Sessão

```
> /load minha-sessao
```

### Ver Histórico

```
> /history
```

---

## Practice Questions

```question
{
  "id": "oc-first-q1",
  "type": "multiple-choice",
  "question": "Qual comando limpa o histórico de conversas no OpenCode?",
  "options": [
    "/clear",
    "/reset",
    "/new",
    "/empty"
  ],
  "correct": 0,
  "explanation": "O comando /clear limpa a conversa atual enquanto mantém a sessão."
}
```

```question
{
  "id": "oc-first-q2",
  "type": "multiple-choice",
  "question": "Qual ferramenta o OpenCode usa para buscar padrões de texto em arquivos?",
  "options": [
    "bash",
    "read",
    "grep",
    "glob"
  ],
  "correct": 2,
  "explanation": "A ferramenta grep busca conteúdo em arquivos usando expressões regulares, tornando-a ideal para encontrar padrões de texto como comentários TODO."
}
```

```question
{
  "id": "oc-first-q3",
  "type": "multiple-choice",
  "question": "Qual é a melhor forma de pedir ao OpenCode para corrigir um bug específico?",
  "options": [
    "Corrija meu código",
    "Corrija o ZeroDivisionError em calculate_average() quando a lista está vazia",
    "Faça funcionar",
    "Depure isso"
  ],
  "correct": 1,
  "explanation": "Prompts específicos que incluem o tipo de erro, nome da função e condições ajudam a IA a fornecer correções precisas."
}
```

```question
{
  "id": "oc-first-q4",
  "type": "multiple-choice",
  "question": "Qual ferramenta cria novos arquivos no OpenCode?",
  "options": [
    "read",
    "write",
    "edit",
    "bash"
  ],
  "correct": 1,
  "explanation": "A ferramenta write cria novos arquivos ou sobrescreve completamente os existentes com novo conteúdo."
}
```

```question
{
  "id": "oc-first-q5",
  "type": "multiple-choice",
  "question": "Como você sai de uma sessão do OpenCode?",
  "options": [
    "Ctrl+C",
    "/quit ou /exit",
    "/stop",
    "close"
  ],
  "correct": 1,
  "explanation": "Use os comandos /quit ou /exit para sair graciosamente de uma sessão do OpenCode."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Inicie o OpenCode no diretório do seu projeto para assistência consciente do contexto
- Seja específico em seus prompts — inclua tipos de erro, nomes de arquivos e comportamento esperado
- OpenCode usa ferramentas (read, write, edit, grep, glob, bash) para interagir com seu projeto
- Você pode salvar e carregar sessões para continuidade
- Faça perguntas de acompanhamento para entender o raciocínio da IA
- A IA pedirá esclarecimentos quando os prompts forem vagos demais
