---
title: "Estrategias de Join"
description: "Comprende tipos de join (inner, outer, semi, anti), broadcast hash join, sort merge join y manejo de skew join"
order: 4
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Estrategias de Join

Los joins están entre las operaciones más costosas en Spark. Elegir la estrategia de join correcta puede significar la diferencia entre un pipeline que se ejecuta en minutos versus uno que falla con errores OOM. Esta lección cubre tipos de join, estrategias físicas de join y técnicas de optimización.

## Tipos de Join

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("JoinStrategies") \
    .master("local[*]") \
    .getOrCreate()

employees = spark.createDataFrame([
    (1, "Alice", "Engineering"),
    (2, "Bob", "Design"),
    (3, "Charlie", "Engineering"),
    (4, "Diana", "Marketing"),
    (5, "Eve", None)
], ["emp_id", "name", "dept"])

salaries = spark.createDataFrame([
    (1, 120000),
    (2, 90000),
    (3, 150000),
    (4, 110000),
    (6, 95000)
], ["emp_id", "salary"])
```

### Inner Join

Devuelve filas donde las claves coinciden en ambos DataFrames.

```python
inner = employees.join(salaries, on="emp_id", how="inner")
inner.show()
# +------+-------+-----------+------+
# |emp_id|   name|       dept|salary|
# +------+-------+-----------+------+
# |     1|  Alice|Engineering|120000|
# |     2|    Bob|     Design| 90000|
# |     3|Charlie|Engineering|150000|
# |     4|  Diana|  Marketing|110000|
# +------+-------+-----------+------+
```

### Left Outer Join

Devuelve todas las filas del DataFrame izquierdo, con nulos donde falta el lado derecho.

```python
left = employees.join(salaries, on="emp_id", how="left")
left.show()
# +------+-------+-----------+------+
# |emp_id|   name|       dept|salary|
# +------+-------+-----------+------+
# |     1|  Alice|Engineering|120000|
# |     2|    Bob|     Design| 90000|
# |     3|Charlie|Engineering|150000|
# |     4|  Diana|  Marketing|110000|
# |     5|    Eve|       null|  null|
# +------+-------+-----------+------+
```

### Right Outer Join

Devuelve todas las filas del DataFrame derecho.

```python
right = employees.join(salaries, on="emp_id", how="right")
right.show()
# +------+-------+-----------+------+
# |emp_id|   name|       dept|salary|
# +------+-------+-----------+------+
# |     1|  Alice|Engineering|120000|
# |     2|    Bob|     Design| 90000|
# |     3|Charlie|Engineering|150000|
# |     4|  Diana|  Marketing|110000|
# |     6|   null|       null| 95000|
# +------+-------+-----------+------+
```

### Full Outer Join

Devuelve todas las filas de ambos DataFrames.

```python
full = employees.join(salaries, on="emp_id", how="full")
full.orderBy("emp_id").show()
```

### Left Semi Join

Devuelve filas del DataFrame izquierdo que tienen una coincidencia en el derecho. No se incluyen columnas del lado derecho.

```python
semi = employees.join(salaries, on="emp_id", how="left_semi")
semi.show()
# +------+-------+-----------+
# |emp_id|   name|       dept|
# +------+-------+-----------+
# |     1|  Alice|Engineering|
# |     2|    Bob|     Design|
# |     3|Charlie|Engineering|
# |     4|  Diana|  Marketing|
# +------+-------+-----------+
# (Eve excluida porque emp_id 5 no tiene registro de salario)
```

> [!SUCCESS]
> `left_semi` es la forma más eficiente de filtrar un DataFrame por la existencia de claves en otro. Evita mezclar columnas del lado derecho.

### Left Anti Join

Devuelve filas del DataFrame izquierdo que **no** tienen coincidencia en el derecho.

```python
anti = employees.join(salaries, on="emp_id", how="left_anti")
anti.show()
# +------+----+----+
# |emp_id|name|dept|
# +------+----+----+
# |     5| Eve|null|
# +------+----+----+
```

## Estrategias Físicas de Join

El planificador de consultas de Spark selecciona una estrategia de join basada en estadísticas, pistas y configuración.

### Broadcast Hash Join (BHJ)

Para tablas pequeñas (predeterminado < 10 MB), Spark transmite la tabla completa a todos los ejecutores.

```python
from pyspark.sql.functions import broadcast

# Forzar pista de broadcast
small_df = salaries  # Asumiendo que es pequeño
result = employees.join(broadcast(small_df), "emp_id", "inner")
result.explain()
# == Physical Plan ==
# BroadcastHashJoin ...
```

| Propiedad | Valor |
|---|---|
| **Mejor para** | Una tabla lo suficientemente pequeña para caber en la memoria del ejecutor |
| **Sin shuffle** para la tabla pequeña | Transmitida una vez a todos los ejecutores |
| **Umbral** | `spark.sql.autoBroadcastJoinThreshold` (predeterminado 10 MB) |
| **Riesgo** | Transmitir una tabla grande causa OOM o cuello de botella en el driver |

> [!NOTE]
> Para deshabilitar broadcast join para una consulta específica, establezca `spark.sql.autoBroadcastJoinThreshold=-1` o use las pistas `/*+ BROADCAST(t) */` y `/*+ NO_BROADCAST(t) */`.

### Sort Merge Join (SMJ)

Predeterminado para tablas grandes. Ambos lados se ordenan y fusionan.

```python
# Establecer para preferir sort merge join
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", -1)

large_df1 = spark.range(1, 1000000)
large_df2 = spark.range(1, 1000000)

result = large_df1.join(large_df2, "id")
result.explain()
# == Physical Plan ==
# SortMergeJoin ...
```

| Propiedad | Valor |
|---|---|
| **Mejor para** | Tablas grandes (ambos lados) |
| **Requiere** | Ordenación de ambos lados por clave de join |
| **Shuffle** | Ambos lados mezclados por clave de join |
| **Escala a** | Cualquier tamaño (respaldado por disco) |

### Shuffled Hash Join

Como SMJ pero usa hashing en lugar de ordenación. Habilitado cuando `spark.sql.join.preferSortMergeJoin=false`.

```python
spark.conf.set("spark.sql.join.preferSortMergeJoin", false)
```

### Broadcast Nested Loop Join

Fallback cuando no hay condición equi-join (cross join o condición compleja).

```python
# Cross join (producto cartesiano)
cross = employees.crossJoin(salaries)
cross.show()

# Con condición no-equi
from pyspark.sql.functions import col
result = employees.alias("e").join(
    salaries.alias("s"),
    col("e.emp_id") < col("s.emp_id"),
    "inner"
)
```

> [!WARNING]
> Los cross joins generan N×M filas. Con dos conjuntos de 1 millón de filas cada uno, eso es 1 billón de filas. Evite cross joins en datos grandes.

## Manejo de Skew Join

El sesgo de datos — donde una clave tiene desproporcionadamente muchos valores — puede causar tareas de larga cola.

```python
# Verificar skew
skew_check = df.groupBy("join_key").agg(count("*").alias("cnt")) \
    .orderBy(col("cnt").desc())
skew_check.show(10)

# Habilitar optimización de skew join (Spark 3.x)
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")
```

> [!NOTE]
> Adaptive Query Execution (AQE) de Spark 3.x puede detectar y dividir automáticamente particiones sesgadas durante el join. Esta es una gran mejora sobre Spark 2.x donde el sesgo tenía que manejarse manualmente.

### Manejo Manual de Skew

```python
# Salar la clave sesgada (añadir sufijo aleatorio para dividir entre particiones)
from pyspark.sql.functions import rand, concat, floor

skewed_key = "NY"

# Salando el lado grande
salted_large = large_df \
    .withColumn("salt", (rand() * 10).cast("int")) \
    .withColumn("salted_key", concat(col("key"), lit("_"), col("salt")))

# Duplicando el lado pequeño
from pyspark.sql.functions import explode, array, lit

salted_small = small_df \
    .withColumn("salt", explode(array([lit(i) for i in range(10)]))) \
    .withColumn("salted_key", concat(col("key"), lit("_"), col("salt")))

# Join en claves saladas y luego deduplicar
result = salted_large.join(salted_small, "salted_key").drop("salt")
```

## Resumen de Rendimiento de Join

| Estrategia | Tabla Pequeña | Tabla Grande | Shuffle | Memoria |
|---|---|---|---|---|
| **Broadcast Hash** | < 10 MB | Cualquier tamaño | Ninguno (pequeña transmitida) | Tabla pequeña en cada ejecutor |
| **Sort Merge** | Cualquier | Cualquier | Ambos lados ordenados | Mínima (stream desde disco) |
| **Shuffled Hash** | Cualquier | Cualquier | Ambos lados hasheados | Un lado en tabla hash |
| **Broadcast Nested Loop** | < 10 MB | Cualquier | Ninguno | Alta (memoria cross join) |

## Mejores Prácticas

1. **Filtre antes de hacer join** para reducir el volumen de datos
2. **Seleccione solo columnas necesarias** antes del join
3. **Transmita tablas pequeñas** explícitamente con `broadcast()`
4. **Use `left_semi`** en lugar de inner join cuando solo necesite columnas del lado izquierdo
5. **Monitoree skew** usando los detalles de etapa de la Spark UI
6. **Habilite AQE** (`spark.sql.adaptive.enabled=true`) para manejo automático de skew
7. **Evite productos cartesianos** (cross joins)

## Preguntas de Práctica

1. ¿Cuáles son los cinco tipos principales de join en Spark?
2. ¿Cómo difiere `left_semi` de un inner join?
3. ¿Cuándo elige Spark broadcast hash join sobre sort merge join?
4. ¿Cuál es el umbral predeterminado de broadcast y cómo cambiarlo?
5. ¿Cómo funciona sort merge join internamente?
6. ¿Qué causa el sesgo de datos y cómo afecta el rendimiento del join?
7. ¿Cómo maneja Adaptive Query Execution (AQE) los joins sesgados?
8. ¿Qué es el salting y cuándo lo usarías?
9. ¿Por qué un cross join es peligroso en grandes conjuntos de datos?
10. ¿Cómo se puede forzar un broadcast join usando una pista?
