---
title: "Configuración de Clúster"
description: "Configura clústers Spark: spark.sql.shuffle.partitions, spark.executor.memory, asignación dinámica y optimización de recursos"
order: 6
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Configuración de Clúster

La configuración adecuada de Spark es esencial para el rendimiento, la estabilidad y la eficiencia de costos. Esta lección cubre los parámetros de configuración más críticos y cómo ajustarlos.

## Prioridad de Configuración

La configuración de Spark sigue una jerarquía:

| Prioridad | Fuente | Anula |
|---|---|---|
| 1 (Más alta) | `spark-submit --conf` | Todo lo demás |
| 2 | `SparkSession.conf.set()` | Valores por defecto del archivo |
| 3 | `spark-defaults.conf` | Valores por defecto duros |
| 4 (Más baja) | Valores por defecto duros | — |

## Configuración Principal de Recursos

### Recursos del Executor

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("OptimizedApp") \
    .config("spark.executor.memory", "8g") \
    .config("spark.executor.cores", "4") \
    .config("spark.executor.instances", "10") \
    .config("spark.driver.memory", "4g") \
    .getOrCreate()
```

### Fórmula de Cálculo de Recursos

```
Total de cores = executor.instances × executor.cores
Total de memoria = executor.instances × executor.memory

Ejemplo:
  10 ejecutores × 4 cores = 40 cores
  10 ejecutores × 8g = 80g de memoria total
  Sobrecarga: 8g × 0.1 = 0.8g por ejecutor (spark.executor.memoryOverhead)
```

> [!NOTE]
> Deja 1-2 cores por nodo para SO y servicios Hadoop. Para YARN, la sobrecarga del contenedor reduce la memoria disponible. Establece `spark.executor.memoryOverhead` al 10-15% de la memoria del ejecutor para sobrecarga JVM.

### Desglose de Memoria

```python
# Asignación de memoria predeterminada dentro de un ejecutor
# spark.executor.memory = 8g
# spark.memory.fraction = 0.6 (60% para ejecución + almacenamiento)
# spark.memory.storageFraction = 0.5 (50% de unificado para almacenamiento)
#
# Ejecución: 8g × 0.6 × 0.5 = 2.4g
# Almacenamiento: 8g × 0.6 × 0.5 = 2.4g  (puede tomar prestado de ejecución)
# Reservado: 8g × 0.4 = 3.2g (código de usuario, sobrecarga)
```

## Configuración de Shuffle

```python
# Particiones de shuffle
spark.conf.set("spark.sql.shuffle.partitions", "200")

# Regla general: 2-4 particiones por core
# 40 cores × 3 = 120 particiones

# Buffer de memoria de shuffle
spark.conf.set("spark.shuffle.file.buffer", "64k")
spark.conf.set("spark.reducer.maxSizeInFlight", "96m")

# Compresión de shuffle
spark.conf.set("spark.shuffle.compress", "true")
spark.conf.set("spark.shuffle.spill.compress", "true")
spark.conf.set("spark.io.compression.codec", "snappy")
```

| Parámetro de Shuffle | Predeterminado | Descripción |
|---|---|---|
| `spark.sql.shuffle.partitions` | 200 | Particiones después del shuffle |
| `spark.shuffle.file.buffer` | 32k | Tamaño del buffer para escrituras shuffle |
| `spark.reducer.maxSizeInFlight` | 48m | Tamaño máximo de salida de mapa por reductor |
| `spark.shuffle.compress` | true | Comprimir salida de shuffle |
| `spark.shuffle.spill.compress` | true | Comprimir datos derramados |

## Asignación Dinámica

La asignación dinámica ajusta el número de ejecutores según la carga de trabajo.

```python
# Habilitar asignación dinámica
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.minExecutors", "2")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "50")
spark.conf.set("spark.dynamicAllocation.initialExecutors", "5")
spark.conf.set("spark.dynamicAllocation.executorIdleTimeout", "60s")
spark.conf.set("spark.dynamicAllocation.cachedExecutorIdleTimeout", "120s")

# Con seguimiento de shuffle (mantiene ejecutores durante shuffles)
spark.conf.set("spark.dynamicAllocation.shuffleTracking.enabled", "true")
```

> [!SUCCESS]
> La asignación dinámica es esencial para clústers multiinquilino. Escala automáticamente hacia abajo cuando la demanda es baja y hacia arriba durante cargas pico, mejorando la utilización del clúster.

### Cuándo Usar Asignación Dinámica

| Escenario | Recomendado |
|---|---|
| Clúster YARN multiinquilino | Sí |
| Clúster dedicado | Quizás (asignación fija más simple) |
| Cargas de trabajo de streaming | Quizás (considerar fijo para latencia predecible) |
| Kubernetes | Sí (autoescalado) |
| Consultas ad-hoc cortas | Sí |

## Ejecución Adaptativa de Consultas (AQE)

```python
# Habilitar AQE (predeterminado en Spark 3.x)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Coalescencia dinámica de particiones
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitions", "10")
spark.conf.set("spark.sql.adaptive.coalescePartitions.maxPartitions", "500")
spark.conf.set("spark.sql.adaptive.coalescePartitions.parallelismFirst", "true")

# Optimización de join sesgado
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")

# Cambio dinámico de join (broadcast vs sort-merge)
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
```

## Serialización y Compresión

```python
# Serialización Kryo (más rápida que serialización Java)
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "256m")
spark.conf.set("spark.kryo.registrationRequired", "false")

# Registrar clases personalizadas para Kryo
spark.conf.set("spark.kryo.classesToRegister", 
    "com.example.MyClass,com.example.AnotherClass")

# Compresión RDD
spark.conf.set("spark.rdd.compress", "true")

# Compresión de difusión
spark.conf.set("spark.broadcast.compress", "true")
```

## Red y E/S

```python
# Timeouts de red
spark.conf.set("spark.network.timeout", "600s")
spark.conf.set("spark.executor.heartbeatInterval", "30s")
spark.conf.set("spark.sql.broadcastTimeout", "600")

# Tamaño máximo de resultado
spark.conf.set("spark.driver.maxResultSize", "4g")

# Optimizaciones de E/S
spark.conf.set("spark.hadoop.parquet.enable.summary-metadata", "false")
spark.conf.set("spark.sql.parquet.mergeSchema", "false")
spark.conf.set("spark.sql.parquet.filterPushdown", "true")
```

## Tareas y Paralelismo

```python
# Configuración de tareas
spark.conf.set("spark.task.maxFailures", "8")
spark.conf.set("spark.speculation", "true")
spark.conf.set("spark.speculation.interval", "100ms")
spark.conf.set("spark.speculation.multiplier", "1.5")

# Paralelismo predeterminado
# spark.default.parallelism = max(2, total_cores)
# spark.sql.shuffle.partitions = 200 
```

## Configuraciones Comunes por Caso de Uso

### ETL por Lotes

```python
spark.conf.set("spark.executor.memory", "4g")
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.sql.shuffle.partitions", "200")
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.dynamicAllocation.enabled", "true")
```

### Machine Learning

```python
spark.conf.set("spark.executor.memory", "16g")  # Más memoria para ML
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.sql.shuffle.partitions", "100")
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "256m")
```

### Streaming

```python
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.executor.cores", "3")
spark.conf.set("spark.sql.shuffle.partitions", "10")  # Menos particiones
spark.conf.set("spark.streaming.backpressure.enabled", "true")
spark.conf.set("spark.streaming.kafka.maxRatePerPartition", "1000")
```

### Interactivo/Ad-hoc

```python
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.sql.shuffle.partitions", "50")
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "20")
```

## Ejemplos de CLI de Configuración

```bash
# spark-submit con configuración
spark-submit \
  --class com.example.Main \
  --master yarn \
  --deploy-mode cluster \
  --num-executors 20 \
  --executor-memory 8g \
  --executor-cores 4 \
  --driver-memory 4g \
  --conf spark.sql.shuffle.partitions=200 \
  --conf spark.sql.adaptive.enabled=true \
  --conf spark.dynamicAllocation.enabled=true \
  --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
  app.jar
```

## Preguntas de Práctica

1. ¿Cuál es la fórmula para calcular los recursos totales del clúster?
2. ¿Cómo divide `spark.memory.fraction` la memoria del ejecutor?
3. ¿Cuándo deberías habilitar la asignación dinámica?
4. ¿Cuál es el valor recomendado para `spark.sql.shuffle.partitions`?
5. ¿Cómo mejora AQE la distribución de particiones de shuffle?
6. ¿Cuál es la ventaja de la serialización Kryo sobre la serialización Java?
7. ¿Cómo ayuda la especulación con tareas rezagadas?
8. ¿Qué cambios de configuración harías para una carga de trabajo de streaming vs por lotes?
9. ¿Por qué `spark.sql.shuffle.partitions` se establece más bajo para streaming?
10. ¿Cómo configuras Spark para una carga de trabajo ML intensiva en memoria?
