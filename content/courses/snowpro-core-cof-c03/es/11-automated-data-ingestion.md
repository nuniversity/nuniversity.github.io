---
title: "Dominio 3.2 — Ingesta Automatizada de Datos"
description: "Aprende a automatizar la ingesta de datos con Snowpipe, Snowpipe Streaming, Streams, Tasks y Tablas Dinámicas. Construye pipelines de datos continuos y orientados a eventos completamente dentro de Snowflake."
order: 11
difficulty: intermediate
duration: "70 min"
---

# Dominio 3.2 — Ingesta Automatizada de Datos

## Peso en el Examen

El **Dominio 3.0** representa aproximadamente el **~18%** del examen. Los patrones de ingesta automatizada se evalúan con frecuencia.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 3.2**: *Realizar ingesta automatizada de datos*, incluyendo Snowpipe, Snowpipe Streaming, Streams, Tasks y Tablas Dinámicas.

---

## Resumen de Patrones de Ingesta

| Herramienta | Disparador | Latencia | Ideal Para |
|---|---|---|---|
| **COPY INTO** | Manual / programado | Minutos a horas | Cargas por lotes |
| **Snowpipe** | Evento de cloud storage | Casi en tiempo real (segundos–minutos) | Ingesta continua basada en archivos |
| **Snowpipe Streaming** | Inserción vía SDK | Sub-segundo | Transmisión de filas de alta frecuencia |
| **Streams + Tasks** | Tiempo o condición de stream | Configurable | Orquestación de pipelines basada en CDC |
| **Tablas Dinámicas** | Automático (basado en retardo) | Configurable | Actualización incremental declarativa |

---

## Snowpipe

**Snowpipe** es el servicio de ingesta continua y sin servidor de Snowflake — carga automáticamente los archivos a medida que llegan a un stage.

### Cómo Funciona Snowpipe

```
Archivos llegan a S3/Azure/GCS
         │
         ▼
Evento de Cloud Storage (S3 Event, Azure Event Grid, GCS Pub/Sub)
         │
         ▼
Snowpipe recibe la notificación (o llamada a REST API)
         │
         ▼
COPY INTO se ejecuta (sin servidor — no se requiere warehouse)
         │
         ▼
Datos disponibles en la tabla Snowflake (segundos a minutos)
```

### Creación de un Pipe

```sql
-- Crear un pipe con auto-ingesta (disparado por evento en la nube)
CREATE PIPE orders_pipe
    AUTO_INGEST = TRUE
    COMMENT = 'Ingestar automáticamente archivos de pedidos desde S3'
AS
COPY INTO raw.orders (order_id, customer_id, amount, order_ts)
FROM (
    SELECT $1, $2, $3::DECIMAL(10,2), $4::TIMESTAMP
    FROM @s3_orders_stage/orders/
)
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- Ver el ARN de SQS del pipe (para configurar la notificación de eventos en S3)
SHOW PIPES LIKE 'orders_pipe';
```

### Snowpipe con REST API

Para casos donde los eventos de la nube no están disponibles, se puede disparar Snowpipe vía REST API:

```python
import requests
from snowflake.ingest import SimpleIngestManager

# Inicializar el gestor de ingesta
manager = SimpleIngestManager(
    account='myaccount.us-east-1',
    host='myaccount.us-east-1.snowflakecomputing.com',
    user='my_user',
    pipe='my_database.my_schema.orders_pipe',
    private_key=private_key_bytes
)

# Notificar a Snowpipe sobre nuevos archivos
response = manager.ingest_files([
    {'path': 'orders/orders_2025_01_15.csv'}
])
```

### Propiedades y Facturación de Snowpipe

| Propiedad | Valor |
|---|---|
| **¿Se necesita warehouse?** | No — sin servidor |
| **Facturación** | Créditos de cómputo por archivo (tarifa sin servidor) |
| **Latencia** | Típicamente < 1 minuto |
| **Deduplicación** | Ventana de 14 días (archivos no se reprocesan) |
| **Manejo de errores** | Los archivos con errores se omiten; verificar COPY_HISTORY |

```sql
-- Monitorear el estado de carga de Snowpipe
SELECT *
FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
    TABLE_NAME => 'ORDERS',
    START_TIME => DATEADD('hour', -24, CURRENT_TIMESTAMP)
))
ORDER BY LAST_LOAD_TIME DESC;

-- Uso de créditos de Snowpipe
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.PIPE_USAGE_HISTORY
WHERE PIPE_NAME = 'ORDERS_PIPE'
AND START_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP);

-- Actualizar Snowpipe (forzar re-escaneo del stage)
ALTER PIPE orders_pipe REFRESH;
```

---

## Snowpipe Streaming

**Snowpipe Streaming** habilita la **ingesta a nivel de fila con latencia sub-segundo** directamente en las tablas de Snowflake vía el SDK de Ingesta de Snowflake — sin necesidad de preparar archivos en stages primero:

```
Aplicación / Kafka / herramienta CDC
         │
         ▼ (SDK de Ingesta de Snowflake o Kafka Connector)
Canal de Streaming (*Streaming Channel*) de Snowflake
         │
         ▼
Tabla Snowflake (latencia: milisegundos a segundos)
```

### Diferencias Clave: Snowpipe vs. Snowpipe Streaming

| Aspecto | Snowpipe | Snowpipe Streaming |
|---|---|---|
| Unidad de datos | Archivos | Filas |
| Latencia | Segundos a minutos | Milisegundos a segundos |
| ¿Se requiere staging? | Sí (archivos en stage) | No |
| SDK | SDK de Ingesta (rutas de archivos) | SDK de Ingesta (nivel de fila) |
| Caso de uso | Carga continua basada en archivos | Transmisión de eventos en tiempo real |
| Integración con Kafka | Kafka Connector v1 | Kafka Connector v2+ |

```java
// Ejemplo en Java — Snowpipe Streaming
SnowflakeStreamingIngestClient client = SnowflakeStreamingIngestClientFactory
    .builder("myClient")
    .setProperties(props)
    .build();

OpenChannelRequest request = OpenChannelRequest.builder("MY_CHANNEL")
    .setDBName("MY_DB")
    .setSchemaName("PUBLIC")
    .setTableName("EVENTS")
    .setOnErrorOption(OpenChannelRequest.OnErrorOption.CONTINUE)
    .build();

SnowflakeStreamingIngestChannel channel = client.openChannel(request);

// Insertar filas
Map<String, Object> row = new HashMap<>();
row.put("event_id", "12345");
row.put("event_type", "click");
row.put("event_ts", System.currentTimeMillis());
channel.insertRow(row, "offset_12345");
```

---

## Streams — Captura de Datos de Cambios (CDC)

Un **Stream** es un objeto de Snowflake que captura cambios DML (INSERT, UPDATE, DELETE) en una tabla o vista fuente. Actúa como un **registro de CDC** (*Change Data Capture*).

### Tipos de Stream

| Tipo | Captura | Fuente |
|---|---|---|
| **Estándar** | INSERT, UPDATE, DELETE | Tablas, tablas de directorio |
| **Solo-append** | Solo INSERT (sin actualizaciones/eliminaciones) | Tablas, vistas |
| **Solo-insert** | Solo INSERT | Tablas externas |

```sql
-- Crear un stream estándar
CREATE STREAM orders_stream ON TABLE raw.orders;

-- Crear un stream solo-append (más ligero para tablas con muchos inserts)
CREATE STREAM events_stream ON TABLE raw.events
    APPEND_ONLY = TRUE;

-- Consultar el stream
SELECT
    *,
    METADATA$ACTION,       -- 'INSERT' o 'DELETE'
    METADATA$ISUPDATE,     -- TRUE si este DELETE es la fila antigua de un UPDATE
    METADATA$ROW_ID        -- identificador único de fila
FROM orders_stream;
```

### Desplazamiento y Consumo del Stream

Un stream rastrea los cambios desde su **desplazamiento** (*offset*) — su última posición consumida. Después de consumir el stream (vía DML dentro de un Task o sentencia explícita), el desplazamiento avanza:

```sql
-- Consumir el stream en un MERGE (el patrón más común)
MERGE INTO analytics.orders tgt
USING orders_stream src
ON tgt.order_id = src.order_id
WHEN MATCHED AND src.METADATA$ACTION = 'DELETE' THEN DELETE
WHEN MATCHED AND src.METADATA$ACTION = 'INSERT' THEN UPDATE SET
    tgt.amount = src.amount,
    tgt.status = src.status
WHEN NOT MATCHED AND src.METADATA$ACTION = 'INSERT' THEN INSERT
    (order_id, amount, status) VALUES (src.order_id, src.amount, src.status);
```

> [!WARNING]
> Los streams consumen **Time Travel** para rastrear su desplazamiento. Si el período de Time Travel vence antes de que se consuma el stream, el stream se vuelve **obsoleto** (*stale*). Siempre consume los streams dentro de la ventana de retención.

---

## Tasks (Tareas Programadas)

Un **Task** programa la ejecución de SQL — es el planificador de trabajos nativo de Snowflake.

### Tipos de Task

| Propiedad | Task Basada en Warehouse | Task Sin Servidor |
|---|---|---|
| Cómputo | Usa un Virtual Warehouse con nombre | Sin servidor gestionado por Snowflake |
| Control de costos | Monitor de Recursos del warehouse | Facturación por crédito sin servidor |
| Ideal para | Cargas de trabajo pesadas y predecibles | Tasks ligeras y frecuentes |

```sql
-- Task basada en warehouse (cada 5 minutos)
CREATE TASK refresh_staging
    WAREHOUSE = WH_TRANSFORM
    SCHEDULE = '5 MINUTE'
AS
INSERT INTO staging.orders_processed
SELECT * FROM raw.orders
WHERE processed = FALSE;

-- Task sin servidor
CREATE TASK serverless_task
    USER_TASK_MANAGED_INITIAL_WAREHOUSE_SIZE = 'SMALL'
    SCHEDULE = 'USING CRON 0 3 * * * UTC'  -- todos los días a las 3am UTC
AS
CALL my_stored_procedure();

-- Task disparada por stream (solo se ejecuta cuando el stream tiene datos)
CREATE TASK process_orders_task
    WAREHOUSE = WH_TRANSFORM
    WHEN SYSTEM$STREAM_HAS_DATA('orders_stream')
    SCHEDULE = '1 MINUTE'  -- verificar cada minuto
AS
MERGE INTO analytics.orders tgt
USING orders_stream src ON tgt.id = src.id
WHEN NOT MATCHED THEN INSERT ...;

-- Las tasks comienzan SUSPENDIDAS — deben reanudarse explícitamente
ALTER TASK refresh_staging RESUME;
ALTER TASK serverless_task RESUME;
ALTER TASK process_orders_task RESUME;
```

### DAGs de Tasks (Grafos Acíclicos Dirigidos)

Las Tasks pueden encadenarse en un **DAG** donde las tasks descendientes se ejecutan después de que las tasks ascendientes se completan:

```sql
-- Task raíz (programada)
CREATE TASK root_task
    WAREHOUSE = WH_TRANSFORM
    SCHEDULE = '1 HOUR'
AS
TRUNCATE TABLE staging.work;

-- Task hija 1 (depende de la raíz)
CREATE TASK child_task_1
    WAREHOUSE = WH_TRANSFORM
    AFTER root_task
AS
INSERT INTO staging.work SELECT * FROM raw.orders;

-- Task hija 2 (depende de la raíz)
CREATE TASK child_task_2
    WAREHOUSE = WH_TRANSFORM
    AFTER root_task
AS
INSERT INTO staging.work SELECT * FROM raw.events;

-- Task nieta (depende de ambas hijas)
CREATE TASK final_task
    WAREHOUSE = WH_TRANSFORM
    AFTER child_task_1, child_task_2
AS
CALL process_final_data();

-- Reanudar todas las tasks
SELECT SYSTEM$TASK_DEPENDENTS_ENABLE('root_task');
```

---

## Tablas Dinámicas (*Dynamic Tables*)

Las **Tablas Dinámicas** proporcionan un enfoque **declarativo** para pipelines de datos incrementales — define la transformación como un SELECT, establece un `TARGET_LAG`, y Snowflake actualiza la tabla automáticamente:

```sql
-- Tabla fuente
CREATE TABLE orders (order_id NUMBER, customer_id NUMBER, amount DECIMAL, status STRING);

-- Tabla dinámica (actualizada automáticamente)
CREATE DYNAMIC TABLE customer_metrics
    TARGET_LAG = '1 hour'        -- retraso máximo aceptable desde la fuente
    WAREHOUSE = WH_TRANSFORM
AS
SELECT
    customer_id,
    count(*) AS total_pedidos,
    sum(amount) AS total_gastado,
    max(order_id) AS ultimo_pedido_id
FROM orders
WHERE status = 'COMPLETED'
GROUP BY customer_id;

-- Verificar el estado de la tabla dinámica
SHOW DYNAMIC TABLES LIKE 'customer_metrics';

-- Disparar actualización manualmente
ALTER DYNAMIC TABLE customer_metrics REFRESH;
```

### Tablas Dinámicas vs. Streams + Tasks

| Aspecto | Tablas Dinámicas | Streams + Tasks |
|---|---|---|
| Complejidad | Baja (declarativo) | Mayor (imperativo) |
| Control del retraso | Parámetro `TARGET_LAG` | Frecuencia del horario de la task |
| Lógica de merge personalizada | Limitada | Control total |
| Rastreo de dependencias | Automático | Manual |
| Monitoreo | Vistas DYNAMIC_TABLE integradas | TASK_HISTORY |

---

## Preguntas de Práctica

**P1.** Una empresa recibe archivos CSV en un bucket S3 continuamente durante el día. ¿Qué funcionalidad proporciona la carga automática con menor latencia sin necesitar un Virtual Warehouse en ejecución?

- A) COPY INTO con una task programada
- B) Snowpipe con AUTO_INGEST = TRUE ✅
- C) SDK de Snowpipe Streaming
- D) Tabla Dinámica con TARGET_LAG = '5 MINUTE'

**P2.** Un stream se vuelve obsoleto (*stale*). ¿Qué lo causó?

- A) El stream fue consumido demasiadas veces
- B) El stream no fue consumido antes de que venciera el período de Time Travel ✅
- C) La tabla fuente fue eliminada y recreada
- D) La task que consume el stream fue suspendida

**P3.** ¿Qué funcionalidad de Snowpipe habilita la transmisión de datos a nivel de fila con latencia sub-segundo, sin necesidad de preparar archivos en un stage primero?

- A) AUTO_INGEST = TRUE
- B) REST API de Snowpipe
- C) SDK de Snowpipe Streaming ✅
- D) Stream solo-append

**P4.** Se crea una Task pero no se están procesando datos. ¿Cuál es la causa más probable?

- A) El warehouse es demasiado pequeño
- B) La task está en estado SUSPENDED y debe ser REANUDADA (RESUMED) ✅
- C) El horario de la task es demasiado infrecuente
- D) El stream ya ha sido consumido

**P5.** Una Tabla Dinámica está configurada con `TARGET_LAG = '30 minutes'`. ¿Qué garantiza esto?

- A) La tabla se actualiza cada 30 minutos en punto
- B) Los datos en la tabla nunca tienen más de 30 minutos de retraso respecto a la fuente ✅
- C) El trabajo de actualización se ejecuta por un máximo de 30 minutos
- D) Los resultados se almacenan en caché durante 30 minutos

**P6.** Al usar `SYSTEM$STREAM_HAS_DATA()` en la cláusula WHEN de una Task, ¿qué sucede si el stream está vacío?

- A) La Task se ejecuta y realiza un merge vacío
- B) La Task se omite para ese intervalo de programación ✅
- C) La Task falla con un error
- D) La Task se suspende sola

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. **Snowpipe** = basado en archivos, sin servidor, casi en tiempo real (segundos a minutos)
> 2. **Snowpipe Streaming** = basado en filas, sub-segundo, no requiere staging
> 3. Los Streams se vuelven **obsoletos** si no se consumen dentro de la ventana de Time Travel
> 4. Las Tasks comienzan **SUSPENDIDAS** — siempre reanúdalas explícitamente
> 5. **Tablas Dinámicas** = enfoque declarativo con `TARGET_LAG` — más simple que Streams + Tasks
> 6. DAGs de Tasks: las tasks hijas se definen con `AFTER <task_padre>`
