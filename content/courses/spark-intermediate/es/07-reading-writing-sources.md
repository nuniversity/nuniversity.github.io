---
title: "Lectura y Escritura de Fuentes de Datos"
description: "Domina la lectura/escritura de formatos CSV, JSON, Parquet, Avro y ORC con particionamiento, modos de guardado y compresión"
order: 7
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Lectura y Escritura de Fuentes de Datos

Spark soporta numerosos formatos de datos, cada uno con ventajas y desventajas en rendimiento, soporte de esquemas y compresión. Elegir el formato y la estrategia de escritura correctos es crucial para construir pipelines de datos eficientes.

## Formatos Soportados

| Formato | Esquema | Compresión | Dividible | Mejor Para |
|---|---|---|---|---|
| **Parquet** | Sí (nativo) | Snappy, gzip, zstd | Sí | Analítica, acceso columnar |
| **ORC** | Sí (nativo) | Snappy, zlib, zstd | Sí | Cargas de trabajo Hive/ACID |
| **Avro** | Sí (incrustado) | Snappy, deflate | Sí | Streaming, Kafka |
| **JSON** | Esquema inferido | gzip | Sí (delimitado por líneas) | Semiestructurado, interoperabilidad |
| **CSV** | Esquema inferido | gzip | Sí | Sistemas heredados, tablas simples |

## Lectura de Fuentes de Datos

### Parquet (Columnar, Predeterminado)

```python
# Leer Parquet (esquema preservado nativamente)
df = spark.read.parquet("data/sales.parquet")

# Leer con poda de esquema (solo leer columnas necesarias)
df = spark.read.parquet("data/sales.parquet").select("date", "amount")

# Leer Parquet particionado
df = spark.read.parquet("data/sales/", basePath="data/sales/")
```

> [!SUCCESS]
> Parquet es el formato recomendado para analítica. Su almacenamiento columnar, pushdown de predicados y preservación de esquema lo hacen la opción más eficiente para Spark.

### ORC (Optimized Row Columnar)

```python
# Leer ORC
df = spark.read.orc("data/sales.orc")

# Con esquema
schema = StructType([...])
df = spark.read.schema(schema).orc("data/sales.orc")
```

### Avro (Basado en Filas)

```python
# Leer Avro (requiere paquete spark-avro)
df = spark.read.format("avro").load("data/events.avro")

# Leer versión específica de esquema Avro
df = spark.read \
    .option("avroSchema", '{"type":"record","name":"Event","fields":[{"name":"id","type":"int"}]}') \
    .format("avro") \
    .load("data/specific.avro")
```

### CSV

```python
# Leer CSV con opciones completas
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("sep", ",") \
    .option("quote", "\"") \
    .option("escape", "\\") \
    .option("mode", "PERMISSIVE") \
    .option("nullValue", "NULL") \
    .option("dateFormat", "yyyy-MM-dd") \
    .option("timestampFormat", "yyyy-MM-dd HH:mm:ss") \
    .option("maxColumns", "2048") \
    .csv("data/people.csv")
```

> [!WARNING]
> CSV no tiene esquema nativo. La inferencia requiere un pase adicional sobre los datos. Siempre proporciona un esquema explícito para pipelines de producción.

### JSON

```python
# Leer JSON Lines (un objeto JSON por línea)
df = spark.read.json("data/events.json")

# Leer JSON multilínea
df = spark.read \
    .option("multiLine", "true") \
    .option("primitivesAsString", "false") \
    .option("prefersDecimal", "false") \
    .option("allowComments", "false") \
    .option("allowUnquotedFieldNames", "false") \
    .json("data/nested_data.json")

# Leer JSON comprimido
df = spark.read.json("data/events.json.gz")
```

## Escritura de Fuentes de Datos

### Modos de Escritura

```python
# Overwrite (reemplazar datos existentes)
df.write.mode("overwrite").parquet("output/")

# Append (añadir a datos existentes)
df.write.mode("append").parquet("output/")

# Ignore (no hacer nada si la salida existe)
df.write.mode("ignore").parquet("output/")

# ErrorIfExists (predeterminado — fallar si la salida existe)
df.write.mode("errorifexists").parquet("output/")
```

> [!NOTE]
> `overwrite` reemplaza todo el directorio de salida, no archivos individuales. Si quieres sobrescribir solo particiones específicas, usa sobrescritura dinámica de particiones.

### Escritura con Particionamiento

```python
# Particionar por una o más columnas
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales_partitioned")

# Sobrescritura dinámica de particiones (solo sobrescribe particiones coincidentes)
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales_partitioned")
```

### Escritura con Compresión

```python
# Compresión Parquet
df.write \
    .option("compression", "snappy") \
    .parquet("output/sales_snappy.parquet")

# Códecs disponibles: snappy, gzip, lzo, brotli, lz4, zstd
# Snappy: Rápido + compresión moderada (mejor para la mayoría de casos)
# Gzip: Lento + alta compresión (archivo, almacenamiento lento)
# Zstd: Rápido + buena compresión (balance)

# Compresión ORC
df.write \
    .option("compression", "zlib") \
    .orc("output/sales.orc")

# Compresión CSV
df.write \
    .option("compression", "gzip") \
    .csv("output/sales_csv_gz/")

# Compresión JSON
df.write \
    .option("compression", "gzip") \
    .json("output/sales_json_gz/")
```

## Opciones Avanzadas de Escritura

```python
# Controlar número de archivos de salida
df.coalesce(4).write.parquet("output/")  # 4 archivos de salida
df.repartition(10).write.parquet("output/")  # 10 archivos de salida

# Máximo de registros por archivo (evitar archivos pequeños)
df.write \
    .option("maxRecordsPerFile", 500000) \
    .parquet("output/")

# Archivo único de salida
df.coalesce(1).write \
    .option("header", "true") \
    .csv("output/single_file.csv")
```

## Lectura desde Múltiples Fuentes

```python
# Leer todos los archivos Parquet en un directorio
df = spark.read.parquet("data/year=2024/*/")

# Leer con globs de ruta
df = spark.read \
    .option("basePath", "data/") \
    .parquet("data/year=2024/month=*/day=*/")

# Leer múltiples rutas específicas
df = spark.read.parquet("data/sales_2024.parquet", "data/sales_2025.parquet")
```

## Fusión de Esquemas

```python
# Fusión de esquemas Parquet (dos archivos con esquemas diferentes)
spark.conf.set("spark.sql.parquet.mergeSchema", "true")

df1 = spark.createDataFrame([(1, "Alice")], ["id", "name"])
df1.write.mode("overwrite").parquet("data/merge_test/")

df2 = spark.createDataFrame([(2, 50000)], ["id", "salary"])
df2.write.mode("append").parquet("data/merge_test/")

merged = spark.read.parquet("data/merge_test/")
merged.printSchema()
# id, name, salary  (todas las columnas fusionadas)
```

> [!WARNING]
> La fusión de esquemas es costosa — requiere leer todos los archivos para descubrir sus esquemas antes del procesamiento. Úsala solo cuando sea necesario.

## Ejemplos de Conversión de Formatos

```python
# CSV a Parquet (patrón ETL común)
df_csv = spark.read.option("header", "true").csv("data/input/")
df_csv.write.parquet("data/processed/")

# JSON a ORC (para compatibilidad con Hive)
df_json = spark.read.json("data/events.json")
df_json.write.orc("data/events_processed/")

# Parquet a Avro (para sink de Kafka)
df_parquet = spark.read.parquet("data/sales.parquet")
df_parquet.write.format("avro").save("data/sales_avro/")
```

## Comparación de Rendimiento de Fuentes de Datos

| Operación | Parquet | ORC | Avro | JSON | CSV |
|---|---|---|---|---|---|
| **Velocidad de lectura** | Más rápido | Rápido | Moderado | Lento | Lento |
| **Velocidad de escritura** | Moderada | Lenta | Rápida | Moderada | Rápida |
| **Ratio de compresión** | 4-8x | 5-10x | 2-4x | 2-5x | 2-5x |
| **Evolución de esquema** | Buena | Buena | Excelente | Buena | Pobre |
| **Dividible** | Sí | Sí | Sí | Sí (línea) | Sí |
| **Datos anidados** | Excelente | Excelente | Bueno | Nativo | Pobre |

## Preguntas de Práctica

1. ¿Cuáles son las ventajas de Parquet sobre CSV para cargas de trabajo de analítica?
2. ¿En qué se diferencian los modos de escritura (overwrite, append, ignore)?
3. ¿Cuándo usarías Avro en lugar de Parquet?
4. ¿Qué códec de compresión ofrece el mejor balance entre velocidad y compresión?
5. ¿Cómo controlas el número de archivos de salida al escribir?
6. ¿Qué es la sobrescritura dinámica de particiones y cuándo es útil?
7. ¿Cómo funciona la fusión de esquemas en Parquet?
8. ¿Cuál es el propósito de `maxRecordsPerFile`?
9. ¿Cómo lees datos desde múltiples directorios particionados?
10. ¿Cómo conviertes un conjunto de datos CSV a Parquet eficientemente?
