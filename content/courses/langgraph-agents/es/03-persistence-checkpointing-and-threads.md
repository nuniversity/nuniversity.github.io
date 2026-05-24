---
title: "Persistencia, Checkpointing y Threads"
description: "Explora MemorySaver, checkpointing por thread, reproducción desde checkpoints, bifurcación de estados pasados y PostgresSaver para producción."
order: 3
duration: "45 min"
difficulty: "intermediate"
---

# Persistencia, Checkpointing y Threads

Una de las características más poderosas de LangGraph es la **persistencia**. Cada paso de la ejecución de un grafo puede guardarse como un checkpoint, permitiendo reproducción, rollback y bifurcación desde cualquier estado anterior.

---

## Mermaid: Ciclo de Vida del Checkpoint

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Graph
    participant S as CheckpointSaver
    participant DB as Storage

    C->>G: invoke(state, thread_id="t1")
    G->>S: save_checkpoint(step_1_state)
    S->>DB: INSERT checkpoint_1
    G->>C: return partial result
    C->>G: invoke(new_input, thread_id="t1")
    G->>S: save_checkpoint(step_2_state)
    S->>DB: INSERT checkpoint_2
    C->>G: invoke(None, thread_id="t1", checkpoint_id="ckpt_1")
    G->>S: load_checkpoint("ckpt_1")
    S->>DB: SELECT checkpoint_1
    G->>C: resume from checkpoint_1
```

Cada llamada `invoke()` con un `thread_id` dispara un guardado de checkpoint después de cada nodo. Los checkpoints se almacenan secuencialmente dentro de un thread, formando una línea de tiempo append-only.

---

## MemorySaver

`MemorySaver` es el backend de checkpointing más simple. Almacena checkpoints en memoria y es ideal para prototipado.

```python
from langgraph.checkpoint import MemorySaver
from langgraph.graph import StateGraph, START, END

# Crea un guardador de checkpoint
memory = MemorySaver()

# Pásalo al compilar
app = builder.compile(checkpointer=memory)

# Cada invocación necesita una configuración de thread
config = {"configurable": {"thread_id": "sesion-1"}}
result = app.invoke({"messages": ["Hola"]}, config)
```

[!WARNING]
MemorySaver es efímero — todos los checkpoints se pierden cuando el proceso Python termina. Usa PostgresSaver o un guardador personalizado para cargas de trabajo de producción.

### Comparación: Backends de Checkpoint

| Característica | MemorySaver | PostgresSaver | Guardador Personalizado |
| :--- | :--- | :--- | :--- |
| Persistencia | En memoria | PostgreSQL | Definido por el usuario |
| Listo para producción | No | Sí | Depende de la impl. |
| Aislamiento de thread | Sí | Sí | Sí |
| Soporte de replay | Sí | Sí | Debe implementar |
| Soporte de bifurcación | Sí | Sí | Debe implementar |
| Complejidad de setup | Ninguna | Requiere esquema DB | Alta |
| Supervivencia entre procesos | No | Sí | Depende de la impl. |
| Escalabilidad | Proceso único | Multi-proceso | Definido por el usuario |
| Costo | Gratuito | Costos de almacenamiento | Variable |

---

## Mermaid: Diagrama de Estado del Thread

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: first invoke()
    ACTIVE --> CHECKPOINTED: after node executes
    CHECKPOINTED --> ACTIVE: next invoke()
    CHECKPOINTED --> BRANCHED: fork with new thread_id
    BRANCHED --> ACTIVE: independent execution
    ACTIVE --> COMPLETED: all paths reach END
    COMPLETED --> [*]

    state CHECKPOINTED {
        [*] --> CKPT_1
        CKPT_1 --> CKPT_2
        CKPT_2 --> CKPT_3
    }
```

Cada thread transiciona entre estados de ejecución activa y puntos de pausa con checkpoint. Las ramas crean linajes de thread completamente nuevos desde un checkpoint padre.

---

## Checkpointing de Estados por Thread

Un **thread** es una conversación o sesión de ejecución identificada por un `thread_id`. LangGraph almacena un nuevo checkpoint después de cada ejecución de nodo dentro de un thread.

```python
# Mismo grafo, mismo thread — el estado se acumula
app.invoke({"messages": ["Turno 1"]}, {"configurable": {"thread_id": "t1"}})
app.invoke({"messages": ["Turno 2"]}, {"configurable": {"thread_id": "t1"}})

# Thread diferente — estado aislado
app.invoke({"messages": ["Inicio thread 2"]}, {"configurable": {"thread_id": "t2"}})
```

El estado tiene namespace por thread. Los checkpoints forman una línea de tiempo dentro de cada thread.

[!IMPORTANT]
El aislamiento de thread es crítico en producción. Cada sesión de usuario recibe su propio `thread_id` — nunca compartas un `thread_id` entre usuarios. Usa un identificador único como `user_id:conversation_id` como ID del thread para garantizar aislamiento.

---

## Reproduciendo desde Checkpoints

Puedes **reproducir** la ejecución desde un checkpoint específico proporcionando un `checkpoint_id`.

```python
# Obtén el ID del checkpoint padre de la última ejecución
parent_id = result["__run"]["checkpoint_id"]

# Reproduce desde ese checkpoint
replayed = app.invoke(
    {"messages": ["Nuevo mensaje"]},
    {"configurable": {"thread_id": "t1", "checkpoint_id": parent_id}}
)
```

La reproducción **no** re-ejecuta nodos anteriores al checkpoint — reanuda desde ese estado exacto.

[!TIP]
El replay es invaluable para pruebas y depuración. Puedes reproducir un checkpoint específico con entrada modificada para ver cómo se comportaría el grafo con datos diferentes en ese estado exacto.

### Reproducción de Checkpoint con thread_id

```python
import uuid

def replay_thread(app, thread_id: str, checkpoint_id: str, new_input: dict):
    """Función utilitaria para reproducir un checkpoint."""
    config = {
        "configurable": {
            "thread_id": thread_id,
            "checkpoint_id": checkpoint_id,
        }
    }
    return app.invoke(new_input, config)

# Uso
result = replay_thread(
    app,
    thread_id="user-123",
    checkpoint_id="1ef345ab...",
    new_input={"messages": ["Consulta corregida"]}
)
```

---

## Bifurcando desde Estados Pasados

Puedes bifurcar un thread en cualquier checkpoint, creando una **bifurcación** que diverge de la línea de tiempo original.

```python
# Bifurca desde un checkpoint anterior
fork_config = {
    "configurable": {
        "thread_id": "t1-rama-1",
        "checkpoint_id": parent_id
    }
}
fork_result = app.invoke({"messages": ["Mensaje de la rama"]}, fork_config)
```

La rama comienza con el estado del checkpoint padre y prosigue independientemente. Esto es útil para análisis de "qué pasaría si" o correcciones humanas.

### Ejemplo de Creación de Bifurcación

```python
def create_branch(app, original_thread: str, checkpoint_id: str, branch_suffix: str, new_input: dict):
    """Crea una bifurcación desde un checkpoint y la ejecuta."""
    branch_thread = f"{original_thread}-{branch_suffix}"
    config = {
        "configurable": {
            "thread_id": branch_thread,
            "checkpoint_id": checkpoint_id,
        }
    }
    return app.invoke(new_input, config)

# Compara dos ramas del mismo checkpoint
branch_a = create_branch(app, "sesion-1", ckpt_id, "rollback", {"messages": ["Probar A"]})
branch_b = create_branch(app, "sesion-1", ckpt_id, "experimento", {"messages": ["Probar B"]})

# Analiza qué rama produjo mejores resultados
```

[!TIP]
La bifurcación permite **pruebas A/B de decisiones de agente**. Ejecuta múltiples ramas desde el mismo checkpoint con diferentes prompts, parámetros o rutas, luego compara resultados para optimizar tu agente.

---

## Costos de Almacenamiento de Checkpoint

[!WARNING]
Cada ejecución de nodo crea un checkpoint de estado completo. Si tu estado es grande (vectores de embedding, historiales completos de conversación), el almacenamiento de checkpoint puede crecer rápidamente. Considera:
- Usar PostgresSaver con particionamiento de tabla por thread_id
- Implementar política de retención que limpie checkpoints antiguos
- Mantener esquemas de estado ligeros — almacena solo lo que los nodos downstream necesitan
- Usar guardadores personalizados con políticas de ciclo de vida S3/GCS

---

## PostgresSaver para Producción

`PostgresSaver` persiste checkpoints en una base de datos PostgreSQL, sobreviviendo a reinicios.

```python
from langgraph.checkpoint import PostgresSaver
import asyncpg

# Conecta a PostgreSQL
conn = await asyncpg.connect("postgresql://user:pass@localhost/langgraph")
saver = PostgresSaver(conn)

# Compila con el guardador de producción
app = builder.compile(checkpointer=saver)

# El estado sobrevive a reinicios del proceso
result = await app.ainvoke({"messages": ["Hola"]}, {"configurable": {"thread_id": "prod-1"}})
```

```bash
# Configuración del esquema (ejecutar una vez)
pip install langgraph-checkpoint-postgres
python -c "from langgraph.checkpoint import PostgresSaver; PostgresSaver.create_tables('postgresql://user:pass@localhost/langgraph')"
```

### Configuración de Producción con PostgresSaver

```python
import asyncpg
from langgraph.checkpoint import PostgresSaver
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_graph_app():
    """Grafo listo para producción con persistencia Postgres."""
    conn = await asyncpg.connect(
        user="app_user",
        password="app_password",
        host="postgres.example.com",
        port=5432,
        database="langgraph_prod",
        # Pool de conexiones es recomendado para producción
        min_size=5,
        max_size=20,
    )
    try:
        saver = PostgresSaver(conn)
        app = builder.compile(checkpointer=saver)
        yield app
    finally:
        await conn.close()

# Uso
async with get_graph_app() as app:
    result = await app.ainvoke(
        {"messages": ["Procesar pedido 12345"]},
        {"configurable": {"thread_id": "pedido:12345:usuario:678"}}
    )
```

---

## Mermaid: Línea de Tiempo de Checkpoints

```mermaid
flowchart LR
    S1["Step 1"] --> CK1["[CKPT 1]"]
    S2["Step 2"] --> CK2["[CKPT 2]"]
    S3["Step 3"] --> CK3["[CKPT 3]"]
    S4["Step 4"] --> CK4["[CKPT 4]"]
    CK3 --> BCK3["[Branch CKPT 3']"]
    BCK3 --> S3P["Step 3'"]

    S1 --> S2 --> S3 --> S4
    CK1 -.-> CK2 -.-> CK3 -.-> CK4
```

Cada checkpoint es una instantánea del estado completo. Las ramas bifurcan desde un checkpoint padre y crean su propia línea de tiempo.

---

## Mermaid: Visualización de Aislamiento de Thread

```mermaid
sequenceDiagram
    participant U1 as User 1 Thread
    participant U2 as User 2 Thread
    participant G as Graph (shared)
    participant DB as Checkpoint Store

    U1->>G: invoke("Hola", thread_id="u1")
    G->>DB: save_checkpoint(u1, ckpt_1)
    U2->>G: invoke("Holi", thread_id="u2")
    G->>DB: save_checkpoint(u2, ckpt_1)
    U1->>G: invoke("¿Cómo estás?", thread_id="u1")
    G->>DB: save_checkpoint(u1, ckpt_2)
    Note over DB: estados u1 y u2 están completamente aislados
```

El aislamiento de thread garantiza que la conversación del Usuario 1 nunca se filtre al estado del Usuario 2. Cada thread tiene su propia cadena de checkpoint independiente.

---

```question
{
  "id": "lg-03-es-q1",
  "type": "multiple-choice",
  "question": "¿Qué guardador es apropiado para uso en producción?",
  "options": ["MemorySaver", "PostgresSaver", "FileSaver", "RedisSaver"],
  "correct": 1,
  "explanation": "PostgresSaver persiste checkpoints en PostgreSQL y sobrevive a reinicios del proceso, haciéndolo adecuado para producción."
}
```

```question
{
  "id": "lg-03-es-q2",
  "type": "multiple-choice",
  "question": "¿Qué identifica una sesión de ejecución única en LangGraph?",
  "options": ["node_id", "thread_id", "run_id", "graph_id"],
  "correct": 1,
  "explanation": "Un thread_id identifica de forma única una conversación o sesión de ejecución, con checkpoints almacenados por thread."
}
```

```question
{
  "id": "lg-03-es-q3",
  "type": "multiple-choice",
  "question": "¿Qué sucede cuando reproduces desde un checkpoint?",
  "options": ["Todos los nodos se re-ejecutan desde el inicio", "La ejecución se reanuda desde el estado del checkpoint sin re-ejecutar nodos anteriores", "El checkpoint se elimina", "El grafo se recompila"],
  "correct": 1,
  "explanation": "Reproducir desde un checkpoint reanuda la ejecución desde ese estado exacto sin re-ejecutar nodos anteriores."
}
```

```question
{
  "id": "lg-03-es-q4",
  "type": "multiple-choice",
  "question": "¿Qué es una bifurcación en el checkpointing de LangGraph?",
  "options": ["Una arista paralela en el grafo", "Una bifurcación desde un checkpoint pasado que crea una línea de tiempo divergente", "Una ruta condicional", "Un nuevo thread con estado vacío"],
  "correct": 1,
  "explanation": "Una bifurcación se separa de un checkpoint padre y crea su propia línea de tiempo independiente para análisis de qué pasaría si."
}
```

```question
{
  "id": "lg-03-es-q5",
  "type": "multiple-choice",
  "question": "¿Cuál NO es una característica de MemorySaver?",
  "options": ["Aislamiento de thread", "Replay de checkpoint", "Persistencia entre procesos", "Bifurcación"],
  "correct": 2,
  "explanation": "MemorySaver es efímero y almacena checkpoints solo en memoria, por lo que no soporta persistencia entre procesos."
}
```

```question
{
  "id": "lg-03-es-q6",
  "type": "multiple-choice",
  "question": "Escenario: Necesitas depurar por qué un agente dio una respuesta incorrecta hace dos turnos. Tienes los IDs de checkpoints. ¿Qué hacer?",
  "options": ["Reiniciar toda la conversación", "Reproducir desde el checkpoint anterior al error con entrada corregida", "Eliminar todos los checkpoints y reconstruir", "Usar un thread_id diferente"],
  "correct": 1,
  "explanation": "Reproducir desde el checkpoint inmediatamente anterior al nodo con error te permite inspeccionar el estado exacto y probar entradas corregidas."
}
```

---

[!SUCCESS]
### Conclusiones Clave
- MemorySaver almacena checkpoints en memoria para prototipado.
- Cada thread (`thread_id`) tiene estado independiente y línea de tiempo de checkpoints.
- Reproducir desde un checkpoint reanuda la ejecución sin re-ejecutar pasos anteriores.
- La bifurcación divide una línea de tiempo desde cualquier checkpoint pasado para experimentación.
- PostgresSaver proporciona persistencia de nivel de producción con replay y bifurcación completos.
- Los checkpoints se almacenan después de cada ejecución de nodo por defecto.
- Los guardadores personalizados pueden implementar cualquier backend (Redis, S3, etc.).
- El aislamiento de thread es esencial para sistemas de producción multi-inquilino.
- Usa IDs de thread únicos por sesión de usuario para prevenir fugas de estado.
- Monitorea costos de almacenamiento de checkpoint con esquemas de estado grandes.
