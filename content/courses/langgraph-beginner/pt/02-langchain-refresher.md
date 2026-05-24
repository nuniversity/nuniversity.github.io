---
title: "Recapitulação de LangChain"
description: "Recapitulação rápida dos fundamentos de LangChain: LLMs, prompts, cadeias, parsers de saída e como eles se integram com LangGraph."
order: 2
duration: "30 minutos"
difficulty: "iniciante"
---

# Recapitulação de LangChain

LangGraph é construído sobre LangChain. Antes de mergulhar mais fundo em grafos, vamos revisar os componentes principais de LangChain que você usará em toda aplicação LangGraph.

---

## LLMs (Modelos de Linguagem)

LangChain fornece uma interface unificada para centenas de LLMs da OpenAI, Anthropic, Google, Cohere, Hugging Face e mais.

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
response = llm.invoke("What is the capital of France?")
print(response.content)  # The capital of France is Paris.
```

### Principais Parâmetros do LLM

| Parâmetro | Descrição | Faixa Típica |
| :--- | :--- | :--- |
| `model` | Identificador do modelo | `"gpt-4o"`, `"claude-3-opus"` |
| `temperature` | Aleatoriedade da saída | 0.0 (determinístico) a 2.0 (criativo) |
| `max_tokens` | Comprimento máximo da saída | 128 a 4096+ |
| `top_p` | Limiar de amostragem nucleus | 0.0 a 1.0 |
| `timeout` | Tempo limite da requisição | 10 a 60 segundos |

[!NOTE]
Modelos de chat usam `invoke()` com mensagens, não strings. A classe base LLM usa strings diretamente. Para agentes LangGraph, você quase sempre usará `ChatOpenAI` ou modelos de chat similares.

```python
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage("You are a helpful assistant."),
    HumanMessage("What is LangGraph?")
]
response = llm.invoke(messages)
```

---

## Prompts

Prompts são templates que estruturam a entrada para um LLM. O `ChatPromptTemplate` do LangChain é a abordagem padrão.

```python
from langchain.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert in {topic}."),
    ("human", "Answer this question: {question}")
])

formatted = prompt.format(topic="Python", question="What is a decorator?")
```

### Prompt com Exemplos Few-Shot

```python
examples = [
    ("human", "What is 2+2?"),
    ("assistant", "4"),
    ("human", "What is 5+3?"),
    ("assistant", "8"),
]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a math tutor. Answer concisely."),
    *examples,
    ("human", "{question}")
])
```

[!TIP]
Em LangGraph, você tipicamente coloca a construção do prompt **dentro de uma função de nó** em vez de encadeá-lo externamente. Isso mantém a lógica do prompt próxima de onde é usada.

---

## Cadeias (Chains)

Cadeias conectam componentes juntos. A abordagem moderna usa o **operador pipe (`|`)**:

```python
from langchain_core.output_parsers import StrOutputParser

# Cadeia: prompt → LLM → saída string
chain = prompt | llm | StrOutputParser()
result = chain.invoke({
    "topic": "AI",
    "question": "What is an agent?"
})
```

### RunnablePassthrough para Valores Intermediários

```python
from langchain_core.runnables import RunnablePassthrough

chain = {
    "response": prompt | llm | StrOutputParser(),
    "original_question": RunnablePassthrough()
} | RunnablePassthrough()

result = chain.invoke({"topic": "AI", "question": "What is RAG?"})
print(result["response"])
print(result["original_question"])
```

[!WARNING]
Em LangGraph, você não deve usar o operador pipe para construir cadeias grandes. Em vez disso, coloque a lógica da cadeia dentro de funções de nó. Isso dá melhor controle sobre atualizações de estado e tratamento de erros.

---

## Parsers de Saída

Parsers de saída transformam a saída de texto do LLM em formatos estruturados.

### StrOutputParser

O parser mais simples — converte a saída do LLM em uma string simples:

```python
from langchain_core.output_parsers import StrOutputParser

parser = StrOutputParser()
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"topic": "AI", "question": "Hi"})
# result é uma string simples
```

### PydanticOutputParser

Analisa a saída JSON em um modelo Pydantic:

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class Recipe(BaseModel):
    name: str = Field(description="Recipe name")
    ingredients: list[str] = Field(description="List of ingredients")
    steps: list[str] = Field(description="Cooking steps")
    cook_time_minutes: int = Field(description="Total cooking time")

parser = PydanticOutputParser(pydantic_object=Recipe)

prompt = ChatPromptTemplate.from_messages([
    ("system", "Extract recipe info. {format_instructions}"),
    ("human", "{input_text}")
]).partial(format_instructions=parser.get_format_instructions())

chain = prompt | llm | parser
recipe = chain.invoke({"input_text": "To make pasta, boil water..."})
print(recipe.name, recipe.cook_time_minutes)
```

### JsonOutputParser

Para casos mais simples onde você não precisa de validação Pydantic completa:

```python
from langchain_core.output_parsers import JsonOutputParser

chain = prompt | llm | JsonOutputParser()
result = chain.invoke({"input_text": "Extract name and age from: John is 30"})
# result é um dict: {"name": "John", "age": 30}
```

[!SUCCESS]
Parsers de saída são essenciais em LangGraph para converter respostas LLM em atualizações de estado estruturadas que nós downstream podem processar de forma confiável.

---

## Como Componentes LangChain se Encaixam no LangGraph

Em LangGraph, componentes LangChain se tornam **blocos de construção dentro de nós**:

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict, List
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage

llm = ChatOpenAI(model="gpt-4o")

class AgentState(TypedDict):
    messages: List[dict]
    response: str

def generate_response(state: AgentState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("human", "{input}")
    ])

    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"input": state["messages"][-1]["content"]})

    return {"response": response}

# Construção do grafo
builder = StateGraph(AgentState)
builder.add_node("generate", generate_response)
builder.add_edge(START, "generate")
builder.add_edge("generate", END)
app = builder.compile()
```

[!IMPORTANT]
Componentes LangChain funcionam **dentro** de nós LangGraph, não como substituições para nós. Cada nó é uma função que usa ferramentas LangChain internamente para processar estado e retornar atualizações.

---

## Principais Diferenças ao Usar LangChain no LangGraph

| Aspecto | Apenas LangChain | LangGraph com LangChain |
| :--- | :--- | :--- |
| Controle de fluxo | Operadores pipe (`\|`) | Arestas e condições do grafo |
| Gerenciamento de estado | Passado através da cadeia | Objeto de Estado compartilhado |
| Looping | Não possível | Adicionar aresta de volta ao nó anterior |
| Uso de ferramentas | Via ToolChain | Dentro de funções de nó |
| Tratamento de erro | Cadeia quebra no erro | try/except por nó |

---

## RunnableConfig no LangGraph

Você pode passar configuração através do `RunnableConfig` do LangChain ao invocar nós:

```python
from langchain_core.runnables import RunnableConfig

def configurable_node(state: AgentState, config: RunnableConfig) -> dict:
    # Acessar parâmetros configuráveis
    model_name = config.get("configurable", {}).get("model", "gpt-4o")
    temperature = config.get("configurable", {}).get("temperature", 0.7)

    llm = ChatOpenAI(model=model_name, temperature=temperature)
    response = llm.invoke(state["messages"])
    return {"response": response.content}

# Passar configuração durante a invocação
app.invoke(
    {"messages": [HumanMessage("Hello")]},
    config={"configurable": {"model": "gpt-3.5-turbo", "temperature": 0.0}}
)
```

[!NOTE]
O parâmetro `config` em funções de nó é opcional. Adicione-o apenas quando precisar de configuração em tempo de execução, como seleção de modelo ou configurações específicas do usuário.

---

## Padrões Comuns para Nós LangGraph

### Chamada LLM Direta
```python
def node(state: State) -> dict:
    response = llm.invoke(state["input"])
    return {"output": response.content}
```

### Prompt + LLM + Parser
```python
def node(state: State) -> dict:
    chain = prompt | llm | parser
    result = chain.invoke({"input": state["input"]})
    return {"structured_output": result}
```

### LLM com Ferramentas
```python
def node(state: State) -> dict:
    llm_with_tools = llm.bind_tools([search_tool, calculator_tool])
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}
```

---

## Perguntas de Prática

```question
{
  "id": "lg-beginner-02-q1",
  "type": "multiple-choice",
  "question": "Qual componente LangChain é usado para converter a saída de texto do LLM em um modelo Pydantic?",
  "options": ["StrOutputParser", "PydanticOutputParser", "JsonOutputParser", "ListOutputParser"],
  "correct": 1,
  "explanation": "PydanticOutputParser analisa a saída do LLM em um BaseModel Pydantic com validação completa."
}
```

```question
{
  "id": "lg-beginner-02-q2",
  "type": "multiple-choice",
  "question": "Como os componentes LangChain se integram com LangGraph?",
  "options": [
    "Eles substituem completamente os nós LangGraph",
    "Eles são usados dentro de funções de nó para processar estado",
    "Eles não podem ser usados juntos",
    "LangGraph reescreve LangChain internamente"
  ],
  "correct": 1,
  "explanation": "Componentes LangChain como prompts, LLMs e parsers são usados dentro de funções de nó. Cada nó pode usar qualquer ferramenta LangChain internamente."
}
```

```question
{
  "id": "lg-beginner-02-q3",
  "type": "multiple-choice",
  "question": "O que o operador pipe (|) faz em LangChain?",
  "options": [
    "Cria um ramo de execução paralela",
    "Encadeia componentes juntos (saída de um vira entrada do próximo)",
    "Define uma rota condicional",
    "Mescla duas cadeias em uma"
  ],
  "correct": 1,
  "explanation": "O operador pipe encadeia componentes LangChain. A saída do componente esquerdo vira a entrada do componente direito."
}
```

```question
{
  "id": "lg-beginner-02-q4",
  "type": "multiple-choice",
  "question": "Qual é o propósito do SystemMessage em LangChain?",
  "options": [
    "Enviar logs de erro para o console",
    "Definir o comportamento e contexto para o LLM",
    "Armazenar credenciais de usuário",
    "Formatar a saída como JSON"
  ],
  "correct": 1,
  "explanation": "SystemMessage define o prompt de sistema que determina o comportamento, papel e restrições do LLM."
}
```

```question
{
  "id": "lg-beginner-02-q5",
  "type": "multiple-choice",
  "question": "Qual parâmetro controla a aleatoriedade da saída do LLM?",
  "options": ["max_tokens", "temperature", "top_p", "frequency_penalty"],
  "correct": 1,
  "explanation": "Temperature controla a aleatoriedade. Valores menores (0.0-0.3) produzem saída determinística; valores maiores (0.7-2.0) produzem saída mais criativa."
}
```

```question
{
  "id": "lg-beginner-02-q6",
  "type": "multiple-choice",
  "question": "Como você passa configuração em tempo de execução, como seleção de modelo, para um nó LangGraph?",
  "options": [
    "Via variáveis de ambiente",
    "Via o parâmetro config em funções de nó",
    "Recompilando o grafo",
    "A configuração não pode ser alterada em tempo de execução"
  ],
  "correct": 1,
  "explanation": "Nós podem aceitar um parâmetro config (RunnableConfig) que permite passar configurações de tempo de execução como nome do modelo e temperatura."
}
```

```question
{
  "id": "lg-beginner-02-q7",
  "type": "multiple-choice",
  "question": "Qual é o tipo de saída de ChatOpenAI.invoke()?",
  "options": ["Uma string", "Um objeto AIMessage", "Um dicionário", "Uma lista de tokens"],
  "correct": 1,
  "explanation": "ChatOpenAI.invoke() retorna um objeto AIMessage. Acesse o texto via propriedade .content."
}
```

```question
{
  "id": "lg-beginner-02-q8",
  "type": "multiple-choice",
  "question": "O que StrOutputParser faz?",
  "options": [
    "Converte a saída do LLM para maiúsculas",
    "Extrai o conteúdo string de uma resposta LLM",
    "Analisa JSON em uma string",
    "Divide a saída em uma lista de strings"
  ],
  "correct": 1,
  "explanation": "StrOutputParser extrai o .content de AIMessage e retorna como uma string simples."
}
```

```question
{
  "id": "lg-beginner-02-q9",
  "type": "multiple-choice",
  "question": "Qual dos seguintes NÃO é um componente LangChain comumente usado dentro de nós LangGraph?",
  "options": ["ChatPromptTemplate", "ChatOpenAI", "Flask web server", "StrOutputParser"],
  "correct": 2,
  "explanation": "Flask é um framework web, não um componente LangChain. Prompts, LLMs e parsers são os componentes usados dentro de nós."
}
```

```question
{
  "id": "lg-beginner-02-q10",
  "type": "multiple-choice",
  "question": "Como você deve construir cadeias de prompt em LangGraph?",
  "options": [
    "Usar o operador pipe para encadear tudo fora do grafo",
    "Construir cadeias de prompt dentro de funções de nó para melhor controle de estado",
    "Prompts não são necessários em LangGraph",
    "Usar apenas LangChain Expression Language"
  ],
  "correct": 1,
  "explanation": "Em LangGraph, você constrói cadeias de prompt dentro de funções de nó. Isso dá acesso direto ao estado e permite tratamento de erro por nó."
}
```

---

[!SUCCESS]
### Principais Conclusões
- LangChain fornece LLMs, prompts, cadeias e parsers usados dentro de nós LangGraph
- ChatOpenAI é a classe LLM padrão; use .invoke() com listas de mensagens
- Parsers de saída (StrOutputParser, PydanticOutputParser) convertem texto LLM em dados estruturados
- Em LangGraph, componentes LangChain vão dentro de funções de nó, não fora do grafo
- O parâmetro config permite configuração em tempo de execução dos parâmetros LLM
- Evite o operador pipe para cadeias grandes dentro de LangGraph — prefira chamadas de função explícitas
