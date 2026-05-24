---
title: "Herramientas Básicas"
description: "Aprende a crear y usar herramientas en LangGraph — desde funciones Python simples hasta APIs externas — y cómo los agentes las ejecutan basándose en decisiones del LLM."
order: 7
duration: "35 minutos"
difficulty: "iniciante"
---

# Herramientas Básicas

Las herramientas son lo que hace que los agentes de IA sean útiles. Sin herramientas, un LLM solo puede generar texto. Con herramientas, un agente puede buscar en la web, hacer cálculos, consultar bases de datos e interactuar con el mundo real.

---

## ¿Qué es una Herramienta?

Una herramienta es una función de Python con:

1. Un **nombre** (el nombre de la función)
2. Una **descripción** (el docstring — el LLM la usa para decidir)
3. **Parámetros** tipados (el LLM genera los argumentos)
4. Un **valor de retorno** (enviado de vuelta al LLM)

```python
from langchain_core.tools import tool

@tool
def obtener_clima(ciudad: str) -> str:
    """Obtener el clima actual para una ciudad específica."""
    # Llamar a una API de clima...
    return f"23°C, soleado en {ciudad}"

# El LLM ve esto como:
# Nombre: obtener_clima
# Descripción: Obtener el clima actual para una ciudad específica.
# Parámetros: {"ciudad": {"type": "string"}}
```

[!NOTE]
El docstring de la herramienta es el **manual de instrucciones para el LLM**. Sé descriptivo sobre qué hace la herramienta y cuándo usarla. El LLM lo lee para decidir si llamar a la herramienta.

---

## Definiendo Herramientas

```python
from langchain_core.tools import tool
from typing import List, Optional

# Herramienta simple
@tool
def buscar_web(consulta: str) -> str:
    """Buscar en la web información actual. Úsalo para noticias, hechos y conocimiento general."""
    return f"Resultados de búsqueda para: {consulta}"

# Herramienta con lógica
@tool
def calculadora(expresion: str) -> str:
    """Evaluar una expresión matemática. Usa sintaxis de Python: +, -, *, /, **, //, %."""
    try:
        return str(eval(expresion, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"Error: {e}"

# Herramienta con múltiples parámetros
@tool
def enviar_correo(destinatario: str, asunto: str, cuerpo: str) -> str:
    """Enviar un correo electrónico. Úsalo para notificar o comunicarte con usuarios."""
    return f"Correo enviado a {destinatario}: {asunto}"
```

### Decorador @tool vs Clase BaseTool

```python
from langchain_core.tools import tool, BaseTool
from pydantic import BaseModel, Field

# Enfoque 1: Decorador (recomendado para la mayoría de los casos)
@tool
def mi_herramienta(param: str) -> str:
    """Descripción de la herramienta."""
    return f"Procesado: {param}"

# Enfoque 2: Clase BaseTool (para control avanzado)
class MiHerramientaPersonalizada(BaseTool):
    name: str = "mi_herramienta"
    description: str = "Descripción de la herramienta."

    def _run(self, param: str) -> str:
        return f"Procesado: {param}"

    async def _arun(self, param: str) -> str:
        raise NotImplementedError("No async")
```

[!TIP]
Usa el decorador `@tool` para el 90% de los casos. Cambia a `BaseTool` solo cuando necesites configuración compleja, herencia o lógica de validación personalizada.

---

## Vinculando Herramientas al LLM

Una vez definidas las herramientas, vincúlalas al LLM:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

# Lista de herramientas
herramientas = [buscar_web, calculadora, obtener_clima]

# Vincular al LLM
llm_con_herramientas = llm.bind_tools(herramientas)

# Ahora el LLM puede solicitar herramientas
respuesta = llm_con_herramientas.invoke("¿Cuánto es 25 * 4?")
print(respuesta.tool_calls)
# → [{"name": "calculadora", "args": {"expresion": "25 * 4"}, "id": "call_123"}]
```

---

## ToolExecutor en LangGraph

`ToolExecutor` ejecuta llamadas a herramientas automáticamente:

```python
from langgraph.prebuilt import ToolExecutor

# Crear ejecutor con todas las herramientas
ejecutor_herramientas = ToolExecutor(herramientas)

# El ejecutor acepta tool_calls del LLM
solicitud = {
    "name": "calculadora",
    "args": {"expresion": "25 * 4"},
    "id": "call_123",
    "type": "tool_call"
}

resultado = ejecutor_herramientas.invoke(solicitud)
print(resultado)  # "100"
```

---

## Grafo Simple con Herramientas

```python
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolExecutor
from typing_extensions import TypedDict
from typing import List

class AgenteState(TypedDict):
    mensajes: List
    consulta: str
    resultado_herramienta: str
    respuesta_final: str

llm = ChatOpenAI(model="gpt-4o-mini")
herramientas = [calculadora, buscar_web]
llm_con_herramientas = llm.bind_tools(herramientas)
ejecutor = ToolExecutor(herramientas)

def llamar_llm(state: AgenteState) -> dict:
    respuesta = llm_con_herramientas.invoke(state["consulta"])
    return {"mensajes": state["mensajes"] + [respuesta]}

def ejecutar_herramientas(state: AgenteState) -> dict:
    ultimo_mensaje = state["mensajes"][-1]
    if hasattr(ultimo_mensaje, 'tool_calls') and ultimo_mensaje.tool_calls:
        resultados = []
        for tc in ultimo_mensaje.tool_calls:
            r = ejecutor.invoke(tc)
            resultados.append(str(r))
        return {"resultado_herramienta": "\n".join(resultados)}
    return {"resultado_herramienta": ""}

def decidir_ruta(state: AgenteState) -> str:
    ultimo_mensaje = state["mensajes"][-1]
    if hasattr(ultimo_mensaje, 'tool_calls') and ultimo_mensaje.tool_calls:
        return "herramientas"
    return "fin"

builder = StateGraph(AgenteState)
builder.add_node("llm", llamar_llm)
builder.add_node("herramientas", ejecutar_herramientas)
builder.add_edge(START, "llm")
builder.add_conditional_edges("llm", decidir_ruta, {
    "herramientas": "herramientas",
    "fin": END
})
builder.add_edge("herramientas", "llm")

app = builder.compile()
```

[!SUCCESS]
¡Este es el bucle **ReAct** (Razonamiento + Acción)! El LLM razona, decide si necesita herramientas, las ejecuta y repite hasta que puede responder. Es el patrón fundamental de los agentes LangGraph.

---

## Preguntas de Práctica

```question
{
  "id": "lg-beginner-07-q1",
  "type": "multiple-choice",
  "question": "¿Cuál es el propósito del docstring de una herramienta?",
  "options": [
    "Documentar el código para desarrolladores",
    "Decirle al LLM qué hace la herramienta y cuándo usarla",
    "Definir los tipos de parámetros",
    "Establecer el valor de retorno"
  ],
  "correct": 1,
  "explanation": "El docstring se envía al LLM como descripción de la herramienta. El LLM lo usa para decidir si llamar a la herramienta."
}
```

```question
{
  "id": "lg-beginner-07-q2",
  "type": "multiple-choice",
  "question": "¿Qué método vincula herramientas a un LLM?",
  "options": ["llm.add_tools()", "llm.bind_tools()", "llm.attach_tools()", "llm.register_tools()"],
  "correct": 1,
  "explanation": "llm.bind_tools(lista_herramientas) registra herramientas con el LLM para que pueda solicitarlas."
}
```

```question
{
  "id": "lg-beginner-07-q3",
  "type": "multiple-choice",
  "question": "¿Qué contiene response.tool_calls cuando el LLM decide usar una herramienta?",
  "options": [
    "Los resultados de la herramienta",
    "El nombre de la herramienta, argumentos y un ID",
    "El código fuente de la herramienta",
    "Un mensaje de error"
  ],
  "correct": 1,
  "explanation": "tool_calls contiene una lista de diccionarios con 'name', 'args' y 'id' para cada herramienta que el LLM quiere llamar."
}
```

```question
{
  "id": "lg-beginner-07-q4",
  "type": "multiple-choice",
  "question": "¿Qué hace ToolExecutor en LangGraph?",
  "options": [
    "Valida los argumentos de las herramientas",
    "Ejecuta llamadas a herramientas basándose en tool_calls del LLM",
    "Entrena modelos de lenguaje",
    "Crea nuevas herramientas"
  ],
  "correct": 1,
  "explanation": "ToolExecutor toma una tool_call del LLM y ejecuta la función de herramienta correspondiente con los argumentos proporcionados."
}
```

```question
{
  "id": "lg-beginner-07-q5",
  "type": "multiple-choice",
  "question": "¿Cuándo deberías usar BaseTool en lugar del decorador @tool?",
  "options": [
    "Siempre, BaseTool es mejor",
    "Cuando necesitas configuración compleja o lógica de validación personalizada",
    "Nunca, @tool es siempre superior",
    "Solo para herramientas sin parámetros"
  ],
  "correct": 1,
  "explanation": "Usa @tool para herramientas simples; BaseTool para herencia, configuración compleja o lógica de validación personalizada."
}
```

```question
{
  "id": "lg-beginner-07-q6",
  "type": "multiple-choice",
  "question": "¿Qué patrón implementa el flujo LLM → herramientas → LLM?",
  "options": [
    "Pipeline lineal",
    "Bucle ReAct (Razonamiento + Acción)",
    "Procesamiento por lotes",
    "Streaming"
  ],
  "correct": 1,
  "explanation": "El bucle ReAct es el patrón donde el LLM razona, llama herramientas si es necesario, recibe resultados y razona de nuevo."
}
```

---

[!SUCCESS]
### Puntos Clave
- Las herramientas son funciones de Python con @tool, docstring y parámetros tipados
- bind_tools() registra herramientas con el LLM para que pueda solicitarlas
- El LLM genera tool_calls cuando decide que necesita una herramienta
- ToolExecutor ejecuta llamadas a herramientas automáticamente
- El bucle ReAct (LLM → herramientas → LLM) es el patrón central de los agentes
- El docstring de la herramienta es la descripción que el LLM usa para decidir
- @tool es para herramientas simples; BaseTool para necesidades avanzadas
