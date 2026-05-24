---
title: "Operaciones de Ventana y Watermarking"
description: "Domina ventanas tumbling y sliding, watermarking, manejo de datos tardíos y modos de salida para agregaciones en streaming"
order: 2
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Operaciones de Ventana y Watermarking

Las operaciones de ventana son la base de la analítica en streaming. Combinadas con watermarking, permiten un manejo robusto de datos que llegan tarde mientras mantienen resultados correctos.

## Ventanas Tumbling

Ventanas de tamaño fijo y no superpuestas.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import window, col, count, sum, avg
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType

spark = SparkSession.builder \
    .appName("WindowOperations") \
    .master("local[*]") \
    .getOrCreate()

schema = StructType([
    StructField("user_id", StringType()),
    StructField("event", StringType()),
    StructField("amount", IntegerType()),
    StructField("event_time", TimestampType())
])

# Ventana tumbling (5 minutos)
tumbling = stream_df \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event")
    ) \
    .agg(
        count("*").alias("count"),
        sum("amount").alias("total_amount")
    )

tumbling.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()
```

```
Salida de ventana (tumbling, 5 min):
+--------------------+--------+-----+------------+
|                 window|    event|count|total_amount|
+--------------------+--------+-----+------------+
|{2024-01-01 12:00, 12:05}|   click|  150|       12000|
|{2024-01-01 12:00, 12:05}| purchase|   20|        8000|
|{2024-01-01 12:05, 12:10}|   click|  200|       16000|
+--------------------+--------+-----+------------+
```

> [!SUCCESS]
> Las ventanas tumbling son la agregación en streaming más simple. Cada evento pertenece exactamente a una ventana. Úsalas para métricas periódicas (ej., "solicitudes por cada 5 minutos").

## Ventanas Sliding

Ventanas superpuestas con un intervalo de deslizamiento.

```python
# Ventana sliding (15 minutos, deslizando cada 5 minutos)
sliding = stream_df \
    .groupBy(
        window(col("event_time"), "15 minutes", "5 minutes"),
        col("event")
    ) \
    .agg(count("*").alias("count"))

sliding.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

```
Salida de ventana (sliding, 15 min ventana, 5 min deslizamiento):
+--------------------+--------+-----+
|                 window|    event|count|
+--------------------+--------+-----+
|{2024-01-01 12:00, 12:15}|   click|  450|
|{2024-01-01 12:05, 12:20}|   click|  520|
|{2024-01-01 12:10, 12:25}|   click|  480|
+--------------------+--------+-----+
```

> [!NOTE]
> Las ventanas sliding crean ventanas superpuestas. Los eventos que pertenecen a múltiples ventanas se incluyen en cada una. El número de ventanas = duración_ventana / intervalo_deslizamiento. Usa ventanas sliding para suavizado (ej., "media móvil sobre 30 minutos").

### Tumbling vs Sliding

| Aspecto | Tumbling | Sliding |
|---|---|---|
| **Superposición** | Ninguna | Sí |
| **Filas de salida por evento** | 1 | duración_ventana / intervalo_deslizamiento |
| **Caso de uso** | Instantáneas periódicas | Medias móviles |
| **Complejidad** | Menor | Mayor |
| **Tamaño de estado** | Menor | Mayor |

## Watermarking

Los watermarks definen cuánto tiempo pueden llegar tarde los datos y aún ser incluidos en los resultados.

```python
# Watermark: 10 minutos de datos tardíos permitidos
with_watermark = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event")
    ) \
    .agg(count("*").alias("count"))

with_watermark.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### Cómo Funcionan los Watermarks

```
Progresión de Tiempo de Evento:

12:00  12:05  12:10  12:15  12:20  12:25  12:30
  |------|------|------|------|------|------|
  W1     W2     W3     W4     W5     W6

Tiempo de procesamiento actual: 12:35
Watermark: 12:25 (10 minutos atrás)

Eventos con tiempo 12:26 llegan: incluidos en W5 (todavía abierta)
Eventos con tiempo 12:24 llegan: incluidos en W4 (todavía abierta)
Eventos con tiempo 12:15 llegan: DESCARTADOS (antes del watermark)
```

> [!WARNING]
> Una vez que un watermark pasa el tiempo de finalización de una ventana, esa ventana se finaliza y sus resultados se emiten. Los eventos tardíos que llegan después del watermark se descartan. Establece el umbral del watermark cuidadosamente según el retraso típico de tus datos.

### Elegir la Duración del Watermark

```python
# Agresivo (menor latencia, más datos tardíos descartados)
df.withWatermark("event_time", "2 minutes")

# Conservador (mayor latencia, menos registros descartados)
df.withWatermark("event_time", "1 hour")

# Basado en análisis de datos
def estimate_watermark_delay(spark, source_path, percentile=0.99):
    """Analizar datos históricos para determinar el retraso del watermark."""
    df = spark.read.parquet(source_path)
    
    delay_stats = df \
        .withColumn("processing_delay", 
            col("processing_time").cast("long") - col("event_time").cast("long")) \
        .selectExpr(f"percentile(processing_delay, {percentile}) / 60 as p99_delay_minutes")
    
    return delay_stats.collect()[0]["p99_delay_minutes"]
```

## Estrategias de Manejo de Datos Tardíos

### Estrategia 1: Watermark con Modo Update

```python
# Los datos tardíos actualizan la ventana hasta que el watermark pasa
query = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(window(col("event_time"), "5 minutes")) \
    .agg(count("*").alias("count")) \
    .writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### Estrategia 2: Cola Separada de Datos Tardíos

```python
# Enrutar datos tardíos a un flujo separado para reprocesamiento
from pyspark.sql.functions import current_timestamp, expr

late_data = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .filter(expr("event_time < current_timestamp() - interval 15 minutes"))

late_data.writeStream \
    .format("parquet") \
    .option("path", "data/late_events/") \
    .outputMode("append") \
    .start()
```

### Estrategia 3: Reprocesar con Ventana Más Amplia Periódicamente

```python
def reprocess_late_data(spark):
    """Trabajo por lotes diario para reprocesar datos recientes con una ventana más amplia."""
    
    df = spark.read.parquet("data/raw_events/") \
        .filter(col("event_date") >= date.today() - timedelta(days=3))
    
    result = df \
        .withWatermark("event_time", "2 hours") \
        .groupBy(window(col("event_time"), "5 minutes")) \
        .agg(count("*").alias("corrected_count"))
    
    result.write.mode("overwrite").parquet("data/corrected/")
```

## Comportamiento del Modo de Salida con Ventanas

| Modo de Salida | Con Watermark | Sin Watermark |
|---|---|---|
| **Append** | Solo resultados finales (después del watermark) | No soportado |
| **Complete** | Resultado completo cada trigger | Resultado completo cada trigger (estado crece sin límite) |
| **Update** | Solo resultados actualizados | No soportado |

> [!NOTE]
> Sin un watermark, el modo `complete` acumula todo el estado de la ventana indefinidamente, lo que eventualmente causará errores OOM. Siempre usa watermarks con agregaciones en streaming.

## Múltiples Agregaciones de Ventana

```python
# Múltiples tamaños de ventana en una consulta
multi_window = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes").alias("window_5m"),
        window(col("event_time"), "15 minutes").alias("window_15m"),
        window(col("event_time"), "1 hour").alias("window_1h"),
        col("event_type")
    ) \
    .agg(count("*").alias("count"))

multi_window.writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", "false") \
    .start()
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre ventanas tumbling y sliding?
2. ¿Cómo evita un watermark el crecimiento ilimitado del estado?
3. ¿Qué sucede con los eventos que llegan después del watermark?
4. ¿Cuál es la relación entre el intervalo de deslizamiento y la duración de la ventana en ventanas sliding?
5. ¿Por qué el modo `append` solo es compatible con watermarks para agregaciones?
6. ¿Cómo eliges la duración correcta del watermark?
7. ¿Qué sucede si usas el modo `complete` sin un watermark?
8. ¿Cómo manejas datos que llegan tarde y deberían actualizar resultados ya emitidos?
9. ¿Qué modos de salida funcionan mejor para agregaciones de ventanas tumbling?
10. ¿Cómo calculas una media móvil de 7 días en streaming?
