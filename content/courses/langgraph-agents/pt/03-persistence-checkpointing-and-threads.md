---
title: "Persistência, Checkpointing e Threads"
description: "Explore MemorySaver, checkpointing por thread, reprodução a partir de checkpoints, ramificação de estados passados e PostgresSaver para produção."
order: 3
duration: "45 min"
difficulty: "intermediate"
---

# Persistência, Checkpointing e Threads

Um dos recursos mais poderosos do LangGraph é a **persistência**. Cada passo da execução de um grafo pode ser salvo como um checkpoint, permitindo reprodução, rollback e ramificação a partir de qualquer estado anterior.

---

## Mermaid: Ciclo de Vida do Checkpoint

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

Cada chamada `invoke()` com um `thread_id` dispara um salvamento de checkpoint após cada nó. Checkpoints são armazenados sequencialmente dentro de uma thread, formando uma linha do tempo append-only.

---

## MemorySaver

`MemorySaver` é o backend de checkpointing mais simples. Ele armazena checkpoints em memória e é ideal para prototipagem.

```python
from langgraph.checkpoint import MemorySaver
from langgraph.graph import StateGraph, START, END

# Cria um salvador de checkpoint
memory = MemorySaver()

# Passa ao compilar
app = builder.compile(checkpointer=memory)

# Cada invocação precisa de uma configuração de thread
config = {"configurable": {"thread_id": "sessao-1"}}
result = app.invoke({"messages": ["Olá"]}, config)
```

[!WARNING]
MemorySaver é efêmero — todos os checkpoints são perdidos quando o processo Python termina. Use PostgresSaver ou um salvador personalizado para cargas de trabalho de produção.

### Comparação: Backends de Checkpoint

| Característica | MemorySaver | PostgresSaver | Salvador Personalizado |
| :--- | :--- | :--- | :--- |
| Persistência | Em memória | PostgreSQL | Definido pelo usuário |
| Pronto para produção | Não | Sim | Depende da impl. |
| Isolamento de thread | Sim | Sim | Sim |
| Suporte a replay | Sim | Sim | Deve implementar |
| Suporte a ramificação | Sim | Sim | Deve implementar |
| Complexidade de setup | Nenhuma | Requer esquema DB | Alta |
| Sobrevivência entre processos | Não | Sim | Depende da impl. |
| Escalabilidade | Processo único | Multi-processo | Definido pelo usuário |
| Custo | Gratuito | Custos de armazenamento | Variável |

---

## Mermaid: Diagrama de Estado da Thread

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

Cada thread transita entre estados de execução ativa e pontos de pausa com checkpoint. Ramos criam linhagens de thread inteiramente novas a partir de um checkpoint pai.

---

## Checkpointing de Estados por Thread

Uma **thread** é uma conversa ou sessão de execução identificada por um `thread_id`. LangGraph armazena um novo checkpoint após cada execução de nó dentro de uma thread.

```python
# Mesmo grafo, mesma thread — estado acumula
app.invoke({"messages": ["Turno 1"]}, {"configurable": {"thread_id": "t1"}})
app.invoke({"messages": ["Turno 2"]}, {"configurable": {"thread_id": "t1"}})

# Thread diferente — estado isolado
app.invoke({"messages": ["Início thread 2"]}, {"configurable": {"thread_id": "t2"}})
```

O estado tem namespace por thread. Checkpoints formam uma linha do tempo dentro de cada thread.

[!IMPORTANT]
Isolamento de thread é crítico em produção. Cada sessão de usuário recebe seu próprio `thread_id` — nunca compartilhe um `thread_id` entre usuários. Use um identificador único como `user_id:conversation_id` como ID da thread para garantir isolamento.

---

## Reproduzindo a partir de Checkpoints

Você pode **reproduzir** a execução de um checkpoint específico fornecendo um `checkpoint_id`.

```python
# Obtém o ID do checkpoint pai da última execução
parent_id = result["__run"]["checkpoint_id"]

# Reproduz a partir desse checkpoint
replayed = app.invoke(
    {"messages": ["Nova mensagem"]},
    {"configurable": {"thread_id": "t1", "checkpoint_id": parent_id}}
)
```

A reprodução **não** reexecuta nós anteriores ao checkpoint — ela retoma daquele estado exato.

[!TIP]
Replay é inestimável para teste e depuração. Você pode reproduzir um checkpoint específico com entrada modificada para ver como o grafo se comportaria com dados diferentes naquele estado exato.

### Reprodução de Checkpoint com thread_id

```python
import uuid

def replay_thread(app, thread_id: str, checkpoint_id: str, new_input: dict):
    """Função utilitária para reproduzir um checkpoint."""
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
    new_input={"messages": ["Consulta corrigida"]}
)
```

---

## Ramificando a partir de Estados Passados

Você pode bifurcar uma thread em qualquer checkpoint, criando uma **ramificação** que diverge da linha do tempo original.

```python
# Bifurca a partir de um checkpoint anterior
fork_config = {
    "configurable": {
        "thread_id": "t1-ramo-1",
        "checkpoint_id": parent_id
    }
}
fork_result = app.invoke({"messages": ["Mensagem do ramo"]}, fork_config)
```

O ramo começa com o estado do checkpoint pai e prossegue independentemente. Isso é útil para análises de "e se" ou correções humanas.

### Exemplo de Criação de Ramificação

```python
def create_branch(app, original_thread: str, checkpoint_id: str, branch_suffix: str, new_input: dict):
    """Cria uma ramificação a partir de um checkpoint e a executa."""
    branch_thread = f"{original_thread}-{branch_suffix}"
    config = {
        "configurable": {
            "thread_id": branch_thread,
            "checkpoint_id": checkpoint_id,
        }
    }
    return app.invoke(new_input, config)

# Compara dois ramos do mesmo checkpoint
branch_a = create_branch(app, "sessao-1", ckpt_id, "rollback", {"messages": ["Tentar A"]})
branch_b = create_branch(app, "sessao-1", ckpt_id, "experimento", {"messages": ["Tentar B"]})

# Analisa qual ramo produziu melhores resultados
```

[!TIP]
Ramificação permite **teste A/B de decisões de agente**. Execute múltiplos ramos do mesmo checkpoint com diferentes prompts, parâmetros ou rotas, depois compare resultados para otimizar seu agente.

---

## Custos de Armazenamento de Checkpoint

[!WARNING]
Cada execução de nó cria um checkpoint de estado completo. Se seu estado for grande (vetores de embedding, históricos completos de conversa), o armazenamento de checkpoint pode crescer rapidamente. Considere:
- Usar PostgresSaver com particionamento de tabela por thread_id
- Implementar política de retenção que limpa checkpoints antigos
- Manter esquemas de estado enxutos — armazene apenas o que nós downstream precisam
- Usar savers personalizados com políticas de ciclo de vida S3/GCS

---

## PostgresSaver para Produção

`PostgresSaver` persiste checkpoints em um banco de dados PostgreSQL, sobrevivendo a reinicializações.

```python
from langgraph.checkpoint import PostgresSaver
import asyncpg

# Conecta ao PostgreSQL
conn = await asyncpg.connect("postgresql://user:pass@localhost/langgraph")
saver = PostgresSaver(conn)

# Compila com o salvador de produção
app = builder.compile(checkpointer=saver)

# O estado sobrevive a reinicializações do processo
result = await app.ainvoke({"messages": ["Olá"]}, {"configurable": {"thread_id": "prod-1"}})
```

```bash
# Configuração do esquema (executar uma vez)
pip install langgraph-checkpoint-postgres
python -c "from langgraph.checkpoint import PostgresSaver; PostgresSaver.create_tables('postgresql://user:pass@localhost/langgraph')"
```

### Configuração de Produção com PostgresSaver

```python
import asyncpg
from langgraph.checkpoint import PostgresSaver
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_graph_app():
    """Grafo pronto para produção com persistência Postgres."""
    conn = await asyncpg.connect(
        user="app_user",
        password="app_password",
        host="postgres.example.com",
        port=5432,
        database="langgraph_prod",
        # Pool de conexões é recomendado para produção
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
        {"messages": ["Processar pedido 12345"]},
        {"configurable": {"thread_id": "pedido:12345:usuario:678"}}
    )
```

---

## Mermaid: Linha do Tempo de Checkpoints

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

Cada checkpoint é um instantâneo do estado completo. Ramos bifurcam de um checkpoint pai e criam sua própria linha do tempo.

---

## Mermaid: Visualização de Isolamento de Thread

```mermaid
sequenceDiagram
    participant U1 as User 1 Thread
    participant U2 as User 2 Thread
    participant G as Graph (shared)
    participant DB as Checkpoint Store

    U1->>G: invoke("Olá", thread_id="u1")
    G->>DB: save_checkpoint(u1, ckpt_1)
    U2->>G: invoke("Oi", thread_id="u2")
    G->>DB: save_checkpoint(u2, ckpt_1)
    U1->>G: invoke("Como vai?", thread_id="u1")
    G->>DB: save_checkpoint(u1, ckpt_2)
    Note over DB: estados u1 e u2 são completamente isolados
```

O isolamento de thread garante que a conversa do Usuário 1 nunca vaze para o estado do Usuário 2. Cada thread tem sua própria cadeia de checkpoint independente.

---

```question
{
  "id": "lg-03-pt-q1",
  "type": "multiple-choice",
  "question": "Qual salvador é apropriado para uso em produção?",
  "options": ["MemorySaver", "PostgresSaver", "FileSaver", "RedisSaver"],
  "correct": 1,
  "explanation": "PostgresSaver persiste checkpoints no PostgreSQL e sobrevive a reinicializações do processo, tornando-o adequado para produção."
}
```

```question
{
  "id": "lg-03-pt-q2",
  "type": "multiple-choice",
  "question": "O que identifica uma sessão de execução única no LangGraph?",
  "options": ["node_id", "thread_id", "run_id", "graph_id"],
  "correct": 1,
  "explanation": "Um thread_id identifica de forma única uma conversa ou sessão de execução, com checkpoints armazenados por thread."
}
```

```question
{
  "id": "lg-03-pt-q3",
  "type": "multiple-choice",
  "question": "O que acontece quando você reproduz a partir de um checkpoint?",
  "options": ["Todos os nós reexecutam desde o início", "A execução retoma do estado do checkpoint sem reexecutar nós anteriores", "O checkpoint é deletado", "O grafo é recompilado"],
  "correct": 1,
  "explanation": "Reproduzir a partir de um checkpoint retoma a execução daquele estado exato sem reexecutar nós anteriores."
}
```

```question
{
  "id": "lg-03-pt-q4",
  "type": "multiple-choice",
  "question": "O que é uma ramificação no checkpointing do LangGraph?",
  "options": ["Uma aresta paralela no grafo", "Uma bifurcação de um checkpoint passado que cria uma linha do tempo divergente", "Uma rota condicional", "Uma nova thread com estado vazio"],
  "correct": 1,
  "explanation": "Uma ramificação bifurca de um checkpoint pai e cria sua própria linha do tempo independente para análises de e se."
}
```

```question
{
  "id": "lg-03-pt-q5",
  "type": "multiple-choice",
  "question": "Qual NÃO é uma característica do MemorySaver?",
  "options": ["Isolamento de thread", "Replay de checkpoint", "Persistência entre processos", "Ramificação"],
  "correct": 2,
  "explanation": "MemorySaver é efêmero e armazena checkpoints apenas em memória, portanto não suporta persistência entre processos."
}
```

```question
{
  "id": "lg-03-pt-q6",
  "type": "multiple-choice",
  "question": "Cenário: Você precisa depurar por que um agente deu uma resposta errada dois turnos atrás. Você tem os IDs dos checkpoints. O que fazer?",
  "options": ["Reiniciar a conversa inteira", "Reproduzir do checkpoint anterior ao erro com entrada corrigida", "Deletar todos os checkpoints e reconstruir", "Usar um thread_id diferente"],
  "correct": 1,
  "explanation": "Reproduzir do checkpoint imediatamente anterior ao nó com erro permite inspecionar o estado exato e testar entradas corrigidas."
}
```

---

[!SUCCESS]
### Principais Conclusões
- MemorySaver armazena checkpoints em memória para prototipagem.
- Cada thread (`thread_id`) tem estado independente e linha do tempo de checkpoints.
- Reproduzir a partir de um checkpoint retoma a execução sem reexecutar passos anteriores.
- Ramificação bifurca uma linha do tempo de qualquer checkpoint passado para experimentação.
- PostgresSaver fornece persistência de nível de produção com replay e ramificação completos.
- Checkpoints são armazenados após cada execução de nó por padrão.
- Salvadores personalizados podem implementar qualquer backend (Redis, S3, etc.).
- Isolamento de thread é essencial para sistemas de produção multi-inquilino.
- Use IDs de thread únicos por sessão de usuário para evitar vazamento de estado.
- Monitore custos de armazenamento de checkpoint com esquemas de estado grandes.
