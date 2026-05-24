---
title: "Particionamiento y Bucketing"
description: "Aprende repartition, coalesce, partitionBy, bucketing y optimización del diseño de datos para mejor rendimiento de Spark"
order: 6
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Particionamiento y Bucketing

El diseño adecuado de datos es crítico para el rendimiento de Spark. El particionamiento y bucketing controlan cómo se organizan los datos en disco y memoria, impactando directamente el tamaño del shuffle, el paralelismo y la velocidad de las consultas.

## Particionamiento en Memoria: repartition vs coalesce

### repartition()

Aumenta o disminuye el número de particiones shuffling los datos.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Partitioning") \
    .master("local[*]") \
    .getOrCreate()

df = spark.range(1, 10000, numPartitions=8)
print(f"Particiones iniciales: {df.rdd.getNumPartitions()}")  # 8

# Aumentar particiones (shuffle completo)
repartitioned = df.repartition(16)
print(f"Después de repartition: {repartitioned.rdd.getNumPartitions()}")  # 16

# Reparticionar por columna (basado en hash)
df_repartitioned = df.repartition(10, "id")
print(f"Por columna: {df_repartitioned.rdd.getNumPartitions()}")  # 10
```

> [!NOTE]
> `repartition()` causa un shuffle completo. Úsalo para aumentar el paralelismo o agrupar datos relacionados en la misma partición.

### coalesce()

Reduce particiones sin un shuffle completo (fusiona particiones existentes).

```python
# Disminuir particiones (sin shuffle)
coalesced = repartitioned.coalesce(4)
print(f"Después de coalesce: {coalesced.rdd.getNumPartitions()}")  # 4
```

| Aspecto | repartition() | coalesce() |
|---|---|---|
| **Shuffle** | Shuffle completo | Mínimo (fusiona) |
| **Particiones** | Aumenta o disminuye | Solo disminuye |
| **Distribución de datos** | Uniforme (round-robin) | Desigual posible |
| **Caso de uso** | Aumentar paralelismo | Reducir particiones para salida |

> [!WARNING]
> `coalesce()` no puede aumentar particiones. Solo fusiona particiones existentes, lo que puede resultar en distribución desigual de datos. Usa `repartition()` cuando necesites aumentar el paralelismo o distribuir datos uniformemente.

## Particionamiento en Disco: partitionBy

Al escribir datos, `partitionBy()` organiza archivos en jerarquías de directorios según los valores de las columnas.

```python
# Escribir con particionamiento
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales")

# Estructura de directorios:
# data/sales/
#   year=2024/month=01/
#     part-00001.parquet
#     part-00002.parquet
#   year=2024/month=02/
#     part-00001.parquet
#   year=2024/month=03/
#     ...

# Lectura — Spark usa automáticamente poda de particiones
df_2024 = spark.read.parquet("data/sales") \
    .filter(col("year") == 2024)
# Solo lee directorios year=2024/
```

> [!SUCCESS]
> La poda de particiones es una de las optimizaciones más efectivas. Cuando filtras por una columna de partición, Spark lee solo los directorios relevantes. Para una tabla particionada por fecha, consultar un solo día lee solo los datos de ese día.

### Elegir Columnas de Partición

```python
# Bueno: baja cardinalidad, filtrado frecuente
.write.partitionBy("region", "year")

# Malo: alta cardinalidad (crea demasiados directorios)
.write.partitionBy("user_id")

# Malo: demasiadas columnas de partición (explosión de directorios)
.write.partitionBy("year", "month", "day", "hour", "region")
```

| Mejores Prácticas | Razón |
|---|---|
| **≤ 3 columnas de partición** | Evita explosión de directorios |
| **Baja cardinalidad** | < 500 valores distintos por columna de partición |
| **Filtro frecuente** | Usado en cláusulas WHERE |
| **Distribución uniforme de datos** | Evita problema de archivos pequeños |

## Bucketing

Bucketing organiza datos en un número fijo de archivos (buckets) usando un hash de la columna de bucketing.

```python
# Escribir con bucketing
df.write \
    .mode("overwrite") \
    .bucketBy(10, "emp_id") \
    .sortBy("salary") \
    .saveAsTable("employees_bucketed")

# Beneficios: sin shuffle en claves de join con bucketing
# Leer (usa automáticamente info del bucket)
bucketed_df = spark.table("employees_bucketed")
```

### Bucketing para Optimización de Joins

```python
# Crear dos tablas con bucketing en la misma clave
df1.write.bucketBy(10, "key").saveAsTable("t1")
df2.write.bucketBy(10, "key").saveAsTable("t2")

# Join — ¡sin shuffle necesario!
result = spark.table("t1").join(spark.table("t2"), "key")
result.explain()
# SortMergeJoin (sin exchange/shuffle antes del join)
```

> [!NOTE]
> Bucketing elimina el shuffle para joins y agregaciones en la columna bucketeada. Ambas tablas deben usar el mismo número de buckets y la misma columna de bucketing para que esta optimización funcione.

### Bucketing vs Particionamiento

| Aspecto | Particionamiento | Bucketing |
|---|---|---|
| **Organización en disco** | Directorio por valor | Número fijo de archivos |
| **Límite de cardinalidad** | Baja (< 500) | Cualquiera |
| **Eliminación de shuffle** | Poda de particiones (lectura) | Shuffle join/agg (escritura) |
| **Mejor para** | Datos temporales, geográficos | Claves de alta cardinalidad (user_id) |
| **Cantidad de archivos** | Variable (depende de valores) | Fijo (número de buckets) |

## Gestión Práctica de Particiones

### Particionamiento Dinámico vs Estático

```python
# Particionamiento dinámico (Spark decide los valores)
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .format("parquet") \
    .save("data/sales_dynamic")

# Particionamiento estático (especificar valor de partición)
df.write \
    .mode("overwrite") \
    .option("partitionOverwriteMode", "static") \
    .partitionBy("year") \
    .parquet("data/sales_static")
```

### Herramientas de Gestión de Particiones

```python
# Reparar metadatos de tabla
spark.sql("MSCK REPAIR TABLE sales_table")

# Mostrar particiones
spark.sql("SHOW PARTICIONS sales_table").show()

# Añadir partición manualmente
spark.sql("ALTER TABLE sales_table ADD PARTITION (year=2024, month=4)")

# Eliminar partición
spark.sql("ALTER TABLE sales_table DROP PARTITION (year=2023)")
```

## Problema de Archivos Pequeños

Demasiados archivos pequeños crea sobrecarga de metadatos y lecturas lentas.

```python
# Problema: escribir con demasiadas particiones
df.repartition(1000).write.parquet("output/")  # ¡1000 archivos pequeños!

# Solución 1: Reducir número de particiones para salida
df.coalesce(4).write.parquet("output/")

# Solución 2: Usar maxRecordsPerFile
df.write \
    .option("maxRecordsPerFile", 100000) \
    .parquet("output/")

# Solución 3: Post-procesamiento con compactación de archivos
df_output = spark.read.parquet("output/")
df_output.coalesce(4).write.mode("overwrite").parquet("output_compacted/")
```

## Fórmula de Número Óptimo de Particiones

```
Número de particiones = (Tamaño total de datos) / (tamaño objetivo de partición)
Tamaño objetivo de partición = Tamaño de bloque HDFS (128 MB) o ligeramente menor
```

```python
# Para 1 TB de datos con particiones objetivo de 128 MB
target_partitions = 1 * 1024 * 1024  # MB / 128 MB = ~8192 particiones

# Ajustar según recursos del clúster
cores_available = 100  # Total de cores de ejecutor
partitions = max(cores_available * 2, 8192)  # Al menos 2x cores
```

## Estrategia de Diseño de Datos

Elige según los patrones de consulta:

```python
# Datos de series temporales: particionar por fecha
df.write.partitionBy("event_date").parquet("events/")

# Consultas centradas en usuario: bucketing por user_id
df.write.bucketBy(50, "user_id").sortBy("event_date").saveAsTable("user_events")

# Geográfico: particionar por región, bucketing por store_id
df.write \
    .partitionBy("region") \
    .bucketBy(20, "store_id") \
    .sortBy("sale_date") \
    .saveAsTable("store_sales")
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `repartition()` y `coalesce()`?
2. ¿Cuándo usarías `partitionBy` al escribir datos?
3. ¿Cómo elimina bucketing el shuffle durante los joins?
4. ¿Qué es el "problema de archivos pequeños" y cómo lo evitas?
5. ¿Por qué es problemático el particionamiento de alta cardinalidad (ej., por user_id)?
6. ¿Cómo eliges entre particionamiento y bucketing?
7. ¿Qué es la poda de particiones y cómo funciona?
8. ¿Cómo mejora la coalescencia dinámica de AQE la gestión de particiones?
9. ¿Cuál es la fórmula recomendada para el número de particiones?
10. ¿Qué hace `MSCK REPAIR TABLE` y cuándo es necesario?
