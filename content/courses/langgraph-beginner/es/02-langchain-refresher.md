---
title: "Repaso de LangChain"
description: "Repaso rápido de los fundamentos de LangChain: ChatPromptTemplate, Chains, Output Parsers y cómo se integran con LangGraph."
order: 2
duration: "25 minutos"
difficulty: "iniciante"
---

# Repaso de LangChain

LangChain es la biblioteca hermana de LangGraph. Proporciona los componentes básicos — LLMs, prompts, herramientas — que usarás dentro de tus nodos de LangGraph.

---

## Conceptos Clave de LangChain

| Componente | Propósito |
| :--- | :--- |
| `ChatPromptTemplate` | Plantillas para mensajes del sistema y humanos |
| `ChatOpenAI` \| `ChatAnthropic` | Interfaces para LLMs |
| `StrOutputParser` | Extrae texto de la salida del LLM |
| `chain` | Pipeline: prompt \| llm \| parser |

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")
prompt = ChatPromptTemplate.from_messages([
    ("system", "Eres un asistente útil."),
    ("human", "{input}")
])
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"input": "¡Hola!"})
```

---

## ChatPromptTemplate

```python
from langchain.prompts import ChatPromptTemplate

# Plantilla básica
prompt = ChatPromptTemplate.from_messages([
    ("system", "Eres un experto en {topic}."),
    ("human", "{question}")
])

# Con mensajes de ejemplo
prompt = ChatPromptTemplate.from_messages([
    ("system", "Eres un asistente útil."),
    ("human", "¿Qué es {concept}?"),
    ("ai", "Te lo explicaré en términos simples."),
    ("human", "{question}")
])

# Invocar una plantilla
messages = prompt.invoke({
    "topic": "Python",
    "question": "¿Qué es un decorador?"
})
```

---

## Output Parsers

```python
from langchain_core.output_parsers import StrOutputParser, CommaSeparatedListOutputParser

# Parser de string simple
str_parser = StrOutputParser()

# Parser de lista separada por comas
list_parser = CommaSeparatedListOutputParser()
# "manzana, pera, plátano" → ["manzana", "pera", "plátano"]

# En una chain
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"input": "cuéntame un chiste"})
```

---

## Chains vs LangGraph

```python
# Chain de LangChain (lineal, sin estado)
chain = prompt_a | llm | parser_a
result = chain.invoke(input)

# LangGraph (con estado, flexible)
builder.add_node("step_a", node_a)
builder.add_edge("step_a", "step_b")
app = builder.compile()
result = app.invoke({"key": "value"})
```

[!NOTE]
LangChain _chains_ son para pipelines simples de usar y olvidar. LangGraph _graphs_ son para flujos de trabajo complejos con estado, bucles y toma de decisiones. A menudo usarás componentes de LangChain _dentro_ de nodos de LangGraph.

---

## Mensajes de LangChain

```python
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

messages = [
    SystemMessage("Eres un asistente útil."),
    HumanMessage("¿Qué es LangGraph?"),
    AIMessage("LangGraph es un framework para construir agentes de IA.")
]

# Usar con LLM
response = llm.invoke(messages)
print(response.content)  # Texto de respuesta
print(response.response_metadata)  # Metadatos (uso de tokens, etc.)
```

---

## Bindings de Herramientas

```python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """Obtener el clima actual de una ciudad."""
    return f"El clima en {city} es soleado, 22°C"

# Vincular herramientas al LLM
llm_with_tools = llm.bind_tools([get_weather])

# Ahora el LLM puede solicitar llamadas a herramientas
response = llm_with_tools.invoke("¿Qué clima hace en Madrid?")
print(response.tool_calls)  # Solicitudes de herramientas si las hay
```

[!TIP]
Los binding de herramientas son cómo los LLMs solicitan el uso de herramientas. LangGraph ejecuta estas solicitudes en nodos separados.

---

## Pipelines con Chain

```python
# Pipeline de documentos: extraer → resumir → traducir
from operator import itemgetter

extract_prompt = ChatPromptTemplate.from_messages([
    ("system", "Extrae los puntos clave de este texto."),
    ("human", "{text}")
])

summarize_prompt = ChatPromptTemplate.from_messages([
    ("system", "Resume estos puntos en 2 frases."),
    ("human", "{points}")
])

# Chain compuesta
pipeline = (
    {"points": extract_prompt | llm | StrOutputParser()}
    | summarize_prompt
    | llm
    | StrOutputParser()
)

# Equivalente en LangGraph (más legible para flujos complejos)
# node_extract → node_summarize con estado compartido
```

---

## Preguntas de Práctica

```question
{
  "id": "lg-beginner-02-q1",
  "type": "multiple-choice",
  "question": "¿Cuál es el propósito de StrOutputParser?",
  "options": [
    "Convertir strings en listas",
    "Extraer contenido de texto de la salida del LLM",
    "Validar la salida del LLM",
    "Traducir la salida del LLM"
  ],
  "correct": 1,
  "explanation": "StrOutputParser extrae el contenido de texto de la respuesta de un modelo de chat, devolviendo un string simple."
}
```

```question
{
  "id": "lg-beginner-02-q2",
  "type": "multiple-choice",
  "question": "¿Cómo se vinculan herramientas a un LLM en LangChain?",
  "options": [
    "llm.add_tools([tool1, tool2])",
    "llm.bind_tools([tool1, tool2])",
    "bind(llm, [tool1, tool2])",
    "tool.bind(llm)"
  ],
  "correct": 1,
  "explanation": "llm.bind_tools() registra herramientas con el LLM para que pueda solicitarlas durante la generación."
}
```

```question
{
  "id": "lg-beginner-02-q3",
  "type": "multiple-choice",
  "question": "¿Qué contiene response.tool_calls después de invocar un LLM con herramientas vinculadas?",
  "options": [
    "Los resultados de las herramientas",
    "Solicitudes del LLM para ejecutar herramientas específicas",
    "Una lista de todas las herramientas disponibles",
    "Los mensajes de error de las herramientas"
  ],
  "correct": 1,
  "explanation": "tool_calls contiene las solicitudes del LLM para ejecutar herramientas específicas con argumentos particulares."
}
```

```question
{
  "id": "lg-beginner-02-q4",
  "type": "multiple-choice",
  "question": "¿Cuáles son los tipos de mensaje en LangChain?",
  "options": [
    "HumanMessage, AIMessage, SystemMessage, ToolMessage",
    "InputMessage, OutputMessage, ErrorMessage",
    "TextMessage, ImageMessage, AudioMessage",
    "QuestionMessage, AnswerMessage"
  ],
  "correct": 0,
  "explanation": "LangChain tiene cuatro tipos de mensaje principales: HumanMessage, AIMessage, SystemMessage y ToolMessage."
}
```

```question
{
  "id": "lg-beginner-02-q5",
  "type": "multiple-choice",
  "question": "¿Cuándo deberías usar LangGraph en lugar de una Chain de LangChain?",
  "options": [
    "Siempre, LangGraph es mejor en todo",
    "Cuando necesitas pipelines lineales simples",
    "Cuando tu flujo de trabajo necesita bucles, ramificaciones o estado compartido",
    "Solo cuando usas múltiples LLMs"
  ],
  "correct": 2,
  "explanation": "LangGraph destaca en flujos de trabajo complejos con bucles, toma de decisiones y estado que persiste entre pasos."
}
```

---

[!SUCCESS]
### Puntos Clave
- LangChain proporciona componentes (prompts, LLMs, parsers) para usar dentro de nodos de LangGraph
- `ChatPromptTemplate.from_messages()` crea plantillas con roles de sistema/humano/IA
- Los Output Parsers transforman la salida del LLM en formatos utilizables
- `llm.bind_tools()` permite a los LLMs solicitar ejecuciones de herramientas
- Los tipos de mensaje (Human/AI/System/Tool) estructuran la comunicación con el LLM
- Las Chain de LangChain son para pipelines lineales; LangGraph es para flujos complejos con estado
