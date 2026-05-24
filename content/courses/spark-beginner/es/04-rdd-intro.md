---
title: "Introducción a los RDDs"
description: "Aprende sobre Resilient Distributed Datasets, creando RDDs con parallelize() y textFile(), y comprendiendo el linaje RDD"
order: 4
duration: "30-40 minutos"
difficulty: "principiante"
---

# Introducción a los RDDs

Resilient Distributed Datasets (RDDs) son la estructura de datos fundamental en Apache Spark. Representan una colección inmutable y particionada de elementos que pueden procesarse en paralelo.

## ¿Qué es un RDD?

Un RDD tiene tres características clave:

| Característica | Descripción |
|---|---|
| **Resilient** | Se recupera automáticamente de fallos usando linaje |
| **Distributed** | Los datos están particionados en múltiples nodos |
| **Dataset** | Una colección de objetos tipados (Python, Scala, Java) |

> [!NOTE]
> Aunque DataFrames y Datasets son ahora las APIs recomendadas, entender los RDDs es crucial para la optimización de bajo nivel y cuando se trabaja con datos no estructurados.

### Propiedades de los RDDs

1. **Inmutabilidad**: Los RDDs no pueden modificarse después de su creación. Las transformaciones producen nuevos RDDs.
2. **Evaluación Perezosa**: Las transformaciones no se ejecutan hasta que se llama a una acción.
3. **Particionamiento**: Los datos se dividen en particiones que pueden procesarse en paralelo.
4. **Linaje**: Spark rastrea las transformaciones utilizadas para construir un RDD, permitiendo la recuperación de fallos.

## Creando RDDs

### Desde una Colección con `parallelize()`

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("RDDIntro") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Crear un RDD desde una lista de Python
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
rdd = sc.parallelize(data)

print(rdd.collect())
# Salida: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### Especificando el Recuento de Particiones

```python
# Crear RDD con 4 particiones
rdd = sc.parallelize(data, numSlices=4)
print(f"Número de particiones: {rdd.getNumPartitions()}")

# Obtener tamaños de las particiones
glommed = rdd.glom().collect()
for i, partition in enumerate(glommed):
    print(f"Partición {i}: {partition}")
```

> [!WARNING]
> Muy pocas particiones subutilizan los recursos del clúster. Demasiadas particiones crean sobrecarga de programación. Un buen punto de partida es 2-4 particiones por núcleo.

### Desde un Archivo con `textFile()`

```python
# Leer un archivo de texto — cada línea se convierte en un elemento
rdd = sc.textFile("data/sample.txt")

# Leer múltiples archivos usando comodines
rdd = sc.textFile("data/logs/*.log")

# Leer desde HDFS
rdd = sc.textFile("hdfs://namenode:9000/user/data/logs/")

# Leer desde S3
rdd = sc.textFile("s3a://my-bucket/logs/2024/*.gz")

print(f"Número de líneas: {rdd.count()}")
print(f"Primeras 5 líneas: {rdd.take(5)}")
```

### Controlando el Recuento de Particiones para Archivos

```python
# Particiones mínimas (Spark puede usar más según el recuento de bloques HDFS)
rdd = sc.textFile("data/large_file.txt", minPartitions=10)
```

> [!NOTE]
> Para `textFile()`, si el archivo está en HDFS, Spark crea una partición por bloque HDFS (predeterminado 128 MB). Puede aumentar las particiones con `minPartitions` pero no puede reducir por debajo del recuento de bloques HDFS.

### Otros Métodos de Creación

```python
# Desde un archivo de texto completo (devuelve pares (nombre_archivo, contenido))
rdd = sc.wholeTextFiles("data/directory/")

# Desde un archivo tipo CSV (análisis manual necesario)
rdd = sc.textFile("data/people.csv")
header = rdd.first()
data = rdd.filter(lambda row: row != header)

# RDD vacío
empty_rdd = sc.emptyRDD()

# Range RDD
range_rdd = sc.range(1, 1000, step=1, numSlices=10)
```

## Linaje RDD

Spark registra cada transformación como un **grafo de linaje** (DAG). Si una partición se pierde, Spark la recalcula reproduciendo el linaje.

```python
rdd1 = sc.textFile("data/sample.txt")
rdd2 = rdd1.filter(lambda line: "ERROR" in line)
rdd3 = rdd2.map(lambda line: (line.split(",")[0], 1))
rdd4 = rdd3.reduceByKey(lambda a, b: a + b)

# Ver linaje
print(rdd4.toDebugString())
# (4) ShuffledRDD[4] at reduceByKey at <...>
#  +-(3) MapPartitionsRDD[3] at map at <...>
#     |  MapPartitionsRDD[2] at filter at <...>
#     |  data/sample.txt MapPartitionsRDD[1] at textFile at <...>
#     |  data/sample.txt HadoopRDD[0] at textFile at <...>
```

> [!SUCCESS]
> El linaje RDD es el principal mecanismo de tolerancia a fallos de Spark. Evita la necesidad de replicación o checkpointing porque las particiones perdidas siempre pueden recalcularse a partir de los datos de origen.

## Tipos de RDDs

| Tipo de RDD | Descripción | Ejemplo |
|---|---|---|
| **HadoopRDD** | Lee de HDFS, S3, etc. | `sc.textFile()` |
| **ParallelCollectionRDD** | Desde una colección local | `sc.parallelize()` |
| **MapPartitionsRDD** | Después de map/flatMap/filter | `rdd.map()` |
| **ShuffledRDD** | Después de operaciones de shuffle | `rdd.reduceByKey()` |
| **UnionRDD** | Unión de múltiples RDDs | `rdd1.union(rdd2)` |
| **CoGroupedRDD** | Después de cogroup/join | `rdd1.join(rdd2)` |

## Entendiendo el Spark Context

`SparkContext` (`sc`) es el punto de entrada para la funcionalidad Spark de bajo nivel.

```python
from pyspark import SparkContext

# Crear SparkContext directamente (menos común con SparkSession)
sc = SparkContext("local[*]", "MyContext")

# Obtener contexto de SparkSession
sc = spark.sparkContext

print(f"Paralelismo predeterminado: {sc.defaultParallelism}")
print(f"ID de la Aplicación: {sc.applicationId}")
print(f"Versión Spark: {sc.version}")
```

## Trabajando con RDDs Clave-Valor

Muchas operaciones de Spark trabajan con pares clave-valor (tuplas de dos elementos).

```python
# Crear un RDD clave-valor
data = [("Alice", 34), ("Bob", 45), ("Charlie", 28)]
rdd = sc.parallelize(data)

# Claves y valores
print(rdd.keys().collect())    # ['Alice', 'Bob', 'Charlie']
print(rdd.values().collect())  # [34, 45, 28]

# Consultar una clave (eficiente si RDD está particionado)
print(rdd.lookup("Alice"))     # [34]
```

> [!WARNING]
> Las operaciones clave-valor como `reduceByKey` y `groupByKey` provocan un **shuffle** — los datos se redistribuyen entre particiones por clave. Los shuffles son costosos y deben minimizarse.

## Persistencia RDD

Por defecto, los RDDs se recalculan cada vez que se ejecuta una acción. Use `cache()` o `persist()` para mantener datos en memoria.

```python
# Cachear RDD en memoria
rdd_cached = rdd.cache()

# Persistir con nivel de almacenamiento
from pyspark import StorageLevel
rdd_persisted = rdd.persist(StorageLevel.MEMORY_AND_DISK)
```

| Nivel de Almacenamiento | Descripción |
|---|---|
| `MEMORY_ONLY` | Almacenar como objetos deserializados en memoria (predeterminado) |
| `MEMORY_AND_DISK` | Memoria primero, spill a disco |
| `DISK_ONLY` | Almacenar solo en disco |
| `MEMORY_ONLY_SER` | Almacenar como objetos serializados (más compacto) |
| `OFF_HEAP` | Almacenar en memoria off-heap |

## Conclusiones Clave

1. Los RDDs son colecciones inmutables, particionadas y tolerantes a fallos
2. Cree RDDs mediante `parallelize()` (colecciones) o `textFile()` (archivos)
3. Las transformaciones son perezosas — no pasa nada hasta una acción
4. El linaje rastrea cómo recalcular cualquier partición perdida
5. Los RDDs clave-valor permiten operaciones basadas en shuffle
6. La persistencia (cache/persist) evita el recálculo

## Preguntas de Práctica

1. ¿Qué significa "Resilient" en el contexto de los RDDs?
2. ¿Cuál es la diferencia entre `parallelize()` y `textFile()`?
3. ¿Cómo mejora la evaluación perezosa el rendimiento de Spark?
4. ¿Qué es el linaje RDD y cómo permite la tolerancia a fallos?
5. ¿Cuántas particiones crea `sc.textFile()` para un archivo de 512 MB en HDFS (bloques de 128 MB)?
6. ¿Qué es un shuffle y por qué es costoso?
7. ¿Cuándo usaría `persist(StorageLevel.MEMORY_AND_DISK)` en lugar de `cache()`?
8. ¿Qué muestra `rdd.glom().collect()`?
9. ¿Cómo se crea un RDD con un número específico de particiones?
10. ¿Cuál es la diferencia entre un RDD y una lista Python normal?
