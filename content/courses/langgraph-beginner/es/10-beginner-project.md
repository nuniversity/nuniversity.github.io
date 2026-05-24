---
title: "Proyecto Iniciante: Agente de Q&A con Uso de Herramientas y Enrutamiento"
description: "Construye un agente de Q&A completo usando LangGraph con uso de herramientas, enrutamiento condicional y gestión de estado."
order: 10
duration: "45 minutos"
difficulty: "iniciante"
---

# Proyecto Iniciante: Agente de Q&A con Uso de Herramientas y Enrutamiento

En este proyecto final, construirás un agente de Q&A completo que puede responder preguntas usando herramientas y enrutamiento inteligente. Esto reúne todo lo que has aprendido: estado, nodos, aristas, LLMs, herramientas y ramificación condicional.

---

## Visión General del Proyecto

El agente:

1. **Clasificará** la pregunta del usuario en una categoría
2. **Enrutará** al manipulador apropiado basándose en la categoría
3. **Ejecutará** herramientas o generará respuestas según sea necesario
4. **Repetirá** si se llamaron herramientas, para procesar resultados
5. **Devolverá** una respuesta final

---

## Paso 1: Configuración e Importaciones

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolExecutor
from typing_extensions import TypedDict, List, Annotated
from typing import Any
from operator import add
import json
```

---

## Paso 2: Definir Herramientas

```python
@tool
def web_search(query: str) -> str:
    """Buscar en la web información actual. Usar para noticias, hechos y conocimiento general."""
    return f"## Resultados Web para '{query}'\n" \
           f"1. LangGraph es un framework para construir agentes de IA con estado.\n" \
           f"2. Fue creado por LangChain Inc.\n" \
           f"3. La versión 0.2 fue lanzada en 2024."

@tool
def calculator(expression: str) -> str:
    """Evaluar una expresión matemática. Usar sintaxis Python: +, -, *, /, **, //, %."""
    try:
        safe_dict = {"__builtins__": {}}
        result = eval(expression, safe_dict)
        return str(result)
    except Exception as e:
        return f"Error de cálculo: {e}"

@tool
def get_timezone(city: str) -> str:
    """Obtener la zona horaria para una ciudad determinada."""
    timezones = {
        "new york": "America/New_York (UTC-5)",
        "london": "Europe/London (UTC+0)",
        "tokyo": "Asia/Tokyo (UTC+9)",
        "paris": "Europe/Paris (UTC+1)",
        "sydney": "Australia/Sydney (UTC+11)"
    }
    return timezones.get(city.lower(), f"Zona horaria no encontrada para {city}")
```

---

## Paso 3: Inicializar LLM y Enlaces de Herramientas

```python
llm = ChatOpenAI(model="gpt-4o-mini")

all_tools = [web_search, calculator, get_timezone]
llm_with_tools = llm.bind_tools(all_tools)
tool_executor = ToolExecutor(all_tools)
```

---

## Paso 4: Definir Estado

```python
class AgentState(TypedDict):
    messages: Annotated[List[Any], add]
    question: str
    category: str
    tool_results: List[str]
    final_answer: str
    error: str
```

---

## Paso 5: Definir Nodos

```python
def classify_question(state: AgentState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Clasifica la pregunta en exactamente una categoría:\n"
                   "- 'web_search': preguntas sobre noticias, hechos, personas, conceptos\n"
                   "- 'calculator': problemas matemáticos, cálculos, ecuaciones\n"
                   "- 'chat': conversación general, opiniones, explicaciones\n\n"
                   "Responde SOLO con el nombre de la categoría."),
        ("human", "{question}")
    ])
    chain = prompt | llm | StrOutputParser()
    category = chain.invoke({"question": state["question"]}).strip().lower()
    if category not in ["web_search", "calculator", "chat"]:
        category = "chat"
    return {"category": category, "messages": [HumanMessage(state["question"])]}

def web_search_node(state: AgentState) -> dict:
    try:
        result = tool_executor.invoke({
            "name": "web_search",
            "args": {"query": state["question"]},
            "id": "search_1",
            "type": "tool_call"
        })
        return {
            "tool_results": state["tool_results"] + [str(result)],
            "messages": [ToolMessage(content=str(result), tool_call_id="search_1")]
        }
    except Exception as e:
        return {"error": f"Búsqueda web falló: {e}"}

def calculator_node(state: AgentState) -> dict:
    try:
        result = tool_executor.invoke({
            "name": "calculator",
            "args": {"expression": state["question"]},
            "id": "calc_1",
            "type": "tool_call"
        })
        return {
            "tool_results": state["tool_results"] + [str(result)],
            "messages": [ToolMessage(content=str(result), tool_call_id="calc_1")]
        }
    except Exception as e:
        return {"error": f"Calculadora falló: {e}"}

def agent_node(state: AgentState) -> dict:
    context = "\n".join(state["tool_results"]) if state["tool_results"] else "No se necesitaron herramientas."
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Eres un asistente de Q&A útil. Responde a la pregunta del usuario "
                   "basándote en el contexto disponible. Sé conciso y preciso.\n\n"
                   "Contexto:\n{context}"),
        ("human", "{question}")
    ])
    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"context": context, "question": state["question"]})
    return {"final_answer": answer, "messages": [AIMessage(content=answer)]}
```

---

## Paso 6: Construir el Grafo

```python
builder = StateGraph(AgentState)
builder.add_node("classify", classify_question)
builder.add_node("web_search", web_search_node)
builder.add_node("calculator", calculator_node)
builder.add_node("agent", agent_node)

builder.add_edge(START, "classify")

builder.add_conditional_edges("classify", lambda s: s["category"], {
    "web_search": "web_search",
    "calculator": "calculator",
    "chat": "agent"
})

builder.add_edge("web_search", "agent")
builder.add_edge("calculator", "agent")
builder.add_edge("agent", END)

app = builder.compile()
```

---

## Paso 7: Ejecutar el Agente

```python
def ask_question(question: str) -> str:
    result = app.invoke({
        "messages": [],
        "question": question,
        "category": "",
        "tool_results": [],
        "final_answer": "",
        "error": ""
    })
    return result["final_answer"]

print(ask_question("¿Qué es LangGraph?"))
print(ask_question("¿Cuánto es 245 * 37?"))
print(ask_question("¿Qué zona horaria tiene Tokio?"))
print(ask_question("¿Cuál es el sentido de la vida?"))
print(ask_question("Resuelve: (15 + 7) * 2"))
```

[!SUCCESS]
Tu agente ahora enruta preguntas inteligentemente a la herramienta correcta y sintetiza una respuesta final. Este es el patrón central detrás de todos los agentes LangGraph.

---

## Preguntas de Práctica

```question
{
  "id": "lg-beginner-10-q1",
  "type": "multiple-choice",
  "question": "¿Cuál es el primer nodo ejecutado en el proyecto del agente de Q&A?",
  "options": ["web_search", "agent", "classify", "calculator"],
  "correct": 2,
  "explanation": "El nodo classify se ejecuta primero para determinar la categoría de la pregunta del usuario."
}
```

```question
{
  "id": "lg-beginner-10-q2",
  "type": "multiple-choice",
  "question": "¿Qué sucede después de que un nodo de herramienta (web_search o calculator) se ejecuta?",
  "options": [
    "El grafo termina inmediatamente",
    "La ejecución va al nodo agente para síntesis final",
    "La ejecución vuelve a classify",
    "El resultado de la herramienta se devuelve directamente al usuario"
  ],
  "correct": 1,
  "explanation": "Después de que una herramienta se ejecuta, el nodo agente recibe los resultados y sintetiza una respuesta final."
}
```

```question
{
  "id": "lg-beginner-10-q3",
  "type": "multiple-choice",
  "question": "¿Cuál es la categoría de fallback por defecto en el nodo de clasificación?",
  "options": ["web_search", "calculator", "chat", "error"],
  "correct": 2,
  "explanation": "Si el LLM devuelve una categoría inesperada, el valor por defecto es 'chat' para un manejo general seguro."
}
```

```question
{
  "id": "lg-beginner-10-q4",
  "type": "multiple-choice",
  "question": "¿Qué reductor de estado se usa para el campo messages?",
  "options": ["replace", "add (append)", "merge", "overwrite"],
  "correct": 1,
  "explanation": "messages usa Annotated[List, add] para que cada mensaje se anexe al historial de la conversación."
}
```

```question
{
  "id": "lg-beginner-10-q5",
  "type": "multiple-choice",
  "question": "¿Por qué deberías establecer recursion_limit al invocar el grafo?",
  "options": [
    "Para limitar el número de hilos paralelos",
    "Para prevenir bucles infinitos si la lógica de enrutamiento tiene un error",
    "Para reducir el uso de tokens",
    "Para acelerar la ejecución"
  ],
  "correct": 1,
  "explanation": "recursion_limit previene la ejecución infinita limitando el número total de ejecuciones de nodos."
}
```

```question
{
  "id": "lg-beginner-10-q6",
  "type": "multiple-choice",
  "question": "¿Qué tipo de arista determina qué nodo de herramienta se ejecuta?",
  "options": ["add_edge()", "add_conditional_edges()", "set_entry_point()", "set_finish_point()"],
  "correct": 1,
  "explanation": "add_conditional_edges en el nodo classify enruta a la herramienta apropiada basándose en la categoría."
}
```

```question
{
  "id": "lg-beginner-10-q7",
  "type": "multiple-choice",
  "question": "¿Cómo accede el nodo agente a las salidas de las herramientas?",
  "options": [
    "A través del campo tool_results en el estado",
    "Llamando a las herramientas de nuevo",
    "A través de una API separada",
    "Las salidas de las herramientas se almacenan en un archivo"
  ],
  "correct": 0,
  "explanation": "Los nodos de herramienta escriben en state['tool_results'], que el nodo agente lee para sintetizar la respuesta."
}
```

```question
{
  "id": "lg-beginner-10-q8",
  "type": "multiple-choice",
  "question": "¿A qué categoría se enruta una pregunta matemática como '¿Cuánto es 2+2?'?",
  "options": ["web_search", "calculator", "chat", "classify"],
  "correct": 1,
  "explanation": "Las preguntas matemáticas se clasifican como 'calculator' y se enrutan al nodo calculadora."
}
```

```question
{
  "id": "lg-beginner-10-q9",
  "type": "multiple-choice",
  "question": "¿Cuál es el propósito de envolver app.invoke() en try/except?",
  "options": [
    "Para hacer el código más lento",
    "Para manejar errores inesperados gracefulmente y devolver un mensaje amigable",
    "Para prevenir la compilación del grafo",
    "Para registrar ejecuciones exitosas"
  ],
  "correct": 1,
  "explanation": "try/except alrededor de invoke() captura excepciones y devuelve un mensaje de error amigable al usuario."
}
```

```question
{
  "id": "lg-beginner-10-q10",
  "type": "multiple-choice",
  "question": "¿Qué hace ToolExecutor en este proyecto?",
  "options": [
    "Valida argumentos de herramientas",
    "Enruta llamadas de herramientas a la función correcta por nombre",
    "Genera esquemas de herramientas para el LLM",
    "Ejecuta herramientas en un sandbox"
  ],
  "correct": 1,
  "explanation": "ToolExecutor toma un tool_call dict e invoca automáticamente la función correcta basándose en el campo 'name'."
}
```

---

[!SUCCESS]
### Puntos Clave
- El agente de Q&A usa clasificación → enrutamiento → ejecución de herramientas → síntesis
- El estado fluye a través de cada nodo, acumulando resultados a lo largo del camino
- El reductor `add` en messages anexa al historial de la conversación
- Las aristas condicionales permiten enrutamiento inteligente basado en la categoría
- El nodo agente sintetiza resultados de herramientas en una respuesta final coherente
- Usa siempre try/except y recursion_limit para manejo robusto de errores
- Esta arquitectura es la base para todos los agentes LangGraph de producción
