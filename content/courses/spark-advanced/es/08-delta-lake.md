---
title: "Delta Lake"
description: "Implementa Delta Lake: transacciones ACID, viaje en el tiempo, cumplimiento de esquemas, operaciones merge (upsert) y optimización del rendimiento"
order: 8
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Delta Lake

Delta Lake es una capa de almacenamiento de código abierto que aporta transacciones ACID a Apache Spark y cargas de trabajo de big data. Funciona sobre lagos de datos existentes (archivos Parquet en HDFS/S3) y proporciona capacidades de streaming, cumplimiento de esquemas y viaje en el tiempo.

## Lo que Proporciona Delta Lake

| Característica | Descripción | Beneficio |
|---|---|---|
| **Transacciones ACID** | Atómicas, Consistentes, Aisladas, Duraderas | Sin fallos parciales, lectores concurrentes obtienen vista consistente |
| **Cumplimiento de Esquemas** | Valida escrituras contra el esquema de la tabla | Previene corrupción de datos |
| **Evolución de Esquemas** | Permite cambios seguros de esquema | Adiciones graduales de columnas |
| **Viaje en el Tiempo** | Consulta versiones anteriores de datos | Auditoría, reversión, reproducibilidad |
| **Merge/Upsert** | INSERT, UPDATE, DELETE con condición | CDC, dimensiones lentamente cambiantes |
| **Vacuum** | Limpia archivos antiguos | Gestión de almacenamiento |

## Configuración

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("DeltaLake") \
    .master("local[*]") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()
```

## Creación de Tablas Delta

```python
from pyspark.sql.functions import col, current_timestamp

data = [
    (1, "Alice", "Engineering", 120000),
    (2, "Bob", "Design", 90000),
    (3, "Charlie", "Engineering", 150000),
    (4, "Diana", "Marketing", 80000)
]
df = spark.createDataFrame(data, ["id", "name", "dept", "salary"])

# Guardar como tabla Delta
df.write.format("delta").mode("overwrite").save("/data/delta/employees")

# Crear tabla gestionada
df.write.format("delta").saveAsTable("employees")

# Crear tabla Delta desde Parquet existente
df_parquet = spark.read.parquet("/data/parquet/employees")
df_parquet.write.format("delta").mode("overwrite").save("/data/delta/employees")
```

> [!SUCCESS]
> Las tablas Delta se autodescriben: el esquema, historial de versiones y registro de transacciones se almacenan junto con los datos. No se requiere un metastore externo.

## Lectura de Tablas Delta

```python
# Lectura estándar
df = spark.read.format("delta").load("/data/delta/employees")
df.show()

# Viaje en el tiempo — consultar versiones anteriores
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .load("/data/delta/employees")

df_timestamp = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-15") \
    .load("/data/delta/employees")

# Comparar actual vs anterior
print(f"Conteo versión actual: {df.count()}")
print(f"Conteo versión 0: {df_v0.count()}")
```

## Transacciones ACID

```python
# Las escrituras concurrentes son atómicas
df1.write.format("delta").mode("append").save("/data/delta/employees/")
df2.write.format("delta").mode("append").save("/data/delta/employees/")
# Ambas escrituras ocurren atómicamente — sin estado parcial

# Verificar historial de transacciones
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/delta/employees")
history = delta_table.history()
history.show()
# +-------+------------------+------+--------+
# |version|      timestamp   |operation|...|
# +-------+------------------+------+--------+
# |      3|2024-01-15 10:30..|   WRITE|    |
# |      2|2024-01-15 09:15..|   WRITE|    |
# |      1|2024-01-14 16:00..|   WRITE|    |
# |      0|2024-01-14 10:00..|   WRITE|    |
# +-------+------------------+------+--------+
```

## Cumplimiento y Evolución de Esquemas

```python
# Cumplimiento de esquemas — rechaza escrituras incompatibles
bad_data = [(5, "Eve", 95000)]  # Falta columna dept — FALLA
try:
    bad_df = spark.createDataFrame(bad_data, ["id", "name", "salary"])
    bad_df.write.format("delta").mode("append").save("/data/delta/employees")
except Exception as e:
    print(f"El cumplimiento de esquema bloqueó la escritura: {e}")

# Evolución de esquemas — permitir añadir columnas
new_data = [(5, "Eve", "Engineering", 125000, "NY")]
new_df = spark.createDataFrame(new_data, ["id", "name", "dept", "salary", "city"])

new_df.write \
    .format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save("/data/delta/employees")

# Leer esquema actualizado
updated_df = spark.read.format("delta").load("/data/delta/employees")
updated_df.printSchema()
# root
#  |-- id: integer
#  |-- name: string
#  |-- dept: string
#  |-- salary: integer
#  |-- city: string (nueva columna)
```

> [!WARNING]
> La evolución de esquemas (`mergeSchema=true`) añade nuevas columnas pero no elimina ni cambia tipos de columnas existentes. Para eliminación de columnas, usa ALTER TABLE o reescribe la tabla.

## Merge (Upsert)

```python
delta_table = DeltaTable.forPath(spark, "/data/delta/employees")

# Nuevos datos con cambios
updates = spark.createDataFrame([
    (1, "Alice", "Engineering", 130000),   # Salario actualizado
    (2, "Bob", "Design", 95000),            # Salario actualizado
    (6, "Frank", "Marketing", 90000)        # Nuevo empleado
], ["id", "name", "dept", "salary"])

# Merge: INSERT nuevo, UPDATE existente
delta_table.alias("target") \
    .merge(
        updates.alias("source"),
        "target.id = source.id"
    ) \
    .whenMatchedUpdate(set={
        "name": "source.name",
        "dept": "source.dept",
        "salary": "source.salary"
    }) \
    .whenNotMatchedInsert(values={
        "id": "source.id",
        "name": "source.name",
        "dept": "source.dept",
        "salary": "source.salary"
    }) \
    .execute()
```

### Operaciones Merge Avanzadas

```python
# Eliminar registros coincidentes
delta_table.alias("target") \
    .merge(updates.alias("source"), "target.id = source.id") \
    .whenMatchedDelete(condition="source.salary < 50000") \
    .whenNotMatchedInsertAll() \
    .execute()

# Actualizaciones condicionales con lógica diferente
delta_table.alias("target") \
    .merge(updates.alias("source"), "target.id = source.id") \
    .whenMatchedUpdate(condition="target.salary < source.salary", set={
        "salary": "source.salary",
        "updated_at": "current_timestamp()"
    }) \
    .whenNotMatchedInsertAll() \
    .execute()
```

## Streaming con Delta

```python
# Escritura streaming a Delta
streaming_df = spark.readStream \
    .format("kafka") \
    .option("subscribe", "events") \
    .load()

streaming_df.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/data/checkpoints/events") \
    .outputMode("append") \
    .start("/data/delta/events/")

# Lectura streaming desde Delta (CDC)
streaming_read = spark.readStream \
    .format("delta") \
    .load("/data/delta/employees")

streaming_read.writeStream \
    .format("console") \
    .start()
```

## Vacuum y Optimización

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/delta/employees")

# Optimizar diseño de archivos (compactar archivos pequeños)
delta_table.optimize().execute()

# Optimizar con Z-ordering (como clusterización)
delta_table.optimize().executeZOrderBy("id", "dept")

# Vacuum — eliminar archivos antiguos (retención predeterminada: 7 días)
delta_table.vacuum(retentionHours=168)  # 7 días

# Describir historial
delta_table.history().show(10, truncate=False)

# Describir detalles
delta_table.detail().show(truncate=False)
```

> [!NOTE]
> Vacuum elimina archivos más antiguos que el período de retención. Las consultas de viaje en el tiempo de Spark no pueden acceder a versiones eliminadas por vacuum. La retención predeterminada de 7 días protege contra operaciones concurrentes.

## Ajuste de Rendimiento

```python
# Habilitar caché Delta
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")

# Auto-optimizar en escrituras
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")

# Estadísticas de columna para salto de datos
spark.conf.set("spark.databricks.delta.properties.defaults.dataSkippingNumIndexedCols", "10")

# Establecer propiedades de tabla Delta
sql = """
ALTER TABLE employees SET TBLPROPERTIES (
    delta.minFileSize = 104857600,
    delta.maxFileSize = 1073741824,
    delta.autoOptimize.optimizeWrite = true,
    delta.autoOptimize.autoCompact = true
)
"""
spark.sql(sql)
```

## Preguntas de Práctica

1. ¿Qué garantías ACID proporciona Delta Lake sobre archivos Parquet?
2. ¿Cómo funciona el viaje en el tiempo en Delta Lake?
3. ¿Qué sucede durante una operación merge (upsert)?
4. ¿Cómo protege el cumplimiento de esquemas la calidad de los datos?
5. ¿Cuál es el propósito de vacuum y cuál es la retención predeterminada?
6. ¿Cómo soporta Delta Lake lecturas y escrituras en streaming?
7. ¿Qué es el registro de transacciones de Delta y qué almacena?
8. ¿Cómo resuelves conflictos durante escrituras concurrentes?
9. ¿Cuándo usarías `optimize` y `ZORDER BY`?
10. ¿En qué se diferencia Delta Lake de las tablas Parquet estándar?
