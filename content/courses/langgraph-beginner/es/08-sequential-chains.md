---
title: "Cadenas Secuenciales"
description: "Aprende patrones de ejecución secuencial en LangGraph, pasando estado entre nodos y usando reductores de estado para gestión avanzada de estado."
order: 8
duration: "35 minutos"
difficulty: "iniciante"
---

# Cadenas Secuenciales

Aunque LangGraph soporta topologías de grafo complejas, muchas aplicaciones se construyen sobre **cadenas secuenciales** simples — una secuencia lineal de nodos donde cada paso construye sobre el anterior.

---

## Ejecución Secuencial en LangGraph

Una cadena secuencial es un pipeline lineal: cada nodo se ejecuta después de que el anterior se completa, pasando estado a lo largo del camino.

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
    analysis = f"Análisis de '{state['cleaned']}': {len(state['cleaned'])} caracteres"
    return {"analyzed": analysis}

def format(state: PipelineState) -> dict:
    return {"result": f"=== RESULTADO ===\n{state['analyzed']}\n=== FIN ==="}

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
Cada nodo solo lee los campos que necesita del estado y escribe los campos que produce. La topología del pipeline garantiza que se ejecuten en el orden correcto.

---

## Pasando Estado Entre Nodos

El estado fluye automáticamente. Cuando el nodo A escribe `{"cleaned": valor}`, el nodo B puede leer `state["cleaned"]`.

```python
def node_a(state: State) -> dict:
    return {"intermediate": "Procesado por A"}

def node_b(state: State) -> dict:
    intermediate = state["intermediate"]
    return {"result": f"B recibió: {intermediate}"}
```

### Reglas de Flujo de Estado

| Escenario | Comportamiento |
| :--- | :--- |
| A escribe clave X, B lee X | B ve el valor de A |
| B escribe clave X después de A | El valor de A se sobrescribe |
| C escribe clave Y, D no toca Y | D ve el valor de C para Y |
| Ningún nodo escribe clave Y | Y mantiene su valor inicial |

---

## Reductores de Estado

Por defecto, cuando un nodo escribe en una clave de estado, **reemplaza** el valor. Los reductores cambian este comportamiento.

```python
from typing import Annotated
from typing_extensions import TypedDict
from operator import add

class AccumState(TypedDict):
    messages: Annotated[list, add]
    total: int

def step_1(state: AccumState) -> dict:
    return {"messages": ["Paso 1 completo"], "total": 10}

def step_2(state: AccumState) -> dict:
    return {"messages": ["Paso 2 completo"], "total": state["total"] + 20}

# Resultado: messages = ["Paso 1 completo", "Paso 2 completo"]
# Resultado: total = 30
```

[!WARNING]
El reductor `add` solo funciona con listas. Usa el operador `+` de Python, así que ambos lados deben ser listas.

---

## Fan-Out y Fan-In

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
builder.add_edge("validate", "search_db")
builder.add_edge("search_web", "merge")
builder.add_edge("search_db", "merge")
builder.add_edge("merge", END)
```

[!SUCCESS]
Fan-out con ramas paralelas, luego fan-in para fusionar resultados. Este patrón combina el poder de cadenas secuenciales con procesamiento paralelo.

---

## Comparación: LangChain vs LangGraph

| Aspecto | LangChain Chain | LangGraph Secuencial |
| :--- | :--- | :--- |
| Definición | `chain = A \| B \| C` | `add_edge(A, B); add_edge(B, C)` |
| Paso de estado | Cada salida es la siguiente entrada | Objeto de estado compartido |
| Acceso intermedio | Perdido tras ejecutar la chain | Disponible en el estado |
| Depuración | Difícil | Fácil (streaming por nodo) |
| Añadir pasos | Requiere reconstruir la chain | Solo añadir edge |
| Recuperación de errores | La chain falla completamente | Manejo por nodo |

---

## Preguntas de Práctica

```question
{
  "id": "lg-beginner-08-q1",
  "type": "multiple-choice",
  "question": "¿Cómo fluye el estado en una cadena secuencial de LangGraph?",
  "options": [
    "Cada nodo tiene su propio estado aislado",
    "El estado es compartido — cada nodo lee escrituras anteriores y añade las suyas",
    "El estado se reinicia entre cada nodo",
    "El estado fluye hacia atrás, del último nodo al primero"
  ],
  "correct": 1,
  "explanation": "Todos los nodos comparten un único objeto de estado. Cada nodo lee valores escritos por nodos anteriores y escribe nuevos valores."
}
```

```question
{
  "id": "lg-beginner-08-q2",
  "type": "multiple-choice",
  "question": "¿Cuál es el comportamiento por defecto cuando dos nodos escriben en la misma clave de estado?",
  "options": [
    "Los valores se anexan",
    "Los valores se fusionan",
    "La última escritura gana (reemplaza la anterior)",
    "Se lanza un error"
  ],
  "correct": 2,
  "explanation": "La actualización de estado por defecto es reemplazar — el último nodo que escribe una clave determina su valor final."
}
```

```question
{
  "id": "lg-beginner-08-q3",
  "type": "multiple-choice",
  "question": "¿Cómo haces que un campo de lista se anexe en lugar de reemplazar?",
  "options": [
    "Usa Annotated[list, add] en la definición de estado",
    "Llama a list.append() en el nodo",
    "Establece reducer='append' en el campo",
    "Las listas siempre se anexan por defecto"
  ],
  "correct": 0,
  "explanation": "Annotated[list, add] usa el reductor operator.add para anexar entradas a la lista en lugar de reemplazar."
}
```

```question
{
  "id": "lg-beginner-08-q4",
  "type": "multiple-choice",
  "question": "¿Qué sucede cuando dos aristas apuntan al mismo nodo (fan-in)?",
  "options": [
    "El nodo se ejecuta dos veces",
    "El nodo se ejecuta una vez después de que ambos nodos entrantes se completen",
    "Solo se usa la primera entrada que llega",
    "Se lanza un error"
  ],
  "correct": 1,
  "explanation": "Fan-in: el nodo destino espera que todos los nodos entrantes se completen, luego recibe el estado fusionado."
}
```

```question
{
  "id": "lg-beginner-08-q5",
  "type": "multiple-choice",
  "question": "En una cadena secuencial, ¿cuándo comienza el siguiente nodo?",
  "options": [
    "Inmediatamente después de que el nodo anterior comienza",
    "Después de que el nodo anterior se completa y devuelve sus actualizaciones",
    "Después de un retraso de tiempo fijo",
    "Cuando se activa manualmente"
  ],
  "correct": 1,
  "explanation": "Cada nodo espera a que el anterior se complete. La ejecución está estrictamente ordenada por las aristas."
}
```

```question
{
  "id": "lg-beginner-08-q6",
  "type": "multiple-choice",
  "question": "¿Qué ventaja tiene una cadena secuencial de LangGraph sobre una chain pipe de LangChain?",
  "options": [
    "LangGraph es más rápido",
    "El estado intermedio es accesible y depurable entre nodos",
    "LangGraph soporta más LLMs",
    "No hay ventaja"
  ],
  "correct": 1,
  "explanation": "LangGraph mantiene todo el estado intermedio entre nodos, haciéndolo depurable, inspeccionable y recuperable."
}
```

```question
{
  "id": "lg-beginner-08-q7",
  "type": "multiple-choice",
  "question": "Si el nodo A escribe 'key1' y el nodo B escribe 'key2', ¿puede el nodo C leer ambos?",
  "options": [
    "Sí, el estado contiene todas las claves de todos los nodos",
    "No, cada nodo solo ve sus propias escrituras",
    "Solo si C los solicita explícitamente",
    "No, el estado tiene ámbito por nodo"
  ],
  "correct": 0,
  "explanation": "El estado acumula todas las claves de todos los nodos. El nodo C puede leer tanto key1 como key2."
}
```

```question
{
  "id": "lg-beginner-08-q8",
  "type": "multiple-choice",
  "question": "¿Qué operador usa el reductor 'add' para listas?",
  "options": ["+ (concatenación)", "append()", "extend()", "merge()"],
  "correct": 0,
  "explanation": "El reductor 'add' usa el operador + de Python, así que ambos operandos deben ser listas que se concatenan."
}
```

---

[!SUCCESS]
### Puntos Clave
- Las cadenas secuenciales son pipelines lineales: cada nodo se ejecuta después del anterior
- El estado pasa automáticamente entre nodos a través del objeto de estado compartido
- La actualización de estado por defecto es reemplazar; usa Annotated[list, add] para anexar
- Fan-out permite paralelización; fan-in sincroniza ramas paralelas
- Las cadenas secuenciales en LangGraph ofrecen mejor depuración que las chains pipe de LangChain
- Los reductores de estado controlan cómo se combinan múltiples escrituras en la misma clave
- Añade puntos de enrutamiento condicional para injectar lógica de decisión
