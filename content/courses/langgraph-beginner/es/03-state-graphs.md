---
title: "Grafos de Estado"
description: "Define esquemas de estado, construye tu primer grafo de estado y entiende cómo fluye el estado a través de los nodos en LangGraph."
order: 3
duration: "30 minutos"
difficulty: "iniciante"
---

# Grafos de Estado

En LangGraph, el **estado** es el ciudadano de primera clase. Todo el flujo de datos — leer, escribir, pasar entre nodos — ocurre a través de un único objeto de estado compartido.

---

## ¿Qué es un Grafo de Estado?

Un StateGraph es un grafo donde cada nodo recibe el estado actual, realiza algún trabajo y devuelve actualizaciones al estado.

```python
from langgraph.graph import StateGraph
from typing_extensions import TypedDict

class MiEstado(TypedDict):
    nombre: str
    edad: int
    saludo: str

builder = StateGraph(MiEstado)
```

---

## Definiendo el Estado

Usa `TypedDict` para definir qué campos contiene tu estado y sus tipos:

```python
from typing_extensions import TypedDict
from typing import List, Optional

class EstadoAgente(TypedDict):
    mensajes: List[str]
    turno_actual: int
    error: Optional[str]
    resultado_final: Optional[str]
```

---

## Construyendo un Grafo con Estado

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class ContadorEstado(TypedDict):
    contador: int
    mensaje: str

def incrementar(state: ContadorEstado) -> dict:
    return {"contador": state["contador"] + 1}

def mostrar(state: ContadorEstado) -> dict:
    return {"mensaje": f"El contador es: {state['contador']}"}

builder = StateGraph(ContadorEstado)
builder.add_node("incrementar", incrementar)
builder.add_node("mostrar", mostrar)
builder.add_edge(START, "incrementar")
builder.add_edge("incrementar", "mostrar")
builder.add_edge("mostrar", END)

app = builder.compile()

resultado = app.invoke({"contador": 0, "mensaje": ""})
print(resultado)
# → {"contador": 1, "mensaje": "El contador es: 1"}
```

[!NOTE]
Cada nodo devuelve un diccionario de **actualizaciones**. Estas se fusionan con el estado existente. Los campos no mencionados en la actualización permanecen sin cambios.

---

## Cómo Fluye el Estado

```
Estado Inicial:  {"contador": 0, "mensaje": ""}
       │
       ▼
Nodo: incrementar()
       │
       ▼
Actualización:   {"contador": 1}
       │
       ▼
Estado:          {"contador": 1, "mensaje": ""}
       │
       ▼
Nodo: mostrar()
       │
       ▼
Actualización:   {"mensaje": "El contador es: 1"}
       │
       ▼
Estado Final:    {"contador": 1, "mensaje": "El contador es: 1"}
```

---

## Acumulando Estado a Través de Múltiples Nodos

```python
from operator import add
from typing import Annotated, List

class EstadoLista(TypedDict):
    items: Annotated[List[str], add]

def agregar_a(state: EstadoLista) -> dict:
    return {"items": ["manzana"]}

def agregar_b(state: EstadoLista) -> dict:
    return {"items": ["pera"]}

builder = StateGraph(EstadoLista)
builder.add_node("a", agregar_a)
builder.add_node("b", agregar_b)
builder.add_edge(START, "a")
builder.add_edge("a", "b")
builder.add_edge("b", END)

app = builder.compile()

resultado = app.invoke({"items": []})
print(resultado["items"])  # ["manzana", "pera"]
```

[!TIP]
Usa `Annotated[type, add]` para anexar a listas en lugar de reemplazar. El operador `add` concatena listas.

---

## Estado con Valores por Defecto

```python
from dataclasses import dataclass, field
from typing import List

@dataclass
class EstadoDataClass:
    mensajes: List[str] = field(default_factory=list)
    contador: int = 0
    depuracion: bool = False

def nodo_procesar(state: EstadoDataClass) -> dict:
    return {"contador": state.contador + 1}

from langgraph.graph import StateGraph, START, END

builder = StateGraph(EstadoDataClass)
builder.add_node("procesar", nodo_procesar)
builder.add_edge(START, "procesar")
builder.add_edge("procesar", END)

app = builder.compile()

resultado = app.invoke(EstadoDataClass())
print(resultado)  # mensajes=[], contador=1, depuracion=False
```

---

## Preguntas de Práctica

```question
{
  "id": "lg-beginner-03-q1",
  "type": "multiple-choice",
  "question": "¿Qué define el esquema de estado en un StateGraph de LangGraph?",
  "options": [
    "La estructura de datos que cada nodo lee y modifica",
    "La conexión entre nodos",
    "El modelo de lenguaje a utilizar",
    "Las herramientas disponibles"
  ],
  "correct": 0,
  "explanation": "El esquema de estado define los campos, tipos y valores por defecto del diccionario de estado compartido."
}
```

```question
{
  "id": "lg-beginner-03-q2",
  "type": "multiple-choice",
  "question": "¿Qué devuelve un nodo de LangGraph?",
  "options": [
    "Un string",
    "Un diccionario de actualizaciones de estado",
    "Un nuevo StateGraph",
    "Un mensaje de chat"
  ],
  "correct": 1,
  "explanation": "Los nodos devuelven un diccionario de actualizaciones que se fusionan con el estado actual."
}
```

```question
{
  "id": "lg-beginner-03-q3",
  "type": "multiple-choice",
  "question": "¿Cómo se añade un nodo a un StateGraph?",
  "options": ["add_node()", "add_vertex()", "create_node()", "register_node()"],
  "correct": 0,
  "explanation": "builder.add_node(nombre, funcion) registra una función como nodo en el grafo de estado."
}
```

```question
{
  "id": "lg-beginner-03-q4",
  "type": "multiple-choice",
  "question": "¿Qué ocurre si un nodo solo actualiza un campo del estado?",
  "options": [
    "Todos los demás campos se reinician",
    "Los demás campos permanecen sin cambios",
    "El grafo lanza un error",
    "El nodo se salta la actualización"
  ],
  "correct": 1,
  "explanation": "Las actualizaciones de estado se fusionan. Los campos no mencionados en la actualización conservan sus valores existentes."
}
```

```question
{
  "id": "lg-beginner-03-q5",
  "type": "multiple-choice",
  "question": "¿Qué hace Annotated[List[str], add] en la definición de estado?",
  "options": [
    "Reemplaza la lista cada vez",
    "Anexa nuevos elementos a la lista existente",
    "Elimina duplicados de la lista",
    "Ordena la lista"
  ],
  "correct": 1,
  "explanation": "Annotated con el operador add concatena nuevas listas con la lista existente en lugar de reemplazarla."
}
```

---

[!SUCCESS]
### Puntos Clave
- El estado se define con TypedDict (o dataclass/Pydantic) y fluye a través de todos los nodos
- Cada nodo devuelve un diccionario de actualizaciones que se fusionan con el estado actual
- Las actualizaciones parciales son seguras — los campos no mencionados no cambian
- `Annotated[type, add]` permite comportamiento de anexión (concatenación de listas)
- `StateGraph` es el constructor; compila el grafo en una aplicación ejecutable
- Invocar el grafo devuelve el estado final después de que todos los nodos se ejecutan
