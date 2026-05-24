---
title: "Ajuste de Memoria"
description: "Domina la gestión de memoria de Spark: memoria de ejecución vs almacenamiento, memoria fuera del heap, ajuste del recolector de basura y optimización de spill"
order: 7
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Ajuste de Memoria

La memoria es el recurso más crítico en Spark. Una mala gestión de memoria causa errores OOM, pausas excesivas del GC y spills a disco que degradan el rendimiento. Esta lección cubre el modelo de memoria de Spark y las estrategias de ajuste.

## Modelo de Memoria de Spark

```
Memoria del Executor (ej., 8g)
  |
  +-- Memoria Reservada (300 MB) — sobrecarga del sistema
  |
  +-- Memoria de Usuario (40%) — código de usuario, UDFs, estructuras de datos
  |   spark.memory.userFraction = 0.4
  |
  +-- Memoria Spark (60%) — ejecución + almacenamiento unificados
      spark.memory.fraction = 0.6
        |
        +-- Memoria de Ejecución (50% de Memoria Spark)
        |   spark.memory.storageFraction = 0.5
        |   (puede tomar prestado de almacenamiento si no se usa)
        |
        +-- Memoria de Almacenamiento (50% de Memoria Spark)
            (puede tomar prestado de ejecución si no se usa)
```

### Ejemplo de Desglose de Memoria

```python
# Para un ejecutor de 8g:
# Reservada:     300 MB
# Usuario:       (8g - 300 MB) × 0.4 = ~3.1g
# Ejecución:     (8g - 300 MB) × 0.6 × 0.5 = ~2.3g
# Almacenamiento: (8g - 300 MB) × 0.6 × 0.5 = ~2.3g
# 
# Ejecución puede expandirse a 4.6g si el almacenamiento está vacío
```

> [!NOTE]
> El modelo de memoria unificada permite que ejecución y almacenamiento tomen prestado el uno del otro. La ejecución puede desalojar bloques de almacenamiento, pero el almacenamiento no puede desalojar bloques de ejecución. Esto prioriza el cómputo sobre el almacenamiento en caché.

## Memoria de Ejecución

Se usa para shuffle, joins, agregaciones y ordenamiento.

```python
# Configuración de memoria de ejecución
spark.conf.set("spark.memory.fraction", "0.6")
spark.conf.set("spark.memory.storageFraction", "0.5")

# Configuración de spill
spark.conf.set("spark.shuffle.spill.compress", "true")
spark.conf.set("spark.shuffle.spill.initialMemoryThreshold", "5m")
spark.conf.set("spark.shuffle.spill.numElementsForceSpillThreshold", "10000000")
```

### Comportamiento de Spill

Cuando la memoria de ejecución se agota, Spark derrama datos a disco:

```python
from pyspark.sql.functions import col

# Esta operación puede hacer spill si la memoria es insuficiente
large_df.groupBy("key").agg(sum("value")).show()

# Monitorear spills en la UI de Spark:
# Stages > Stage ID > Shuffle Write/Read > Spill (disk)
# Alto spill = memoria de ejecución insuficiente
```

> [!WARNING]
> Derramar a disco ralentiza drásticamente los trabajos de Spark. Si ves spill significativo en la UI de Spark, aumenta la memoria del ejecutor o reduce las particiones de shuffle para que cada partición sea más pequeña.

## Memoria de Almacenamiento

Se usa para almacenar en caché RDDs, DataFrames y variables de difusión.

```python
# Cachear con diferentes niveles de almacenamiento
from pyspark import StorageLevel

# Predeterminado: MEMORY_ONLY
df.cache()

# Memoria y disco (derramar a disco si la memoria está llena)
df.persist(StorageLevel.MEMORY_AND_DISK)

# Solo disco
df.persist(StorageLevel.DISK_ONLY)

# Serializado (menor huella de memoria)
df.persist(StorageLevel.MEMORY_ONLY_SER)

# Verificar estado del caché
from pyspark.sql.functions import col

catalog = spark.catalog
print(f"Tablas en caché: {catalog.listTables()}")
# Verificar tamaño del caché
df_cached = df.cache()
df_cached.count()  # Materializar caché
print(spark.sparkContext.getRDDStorageInfo())
```

### Estimación del Tamaño de Caché

```python
# Estimar tamaño de caché para un DataFrame
def estimate_cache_size(df):
    """Muestrear filas para estimar el tamaño completo del caché."""
    sample = df.sample(0.01, seed=42).cache()
    sample.count()
    
    # Obtener tamaños por partición
    sizes = sample.rdd.mapPartitions(
        lambda it: [sum(len(str(x).encode('utf-8')) for x in it)]
    ).collect()
    
    avg_partition_size = sum(sizes) / len(sizes)
    num_partitions = df.rdd.getNumPartitions()
    
    estimated_total = avg_partition_size * num_partitions
    return estimated_total

# Uso
est_size = estimate_cache_size(df)
print(f"Tamaño estimado de caché: {est_size / 1024**3:.2f} GB")
```

## Memoria Fuera del Heap

La memoria fuera del heap evita la recolección de basura JVM.

```python
# Habilitar memoria fuera del heap
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")

# Tungsten usa memoria fuera del heap para:
# - Operaciones de shuffle
# - Almacenamiento en caché de datos serializados
# - Buffers de ordenamiento y agregación
```

> [!SUCCESS]
> La memoria fuera del heap puede reducir significativamente las pausas del GC para shuffles grandes al mantener datos fuera del heap JVM. Sin embargo, la memoria fuera del heap debe contabilizarse en las solicitudes de memoria del contenedor/YARN.

## Ajuste del Recolector de Basura

Las pausas del GC pueden causar timeouts de ejecutores y fallos de trabajos.

### Monitoreo de GC

```python
# Añadir registro de GC a spark-submit
# --conf spark.executor.extraJavaOptions="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps"
```

```bash
spark-submit \
  --conf "spark.executor.extraJavaOptions=-XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=35 -XX:ConcGCThreads=4 -verbose:gc -XX:+PrintGCDetails" \
  --conf "spark.driver.extraJavaOptions=-XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=35" \
  app.py
```

### Estrategias de Ajuste de GC

```python
# Estrategia 1: Usar G1GC (predeterminado en Java 8u45+)
# -XX:+UseG1GC
# -XX:InitiatingHeapOccupancyPercent=35 (iniciar GC antes)
# -XX:ConcGCThreads=4 (hilos GC paralelos)

# Estrategia 2: Aumentar NewRatio para trabajos con mucho shuffle
# -XX:NewRatio=3 (generación antigua más grande para datos en caché)

# Estrategia 3: Reducir presión de GC almacenando en caché serializado
df.persist(StorageLevel.MEMORY_ONLY_SER)
```

| Estrategia de GC | Mejor Para |
|---|---|
| **G1GC** | Propósito general, heaps grandes (>4g) |
| **Parallel GC** | Orientado a rendimiento, heaps medianos |
| **CMS** | Baja latencia (obsoleto en Java 14) |
| **ZGC** | Heaps muy grandes (>100g), baja latencia |

## Prevención de Out of Memory (OOM)

```python
# Ajustar memoria para evitar OOM

# 1. Aumentar memoria
spark.conf.set("spark.executor.memory", "16g")
spark.conf.set("spark.executor.memoryOverhead", "2g")  # Sobrecarga fuera del heap

# 2. Reducir datos por partición
spark.conf.set("spark.sql.shuffle.partitions", "400")  # Más particiones = menos datos cada una

# 3. Habilitar spill
spark.conf.set("spark.shuffle.spill.compress", "true")

# 4. Usar broadcast para tablas pequeñas
from pyspark.sql.functions import broadcast
df_large.join(broadcast(df_small), "key")

# 5. Cachear con juicio — solo cuando se reutiliza
# No cachear todo

# 6. Reducir tamaño de lote para UDFs
spark.conf.set("spark.sql.execution.arrow.maxRecordsPerBatch", "5000")
```

## Perfilado de Memoria

```python
from pyspark.sql.functions import col, size

# Encontrar columnas pesadas en memoria
def profile_memory_usage(df):
    """Identificar columnas que consumen más memoria."""
    
    shape = len(df.columns)
    estimated_bytes = {
        "string": 40,    # Sobrecarga por campo string
        "integer": 4,
        "long": 8,
        "double": 8,
        "array": 16
    }
    
    for field in df.schema.fields:
        col_name = field.name
        dtype = str(field.dataType).lower()
        
        sample = df.select(col(col_name)).limit(1000).collect()
        total_bytes = sum(len(str(row[0]).encode('utf-8')) for row in sample)
        avg_bytes = total_bytes / len(sample)
        
        print(f"{col_name}: {dtype}, avg {avg_bytes:.0f} bytes/fila")

# Verificar tamaños de partición
def check_partition_sizes(df):
    """Verificar distribución de datos entre particiones."""
    sizes = df.rdd.mapPartitions(
        lambda it: [sum(len(str(x).encode('utf-8')) for x in it)]
    ).collect()
    
    print(f"Tamaños de partición: min={min(sizes)}, max={max(sizes)}, "
          f"avg={sum(sizes)/len(sizes):.0f}")
    print(f"Sesgo: max/avg = {max(sizes) / (sum(sizes)/len(sizes)):.1f}x")
```

## Árbol de Decisión de Ajuste de Memoria

```
¿El trabajo tiene OOM o spill?
  |
  +-- Sí: ¿Aumentar memoria del ejecutor? 
  |   |  
  |   +-- Sí, disponible: Aumentar memoria
  |   |
  |   +-- No (en el límite): 
  |       +-- ¿Mucho shuffle? Aumentar particiones
  |       +-- ¿Mucho caché? Usar MEMORY_AND_DISK o MEMORY_ONLY_SER
  |       +-- ¿Muchas UDFs? Reducir tamaño de lote, optimizar UDF
  |
  +-- No, pero GC lento:
      +-- Usar G1GC
      +-- Reducir almacenamiento en caché
      +-- Usar memoria fuera del heap

¿El tiempo de GC supera el 10% del tiempo de ejecución?
  +-- Sí: Ajustar GC, reducir objetos
  +-- No: Centrarse en otras optimizaciones
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre memoria de ejecución y memoria de almacenamiento?
2. ¿Cómo maneja el modelo de memoria unificada la contención entre ejecución y almacenamiento?
3. ¿Qué causa el derrame de datos a disco?
4. ¿Cómo reduce la memoria fuera del heap la presión del GC?
5. ¿Qué algoritmo de GC se recomienda para ejecutores Spark grandes?
6. ¿Cómo monitoreas el uso de memoria en la UI de Spark?
7. ¿Cuál es el impacto de almacenar en caché demasiados datos?
8. ¿En qué se diferencia el almacenamiento en caché serializado del no serializado?
9. ¿Qué cambios de configuración reducen los errores OOM?
10. ¿Cómo calculas la memoria óptima del ejecutor para una carga de trabajo dada?
