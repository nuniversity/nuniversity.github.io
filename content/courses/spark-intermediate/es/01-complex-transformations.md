---
title: "Transformaciones Complejas"
description: "Domina when/otherwise, tipos anidados (struct, array, map), explode y split para manipulación avanzada de datos"
order: 1
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Transformaciones Complejas

Los desarrolladores Spark intermedios deben manejar datos semiestructurados y anidados. Esta lección cubre lógica condicional, tipos complejos y manipulaciones de array esenciales para pipelines ETL del mundo real.

## Lógica Condicional con when/otherwise

`when()` y `otherwise()` proporcionan lógica condicional nativa del DataFrame similar a `CASE WHEN` de SQL.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import when, col, lit

spark = SparkSession.builder.appName("ComplexTransformations").master("local[*]").getOrCreate()

data = [
    ("Alice", 120000), ("Bob", 90000), ("Charlie", 150000),
    ("Diana", 75000), ("Eve", 130000), ("Frank", 50000)
]
df = spark.createDataFrame(data, ["name", "salary"])

# Condición única
df.withColumn("level", when(col("salary") >= 100000, "Senior")
    .otherwise("Junior")).show()

# Múltiples condiciones
df.withColumn("level", when(col("salary") >= 130000, "Lead")
    .when(col("salary") >= 100000, "Senior")
    .when(col("salary") >= 70000, "Mid")
    .otherwise("Junior")).show()

# Condiciones complejas con AND/OR
df.withColumn("category", when((col("salary") >= 100000) & (col("name") != "Charlie"), "High")
    .when(col("salary") < 70000, "Low")
    .otherwise("Medium")).show()
```

> [!NOTE]
> Las condiciones `when()` se evalúan en orden. La primera condición coincidente gana. Coloque las condiciones más específicas primero.

## Condiciones de Múltiples Columnas

```python
from pyspark.sql.functions import when, col, lit

# when anidado
df.withColumn("range", when(col("salary").between(70000, 100000), "Mid-Range")
    .otherwise(when(col("salary") < 70000, "Entry").otherwise("Top"))).show()

# Usando when en select
df.select(
    col("name"),
    col("salary"),
    when(col("salary") > 100000, "High").otherwise("Standard").alias("tier")
).show()
```

## Tipo Struct

Un `struct` agrupa múltiples campos en una sola columna, similar a un registro anidado.

```python
from pyspark.sql.functions import struct

# Crear una columna struct
df_with_address = df.withColumn("address", struct(
    lit("123 Main St").alias("street"),
    lit("NYC").alias("city"),
    lit("NY").alias("state"),
    lit(10001).alias("zip")
))
df_with_address.printSchema()
# root
#  |-- name: string
#  |-- salary: long
#  |-- address: struct
#  |    |-- street: string
#  |    |-- city: string
#  |    |-- state: string
#  |    |-- zip: integer

# Acceder a campos struct
df_with_address.select(
    col("name"),
    col("address.city"),
    col("address.state")
).show()

# Sintaxis alternativa
df_with_address.select("name", "address.city", "address.state").show()
```

> [!SUCCESS]
> Los tipos struct son la base para trabajar con datos JSON y Parquet anidados. Modelan relaciones jerárquicas sin requerir tablas separadas.

### Creando Structs desde Columnas Existentes

```python
# Agrupar columnas existentes en un struct
nested_df = df.select(
    col("name"),
    struct(
        col("salary").alias("annual"),
        (col("salary") / 12).alias("monthly"),
        (col("salary") / 52).alias("weekly")
    ).alias("compensation")
)

nested_df.printSchema()
nested_df.show(truncate=False)
```

## Tipo Array

Los arrays almacenan secuencias de elementos del mismo tipo.

```python
from pyspark.sql.functions import array, split, col

# Crear una columna array
skills_data = [
    ("Alice", ["Python", "Spark", "SQL"]),
    ("Bob", ["Java", "Kubernetes"]),
    ("Charlie", ["R", "Python", "TensorFlow", "PyTorch"])
]
skills_df = spark.createDataFrame(skills_data, ["name", "skills"])
skills_df.show(truncate=False)

# Crear arrays desde columnas
df.withColumn("nums", array(lit(1), lit(2), lit(3))).show()

# Dividir string en array
df.withColumn("name_chars", split(col("name"), "")).show(truncate=False)
```

## Explode

`explode()` transforma cada elemento del array en una fila separada.

```python
from pyspark.sql.functions import explode

# Explotar array de habilidades
exploded = skills_df.select(col("name"), explode(col("skills")).alias("skill"))
exploded.show()
# +-------+----------+
# |   name|     skill|
# +-------+----------+
# |  Alice|    Python|
# |  Alice|     Spark|
# |  Alice|       SQL|
# |    Bob|      Java|
# |    Bob|Kubernetes|
# |Charlie|         R|
# |Charlie|    Python|
# |Charlie|TensorFlow|
# |Charlie|    PyTorch|
# +-------+----------+

# Contar habilidades por persona
exploded.groupBy("name").agg(count("skill").alias("skill_count")).show()
```

> [!WARNING]
> `explode()` multiplica el recuento de filas. Si un array tiene 1000 elementos, cada fila original se convierte en 1000 filas. Para arrays grandes, esto puede causar explosión de datos.

### Variantes de Explode

```python
from pyspark.sql.functions import explode_outer, posexplode, posexplode_outer

# explode_outer — incluye nulos (explode descarta arrays nulos)
data_with_null = [
    ("Alice", ["Python", "SQL"]),
    ("Bob", None),
    ("Charlie", ["Scala"])
]
null_df = spark.createDataFrame(data_with_null, ["name", "skills"])

null_df.select("name", explode_outer("skills").alias("skill")).show()
# Bob aparece con skill nulo (explode descartaría a Bob)

# posexplode — incluye índice de posición
skills_df.select(
    col("name"),
    posexplode(col("skills")).alias("position", "skill")
).show()
# +-------+--------+----------+
# |   name|position|     skill|
# +-------+--------+----------+
# |  Alice|       0|    Python|
# |  Alice|       1|     Spark|
# |  Alice|       2|       SQL|
# ...
```

## Tipo Map

Los maps almacenan pares clave-valor donde las claves son strings y los valores son de un solo tipo.

```python
from pyspark.sql.functions import create_map, lit, map_keys, map_values

map_data = [
    ("Alice", {"Python": 5, "Spark": 3, "SQL": 4}),
    ("Bob", {"Java": 5, "Kubernetes": 2}),
    ("Charlie", {"R": 4, "Python": 5, "TensorFlow": 3})
]
map_df = spark.createDataFrame(map_data, ["name", "experience_years"])
map_df.printSchema()
# root
#  |-- name: string
#  |-- experience_years: map<string, int>

# Acceder a valores del map
map_df.select(
    col("name"),
    col("experience_years")["Python"].alias("python_years")
).show()

# Claves y valores del map
map_df.select(
    col("name"),
    map_keys(col("experience_years")).alias("skills"),
    map_values(col("experience_years")).alias("years")
).show(truncate=False)

# Crear map desde columnas
df.withColumn("config", create_map(
    lit("base"), col("salary"),
    lit("bonus"), col("salary") * 0.15
)).show(truncate=False)
```

## Funciones de Array

```python
from pyspark.sql.functions import (
    array_contains, size, sort_array, array_distinct,
    array_intersect, array_union, array_except, slice, reverse
)

arr_df = spark.createDataFrame([
    ("Alice", [3, 1, 2, 1, 5], ["a", "b", "c"]),
    ("Bob", [5, 5, 3, 2], ["d", "e"]),
    ("Charlie", [1, 2, 3], ["f"])
], ["name", "numbers", "letters"])

arr_df.select(
    col("name"),
    size(col("numbers")).alias("count"),
    array_contains(col("numbers"), 3).alias("has_3"),
    sort_array(col("numbers")).alias("sorted"),
    array_distinct(col("numbers")).alias("unique"),
    array_intersect(col("numbers"), array(lit(1), lit(2))).alias("intersect"),
    array_union(col("numbers"), array(lit(6), lit(7))).alias("union"),
    slice(col("numbers"), 1, 3).alias("first_3"),
    reverse(col("letters")).alias("reversed")
).show(truncate=False)
```

## Transformaciones Anidadas Complejas

```python
# Mundo real: Analizar logs JSON anidados
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, ArrayType

json_data = """
{"user": "Alice", "events": [{"type": "click", "page": "/home", "ts": 100}, {"type": "view", "page": "/about", "ts": 200}]}
{"user": "Bob", "events": [{"type": "click", "page": "/pricing", "ts": 150}]}
""".strip().split("\n")

logs_df = spark.read.json(sc.parallelize(json_data))

# Explotar eventos
events_df = logs_df.select(
    col("user"),
    explode(col("events")).alias("event")
)

# Extraer detalles del evento
events_df.select(
    col("user"),
    col("event.type"),
    col("event.page"),
    col("event.ts")
).show()
```

## Preguntas de Práctica

1. ¿Cómo difiere `when()` del `if-elif-else` de Python en la ejecución?
2. ¿Cuál es la diferencia entre `explode()` y `explode_outer()`?
3. ¿Cómo se accede a campos dentro de una columna struct?
4. ¿Cuándo usaría `posexplode()` en lugar de `explode()`?
5. ¿Cómo se crea una columna map a partir de columnas existentes?
6. ¿Qué sucede con las filas con arrays nulos al usar `explode()` vs `explode_outer()`?
7. ¿Cómo se encuentra la longitud de una columna array?
8. ¿Cuál es la diferencia entre `array_union` y `array_distinct`?
9. ¿Cómo se extrae una porción de elementos de un array?
10. Escribe una transformación que divida una string separada por comas, la explote y agrupe por valor.
