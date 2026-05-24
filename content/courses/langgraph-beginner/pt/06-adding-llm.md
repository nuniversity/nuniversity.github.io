---
title: "Conectando LLMs aos Nós"
description: "Aprenda como integrar LLMs em nós LangGraph, passar mensagens entre nós e construir aplicações gráficas alimentadas por LLM."
order: 6
duration: "35 minutos"
difficulty: "iniciante"
---

# Conectando LLMs aos Nós

LLMs são o cérebro dos seus agentes LangGraph. Esta lição cobre como integrar LLMs em nós e gerenciar o fluxo de mensagens entre eles.

---

## LLM Básico em um Nó

A maneira mais simples de usar um LLM em um nó:

```python
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

llm = ChatOpenAI(model="gpt-4o")

class State(TypedDict):
    question: str
    answer: str

def answer_node(state: State) -> dict:
    response = llm.invoke(state["question"])
    return {"answer": response.content}

builder = StateGraph(State)
builder.add_node("answer", answer_node)
builder.add_edge(START, "answer")
builder.add_edge("answer", END)
app = builder.compile()

result = app.invoke({"question": "What is LangGraph?", "answer": ""})
print(result["answer"])
```

[!NOTE]
O LLM é instanciado **fora** da função do nó para que seja criado uma vez. Instanciar dentro do nó criaria um novo cliente LLM a cada invocação, o que é desperdício.

---

## Cadeia LLM Multi-Passo Através de Nós

Múltiplos nós podem cada um usar o LLM, construindo sobre resultados anteriores:

```python
class ResearchState(TypedDict):
    topic: str
    outline: str
    article: str

def outline_node(state: ResearchState) -> dict:
    response = llm.invoke(
        f"Create a detailed outline for an article about: {state['topic']}"
    )
    return {"outline": response.content}

def write_node(state: ResearchState) -> dict:
    response = llm.invoke(
        f"Write a full article based on this outline:\n{state['outline']}"
    )
    return {"article": response.content}

builder = StateGraph(ResearchState)
builder.add_node("outline", outline_node)
builder.add_node("write", write_node)
builder.add_edge(START, "outline")
builder.add_edge("outline", "write")
builder.add_edge("write", END)
app = builder.compile()
```

[!SUCCESS]
Cada chamada LLM constrói sobre a saída do nó anterior através do estado compartilhado. O nó de roteiro escreve em `state["outline"]`, que o nó de escrita lê.

---

## Passando Mensagens Entre Nós

Para agentes conversacionais, use os tipos de mensagem do LangChain para passar mensagens estruturadas entre nós:

```python
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

class ChatState(TypedDict):
    messages: list  # Lista de objetos BaseMessage
    context: str

def system_node(state: ChatState) -> dict:
    """Adicionar mensagem de sistema à conversa."""
    return {
        "messages": [
            SystemMessage("You are a helpful AI assistant.")
        ] + state["messages"]
    }

def chat_node(state: ChatState) -> dict:
    """Gerar resposta AI para a conversa."""
    response = llm.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}

builder = StateGraph(ChatState)
builder.add_node("system", system_node)
builder.add_node("chat", chat_node)
builder.add_edge(START, "system")
builder.add_edge("system", "chat")
builder.add_edge("chat", END)
app = builder.compile()

result = app.invoke({
    "messages": [HumanMessage("What is LangGraph?")],
    "context": ""
})
```

[!IMPORTANT]
Ao passar mensagens entre nós, use subclasses de `BaseMessage` (`HumanMessage`, `AIMessage`, `SystemMessage`, `ToolMessage`). Elas carregam metadados dos quais LangChain e LangGraph dependem.

---

## Saída Estruturada de Nós LLM

Use parsers de saída para obter dados estruturados de respostas LLM:

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class Analysis(BaseModel):
    summary: str = Field(description="One-sentence summary")
    sentiment: str = Field(description="positive, negative, or neutral")
    confidence: float = Field(description="Confidence score 0-1")

parser = PydanticOutputParser(pydantic_object=Analysis)

class AnalysisState(TypedDict):
    text: str
    analysis: dict

def analyze_node(state: AnalysisState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Analyze the text. {format_instructions}"),
        ("human", "{text}")
    ]).partial(format_instructions=parser.get_format_instructions())

    chain = prompt | llm | parser
    result = chain.invoke({"text": state["text"]})

    return {"analysis": result.dict()}

app = builder.compile()
result = app.invoke({
    "text": "LangGraph is an amazing framework!",
    "analysis": {}
})
print(result["analysis"])
# {'summary': '...', 'sentiment': 'positive', 'confidence': 0.95}
```

---

## LLMs com Chamada de Ferramentas

LLMs podem chamar ferramentas. A resposta inclui requisições de chamada de ferramenta:

```python
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression."""
    return str(eval(expression))

llm_with_tools = llm.bind_tools([search, calculator])

class ToolState(TypedDict):
    messages: list
    tool_outputs: list

def agent_node(state: ToolState) -> dict:
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}
```

[!WARNING]
Quando um LLM retorna chamadas de ferramenta, você precisa executá-las em um nó separado. O LLM apenas gera a requisição — ele não executa a ferramenta. Isso é abordado em detalhes na Lição 7.

---

## Stream de Tokens LLM a partir de Nós

Transmita token por token do LLM de dentro de um nó:

```python
def streaming_node(state: State, config: dict) -> dict:
    full_response = ""
    for chunk in llm.stream(state["question"]):
        full_response += chunk.content
    return {"answer": full_response}
```

Para streaming de tokens em tempo real através do grafo, use os modos de streaming do LangGraph (abordado no curso Intermediário).

---

## Gerenciando Janelas de Contexto

LLMs têm limites de contexto. Gerencie o que você envia:

```python
def trim_messages(messages: list, max_tokens: int = 4000) -> list:
    """Manter apenas as mensagens mais recentes dentro do orçamento de tokens."""
    from tiktoken import encoding_for_model

    enc = encoding_for_model("gpt-4o")
    total = 0
    trimmed = []

    for msg in reversed(messages):
        tokens = len(enc.encode(msg.content))
        if total + tokens > max_tokens:
            break
        total += tokens
        trimmed.insert(0, msg)

    return trimmed

def context_aware_node(state: ChatState) -> dict:
    recent = trim_messages(state["messages"])
    response = llm.invoke(recent)
    return {"messages": state["messages"] + [response]}
```

[!TIP]
Sempre apare mensagens antes de enviar ao LLM para evitar erros de estouro de janela de contexto. Em produção, use contadores de token de `tiktoken` ou bibliotecas similares.

---

## Roteamento Condicional com LLM

Use a saída do LLM para decidir qual nó executa em seguida:

```python
def classifier_node(state: State) -> dict:
    response = llm.invoke(
        f"Classify this query as 'technical', 'billing', or 'general': {state['query']}"
    )
    category = response.content.strip().lower()
    return {"category": category}

def route_by_category(state: State) -> str:
    return state["category"]

builder.add_conditional_edges(
    "classifier",
    route_by_category,
    {
        "technical": "tech_support",
        "billing": "billing_support",
        "general": "general_support"
    }
)
```

---

## Exemplo Completo: Sumarizador com LLM

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

class SummaryState(TypedDict):
    text: str
    summary: str
    keywords: list
    length: int

def summarize_node(state: SummaryState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Summarize the following text in 2-3 sentences."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    summary = chain.invoke({"text": state["text"]})
    return {"summary": summary, "length": len(summary.split())}

def keywords_node(state: SummaryState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract 5 key keywords from this text as a comma-separated list."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    keywords_text = chain.invoke({"text": state["text"]})
    keywords = [k.strip() for k in keywords_text.split(",")]
    return {"keywords": keywords}

# Construir grafo
builder = StateGraph(SummaryState)
builder.add_node("summarize", summarize_node)
builder.add_node("extract_keywords", keywords_node)
builder.add_edge(START, "summarize")
builder.add_edge("summarize", "extract_keywords")
builder.add_edge("extract_keywords", END)
app = builder.compile()

# Executar
result = app.invoke({
    "text": "LangGraph is a framework for building stateful agents...",
    "summary": "",
    "keywords": [],
    "length": 0
})
print(f"Summary ({result['length']} words): {result['summary']}")
print(f"Keywords: {', '.join(result['keywords'])}")
```

---

## Perguntas de Prática

```question
{
  "id": "lg-beginner-06-q1",
  "type": "multiple-choice",
  "question": "Onde você deve instanciar o LLM para uso em nós LangGraph?",
  "options": [
    "Dentro de cada função de nó que precisa dele",
    "Fora das funções de nó para que seja criado uma vez",
    "Dentro do método compile() do grafo",
    "LLMs não podem ser usados com LangGraph"
  ],
  "correct": 1,
  "explanation": "Instancie o LLM fora das funções de nó para reuso entre invocações. Criá-lo dentro de um nó cria um novo cliente a cada chamada."
}
```

```question
{
  "id": "lg-beginner-06-q2",
  "type": "multiple-choice",
  "question": "Quais tipos de mensagem você deve usar ao passar histórico de conversa entre nós?",
  "options": [
    "Strings simples",
    "Subclasses de BaseMessage (HumanMessage, AIMessage, etc.)",
    "Dicionários JSON",
    "Listas de tuplas"
  ],
  "correct": 1,
  "explanation": "Use subclasses de BaseMessage para manipulação adequada de metadados e compatibilidade com LangChain e LangGraph."
}
```

```question
{
  "id": "lg-beginner-06-q3",
  "type": "multiple-choice",
  "question": "Quando um LLM retorna chamadas de ferramenta, o que acontece em seguida?",
  "options": [
    "A ferramenta é automaticamente executada",
    "A função do nó deve executar a ferramenta em um passo separado",
    "O LLM lida com a execução da ferramenta internamente",
    "Chamadas de ferramenta são ignoradas por padrão"
  ],
  "correct": 1,
  "explanation": "O LLM apenas gera requisições de chamada de ferramenta. Um nó ou lógica separada deve executar a ferramenta real."
}
```

```question
{
  "id": "lg-beginner-06-q4",
  "type": "multiple-choice",
  "question": "Qual é o propósito de trim_messages() antes de chamar um LLM?",
  "options": [
    "Remover mensagens duplicadas",
    "Permanecer dentro do limite da janela de contexto do LLM",
    "Ordenar mensagens por timestamp",
    "Criptografar as mensagens"
  ],
  "correct": 1,
  "explanation": "trim_messages() mantém a conversa dentro do limite de tokens do LLM para evitar erros de estouro de janela de contexto."
}
```

```question
{
  "id": "lg-beginner-06-q5",
  "type": "multiple-choice",
  "question": "Como você obtém saída estruturada de um nó LLM?",
  "options": [
    "Analisar a string bruta manualmente",
    "Usar um parser de saída como PydanticOutputParser",
    "Definir structured=True no LLM",
    "LLMs não podem produzir saída estruturada"
  ],
  "correct": 1,
  "explanation": "Use parsers de saída (PydanticOutputParser, JsonOutputParser) para converter texto LLM em dados estruturados."
}
```

```question
{
  "id": "lg-beginner-06-q6",
  "type": "multiple-choice",
  "question": "Qual método você usa para tornar um LLM ciente das ferramentas disponíveis?",
  "options": ["llm.add_tools([...])", "llm.bind_tools([...])", "llm.configure_tools([...])", "Ferramentas são carregadas automaticamente"],
  "correct": 1,
  "explanation": "llm.bind_tools([ferramenta1, ferramenta2]) registra schemas de ferramentas com o LLM para que ele possa solicitar chamadas de ferramenta."
}
```

```question
{
  "id": "lg-beginner-06-q7",
  "type": "multiple-choice",
  "question": "Em uma cadeia LLM multi-passo, como a saída de um nó fica disponível para o próximo?",
  "options": [
    "Através do estado compartilhado — um nó escreve no estado, outro lê",
    "Via chamadas de função diretas entre nós",
    "Através de uma fila de mensagens",
    "Não fica; cada nó começa do zero"
  ],
  "correct": 0,
  "explanation": "Nós compartilham estado. Um nó atualiza o estado (ex.: state['outline']), e o próximo nó lê esse campo."
}
```

```question
{
  "id": "lg-beginner-06-q8",
  "type": "multiple-choice",
  "question": "Qual é o modelo recomendado para chamadas LLM econômicas em LangGraph?",
  "options": [
    "gpt-4o para tudo",
    "gpt-4o-mini para tarefas simples, gpt-4o para tarefas complexas",
    "Apenas modelos open-source",
    "O modelo mais caro para melhor qualidade"
  ],
  "correct": 1,
  "explanation": "Use gpt-4o-mini para tarefas simples/baratas e reserve gpt-4o para raciocínio complexo. Isso otimiza custo e desempenho."
}
```

```question
{
  "id": "lg-beginner-06-q9",
  "type": "multiple-choice",
  "question": "O que determina qual nó executa em seguida após um LLM classificar a entrada?",
  "options": [
    "O texto de resposta do LLM mapeado através de uma aresta condicional",
    "Seleção aleatória",
    "Ordem alfabética dos nomes dos nós",
    "A ordem em que os nós foram adicionados ao grafo"
  ],
  "correct": 0,
  "explanation": "A saída de classificação do LLM é lida por uma função de roteamento, que retorna um nome de nó. Isso é então mapeado via add_conditional_edges."
}
```

```question
{
  "id": "lg-beginner-06-q10",
  "type": "multiple-choice",
  "question": "O que llm.invoke() retorna quando chamado com uma lista de mensagens?",
  "options": [
    "Uma string simples",
    "Um objeto AIMessage",
    "Um dicionário de chamadas de ferramenta",
    "Uma lista de tokens"
  ],
  "correct": 1,
  "explanation": "llm.invoke(mensagens) retorna um objeto AIMessage. Acesse o texto via .content e chamadas de ferramenta via .tool_calls."
}
```

---

[!SUCCESS]
### Principais Conclusões
- Instancie LLMs fora das funções de nó para eficiência
- Use subclasses de BaseMessage para passar mensagens entre nós
- Parsers de saída fornecem dados estruturados a partir de respostas LLM
- LLMs geram requisições de chamada de ferramenta; nós executam as ferramentas reais
- Apare mensagens para permanecer dentro das janelas de contexto
- Use arestas condicionais com classificação LLM para roteamento
- Diferentes modelos LLM podem ser usados em diferentes nós para otimização de custo
- O estado compartilhado carrega saídas LLM de um nó para o próximo
