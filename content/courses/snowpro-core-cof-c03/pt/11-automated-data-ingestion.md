---
title: "Domínio 3.2 — Ingestão Automatizada de Dados"
description: "Aprenda a automatizar a ingestão de dados com Snowpipe, Snowpipe Streaming, Streams, Tasks e Dynamic Tables. Construa pipelines contínuos e orientados a eventos inteiramente dentro do Snowflake."
order: 11
difficulty: intermediate
duration: "70 min"
---

# Domínio 3.2 — Ingestão Automatizada de Dados

## Peso no Exame

O **Domínio 3.0** representa **~18%** do exame. Os padrões de ingestão automatizada são frequentemente testados.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 3.2**: *Realizar ingestão automatizada de dados*, incluindo Snowpipe, Snowpipe Streaming, Streams, Tasks e Dynamic Tables.

---

## Visão Geral dos Padrões de Ingestão

| Ferramenta | Gatilho | Latência | Melhor Para |
|---|---|---|---|
| **COPY INTO** | Manual / agendado | Minutos a horas | Cargas em lote |
| **Snowpipe** | Evento de armazenamento em nuvem | Quase em tempo real (segundos–minutos) | Ingestão contínua baseada em arquivo |
| **Snowpipe Streaming** | Push via SDK | Subsegundo | Streaming de alto volume em nível de linha |
| **Streams + Tasks** | Tempo ou condição de stream | Configurável | Orquestração de pipeline baseada em CDC |
| **Dynamic Tables** | Automático (baseado em lag) | Configurável | Atualização incremental declarativa |

---

## Snowpipe

O **Snowpipe** é o serviço serverless de ingestão contínua do Snowflake — carrega arquivos automaticamente conforme chegam em um stage.

### Como o Snowpipe Funciona

```
Arquivos chegam no S3/Azure/GCS
         │
         ▼
Evento de Armazenamento em Nuvem (S3 Event, Azure Event Grid, GCS Pub/Sub)
         │
         ▼
Snowpipe recebe notificação (ou chamada da REST API)
         │
         ▼
COPY INTO é executado (serverless — sem warehouse necessário)
         │
         ▼
Dados disponíveis na tabela Snowflake (segundos a minutos)
```

### Criando um Pipe

```sql
-- Criar um pipe com auto-ingest (gatilho por evento em nuvem)
CREATE PIPE pipe_pedidos
    AUTO_INGEST = TRUE
    COMMENT = 'Ingestão automática de arquivos de pedidos do S3'
AS
COPY INTO raw.pedidos (id_pedido, id_cliente, valor, ts_pedido)
FROM (
    SELECT $1, $2, $3::DECIMAL(10,2), $4::TIMESTAMP
    FROM @stage_pedidos_s3/pedidos/
)
FILE_FORMAT = (FORMAT_NAME = formato_csv);

-- Ver o ARN SQS do pipe (para configurar notificação de evento S3)
SHOW PIPES LIKE 'pipe_pedidos';
```

### Snowpipe com REST API

Para casos onde eventos de nuvem não estão disponíveis, você pode acionar o Snowpipe via REST API:

```python
import requests
from snowflake.ingest import SimpleIngestManager

# Inicializar o gerenciador de ingestão
manager = SimpleIngestManager(
    account='minhaconta.us-east-1',
    host='minhaconta.us-east-1.snowflakecomputing.com',
    user='meu_usuario',
    pipe='meu_banco.meu_schema.pipe_pedidos',
    private_key=bytes_chave_privada
)

# Notificar o Snowpipe sobre novos arquivos
response = manager.ingest_files([
    {'path': 'pedidos/pedidos_2025_01_15.csv'}
])
```

### Propriedades e Cobrança do Snowpipe

| Propriedade | Valor |
|---|---|
| **Warehouse necessário?** | Não — serverless |
| **Cobrança** | Créditos de computação por arquivo (taxa serverless) |
| **Latência** | Tipicamente < 1 minuto |
| **Deduplicação** | Janela de 14 dias (arquivos não são reprocessados) |
| **Tratamento de erros** | Arquivos com erros são ignorados; verificar COPY_HISTORY |

```sql
-- Monitorar o status de carga do Snowpipe
SELECT *
FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
    TABLE_NAME => 'PEDIDOS',
    START_TIME => DATEADD('hour', -24, CURRENT_TIMESTAMP)
))
ORDER BY LAST_LOAD_TIME DESC;

-- Uso de créditos do Snowpipe
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.PIPE_USAGE_HISTORY
WHERE PIPE_NAME = 'PIPE_PEDIDOS'
AND START_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP);

-- Atualizar o Snowpipe (forçar nova varredura do stage)
ALTER PIPE pipe_pedidos REFRESH;
```

---

## Snowpipe Streaming

O **Snowpipe Streaming** habilita a **ingestão em nível de linha com latência subsegundo** diretamente em tabelas do Snowflake via Snowflake Ingest SDK — sem fazer staging de arquivos primeiro:

```
Aplicação / Kafka / Ferramenta CDC
         │
         ▼ (Snowflake Ingest SDK ou Kafka Connector)
Canal de Streaming do Snowflake
         │
         ▼
Tabela Snowflake (latência: milissegundos a segundos)
```

### Diferenças-Chave: Snowpipe vs. Snowpipe Streaming

| Aspecto | Snowpipe | Snowpipe Streaming |
|---|---|---|
| Unidade de dados | Arquivos | Linhas |
| Latência | Segundos a minutos | Milissegundos a segundos |
| Staging obrigatório | Sim (arquivos no stage) | Não |
| SDK | Ingest SDK (caminhos de arquivo) | Ingest SDK (nível de linha) |
| Caso de uso | Carga contínua baseada em arquivo | Streaming de eventos em tempo real |
| Integração Kafka | Snowflake Kafka Connector v1 | Snowflake Kafka Connector v2+ |

```java
// Exemplo Java — Snowpipe Streaming
SnowflakeStreamingIngestClient client = SnowflakeStreamingIngestClientFactory
    .builder("meuCliente")
    .setProperties(props)
    .build();

OpenChannelRequest request = OpenChannelRequest.builder("MEU_CANAL")
    .setDBName("MEU_BD")
    .setSchemaName("PUBLIC")
    .setTableName("EVENTOS")
    .setOnErrorOption(OpenChannelRequest.OnErrorOption.CONTINUE)
    .build();

SnowflakeStreamingIngestChannel channel = client.openChannel(request);

// Inserir linhas
Map<String, Object> linha = new HashMap<>();
linha.put("id_evento", "12345");
linha.put("tipo_evento", "clique");
linha.put("ts_evento", System.currentTimeMillis());
channel.insertRow(linha, "offset_12345");
```

---

## Streams — Change Data Capture (Captura de Alterações de Dados)

Um **Stream** é um objeto do Snowflake que captura alterações DML (INSERT, UPDATE, DELETE) em uma tabela ou view de origem. Ele age como um **log de CDC**.

### Tipos de Stream

| Tipo | Captura | Origem |
|---|---|---|
| **Standard (Padrão)** | INSERT, UPDATE, DELETE | Tabelas, directory tables |
| **Append-only** | Apenas INSERT (sem atualizações/exclusões) | Tabelas, views |
| **Insert-only** | Apenas INSERT | Tabelas externas |

```sql
-- Criar um stream padrão
CREATE STREAM stream_pedidos ON TABLE raw.pedidos;

-- Criar um stream append-only (mais leve para tabelas com muitos inserts)
CREATE STREAM stream_eventos ON TABLE raw.eventos
    APPEND_ONLY = TRUE;

-- Consultar o stream
SELECT
    *,
    METADATA$ACTION,       -- 'INSERT' ou 'DELETE'
    METADATA$ISUPDATE,     -- TRUE se este DELETE for a linha antiga de um UPDATE
    METADATA$ROW_ID        -- identificador único de linha
FROM stream_pedidos;
```

### Offset e Consumo do Stream

Um stream rastreia alterações a partir de seu **offset** (última posição consumida). Após o consumo (via DML dentro de uma Task ou instrução explícita), o offset avança:

```sql
-- Consumir o stream em um MERGE (padrão mais comum)
MERGE INTO analytics.pedidos tgt
USING stream_pedidos src
ON tgt.id_pedido = src.id_pedido
WHEN MATCHED AND src.METADATA$ACTION = 'DELETE' THEN DELETE
WHEN MATCHED AND src.METADATA$ACTION = 'INSERT' THEN UPDATE SET
    tgt.valor = src.valor,
    tgt.status = src.status
WHEN NOT MATCHED AND src.METADATA$ACTION = 'INSERT' THEN INSERT
    (id_pedido, valor, status) VALUES (src.id_pedido, src.valor, src.status);
```

> [!WARNING]
> Os streams consomem o **Time Travel** para rastrear seu offset. Se o período de Time Travel expirar antes de o stream ser consumido, o stream fica **obsoleto (stale)**. Sempre consuma streams dentro da janela de retenção.

---

## Tasks — Execução Agendada

Uma **Task** agenda a execução de SQL — é o agendador de jobs nativo do Snowflake.

### Tipos de Task

| Propriedade | Task Baseada em Warehouse | Task Serverless |
|---|---|---|
| Computação | Usa um virtual warehouse nomeado | Serverless gerenciado pelo Snowflake |
| Controle de custo | Resource Monitor do warehouse | Cobrança serverless por crédito |
| Melhor para | Workloads pesados e previsíveis | Tasks leves e frequentes |

```sql
-- Task baseada em warehouse (a cada 5 minutos)
CREATE TASK atualizar_staging
    WAREHOUSE = WH_TRANSFORM
    SCHEDULE = '5 MINUTE'
AS
INSERT INTO staging.pedidos_processados
SELECT * FROM raw.pedidos
WHERE processado = FALSE;

-- Task serverless
CREATE TASK task_serverless
    USER_TASK_MANAGED_INITIAL_WAREHOUSE_SIZE = 'SMALL'
    SCHEDULE = 'USING CRON 0 3 * * * UTC'  -- todo dia às 3h UTC
AS
CALL meu_procedimento_armazenado();

-- Task acionada por stream (só executa quando o stream tem dados)
CREATE TASK task_processar_pedidos
    WAREHOUSE = WH_TRANSFORM
    WHEN SYSTEM$STREAM_HAS_DATA('stream_pedidos')
    SCHEDULE = '1 MINUTE'  -- verificar a cada minuto
AS
MERGE INTO analytics.pedidos tgt
USING stream_pedidos src ON tgt.id = src.id
WHEN NOT MATCHED THEN INSERT ...;

-- Tasks iniciam SUSPENDED — devem ser retomadas
ALTER TASK atualizar_staging RESUME;
ALTER TASK task_serverless RESUME;
ALTER TASK task_processar_pedidos RESUME;
```

### DAGs de Tasks (Grafos Acíclicos Dirigidos)

As tasks podem ser encadeadas em um **DAG** onde tasks downstream executam após tasks upstream serem concluídas:

```sql
-- Task raiz (agendada)
CREATE TASK task_raiz
    WAREHOUSE = WH_TRANSFORM
    SCHEDULE = '1 HOUR'
AS
TRUNCATE TABLE staging.trabalho;

-- Task filha 1 (depende da raiz)
CREATE TASK task_filha_1
    WAREHOUSE = WH_TRANSFORM
    AFTER task_raiz
AS
INSERT INTO staging.trabalho SELECT * FROM raw.pedidos;

-- Task filha 2 (depende da raiz)
CREATE TASK task_filha_2
    WAREHOUSE = WH_TRANSFORM
    AFTER task_raiz
AS
INSERT INTO staging.trabalho SELECT * FROM raw.eventos;

-- Task neta (depende de ambas as filhas)
CREATE TASK task_final
    WAREHOUSE = WH_TRANSFORM
    AFTER task_filha_1, task_filha_2
AS
CALL processar_dados_finais();

-- Retomar todas as tasks (use SYSTEM$TASK_DEPENDENTS_ENABLE)
SELECT SYSTEM$TASK_DEPENDENTS_ENABLE('task_raiz');
```

---

## Dynamic Tables (Tabelas Dinâmicas)

As **Dynamic Tables** fornecem uma abordagem **declarativa** para pipelines de dados incrementais — defina a transformação como um SELECT, configure um `TARGET_LAG`, e o Snowflake atualiza a tabela automaticamente:

```sql
-- Tabela de origem
CREATE TABLE pedidos (id_pedido NUMBER, id_cliente NUMBER, valor DECIMAL, status STRING);

-- Tabela dinâmica (atualizada automaticamente)
CREATE DYNAMIC TABLE metricas_clientes
    TARGET_LAG = '1 hour'        -- atraso máximo aceitável em relação à origem
    WAREHOUSE = WH_TRANSFORM
AS
SELECT
    id_cliente,
    count(*) AS qtd_pedidos,
    sum(valor) AS total_gasto,
    max(id_pedido) AS ultimo_id_pedido
FROM pedidos
WHERE status = 'CONCLUIDO'
GROUP BY id_cliente;

-- Verificar o status da dynamic table
SHOW DYNAMIC TABLES LIKE 'metricas_clientes';

-- Acionar atualização manual
ALTER DYNAMIC TABLE metricas_clientes REFRESH;
```

### Dynamic Tables vs. Streams + Tasks

| Aspecto | Dynamic Tables | Streams + Tasks |
|---|---|---|
| Complexidade | Baixa (declarativa) | Maior (imperativa) |
| Controle de lag | Parâmetro `TARGET_LAG` | Frequência do agendamento da Task |
| Lógica de merge personalizada | Limitada | Controle total |
| Rastreamento de dependências | Automático | Manual |
| Monitoramento | Views DYNAMIC_TABLE integradas | TASK_HISTORY |

---

## Questões de Prática

**Q1.** Uma empresa recebe arquivos CSV em um bucket S3 continuamente ao longo do dia. Qual recurso fornece o menor carregamento automático de latência sem exigir um virtual warehouse em execução?

- A) COPY INTO com uma task agendada
- B) Snowpipe com AUTO_INGEST = TRUE ✅
- C) Snowpipe Streaming SDK
- D) Dynamic Table com TARGET_LAG = '5 MINUTE'

**Q2.** Um stream fica obsoleto (stale). O que causou isso?

- A) O stream foi consumido muitas vezes
- B) O stream não foi consumido antes do período de Time Travel expirar ✅
- C) A tabela de origem foi descartada e recriada
- D) A task que consome o stream foi suspensa

**Q3.** Qual recurso do Snowpipe habilita streaming de dados em nível de linha com latência subsegundo, sem fazer staging de arquivos primeiro?

- A) AUTO_INGEST = TRUE
- B) Snowpipe REST API
- C) Snowpipe Streaming SDK ✅
- D) Stream Append-only

**Q4.** Uma Task é criada, mas nenhum dado está sendo processado. Qual é a causa mais provável?

- A) O warehouse é muito pequeno
- B) A task está no estado SUSPENDED e precisa ser RESUMED ✅
- C) O agendamento da task é muito infrequente
- D) O stream já foi consumido

**Q5.** Uma Dynamic Table é configurada com `TARGET_LAG = '30 minutes'`. O que isso garante?

- A) A tabela é atualizada a cada 30 minutos no relógio
- B) Os dados na tabela nunca ficam mais de 30 minutos atrás da origem ✅
- C) O job de atualização executa por no máximo 30 minutos
- D) Os resultados são armazenados em cache por 30 minutos

**Q6.** Ao usar `SYSTEM$STREAM_HAS_DATA()` na cláusula WHEN de uma Task, o que acontece se o stream estiver vazio?

- A) A Task executa e executa um merge vazio
- B) A Task é ignorada naquele intervalo de agendamento ✅
- C) A Task falha com um erro
- D) A Task se suspende

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. **Snowpipe** = baseado em arquivo, serverless, quase em tempo real (segundos a minutos)
> 2. **Snowpipe Streaming** = baseado em linha, subsegundo, sem staging necessário
> 3. Streams ficam **obsoletos (stale)** se não forem consumidos dentro da janela do Time Travel
> 4. Tasks iniciam **SUSPENDED** — sempre as retome explicitamente
> 5. **Dynamic Tables** = abordagem `TARGET_LAG` declarativa — mais simples que Streams + Tasks
> 6. DAGs de Tasks: tasks filhas definidas com `AFTER <task_pai>`
