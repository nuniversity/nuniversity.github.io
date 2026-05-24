---
title: "Monitoreo y Depuración"
description: "Usa la UI de Spark, el servidor de historial, análisis de registros, métricas y estrategias de depuración para diagnosticar y solucionar problemas de Spark"
order: 9
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Monitoreo y Depuración

Incluso las aplicaciones Spark bien ajustadas encuentran problemas. Esta lección cubre herramientas de monitoreo, estrategias de depuración y técnicas de diagnóstico para identificar y resolver problemas de rendimiento y errores.

## UI de Spark

La UI de Spark es la herramienta principal para monitorear aplicaciones en ejecución y completadas. Accede a ella en `http://<driver>:4040`.

### Resumen de Pestañas de la UI

| Pestaña | Información | Cómo Usar |
|---|---|---|
| **Jobs** | DAG a nivel de trabajo, estado, duración | Identificar trabajos lentos |
| **Stages** | Detalles de etapa, lectura/escritura shuffle, spill | Encontrar sesgo de datos, spills |
| **Storage** | RDDs/DataFrames en caché | Verificar que el caché funciona |
| **Environment** | Valores de configuración | Verificar configuración efectiva |
| **Executors** | Métricas por ejecutor | Identificar ejecutores fallidos |
| **SQL** | Planes de consultas SQL | Optimizar consultas |

```python
# Habilitar registro de eventos para el servidor de historial
spark.conf.set("spark.eventLog.enabled", "true")
spark.conf.set("spark.eventLog.dir", "hdfs://namenode:9000/spark-logs/")
```

### Lectura de la Página de Stages

Métricas clave en los detalles de Stage:

```
- Duration: Tiempo por tarea
- Shuffle Read/Write: Datos shufflados
- Spill (Memory): Datos derramados a memoria (aceptable)
- Spill (Disk): Datos derramados a disco (malo — riesgo OOM)
- Shuffle Read Size/Records: Buscar sesgo (>10x promedio)
- GC Time: Tiempo dedicado a recolección de basura
```

> [!NOTE]
> El spill a disco es el indicador más fuerte de memoria insuficiente. Si ves cualquier spill a disco, aumenta la memoria del ejecutor o reduce el tamaño de partición.

### Uso de la Pestaña SQL

```python
# Ver plan de consulta SQL
spark.sql("SELECT * FROM large_table JOIN small_table ON key").explain(True)

# Habilitar métricas SQL
spark.conf.set("spark.sql.ui.retainedExecutions", "50")
```

## Servidor de Historial

El Servidor de Historial persiste los datos de la UI de Spark después de que la aplicación termina.

```bash
# Iniciar el servidor de historial
./sbin/start-history-server.sh

# Acceder en http://<host>:18080
```

```python
# Escribir registros de eventos para el servidor de historial
spark.conf.set("spark.eventLog.enabled", "true")
spark.conf.set("spark.eventLog.dir", "file:///tmp/spark-logs/")
spark.conf.set("spark.history.fs.logDirectory", "file:///tmp/spark-logs/")
```

## Análisis de Registros

### Configuración de Niveles de Registro

```python
# Reducir verbosidad de registros de Spark
from pyspark import SparkContext
sc = spark.sparkContext
sc.setLogLevel("WARN")

# Niveles: ALL < DEBUG < INFO < WARN < ERROR < FATAL < OFF

# Habilitar registros del driver
# En log4j.properties:
# log4j.logger.org.apache.spark=INFO
# log4j.logger.org.apache.hadoop=WARN
```

### Captura de Registros del Executor

```bash
# En spark-submit:
--conf spark.executor.extraJavaOptions=-Dlog4j.configuration=file:log4j.properties

# Registros YARN
yarn logs -applicationId application_123456789_0001
```

## Métricas y Monitoreo

### Métricas Incorporadas

```python
# Habilitar métricas
# conf/metrics.properties
# *.sink.servlet.class=org.apache.spark.metrics.sink.MetricsServlet
# *.source.jvm.class=org.apache.spark.metrics.source.JvmSource
```

### Métricas Personalizadas de Streaming

```python
from pyspark.sql.functions import col, count, sum, window, current_timestamp

# Rastrear progreso de streaming
streaming_query = streaming_df.writeStream \
    .format("console") \
    .queryName("metrics_stream") \
    .trigger(processingTime="10 seconds") \
    .start()

# Consultar progreso
import json
last_progress = streaming_query.lastProgress
if last_progress:
    print(f"Filas procesadas: {last_progress['numInputRows']}")
    print(f"Filas de entrada por segundo: {last_progress['inputRowsPerSecond']}")
    print(f"Tasa de procesamiento: {last_progress['processedRowsPerSecond']}")

# Listar flujos activos
for q in spark.streams.active:
    status = q.status
    print(f"Stream {q.name}: {status['message']}")
```

### Acumuladores para Monitoreo Personalizado

```python
# Métricas personalizadas con acumuladores
rows_processed = sc.accumulator(0)
errors_found = sc.accumulator(0)
bytes_processed = sc.accumulator(0.0)

def monitor_row(row):
    rows_processed.add(1)
    if row.get("status", 200) >= 400:
        errors_found.add(1)
    return row

# Después de la acción
print(f"Filas: {rows_processed.value}, Errores: {errors_found.value}")
```

## Errores Comunes y Soluciones

### OutOfMemoryError

```
java.lang.OutOfMemoryError: Java heap space
```

```python
# Soluciones:
# 1. Aumentar memoria del ejecutor
spark.conf.set("spark.executor.memory", "8g")

# 2. Aumentar sobrecarga
spark.conf.set("spark.executor.memoryOverhead", "1g")

# 3. Reducir tamaño de partición
spark.conf.set("spark.sql.shuffle.partitions", "200")

# 4. Reducir datos por tarea
df.repartition(100)

# 5. Usar DISK_ONLY para cachés grandes
df.persist(StorageLevel.DISK_ONLY)

# 6. Habilitar fuera del heap
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")
```

### Sesgo de Datos

Tareas que tardan significativamente más que otras:

```python
# Identificar sesgo
def check_skew(df, key_col):
    """Identificar claves sesgadas."""
    stats = df.groupBy(key_col).agg(
        count("*").alias("count")
    ).orderBy(col("count").desc())
    
    stats.show(10)
    top = stats.first()
    print(f"Clave principal: {top[key_col]} con {top['count']} filas")

# Soluciones:
# 1. Salting (añadir sufijo aleatorio a claves sesgadas)
# 2. Habilitar AQE skew join (Spark 3.x)
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# 3. Aumentar particiones
spark.conf.set("spark.sql.shuffle.partitions", "200")
```

### Problemas de Shuffle

```python
# Errores de shuffle
# ERROR: ExecutorLostFailure
# ERROR: java.io.FileNotFoundException

# Soluciones:
# 1. Aumentar buffer de shuffle
spark.conf.set("spark.shuffle.file.buffer", "64k")
spark.conf.set("spark.reducer.maxSizeInFlight", "96m")

# 2. Habilitar seguimiento de shuffle
spark.conf.set("spark.dynamicAllocation.shuffleTracking.enabled", "true")

# 3. Aumentar timeout de red
spark.conf.set("spark.network.timeout", "800s")
```

### Errores de Serialización

```
org.apache.spark.SparkException: Task not serializable
```

```python
# Soluciones:
# 1. Hacer clases Serializable
class MyClass:
    def __init__(self):
        self.data = []
    def __getstate__(self):
        return self.__dict__
    def __setstate__(self, state):
        self.__dict__ = state

# 2. Usar serialización Kryo
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

# 3. Definir funciones a nivel de módulo (no dentro de clases)
def my_function(x):
    return x * 2

# 4. Transmitir objetos grandes
broadcast_data = sc.broadcast(large_dictionary)
```

## Lista de Verificación de Depuración

```
P: ¿El trabajo se está ejecutando?
  |-- SÍ -> Ir a la UI de Spark
  |-- NO -> Verificar registros de error
  
P: ¿Tareas lentas?
  |-- ¿Sesgo de datos? -> Salting o aumentar particiones
  |-- ¿Spilling a disco? -> Aumentar memoria
  |-- ¿Sobrecarga de GC? -> Ajustar GC o usar fuera del heap
  
P: ¿El trabajo falla?
  |-- ¿OOM? -> Aumentar memoria, reducir tamaño de partición
  |-- ¿Timeout de conexión? -> Aumentar timeout de red
  |-- ¿Error de serialización? -> Verificar serializabilidad de clases
  |-- ¿Archivo no encontrado? -> Verificar rutas, usar hadoop fs -ls
  
P: ¿Resultados incorrectos?
  |-- Verificar condiciones de join
  |-- Verificar manejo de nulos
  |-- Verificar tipos de datos
  |-- Revisar UDFs para corrección
```

## Perfilado de Rendimiento

```python
# Perfilar una transformación DataFrame
import time

def time_transform(df, transform_fn, name="transform"):
    start = time.time()
    result = transform_fn(df)
    result.count()  # Forzar acción
    duration = time.time() - start
    print(f"{name}: {duration:.2f}s")
    return result, duration

# Comparar enfoques
result1, t1 = time_transform(df, lambda d: d.groupBy("key").agg(sum("value")))
result2, t2 = time_transform(df, lambda d: d.groupBy("key").sum("value"))
print(f"Speedup: {t1/t2:.1f}x")

# Perfilado de memoria
def profile_storage(df, action="count"):
    """Perfil de almacenamiento y memoria."""
    initial = sc.getRDDStorageInfo()
    result = getattr(df, action)()
    final = sc.getRDDStorageInfo()
    
    for info in final:
        print(f"RDD: {info.name}")
        print(f"  Memoria: {info.memSize / 1024**2:.0f} MB")
        print(f"  Disco: {info.diskSize / 1024**2:.0f} MB")
    
    return result
```

## Preguntas de Práctica

1. ¿Qué información proporciona cada pestaña de la UI de Spark?
2. ¿En qué se diferencia el Servidor de Historial de la UI de Spark en vivo?
3. ¿Qué métricas en la página de Stage indican problemas de rendimiento?
4. ¿Cómo habilitas el registro de eventos para el Servidor de Historial?
5. ¿Qué indica el spill a disco y cómo lo solucionas?
6. ¿Cómo identificas y solucionas el sesgo de datos?
7. ¿Qué causa "Task not serializable" y cómo lo solucionas?
8. ¿Cómo usas acumuladores para monitoreo personalizado?
9. ¿Cómo depurarías un trabajo que funciona bien con datos pequeños pero falla con datos grandes?
10. ¿Cómo accedes y analizas los registros del ejecutor?
