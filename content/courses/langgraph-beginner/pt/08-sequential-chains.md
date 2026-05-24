---
title: "Cadeias Sequenciais"
description: "Aprenda padrões de execução sequencial em LangGraph, passando estado entre nós e usando redutores de estado para gerenciamento avançado de estado."
order: 8
duration: "35 minutos"
difficulty: "iniciante"
---

# Cadeias Sequenciais

Embora LangGraph suporte topologias de grafo complexas, muitas aplicações são construídas sobre **cadeias sequenciais** simples — uma sequência linear de nós onde cada etapa constrói sobre a anterior.

---

## Execução Sequencial em LangGraph

Uma cadeia sequencial é um pipeline linear: cada nó executa após o anterior ser concluído, passando estado ao longo do caminho.

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class PipelineState(TypedDict):
    input_text: str
    cleaned: str
    analyzed: str
    result: str

def clean(state: PipelineState) -> dict:
    return {"cleaned": state["input_text"].strip().lower()}

def analyze(state: PipelineState) -> dict:
    analysis = f"Análise de '{state['cleaned']}': {len(state['cleaned'])} caracteres"
    return {"analyzed": analysis}

def format(state: PipelineState) -> dict:
    return {"result": f"=== RESULTADO ===\n{state['analyzed']}\n=== FIM ==="}

builder = StateGraph(PipelineState)
builder.add_node("clean", clean)
builder.add_node("analyze", analyze)
builder.add_node("format", format)
builder.add_edge(START, "clean")
builder.add_edge("clean", "analyze")
builder.add_edge("analyze", "format")
builder.add_edge("format", END)
app = builder.compile()
```

[!NOTE]
Cada nó lê apenas os campos de que precisa do estado e escreve os campos que produz. A topologia do pipeline garante que eles executem na ordem correta.

---

## Passando Estado Entre Nós

O estado flui automaticamente. Quando o nó A escreve `{"cleaned": valor}`, o nó B pode ler `state["cleaned"]`. Este é o mecanismo central para comunicação entre nós.

```python
def node_a(state: State) -> dict:
    # Escreve no estado
    return {"intermediate": "Processado por A"}

def node_b(state: State) -> dict:
    # Lê do estado (escrito pelo node_a)
    intermediate = state["intermediate"]  # "Processado por A"
    return {"result": f"B recebeu: {intermediate}"}
```

### Regras de Fluxo de Estado

| Cenário | Comportamento |
| :--- | :--- |
| A escreve chave X, B lê X | B vê o valor de A |
| B escreve chave X depois de A | O valor de A é sobrescrito |
| C escreve chave Y, D não toca em Y | D vê o valor de C para Y |
| Nenhum nó escreve chave Y | Y mantém seu valor inicial |

---

## Exemplo de Pipeline Sequencial: Processador de Documentos

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict
from typing import List

llm = ChatOpenAI(model="gpt-4o-mini")

class DocState(TypedDict):
    raw_text: str
    cleaned_text: str
    summary: str
    bullet_points: List[str]
    final_doc: str

def clean_text(state: DocState) -> dict:
    cleaned = state["raw_text"].strip()
    # Remove espaços extras
    import re
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return {"cleaned_text": cleaned}

def summarize(state: DocState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Resuma o texto a seguir em 2-3 frases."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    summary = chain.invoke({"text": state["cleaned_text"]})
    return {"summary": summary}

def extract_bullets(state: DocState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extraia 5 pontos principais do texto como uma lista numerada."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    bullets_text = chain.invoke({"text": state["cleaned_text"]})
    bullets = [b.strip() for b in bullets_text.split("\n") if b.strip()]
    return {"bullet_points": bullets}

def format_document(state: DocState) -> dict:
    doc = f"""# Resumo
{state['summary']}

# Pontos Principais
{chr(10).join(f'- {b}' for b in state['bullet_points'])}
"""
    return {"final_doc": doc}

builder = StateGraph(DocState)
builder.add_node("clean", clean_text)
builder.add_node("summarize", summarize)
builder.add_node("bullets", extract_bullets)
builder.add_node("format", format_document)

builder.add_edge(START, "clean")
builder.add_edge("clean", "summarize")
builder.add_edge("summarize", "bullets")
builder.add_edge("bullets", "format")
builder.add_edge("format", END)

app = builder.compile()
```

[!SUCCESS]
Este é um pipeline do mundo real: limpar → resumir → extrair pontos → formatar. Cada etapa é um nó separado e testável.

---

## Redutores de Estado

Por padrão, quando um nó escreve em uma chave de estado, ele **substitui** o valor. Redutores de estado mudam este comportamento.

### O Redutor Padrão: Substituir

```python
def node_a(state: State) -> dict:
    return {"messages": ["Olá"]}    # Substitui messages

def node_b(state: State) -> dict:
    return {"messages": ["Mundo"]}    # Substitui messages (perde "Olá")
```

### O Redutor Add: Anexar

Use `Annotated` com `add` para anexar a listas em vez de substituir:

```python
from typing import Annotated
from typing_extensions import TypedDict
from operator import add

class AccumState(TypedDict):
    messages: Annotated[list, add]  # Anexa em vez de substituir
    total: int

def step_1(state: AccumState) -> dict:
    return {"messages": ["Etapa 1 concluída"], "total": 10}

def step_2(state: AccumState) -> dict:
    return {"messages": ["Etapa 2 concluída"], "total": state["total"] + 20}

# Resultado: messages = ["Etapa 1 concluída", "Etapa 2 concluída"]
# Resultado: total = 30 (sem redutor — última escrita vence)
```

[!WARNING]
O redutor `add` só funciona com listas. Ele usa o operador `+` do Python, então ambos os lados devem ser listas. Se precisar de lógica de mesclagem personalizada, defina um redutor customizado (abordado no curso Intermediário).

---

## Sequencial Paralelo: Fan-Out

Às vezes você quer processamento sequencial com ramificações paralelas:

```python
def validate(state: State) -> dict:
    return {"validated": True}

def search_web(state: State) -> dict:
    return {"web_results": "..."}

def search_db(state: State) -> dict:
    return {"db_results": "..."}

def merge(state: State) -> dict:
    combined = f"Web: {state['web_results']}\nDB: {state['db_results']}"
    return {"merged": combined}

builder.add_edge(START, "validate")
builder.add_edge("validate", "search_web")
builder.add_edge("validate", "search_db")  # Executa em paralelo ao search_web
builder.add_edge("search_web", "merge")
builder.add_edge("search_db", "merge")     # Merge espera ambos
builder.add_edge("merge", END)
```

[!SUCCESS]
Fan-out com ramificações paralelas, depois fan-in para mesclar resultados. Este padrão combina o poder de cadeias sequenciais com processamento paralelo.

---

## Cadeia Sequencial com Condicionais

Insira pontos de decisão em sua cadeia sequencial:

```python
def check_quality(state: State) -> str:
    if len(state.get("errors", [])) > 0:
        return "fix_errors"
    return "continue"

builder.add_edge(START, "process")
builder.add_edge("process", "validate")
builder.add_conditional_edges("validate", check_quality, {
    "fix_errors": "error_handler",
    "continue": "finalize"
})
builder.add_edge("error_handler", "process")  # Loop de volta para tentar novamente
builder.add_edge("finalize", END)
```

---

## Comparando Cadeias Sequenciais: LangChain vs LangGraph

| Aspecto | LangChain Chain | LangGraph Sequencial |
| :--- | :--- | :--- |
| Definição | `chain = A \| B \| C` | `add_edge(A, B); add_edge(B, C)` |
| Passagem de estado | Cada saída é a próxima entrada | Objeto de estado compartilhado |
| Acesso intermediário | Perdido após a chain executar | Disponível no estado |
| Depuração | Difícil (internos do pipeline) | Fácil (streaming por nó) |
| Adicionar etapas | Requer reconstrução da chain | Apenas adicionar edge |
| Recuperação de erros | Chain falha completamente | Tratamento por nó |

---

## Redutor de Estado: Merge para Dicionários

```python
from typing import Annotated
from typing_extensions import TypedDict

def merge_dicts(a: dict, b: dict) -> dict:
    """Redutor personalizado que mescla dicionários profundamente."""
    result = a.copy()
    for k, v in b.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = merge_dicts(result[k], v)
        else:
            result[k] = v
    return result

class NestedState(TypedDict):
    metadata: Annotated[dict, merge_dicts]
    logs: Annotated[list, add]

def node_a(state: NestedState) -> dict:
    return {"metadata": {"step": "a", "timestamp": "2024-01-01"}}

def node_b(state: NestedState) -> dict:
    return {"metadata": {"status": "done"}, "logs": ["Etapa B executada"]}
# Metadata final: {"step": "a", "timestamp": "2024-01-01", "status": "done"}
```

---

## Perguntas de Prática

```question
{
  "id": "lg-beginner-08-q1",
  "type": "multiple-choice",
  "question": "Como o estado flui em uma cadeia sequencial do LangGraph?",
  "options": [
    "Cada nó tem seu próprio estado isolado",
    "O estado é compartilhado — cada nó lê escritas anteriores e adiciona as suas",
    "O estado é resetado entre cada nó",
    "O estado flui para trás, do último nó para o primeiro"
  ],
  "correct": 1,
  "explanation": "Todos os nós compartilham um único objeto de estado. Cada nó lê valores escritos por nós anteriores e escreve novos valores."
}
```

```question
{
  "id": "lg-beginner-08-q2",
  "type": "multiple-choice",
  "question": "Qual é o comportamento padrão quando dois nós escrevem na mesma chave de estado?",
  "options": [
    "Os valores são anexados",
    "Os valores são mesclados",
    "A última escrita vence (substitui a anterior)",
    "Um erro é lançado"
  ],
  "correct": 2,
  "explanation": "A atualização padrão de estado é substituir — o último nó a escrever uma chave determina seu valor final."
}
```

```question
{
  "id": "lg-beginner-08-q3",
  "type": "multiple-choice",
  "question": "Como fazer um campo de lista anexar em vez de substituir?",
  "options": [
    "Use Annotated[list, add] na definição de estado",
    "Chame list.append() no nó",
    "Defina reducer='append' no campo",
    "Listas sempre anexam por padrão"
  ],
  "correct": 0,
  "explanation": "Annotated[list, add] usa o redutor operator.add para anexar entradas à lista em vez de substituir."
}
```

```question
{
  "id": "lg-beginner-08-q4",
  "type": "multiple-choice",
  "question": "O que acontece quando duas arestas apontam para o mesmo nó (fan-in)?",
  "options": [
    "O nó executa duas vezes",
    "O nó executa uma vez depois que ambos os nós de entrada são concluídos",
    "Apenas a primeira entrada que chega é usada",
    "Um erro é lançado"
  ],
  "correct": 1,
  "explanation": "Fan-in: o nó alvo espera que todos os nós de entrada sejam concluídos, então recebe o estado mesclado."
}
```

```question
{
  "id": "lg-beginner-08-q5",
  "type": "multiple-choice",
  "question": "Em uma cadeia sequencial, quando o próximo nó começa?",
  "options": [
    "Imediatamente após o nó anterior começar",
    "Após o nó anterior ser concluído e retornar suas atualizações",
    "Após um atraso de tempo fixo",
    "Quando acionado manualmente"
  ],
  "correct": 1,
  "explanation": "Cada nó espera o anterior ser concluído. A execução é estritamente ordenada pelas arestas."
}
```

```question
{
  "id": "lg-beginner-08-q6",
  "type": "multiple-choice",
  "question": "Qual vantagem uma cadeia sequencial do LangGraph tem sobre uma chain pipe do LangChain?",
  "options": [
    "LangGraph é mais rápido",
    "O estado intermediário é acessível e depurável entre os nós",
    "LangGraph suporta mais LLMs",
    "Não há vantagem"
  ],
  "correct": 1,
  "explanation": "LangGraph mantém todo o estado intermediário entre os nós, tornando-o depurável, inspecionável e recuperável."
}
```

```question
{
  "id": "lg-beginner-08-q7",
  "type": "multiple-choice",
  "question": "Se o nó A escreve 'key1' e o nó B escreve 'key2', o nó C pode ler ambos?",
  "options": [
    "Sim, o estado contém todas as chaves de todos os nós",
    "Não, cada nó vê apenas suas próprias escritas",
    "Apenas se C solicitá-los explicitamente",
    "Não, o estado é escopo por nó"
  ],
  "correct": 0,
  "explanation": "O estado acumula todas as chaves de todos os nós. O nó C pode ler tanto key1 quanto key2."
}
```

```question
{
  "id": "lg-beginner-08-q8",
  "type": "multiple-choice",
  "question": "Qual operador o redutor 'add' usa para listas?",
  "options": ["+ (concatenação)", "append()", "extend()", "merge()"],
  "correct": 0,
  "explanation": "O redutor 'add' usa o operador + do Python, então ambos os operandos devem ser listas que são concatenadas."
}
```

```question
{
  "id": "lg-beginner-08-q9",
  "type": "multiple-choice",
  "question": "Ao construir um padrão fan-out que converge de volta (fan-in), que ordenação de nós é garantida?",
  "options": [
    "Todas as ramificações executam sequencialmente",
    "Todas as ramificações executam em paralelo, merge espera todas serem concluídas",
    "Apenas a ramificação mais rápida é usada",
    "Ramificações executam em ordem alfabética"
  ],
  "correct": 1,
  "explanation": "Fan-out executa ramificações em paralelo (em threads separadas). O nó fan-in espera todas as ramificações serem concluídas antes de executar."
}
```

```question
{
  "id": "lg-beginner-08-q10",
  "type": "multiple-choice",
  "question": "Qual é o melhor caso de uso para uma cadeia sequencial em LangGraph?",
  "options": [
    "Processamento paralelo de dados",
    "Pipelines lineares onde cada etapa depende da anterior",
    "Roteamento complexo com lógica condicional",
    "Comunicação multi-agente"
  ],
  "correct": 1,
  "explanation": "Cadeias sequenciais se destacam em pipelines lineares onde a etapa B depende da saída da etapa A, como limpar → analisar → formatar."
}
```

---

[!SUCCESS]
### Principais Conclusões
- Cadeias sequenciais são pipelines lineares: cada nó executa após o anterior
- O estado passa automaticamente entre nós através do objeto de estado compartilhado
- A atualização padrão de estado é substituir; use Annotated[list, add] para anexar
- Fan-out permite paralelização; fan-in sincroniza ramificações paralelas
- Cadeias sequenciais em LangGraph oferecem melhor depuração que chains pipe do LangChain
- Redutores de estado controlam como múltiplas escritas na mesma chave são combinadas
- Adicione pontos de roteamento condicional para injetar lógica de decisão em cadeias sequenciais
