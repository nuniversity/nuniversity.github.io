---
title: "Ferramentas Básicas"
description: "Aprenda como definir ferramentas com @tool, vinculá-las a LLMs e executar ferramentas dentro de nós LangGraph."
order: 7
duration: "35 minutos"
difficulty: "iniciante"
---

# Ferramentas Básicas

Ferramentas dão aos LLMs a capacidade de interagir com o mundo exterior — pesquisar na web, executar cálculos, consultar bancos de dados e mais. Esta lição cobre como definir, vincular e executar ferramentas em LangGraph.

---

## Definindo Ferramentas com @tool

O decorador `@tool` do LangChain converte uma função Python em uma ferramenta que LLMs podem usar:

```python
from langchain_core.tools import tool

@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location."""
    # Em produção, chamar uma API de clima
    return f"The weather in {location} is sunny, 72°F."

@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression. Use Python syntax."""
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"Error: {e}"
```

### Estrutura da Ferramenta

Cada ferramenta tem:

| Componente | Descrição | Fonte |
| :--- | :--- | :--- |
| **Nome** | O nome da função (ex.: `get_weather`) | Gerado do nome da função |
| **Descrição** | Docstring explicando quando usar | De `"""docstring"""` |
| **Parâmetros** | Argumentos da função com tipagem | Da assinatura da função |
| **Corpo** | A lógica de implementação | O código da função |

[!IMPORTANT]
A **docstring é crítica**. O LLM a lê para decidir quando e como chamar a ferramenta. Seja descritivo e inclua exemplos de quando a ferramenta é apropriada.

---

## Vinculação de Ferramentas

Vincule ferramentas a um LLM para que ele saiba que elas existem:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

# Vincular ferramentas ao LLM
llm_with_tools = llm.bind_tools([get_weather, calculator])
```

### Como a Vinculação Funciona

`bind_tools()` envia os schemas das ferramentas (nome, descrição, parâmetros) para o LLM como parte da chamada de API. O LLM pode então decidir:

1. **Responder normalmente** com texto se nenhuma ferramenta for necessária
2. **Solicitar uma chamada de ferramenta** retornando um objeto `tool_calls` estruturado

```python
# LLM pode responder sem ferramenta
response = llm_with_tools.invoke("Hello!")
print(response.content)  # "Hi! How can I help you?"

# LLM pode solicitar uma ferramenta
response = llm_with_tools.invoke("What is 2+2?")
print(response.tool_calls)
# [{'name': 'calculator', 'args': {'expression': '2+2'}, 'id': '...'}]
```

[!NOTE]
O LLM **não** executa a ferramenta. Ele apenas gera uma requisição de chamada de ferramenta. Sua função de nó deve lidar com a execução.

---

## Verificando Chamadas de Ferramenta

Após invocar um LLM habilitado para ferramentas, verifique se ele quer usar uma ferramenta:

```python
response = llm_with_tools.invoke(messages)

if response.tool_calls:
    # LLM quer chamar ferramentas
    for tool_call in response.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]
        print(f"Tool requested: {tool_name}({tool_args})")
else:
    # LLM respondeu com texto
    print(f"Response: {response.content}")
```

### Estrutura da Chamada de Ferramenta

```python
# Cada tool_call é um dict com:
{
    "name": "calculator",        # Nome da ferramenta
    "args": {"expression": "2+2"},  # Dict de argumentos
    "id": "call_abc123",         # ID único da chamada
    "type": "tool_call"          # Sempre "tool_call"
}
```

---

## Execução de Ferramenta em um Nó

O padrão padrão: invocar LLM, verificar chamadas de ferramenta, executar ferramentas, retornar resultados:

```python
from langchain_core.messages import ToolMessage

class AgentState(TypedDict):
    messages: list
    tool_results: dict

def agent_node(state: AgentState) -> dict:
    # 1. Chamar LLM com ferramentas
    response = llm_with_tools.invoke(state["messages"])

    # 2. Verificar se LLM quer usar ferramentas
    if response.tool_calls:
        results = {}
        new_messages = state["messages"] + [response]

        for tool_call in response.tool_calls:
            # 3. Executar a ferramenta
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            if tool_name == "calculator":
                result = calculator.invoke(tool_args)
            elif tool_name == "get_weather":
                result = get_weather.invoke(tool_args)
            else:
                result = f"Unknown tool: {tool_name}"

            # 4. Armazenar resultado
            tool_call_id = tool_call["id"]
            results[tool_call_id] = result

            # 5. Adicionar ToolMessage à conversa
            new_messages.append(
                ToolMessage(content=result, tool_call_id=tool_call_id)
            )

        return {"messages": new_messages, "tool_results": results}

    # 6. Sem chamadas de ferramenta — retornar resposta LLM
    return {"messages": state["messages"] + [response]}
```

[!SUCCESS]
O padrão é: LLM decide → analisar chamadas de ferramenta → executar ferramentas → anexar resultados como ToolMessages → continuar.

---

## Execução Simplificada com ToolExecutor

LangGraph fornece `ToolExecutor` para execução mais limpa de ferramentas:

```python
from langgraph.prebuilt import ToolExecutor

# Criar executor a partir de suas ferramentas
tools = [get_weather, calculator]
tool_executor = ToolExecutor(tools)

def agent_node(state: AgentState) -> dict:
    response = llm_with_tools.invoke(state["messages"])

    if response.tool_calls:
        new_messages = [response]

        for tool_call in response.tool_calls:
            # ToolExecutor lida com roteamento e invocação
            result = tool_executor.invoke(tool_call)
            new_messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_call["id"])
            )

        return {"messages": state["messages"] + new_messages}

    return {"messages": state["messages"] + [response]}
```

[!TIP]
`ToolExecutor` automaticamente roteia chamadas de ferramenta para a função correta baseada no nome da ferramenta. Ele lida com o dicionário de mapeamento internamente.

---

## Agente ReAct Completo com Ferramentas

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolExecutor
from typing_extensions import TypedDict, List, Dict, Any

# 1. Definir ferramentas
@tool
def search(query: str) -> str:
    """Search the web. Use for general knowledge questions."""
    return f"Search results for '{query}': LangGraph is a framework..."

@tool
def calculator(expression: str) -> str:
    """Evaluate math expressions. Use for calculations."""
    return str(eval(expression, {"__builtins__": {}}, {}))

# 2. Configuração
tools = [search, calculator]
llm = ChatOpenAI(model="gpt-4o")
llm_with_tools = llm.bind_tools(tools)
tool_executor = ToolExecutor(tools)

# 3. Estado
class AgentState(TypedDict):
    messages: List[Any]

# 4. Nó
def agent(state: AgentState) -> dict:
    response = llm_with_tools.invoke(state["messages"])

    if response.tool_calls:
        new_messages = [response]
        for tc in response.tool_calls:
            result = tool_executor.invoke(tc)
            new_messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
        return {"messages": state["messages"] + new_messages}

    return {"messages": state["messages"] + [response]}

# 5. Roteador
def should_continue(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "continue"
    return "end"

# 6. Grafo
builder = StateGraph(AgentState)
builder.add_node("agent", agent)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue, {
    "continue": "agent",  # Loop de volta — resultados de ferramentas alimentam de volta ao LLM
    "end": END
})

app = builder.compile()

# 7. Executar
result = app.invoke({
    "messages": [HumanMessage("What is 15 * 7 and search for LangGraph?")]
})
print(result["messages"][-1].content)
```

[!WARNING]
Quando o roteador retorna `"continue"`, o grafo faz loop de volta ao nó agente. O agente recebe os ToolMessages (resultados das ferramentas) e pode decidir se chama mais ferramentas ou responde. Sempre defina um `recursion_limit` para prevenir loops infinitos.

---

## Múltiplas Chamadas de Ferramenta

O LLM pode solicitar múltiplas chamadas de ferramenta em uma única resposta:

```python
# Exemplo: Resposta LLM com duas chamadas de ferramenta
response = llm_with_tools.invoke(
    "What's the weather in Paris and calculate 2^10?"
)
print(len(response.tool_calls))  # 2

# Executar todas as chamadas de ferramenta
for tc in response.tool_calls:
    result = tool_executor.invoke(tc)
    print(f"{tc['name']} → {result}")
```

Todas as chamadas de ferramenta de uma resposta LLM são executadas e seus resultados são retornados como ToolMessages para o LLM para processamento final.

---

## Tratamento de Erro em Ferramentas

```python
def safe_agent_node(state: AgentState) -> dict:
    try:
        response = llm_with_tools.invoke(state["messages"])
    except Exception as e:
        print(f"LLM call failed: {e}")
        return {"messages": state["messages"] + [
            AIMessage(content=f"I encountered an error: {str(e)}")
        ]}

    if response.tool_calls:
        new_messages = [response]
        for tc in response.tool_calls:
            try:
                result = tool_executor.invoke(tc)
            except Exception as e:
                result = f"Tool execution error: {e}"
            new_messages.append(
                ToolMessage(content=str(result), tool_call_id=tc["id"])
            )
        return {"messages": state["messages"] + new_messages}

    return {"messages": state["messages"] + [response]}
```

[!NOTE]
Sempre envolva a execução de ferramenta em try/except. Uma ferramenta com falha não deve quebrar o grafo inteiro. Retorne uma mensagem de erro como resultado da ferramenta para que o LLM possa lidar com isso graciosamente.

---

## Ferramentas vs Funções Embutidas

| Aspecto | Decorador @tool | Função Simples |
| :--- | :--- | :--- |
| Geração de schema | Automática a partir da assinatura | Manual |
| Descoberta pelo LLM | Via bind_tools() | Não visível ao LLM |
| Tratamento de erro | Pode ser configurado | Manual |
| Caso de uso | LLM precisa chamá-la | Lógica interna do nó |

---

## Perguntas de Prática

```question
{
  "id": "lg-beginner-07-q1",
  "type": "multiple-choice",
  "question": "O que o decorador @tool faz?",
  "options": [
    "Converte uma função em uma ferramenta LangChain com metadados de schema",
    "Adiciona tratamento de erro a uma função",
    "Torna uma função assíncrona",
    "Registra uma função com LangSmith"
  ],
  "correct": 0,
  "explanation": "@tool converte uma função Python em uma Tool LangChain com nome, descrição e schema de parâmetros gerados automaticamente."
}
```

```question
{
  "id": "lg-beginner-07-q2",
  "type": "multiple-choice",
  "question": "Qual método torna um LLM ciente das ferramentas disponíveis?",
  "options": ["llm.add_tools()", "llm.bind_tools()", "llm.register_tools()", "llm.attach_tools()"],
  "correct": 1,
  "explanation": "llm.bind_tools([...]) envia schemas de ferramentas para o LLM para que ele possa solicitar chamadas de ferramenta em sua resposta."
}
```

```question
{
  "id": "lg-beginner-07-q3",
  "type": "multiple-choice",
  "question": "O LLM executa ferramentas diretamente?",
  "options": [
    "Sim, automaticamente",
    "Não, ele apenas solicita chamadas de ferramenta; seu código as executa",
    "Apenas se configurado com auto_execute=True",
    "Apenas para ferramentas embutidas"
  ],
  "correct": 1,
  "explanation": "O LLM gera requisições de chamada de ferramenta. Sua função de nó é responsável por executar as ferramentas reais."
}
```

```question
{
  "id": "lg-beginner-07-q4",
  "type": "multiple-choice",
  "question": "Qual tipo de mensagem envolve resultados de execução de ferramenta para o LLM?",
  "options": ["AIMessage", "HumanMessage", "ToolMessage", "SystemMessage"],
  "correct": 2,
  "explanation": "ToolMessage envolve resultados de execução de ferramenta. Seu tool_call_id o vincula à requisição de chamada de ferramenta original."
}
```

```question
{
  "id": "lg-beginner-07-q5",
  "type": "multiple-choice",
  "question": "O que ToolExecutor faz?",
  "options": [
    "Executa funções Python em uma sandbox",
    "Roteia chamadas de ferramenta para a função de ferramenta correta pelo nome",
    "Gera schemas de ferramentas para o LLM",
    "Valida argumentos de ferramenta"
  ],
  "correct": 1,
  "explanation": "ToolExecutor pega um dict de tool_call e automaticamente o roteia para a função de ferramenta correspondente baseada no campo name."
}
```

```question
{
  "id": "lg-beginner-07-q6",
  "type": "multiple-choice",
  "question": "Qual parte de uma função @tool é mais importante para a compreensão do LLM?",
  "options": [
    "O nome da função",
    "A docstring",
    "A anotação de tipo de retorno",
    "As declarações de import"
  ],
  "correct": 1,
  "explanation": "A docstring diz ao LLM quando e como usar a ferramenta. Uma docstring clara e descritiva é crítica para a seleção correta da ferramenta."
}
```

```question
{
  "id": "lg-beginner-07-q7",
  "type": "multiple-choice",
  "question": "O que acontece em um loop de agente ReAct?",
  "options": [
    "O agente chama uma ferramenta e para",
    "Resultados de ferramentas alimentam de volta ao LLM, que pode chamar mais ferramentas ou responder",
    "O agente ignora resultados de ferramentas",
    "O grafo reinicia do começo"
  ],
  "correct": 1,
  "explanation": "Em ReAct, resultados de ferramentas são retornados ao LLM como ToolMessages, e o LLM decide se chama mais ferramentas ou gera uma resposta final."
}
```

```question
{
  "id": "lg-beginner-07-q8",
  "type": "multiple-choice",
  "question": "Como você deve lidar com erros de execução de ferramenta?",
  "options": [
    "Deixá-los quebrar o grafo",
    "Envolver em try/except e retornar mensagem de erro como resultado da ferramenta",
    "Ignorar todos os erros",
    "Tentar novamente automaticamente 10 vezes"
  ],
  "correct": 1,
  "explanation": "Capture erros de ferramenta e retorne uma mensagem de erro descritiva como o resultado da ferramenta. O LLM pode então relatar ou lidar com o erro graciosamente."
}
```

```question
{
  "id": "lg-beginner-07-q9",
  "type": "multiple-choice",
  "question": "Um LLM pode solicitar múltiplas chamadas de ferramenta em uma resposta?",
  "options": [
    "Não, apenas uma ferramenta por resposta",
    "Sim, tool_calls pode conter múltiplas requisições",
    "Apenas para certos modelos",
    "Apenas se as ferramentas forem independentes"
  ],
  "correct": 1,
  "explanation": "LLMs podem solicitar múltiplas chamadas de ferramenta em uma única resposta. Cada uma tem um ID único e é executada independentemente."
}
```

```question
{
  "id": "lg-beginner-07-q10",
  "type": "multiple-choice",
  "question": "Qual propriedade na resposta do LLM contém as requisições de chamada de ferramenta?",
  "options": [".content", ".tool_calls", ".response_metadata", ".usage_metadata"],
  "correct": 1,
  "explanation": "response.tool_calls contém uma lista de dicts de chamada de ferramenta com name, args e id."
}
```

---

[!SUCCESS]
### Principais Conclusões
- `@tool` decora uma função com metadados que o LLM usa para decidir quando chamá-la
- `llm.bind_tools([...])` torna o LLM ciente das ferramentas disponíveis
- LLMs apenas solicitam chamadas de ferramenta — seu código de nó as executa
- Resultados de ferramentas vão em ToolMessages vinculados por tool_call_id
- ToolExecutor simplifica o roteamento e execução de múltiplas ferramentas
- O padrão ReAct faz loop: LLM → chamadas de ferramenta → executar → ToolMessages → LLM novamente
- Sempre trate erros de ferramenta com try/except
- Uma docstring clara é a parte mais importante de uma definição de ferramenta
