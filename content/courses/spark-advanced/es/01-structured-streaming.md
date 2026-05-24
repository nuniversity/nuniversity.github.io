---
title: "Structured Streaming"
description: "Comprende conceptos de streaming, arquitectura de micro-batches, readStream, writeStream y construcción de pipelines de datos en tiempo real"
order: 1
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Structured Streaming

Structured Streaming proporciona un motor de procesamiento de flujo escalable y tolerante a fallos construido sobre la API de Spark SQL. Escribes consultas de streaming usando la misma API DataFrame/SQL que las consultas por lotes, y Spark las ejecuta incrementalmente sobre datos en streaming.

## Conceptos de Streaming

### Modelos de Procesamiento de Flujo

| Modelo | Descripción | Latencia |
|---|---|---|
| **Micro-batch** | Procesa datos en pequeños lotes (predeterminado) | 100ms - 1s |
| **Continuo** | Procesa cada registro a medida que llega (Spark 2.3+) | 1ms - 10ms |

> [!NOTE]
> El modo micro-batch es el predeterminado y más confiable. El procesamiento continuo ofrece menor latencia pero soporta menos operaciones. Comienza con micro-batch y cambia solo si se requiere latencia inferior a 100ms.

### Conceptos Clave

- **Flujo de entrada**: Datos no acotados que llegan continuamente (Kafka, archivos, sockets, etc.)
- **Flujo de salida**: Resultados escritos continuamente a un sumidero
- **Trigger**: Intervalo en el que se procesan los datos de streaming
- **Watermark**: Retraso máximo para esperar datos tardíos
- **Checkpointing**: Almacena metadatos de progreso para recuperación de fallos

## Arquitectura de Streaming

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("StructuredStreaming") \
    .master("local[*]") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoints") \
    .getOrCreate()
```

## readStream

Lectura desde una fuente de streaming:

```python
# Fuente de archivos (monitorear un directorio para nuevos archivos)
streaming_df = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .option("cleanSource", "archive") \
    .csv("data/input/")

# Fuente Kafka
kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .load()

# Fuente Rate (para pruebas)
rate_df = spark.readStream \
    .format("rate") \
    .option("rowsPerSecond", 10) \
    .option("numPartitions", 1) \
    .load()

# Fuente Socket (pruebas simples)
socket_df = spark.readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()
```

> [!SUCCESS]
> La fuente de archivos es la forma más fácil de aprender streaming. Coloca archivos en un directorio y Spark los procesa incrementalmente. La opción `maxFilesPerTrigger` controla el rendimiento.

## writeStream

Escritura a un sumidero de streaming:

```python
# Sumidero Console (depuración)
query = streaming_df.writeStream \
    .format("console") \
    .outputMode("append") \
    .option("truncate", "false") \
    .start()

# Sumidero Memory (para consultas interactivas)
query = streaming_df.writeStream \
    .format("memory") \
    .queryName("recent_events") \
    .outputMode("append") \
    .start()

# Consultar la tabla en memoria
spark.sql("SELECT * FROM recent_events").show()

# Sumidero File (escribir a Parquet/CSV/JSON)
query = streaming_df.writeStream \
    .format("parquet") \
    .option("path", "data/output/") \
    .option("checkpointLocation", "/tmp/checkpoints") \
    .outputMode("append") \
    .start()

# Sumidero Kafka
query = streaming_df.selectExpr("key", "value") \
    .writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "processed-events") \
    .option("checkpointLocation", "/tmp/checkpoints") \
    .start()

# Sumidero ForeachBatch (procesamiento personalizado)
def process_batch(batch_df, batch_id):
    batch_df.write.mode("append").parquet(f"data/batches/{batch_id}/")

query = streaming_df.writeStream \
    .foreachBatch(process_batch) \
    .outputMode("append") \
    .start()
```

## Modos de Salida

| Modo | Descripción | Cuándo Usar |
|---|---|---|
| **Append** | Solo nuevas filas | Operaciones map/filter (sin agregación) |
| **Complete** | Tabla de resultados completa cada trigger | Consultas agregadas (sin watermark) |
| **Update** | Solo filas actualizadas | Consultas agregadas (con watermark) |

## Ejemplo Completo de Streaming

```python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType
from pyspark.sql.functions import window, col, count, sum, avg, to_timestamp

# Definir esquema para datos de streaming
schema = StructType([
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("amount", IntegerType()),
    StructField("timestamp", StringType())
])

# Leer datos de streaming
raw_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .json("data/events/")

# Analizar timestamp
parsed_stream = raw_stream \
    .withColumn("event_time", to_timestamp(col("timestamp"))) \
    .drop("timestamp")

# Agregación por ventana con watermark
aggregated = parsed_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event_type")
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount")
    )

# Escribir resultados agregados
query = aggregated.writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", "false") \
    .option("numRows", 10) \
    .start()

query.awaitTermination()
```

## Gestión de Consultas de Streaming

```python
# Iniciar múltiples flujos
query1 = stream1.writeStream.queryName("stream1").format("console").start()
query2 = stream2.writeStream.queryName("stream2").format("console").start()

# Listar flujos activos
for q in spark.streams.active:
    print(f"Query: {q.name}, Status: {q.status}")

# Esperar a que cualquier flujo termine
spark.streams.awaitAnyTermination()

# Detener una consulta específica
query.stop()

# Detener todas las consultas
spark.streams.resetTerminated()
```

## Checkpointing y Recuperación

El checkpointing almacena el progreso y estado de una consulta de streaming para recuperación de fallos.

```python
checkpoint_dir = "hdfs://namenode:9000/checkpoints/log_processor"

query = streaming_df.writeStream \
    .option("checkpointLocation", checkpoint_dir) \
    .format("parquet") \
    .option("path", "data/output/") \
    .start()
```

> [!WARNING]
> Los directorios de checkpoint deben almacenarse en un sistema de archivos tolerante a fallos (HDFS, S3, GCS). Los checkpoints del sistema de archivos local se pierden si el driver falla. Nunca reutilices un directorio de checkpoint para una consulta diferente.

## Pruebas de Aplicaciones de Streaming

```python
# Stream a sumidero Memory para pruebas
def test_streaming_pipeline():
    test_df = spark.readStream \
        .format("rate") \
        .option("rowsPerSecond", 5) \
        .load()
    
    result = test_df \
        .withColumn("doubled", col("value") * 2) \
        .writeStream \
        .format("memory") \
        .queryName("test_results") \
        .outputMode("append") \
        .start()
    
    import time
    time.sleep(3)
    
    # Consultar tabla en memoria
    df = spark.sql("SELECT * FROM test_results")
    assert df.count() > 0
    print(f"Prueba pasada: {df.count()} filas")
    
    result.stop()
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre procesamiento micro-batch y continuo?
2. ¿Cuáles son los tres modos de salida en Structured Streaming?
3. ¿Cómo habilita el checkpointing la recuperación de fallos?
4. ¿Qué es un watermark y por qué es necesario para las agregaciones?
5. ¿Cómo lees desde Kafka en una consulta de streaming?
6. ¿Qué sucede si reinicias una consulta de streaming sin un checkpoint?
7. ¿Cómo controla `maxFilesPerTrigger` el rendimiento del flujo de archivos?
8. ¿Para qué se usa `foreachBatch`?
9. ¿Cómo manejas cambios de esquema en datos de streaming?
10. Diseña un pipeline de streaming que lea de Kafka, agregue por ventanas de 5 minutos y escriba a Parquet.
