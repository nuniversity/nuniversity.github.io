---
title: "Nodos y Aristas"
description: "Aprende los dos componentes fundamentales de LangGraph: nodos (funciones de Python) y aristas (conexiones entre nodos)."
order: 4
duration: "30 minutos"
difficulty: "iniciante"
---

# Nodos y Aristas

Los dos componentes fundamentales de cualquier grafo LangGraph son **nodos** y **aristas**. Los nodos hacen el trabajo; las aristas definen el orden y flujo.

---

## Nodos

Los nodos son funciones de Python que reciben el estado y devuelven actualizaciones:

```python
def mi_nodo(state: MiEstado) -> dict:
    valor_actual = state["campo"]
    nuevo_valor = transformar(valor_actual)
    return {"campo": nuevo_valor}
```

### Patrones de Nodos

```python
# 1. Nodo de procesamiento
def procesar(state: State) -> dict:
    return {"resultado": state["entrada"].upper()}

# 2. Nodo LLM
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini")

def responder(state: State) -> dict:
    respuesta = llm.invoke(state["mensajes"])
    return {"respuesta": respuesta.content}

# 3. Nodo de herramienta
from langchain_core.tools import tool

@tool
def buscar_clima(ciudad: str) -> str:
    """Obtener el clima de una ciudad."""
    return f"22°C en {ciudad}"

def nodo_clima(state: State) -> dict:
    resultado = buscar_clima.invoke({"ciudad": state["ciudad"]})
    return {"clima": resultado}

# 4. Nodo de enrutamiento
def clasificar(state: State) -> dict:
    if state["consulta"].startswith("clima"):
        return {"ruta": "manejador_clima"}
    return {"ruta": "manejador_general"}
```

[!NOTE]
Los nodos pueden contener cualquier código de Python — llamadas LLM, APIs, cálculo, E/S de archivos, etc. El grafo no se preocupa por lo que hace el nodo, solo por las actualizaciones de estado que devuelve.

---

## Aristas

Las aristas conectan nodos y determinan el orden de ejecución:

```python
builder.add_edge("A", "B")

builder.add_conditional_edges(
    "clasificar",
    lambda state: state["ruta"],
    {"manejar_clima": "clima", "manejar_general": "general"}
)

builder.add_edge(START, "primer_nodo")
builder.add_edge("ultimo_nodo", END)
```

### Tipos de Aristas

| Tipo | Método | Propósito |
| :--- | :--- | :--- |
| Normal | `add_edge(origen, destino)` | Flujo fijo de A a B |
| Condicional | `add_conditional_edges(origen, router, mapeo)` | Flujo dinámico basado en estado |
| START | `add_edge(START, nodo)` | Define el punto de entrada |
| END | `add_edge(nodo, END)` | Define el punto de salida |

---

## Ejemplo: Procesamiento en Tres Pasos

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class DocState(TypedDict):
    texto: str
    longitud: int
    resumen: str

def medir(state: DocState) -> dict:
    return {"longitud": len(state["texto"])}

def resumir(state: DocState) -> dict:
    texto = state["texto"]
    if len(texto) > 50:
        resumen = texto[:50] + "..."
    else:
        resumen = texto
    return {"resumen": resumen}

def formatear(state: DocState) -> dict:
    return {"texto": f"**{state['texto']}**"}

builder = StateGraph(DocState)
builder.add_node("medir", medir)
builder.add_node("resumir", resumir)
builder.add_node("formatear", formatear)

builder.add_edge(START, "medir")
builder.add_edge("medir", "resumir")
builder.add_edge("resumir", "formatear")
builder.add_edge("formatear", END)

app = builder.compile()
```

---

## Añadiendo Múltiples Aristas desde un Nodo

```python
builder.add_edge("validar", "enriquecer")
builder.add_edge("validar", "registrar")

builder.add_conditional_edges(
    "clasificar",
    router,
    {"opcion_a": "manejador_a", "opcion_b": "manejador_b"}
)
```

[!WARNING]
Las aristas normales desde un mismo nodo se ejecutan en **paralelo**. Las aristas condicionales toman **una ruta**. Se pueden mezclar ambos tipos.

---

## Mejores Prácticas con Nodos

1. **Nombra los nodos descriptivamente**: `procesar_consulta`, no `paso_1`
2. **Mantén los nodos pequeños y enfocados**: Un nodo = una responsabilidad
3. **Los nodos pueden ser reutilizables**: Usa la misma función para diferentes nodos si es apropiado
4. **Mensajes de error**: Captura excepciones y escribe el error en el estado

```python
def nodo_seguro(state: State) -> dict:
    try:
        resultado = operacion_riesgosa()
        return {"resultado": resultado}
    except Exception as e:
        return {"error": str(e), "resultado": None}
```

---

## Preguntas de Práctica

```question
{
  "id": "lg-beginner-04-q1",
  "type": "multiple-choice",
  "question": "¿Qué recibe una función de nodo en LangGraph?",
  "options": [
    "Solo los campos de estado que necesita",
    "El diccionario de estado completo",
    "La salida del nodo anterior",
    "Nada, los nodos son sin estado"
  ],
  "correct": 1,
  "explanation": "Cada función de nodo recibe el diccionario de estado completo, del cual puede leer cualquier campo."
}
```

```question
{
  "id": "lg-beginner-04-q2",
  "type": "multiple-choice",
  "question": "¿Qué tipo de arista evalúa el estado para decidir qué nodo ejecutar después?",
  "options": ["add_edge()", "add_conditional_edges()", "set_entry_point()", "set_finish_point()"],
  "correct": 1,
  "explanation": "add_conditional_edges() usa una función de enrutamiento que inspecciona el estado y devuelve el nombre del siguiente nodo."
}
```

```question
{
  "id": "lg-beginner-04-q3",
  "type": "multiple-choice",
  "question": "¿Qué constante representa el punto de entrada a un grafo?",
  "options": ["ENTRY", "BEGIN", "START", "INPUT"],
  "correct": 2,
  "explanation": "START es la constante que representa el punto de entrada del grafo."
}
```

```question
{
  "id": "lg-beginner-04-q4",
  "type": "multiple-choice",
  "question": "¿Qué sucede cuando un nodo tiene múltiples aristas normales salientes?",
  "options": [
    "Solo la primera arista se ejecuta",
    "Todas las aristas se ejecutan en paralelo",
    "Las aristas se ejecutan en orden alfabético",
    "Se lanza un error"
  ],
  "correct": 1,
  "explanation": "Múltiples aristas normales desde un nodo crean ramas paralelas."
}
```

```question
{
  "id": "lg-beginner-04-q5",
  "type": "multiple-choice",
  "question": "¿Qué debería devolver un nodo si encuentra un error?",
  "options": [
    "Lanzar una excepción",
    "Devolver None",
    "Devolver un diccionario con un campo de error",
    "Llamar a exit()"
  ],
  "correct": 2,
  "explanation": "Captura excepciones y escribe el error en un campo del estado."
}
```

---

[!SUCCESS]
### Puntos Clave
- Nodos: funciones de Python que reciben el estado y devuelven actualizaciones
- Aristas normales: flujo de ejecución fijo (add_edge)
- Aristas condicionales: enrutamiento dinámico (add_conditional_edges)
- START y END son constantes integradas para entrada y salida del grafo
- Múltiples aristas normales = ejecución paralela
- Las aristas condicionales toman una ruta única basada en el estado
- Nombra los nodos descriptivamente y mantenlos enfocados en una responsabilidad
