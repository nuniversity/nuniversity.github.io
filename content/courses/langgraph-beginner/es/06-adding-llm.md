---
title: "Añadiendo un LLM"
description: "Integra modelos de lenguaje en tus nodos LangGraph para crear agentes inteligentes que pueden razonar, responder y llamar herramientas."
order: 6
duration: "30 minutos"
difficulty: "iniciante"
---

# Añadiendo un LLM

Un grafo sin LLM es solo un pipeline de datos. Añadir un LLM transforma tu grafo en un agente inteligente que puede razonar, responder preguntas y decidir qué acciones tomar.

---

## Nodo LLM Básico

La forma más simple de añadir un LLM a un nodo:

```python
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

llm = ChatOpenAI(model="gpt-4o-mini")

class EstadoChat(TypedDict):
    mensaje_usuario: str
    respuesta: str

def nodo_llm(state: EstadoChat) -> dict:
    respuesta = llm.invoke(state["mensaje_usuario"])
    return {"respuesta": respuesta.content}

builder = StateGraph(EstadoChat)
builder.add_node("chat", nodo_llm)
builder.add_edge(START, "chat")
builder.add_edge("chat", END)
app = builder.compile()

resultado = app.invoke({"mensaje_usuario": "¿Qué es LangGraph?", "respuesta": ""})
print(resultado["respuesta"])
```

[!NOTE]
El LLM se inicializa fuera del nodo (una vez) y se usa dentro de la función del nodo. Esto evita reinicializar el modelo en cada ejecución.

---

## Añadiendo Prompts

Usa `ChatPromptTemplate` para prompts estructurados:

```python
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "Eres un experto en {tema}. Responde preguntas de manera concisa."),
    ("human", "{pregunta}")
])

class EstadoExperto(TypedDict):
    tema: str
    pregunta: str
    respuesta: str

def nodo_experto(state: EstadoExperto) -> dict:
    chain = prompt | llm | StrOutputParser()
    respuesta = chain.invoke({
        "tema": state["tema"],
        "pregunta": state["pregunta"]
    })
    return {"respuesta": respuesta}
```

---

## Múltiples LLMs en un Solo Grafo

Usa diferentes LLMs para diferentes tareas:

```python
llm_rapido = ChatOpenAI(model="gpt-4o-mini")
llm_potente = ChatOpenAI(model="gpt-4o")

def clasificar(state: State) -> dict:
    respuesta = llm_rapido.invoke(f"Clasifica: {state['consulta']}")
    return {"categoria": respuesta.content}

def analisis_profundo(state: State) -> dict:
    respuesta = llm_potente.invoke(
        f"Analiza en detalle: {state['consulta']}"
    )
    return {"analisis": respuesta.content}

# Nodo rápido → decisión → nodo potente (solo si es necesario)
```

[!TIP]
Usa modelos más pequeños (gpt-4o-mini) para clasificación y enrutamiento, y modelos más grandes (gpt-4o) para razonamiento complejo. Esto ahorra costes y velocidad.

---

## Manejo de Mensajes de Chat

Los LLMs de chat trabajan con listas de mensajes:

```python
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

class EstadoConversacion(TypedDict):
    mensajes: list
    respuesta_ia: str

def nodo_conversacion(state: EstadoConversacion) -> dict:
    respuesta = llm.invoke(state["mensajes"])
    return {
        "mensajes": state["mensajes"] + [AIMessage(content=respuesta.content)],
        "respuesta_ia": respuesta.content
    }

# Uso
initial_messages = [
    SystemMessage("Eres un asistente útil."),
    HumanMessage("¿Cuál es la capital de Francia?")
]
resultado = app.invoke({"mensajes": initial_messages, "respuesta_ia": ""})
```

---

## Nodo LLM con Herramientas

```python
from langchain_core.tools import tool

@tool
def obtener_hora(ciudad: str) -> str:
    """Obtener la hora actual para una ciudad."""
    husos = {"Madrid": "UTC+1", "Tokio": "UTC+9", "Nueva York": "UTC-5"}
    return husos.get(ciudad, "Desconocido")

llm_con_herramientas = llm.bind_tools([obtener_hora])

class EstadoHerramientas(TypedDict):
    consulta: str
    respuesta_llm: str
    solicitudes_herramientas: list

def nodo_con_herramientas(state: EstadoHerramientas) -> dict:
    respuesta = llm_con_herramientas.invoke(state["consulta"])
    return {
        "respuesta_llm": respuesta.content,
        "solicitudes_herramientas": respuesta.tool_calls if hasattr(respuesta, 'tool_calls') else []
    }
```

---

## Ejemplo Completo: Asistente de Preguntas

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

llm = ChatOpenAI(model="gpt-4o-mini")

class EstadoQA(TypedDict):
    pregunta: str
    contexto: str
    respuesta: str
    confianza: str

def recuperar_contexto(state: EstadoQA) -> dict:
    return {"contexto": f"Información relevante sobre: {state['pregunta']}"}

def generar_respuesta(state: EstadoQA) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Responde basándote en el contexto proporcionado."),
        ("human", "Contexto: {contexto}\nPregunta: {pregunta}")
    ])
    chain = prompt | llm | StrOutputParser()
    respuesta = chain.invoke({"contexto": state["contexto"], "pregunta": state["pregunta"]})
    return {"respuesta": respuesta}

def evaluar_confianza(state: EstadoQA) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Clasifica tu confianza en la respuesta como 'alta', 'media' o 'baja'."),
        ("human", "Pregunta: {pregunta}\nRespuesta: {respuesta}")
    ])
    chain = prompt | llm | StrOutputParser()
    confianza = chain.invoke({"pregunta": state["pregunta"], "respuesta": state["respuesta"]})
    return {"confianza": confianza}

builder = StateGraph(EstadoQA)
builder.add_node("recuperar", recuperar_contexto)
builder.add_node("generar", generar_respuesta)
builder.add_node("evaluar", evaluar_confianza)
builder.add_edge(START, "recuperar")
builder.add_edge("recuperar", "generar")
builder.add_edge("generar", "evaluar")
builder.add_edge("evaluar", END)
app = builder.compile()

resultado = app.invoke({
    "pregunta": "¿Qué es un decorador en Python?",
    "contexto": "",
    "respuesta": "",
    "confianza": ""
})
print(f"Respuesta: {resultado['respuesta']}")
print(f"Confianza: {resultado['confianza']}")
```

[!SUCCESS]
Este patrón — recuperar información → generar respuesta → evaluar calidad — es la base de los sistemas RAG (Retrieval-Augmented Generation).

---

## Preguntas de Práctica

```question
{
  "id": "lg-beginner-06-q1",
  "type": "multiple-choice",
  "question": "¿Dónde se debe inicializar el LLM al usarlo en un nodo LangGraph?",
  "options": [
    "Dentro de cada función de nodo",
    "Fuera de los nodos, como variable global o de módulo",
    "Dentro del grafo",
    "En el archivo de configuración"
  ],
  "correct": 1,
  "explanation": "Inicializa el LLM una vez fuera del nodo para evitar reinicializarlo en cada ejecución."
}
```

```question
{
  "id": "lg-beginner-06-q2",
  "type": "multiple-choice",
  "question": "¿Qué devuelve llm.invoke(mensajes) cuando se usan herramientas vinculadas?",
  "options": [
    "Solo el contenido del texto",
    "Un AIMessage con contenido y tool_calls opcionales",
    "Un diccionario con la respuesta",
    "Un string directamente"
  ],
  "correct": 1,
  "explanation": "llm.invoke() devuelve un AIMessage que tiene .content para texto y .tool_calls para solicitudes de herramientas."
}
```

```question
{
  "id": "lg-beginner-06-q3",
  "type": "multiple-choice",
  "question": "¿Qué es ChatPromptTemplate.from_messages()?",
  "options": [
    "Un parser de salida",
    "Un constructor de plantillas de mensajes con roles",
    "Un modelo de lenguaje",
    "Un tipo de arista"
  ],
  "correct": 1,
  "explanation": "Crea plantillas de mensajes estructurados con roles de sistema, humano y IA."
}
```

```question
{
  "id": "lg-beginner-06-q4",
  "type": "multiple-choice",
  "question": "¿Cuál es una buena práctica para elegir modelos LLM en un grafo?",
  "options": [
    "Usar el mismo modelo para todo",
    "Usar modelos pequeños para clasificación y grandes para razonamiento",
    "Usar siempre el modelo más grande",
    "Usar siempre el modelo más pequeño"
  ],
  "correct": 1,
  "explanation": "Usa modelos más rápidos/baratos para tareas simples como clasificación y modelos más potentes para tareas complejas."
}
```

```question
{
  "id": "lg-beginner-06-q5",
  "type": "multiple-choice",
  "question": "¿Qué hace .bind_tools() en un LLM?",
  "options": [
    "Ejecuta las herramientas inmediatamente",
    "Registra herramientas para que el LLM pueda solicitarlas",
    "Elimina herramientas del LLM",
    "Prueba las herramientas"
  ],
  "correct": 1,
  "explanation": "bind_tools() registra herramientas con el LLM para que pueda generar solicitudes tool_calls durante la generación."
}
```

---

[!SUCCESS]
### Puntos Clave
- Inicializa los LLM fuera de los nodos para eficiencia
- Usa ChatPromptTemplate para prompts estructurados
- Diferentes LLM para diferentes tareas (rápido vs potente)
- bind_tools() permite a los LLM solicitar ejecuciones de herramientas
- Los mensajes de chat (Human/AI/System) estructuran la comunicación con el LLM
- Los nodos LLM leen del estado, invocan el modelo y escriben los resultados en el estado
- El patrón recuperar → generar → evaluar es fundamental para sistemas de QA
