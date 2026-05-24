---
title: "O que é LangGraph?"
description: "Entenda LangGraph, agentes baseados em grafos vs cadeias tradicionais, execução stateful vs stateless, e como LangGraph difere de LangChain."
order: 1
duration: "30 minutos"
difficulty: "iniciante"
---

# O que é LangGraph?

LangGraph é um framework da LangChain para construir **aplicações stateful com múltiplos atores** usando grafos direcionados como abstração central. Cada nó no grafo modifica um estado compartilhado, e as arestas definem o fluxo de execução.

[!WARNING]
LangGraph não é uma ferramenta de DAG de workflow. Nós podem ser revisitados, loops podem se formar, e o estado é preservado entre ciclos. Isso é o que o torna adequado para sistemas agenticos que precisam raciocinar, agir e se adaptar.

---

## Agentes Baseados em Grafos vs Cadeias Tradicionais

### Cadeias Tradicionais

Em LangChain tradicional, você constrói **cadeias lineares** onde cada passo passa sua saída para o próximo:

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

prompt = PromptTemplate.from_template("Tell me about {topic}")
chain = prompt | llm | output_parser
result = chain.invoke({"topic": "AI agents"})
```

Cadeias são **lineares, previsíveis e stateless entre execuções**. Quando uma cadeia completa, todos os dados intermediários são perdidos. Não há conceito de loops, ramificações ou gerenciamento de estado.

### Agentes Baseados em Grafos

LangGraph substitui a cadeia linear por um **grafo** onde:

- **Nós** são funções independentes que podem ler e escrever em um estado compartilhado
- **Arestas** definem qual nó executa em seguida
- **Condições** podem rotear a execução com base no estado atual
- **Loops** permitem que agentes iterem até que uma condição seja atendida

```python
from langgraph.graph import StateGraph
from typing import TypedDict, List

class AgentState(TypedDict):
    messages: List[str]
    agent_decision: str

def analyze(state: AgentState) -> dict:
    decision = decide_next_step(state["messages"])
    return {"agent_decision": decision}

def execute(state: AgentState) -> dict:
    result = perform_action(state["agent_decision"])
    return {"messages": state["messages"] + [result]}

graph = StateGraph(AgentState)
graph.add_node("analyze", analyze)
graph.add_node("execute", execute)
graph.add_edge("analyze", "execute")
graph.set_entry_point("analyze")
graph.set_finish_point("execute")
```

[!SUCCESS]
Grafos oferecem **loops, ramificações, persistência e roteamento dinâmico** — tudo essencial para construir agentes autônomos.

---

## Execução Stateful vs Stateless

### Execução Stateless

Em um sistema stateless, cada invocação é independente. Nenhuma informação persiste entre chamadas:

```python
# Stateless — cada chamada começa do zero
response = llm.invoke("What is 2+2?")
response = llm.invoke("Now add 5")  # O LLM esqueceu a resposta anterior
```

### Execução Stateful

LangGraph mantém um **objeto de estado compartilhado** que persiste através de todos os nós do grafo. Cada nó pode ler o estado completo e retornar atualizações:

```python
class ConversationState(TypedDict):
    messages: List[str]
    turn_count: int

def chatbot(state: ConversationState) -> dict:
    user_msg = get_user_input()
    new_messages = state["messages"] + [user_msg]
    response = llm.invoke("\n".join(new_messages))
    return {
        "messages": new_messages + [response],
        "turn_count": state["turn_count"] + 1
    }
```

O estado flui através de cada nó e é preservado entre ciclos, permitindo **memória, contexto e raciocínio de múltiplas etapas**.

[!NOTE]
O estado no LangGraph **não** é persistido em disco por padrão. Você adiciona persistência via `MemorySaver` ou outros checkpointers (abordado no curso Intermediário).

---

## LangChain vs LangGraph

| Característica | LangChain | LangGraph |
| :--- | :--- | :--- |
| Modelo de execução | Cadeias lineares (DAG) | Grafos cíclicos |
| Gerenciamento de estado | Manual (passar entre etapas) | Automático (estado compartilhado) |
| Loops | Não suportado | Suporte de primeira classe |
| Ramificação | Apenas sequencial | Condicional, paralela |
| Persistência | Não embutida | Via checkpointers |
| Humano-no-loop | Não suportado | Via `interrupt()` |
| Melhor para | Pipelines LLM simples | Workflows agenticos complexos |

### Quando Usar Apenas LangChain

- Você tem um pipeline simples de prompt → LLM → saída
- Nenhuma lógica de loop ou condicional é necessária
- Você não precisa persistir estado intermediário
- Exemplo: sumarização, tradução, Q&A simples

### Quando Usar LangGraph

- Você precisa de agentes que possam raciocinar, agir e observar em um loop
- O fluxo depende de resultados intermediários (roteamento condicional)
- Você precisa de memória, persistência ou humano-no-loop
- Exemplo: agentes de codificação autônomos, assistentes de pesquisa, bots de atendimento

```python
# LangChain: Simples e linear
chain = prompt | llm | parser
result = chain.invoke(input)

# LangGraph: Flexível e stateful
graph = StateGraph(State)
graph.add_node("think", think_node)
graph.add_node("act", act_node)
graph.add_node("observe", observe_node)
graph.add_conditional_edges("think", should_continue, {True: "act", False: END})
graph.add_edge("act", "observe")
graph.add_edge("observe", "think")
app = graph.compile()
result = app.invoke(initial_state)
```

---

## Por que Grafos para Agentes?

Agentes precisam realizar raciocínio de múltiplas etapas, usar ferramentas, interpretar resultados e decidir a próxima ação. Isso naturalmente mapeia para uma **estrutura de grafo**:

1. **Pensar**: O agente analisa o estado atual e decide o que fazer
2. **Agir**: O agente executa uma chamada de ferramenta ou gera uma resposta
3. **Observar**: O agente processa a saída da ferramenta
4. **Loop**: O agente repete até que a tarefa esteja completa

```
Input → [Pensar] → decidir → [Agir] → [Observar] → decidir → [Pensar] → ...
                         ↑                      |
                         └── continuar ──────────┘
                             [Parar] → Output
```

Este loop é a fundação de todo agente ReAct. LangGraph torna trivial implementá-lo.

[!IMPORTANT]
O padrão ReAct (Raciocinar + Agir) é a arquitetura de agente mais comum. A estrutura de grafo do LangGraph é a maneira ideal de implementá-lo — cada turno do loop é uma execução de nó.

---

## Primitivas Principais

LangGraph tem cinco primitivas principais:

| Primitiva | Descrição | Exemplo |
| :--- | :--- | :--- |
| `StateGraph` | A classe construtora de grafos | `StateGraph(AgentState)` |
| `State` | Um dicionário tipado compartilhado entre nós | `class AgentState(TypedDict)` |
| `Node` | Uma função Python que altera o estado | `def my_node(state) -> dict` |
| `Edge` | Uma conexão entre nós | `graph.add_edge("a", "b")` |
| `Condition` | Uma função de roteamento para arestas condicionais | `lambda s: "b" if s["done"] else "c"` |

---

## Instalação

```bash
pip install langgraph langchain-openai
```

[!NOTE]
LangGraph requer Python 3.9+. É compatível com todas as integrações LangChain (LLMs, vector stores, ferramentas, etc.).

Configuração mínima para um primeiro grafo:

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class MyState(TypedDict):
    value: str

def echo(state: MyState) -> dict:
    return {"value": f"Echo: {state['value']}"}

builder = StateGraph(MyState)
builder.add_node("echo", echo)
builder.add_edge(START, "echo")
builder.add_edge("echo", END)
app = builder.compile()

result = app.invoke({"value": "hello"})
print(result["value"])  # Echo: hello
```

---

## Casos de Uso do Mundo Real

### Agente de Atendimento ao Cliente
Um grafo roteia consultas de clientes através de classificação de intenção, busca na base de conhecimento, criação de ticket e escalonamento para humanos.

### Agente de Geração de Código
Um agente que escreve código, executa testes, lê saídas de erro e corrige bugs iterativamente — tudo dentro de um único grafo com um loop.

### Assistente de Pesquisa
Um agente de múltiplas etapas que pesquisa na web, sumariza descobertas, gera relatórios e faz perguntas esclarecedoras quando necessário.

### Orquestrador de Pipeline de Dados
Um grafo que ingere dados, valida, transforma, carrega em um banco de dados e envia notificações — com tratamento de erro em cada etapa.

[!SUCCESS]
LangGraph transforma lógica agentica complexa de código espaguete em uma estrutura de grafo limpa, visual e debugável.

---

## Perguntas de Prática

```question
{
  "id": "lg-beginner-01-q1",
  "type": "multiple-choice",
  "question": "Qual é a principal diferença entre cadeias LangChain e grafos LangGraph?",
  "options": [
    "LangGraph suporta loops e ramificação condicional, cadeias LangChain são lineares",
    "LangChain é mais rápido que LangGraph",
    "LangGraph só funciona com OpenAI, LangChain funciona com qualquer LLM",
    "Não há diferença, são a mesma coisa"
  ],
  "correct": 0,
  "explanation": "LangGraph usa grafos direcionados cíclicos com estado compartilhado, permitindo loops, ramificações e persistência. Cadeias LangChain são lineares e stateless entre etapas."
}
```

```question
{
  "id": "lg-beginner-01-q2",
  "type": "multiple-choice",
  "question": "O que uma função de nó LangGraph recebe e retorna?",
  "options": [
    "Recebe o dicionário de estado completo, retorna um dicionário de atualização parcial",
    "Recebe uma string, retorna uma string",
    "Recebe apenas a nova entrada, não retorna nada",
    "Não recebe nada, altera uma variável global"
  ],
  "correct": 0,
  "explanation": "Cada nó recebe o dicionário de estado compartilhado completo e retorna um dicionário parcial de atualizações que são mescladas ao estado."
}
```

```question
{
  "id": "lg-beginner-01-q3",
  "type": "multiple-choice",
  "question": "Qual classe LangGraph você deve usar para construir agentes stateful?",
  "options": ["Graph", "StateGraph", "AgentGraph", "WorkflowGraph"],
  "correct": 1,
  "explanation": "StateGraph é a classe recomendada para grafos stateful com estado tipado, checkpointing e recursos de produção."
}
```

```question
{
  "id": "lg-beginner-01-q4",
  "type": "multiple-choice",
  "question": "O que é o padrão ReAct?",
  "options": [
    "Um componente React.js para construir UIs",
    "Raciocinar + Agir: um loop de agente onde o agente pensa, age e observa",
    "Uma técnica de otimização de consulta de banco de dados",
    "Uma estratégia de deploy para LangGraph"
  ],
  "correct": 1,
  "explanation": "ReAct (Raciocinar + Agir) é a arquitetura padrão de agente onde o agente raciocina iterativamente sobre a tarefa, toma ações e observa resultados."
}
```

```question
{
  "id": "lg-beginner-01-q5",
  "type": "multiple-choice",
  "question": "LangGraph é mais adequado para qual tipo de aplicação?",
  "options": [
    "Pipelines simples de prompt → LLM → saída",
    "Workflows agenticos complexos com loops, estado e roteamento condicional",
    "Geração de sites estáticos",
    "Processamento de vídeo em tempo real"
  ],
  "correct": 1,
  "explanation": "LangGraph se destaca em workflows agenticos complexos que exigem gerenciamento de estado, loops, ramificação condicional e interação humano-no-loop."
}
```

```question
{
  "id": "lg-beginner-01-q6",
  "type": "multiple-choice",
  "question": "Qual comando instala LangGraph?",
  "options": [
    "pip install langchain",
    "pip install langgraph",
    "npm install langgraph",
    "pip install langgraph-agent"
  ],
  "correct": 1,
  "explanation": "LangGraph é instalado via `pip install langgraph`. Ele se integra com LangChain mas é um pacote separado."
}
```

```question
{
  "id": "lg-beginner-01-q7",
  "type": "multiple-choice",
  "question": "Qual das seguintes NÃO é uma funcionalidade do LangGraph?",
  "options": [
    "Roteamento condicional de arestas",
    "Estado compartilhado entre nós",
    "Servidor web embutido para deploy",
    "Suporte para grafos cíclicos"
  ],
  "correct": 2,
  "explanation": "LangGraph não inclui um servidor web embutido. O deploy é tratado separadamente via LangGraph Platform ou infraestrutura de servidor personalizada."
}
```

```question
{
  "id": "lg-beginner-01-q8",
  "type": "multiple-choice",
  "question": "Como o estado flui em uma aplicação LangGraph?",
  "options": [
    "Cada nó tem seu próprio estado privado",
    "O estado é compartilhado entre todos os nós e atualizado conforme os nós retornam dicionários",
    "O estado é passado via uma variável global",
    "O estado é armazenado em um banco de dados e buscado a cada vez"
  ],
  "correct": 1,
  "explanation": "Todos os nós no grafo compartilham um único objeto de estado. Cada nó recebe o estado completo e retorna atualizações parciais que são mescladas."
}
```

```question
{
  "id": "lg-beginner-01-q9",
  "type": "multiple-choice",
  "question": "O que torna LangGraph adequado para construir agentes autônomos?",
  "options": [
    "Ele tem uma rede neural embutida",
    "Ele suporta loops, gerenciamento de estado e roteamento condicional",
    "Ele faz deploy automaticamente para produção",
    "Ele substitui a necessidade de um LLM"
  ],
  "correct": 1,
  "explanation": "Agentes autônomos precisam fazer loop (pensar-agir-observar), manter estado entre iterações e tomar decisões — tudo que LangGraph suporta nativamente."
}
```

```question
{
  "id": "lg-beginner-01-q10",
  "type": "multiple-choice",
  "question": "O que o método compile() faz em LangGraph?",
  "options": [
    "Faz deploy do grafo para um servidor",
    "Congela a definição do grafo em um objeto executável",
    "Compila código Python em código de máquina",
    "Converte o grafo em uma cadeia LangChain"
  ],
  "correct": 1,
  "explanation": "compile() transforma o construtor StateGraph em um CompiledGraph que pode ser invocado, transmitido e checkpointado."
}
```

---

[!SUCCESS]
### Principais Conclusões
- LangGraph usa grafos direcionados com estado compartilhado para construir agentes
- Grafos suportam loops, ramificação condicional e persistência — ao contrário de cadeias lineares
- O estado flui através de todos os nós; cada nó recebe o estado completo e retorna atualizações parciais
- StateGraph é a classe principal para construir aplicações LangGraph
- O padrão ReAct (raciocinar → agir → observar → loop) é uma adaptação natural para grafos
- LangGraph é instalado via `pip install langgraph` e se integra com todos os componentes LangChain
