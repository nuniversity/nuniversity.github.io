---
title: "Agregaciones Avanzadas"
description: "Domina groupBy con agg, múltiples agregaciones, pivot, rollup y cube para análisis avanzado de datos"
order: 3
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Agregaciones Avanzadas

`groupBy` básico con `count()` solo araña la superficie. Spark proporciona capacidades poderosas de agregación incluyendo múltiples métricas por grupo, pivot y análisis multidimensional con rollup y cube.

## GroupBy con Múltiples Agregaciones

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    count, avg, sum, max, min, stddev, collect_list, collect_set
)

spark = SparkSession.builder \
    .appName("AdvancedAggs") \
    .master("local[*]") \
    .getOrCreate()

data = [
    ("Alice", "Engineering", "NY", 120000),
    ("Bob", "Design", "SF", 90000),
    ("Charlie", "Engineering", "NY", 150000),
    ("Diana", "Marketing", "SF", 80000),
    ("Eve", "Engineering", "NY", 135000),
    ("Frank", "Design", "LA", 95000),
    ("Grace", "Marketing", "NY", 110000),
    ("Henry", "Engineering", "LA", 125000)
]
df = spark.createDataFrame(data, ["name", "dept", "city", "salary"])

# Múltiples agregaciones
dept_stats = df.groupBy("dept").agg(
    count("*").alias("emp_count"),
    sum("salary").alias("total_salary"),
    avg("salary").alias("avg_salary"),
    max("salary").alias("max_salary"),
    min("salary").alias("min_salary"),
    stddev("salary").alias("salary_stddev")
)
dept_stats.show()
```

> [!NOTE]
> Puedes pasar cualquier número de expresiones de agregación a `agg()`. Cada una recibe su propio alias para un nombre limpio de columnas.

## Agregación con Filtrado

```python
# Agregación condicional (contar solo filas coincidentes)
dept_condition = df.groupBy("dept").agg(
    count("*").alias("total"),
    count(when(col("salary") > 100000, 1)).alias("high_earners"),
    sum(when(col("city") == "NY", col("salary"))).alias("ny_salary_total"),
    avg(when(col("city") == "SF", col("salary"))).alias("sf_avg_salary")
)
dept_condition.show()
```

## Usando agg con Diccionario

```python
# Expresiones de agregación como dict
from pyspark.sql.functions import expr

agg_exprs = {
    "salary": ["count", "sum", "avg", "max", "min"],
    "name": "count"
}

dept_stats_dict = df.groupBy("dept").agg(agg_exprs)
dept_stats_dict.show()
```

> [!WARNING]
> La agregación basada en dict produce nombres de columna multinivel como `salary_sum`, `salary_avg`. Usa la API basada en expresión para nombres más limpios.

## Colectando Valores

```python
# Colectar nombres por departamento como listas
dept_names = df.groupBy("dept").agg(
    collect_list("name").alias("names_list"),
    collect_set("name").alias("names_set"),
    collect_list("salary").alias("salaries")
)
dept_names.show(truncate=False)
```

> [!SUCCESS]
> `collect_list()` y `collect_set()` son invaluables para crear arrays listos para JSON para sistemas downstream como Elasticsearch o Kafka.

## Agrupando por Múltiples Columnas

```python
# Group by multi-columna
city_dept = df.groupBy("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

city_dept.show()
```

## Pivot

`pivot()` transforma valores únicos de una columna en columnas separadas.

```python
# Pivot simple — departamentos como columnas, salario promedio como valores
pivot_df = df.groupBy("city").pivot("dept").agg(avg("salary"))
pivot_df.show()
# +----+--------+-------+---------+
# |city|  Design|Engineer|Marketing|
# +----+--------+-------+---------+
# |  LA| 95000.0|125000.0|     null|
# |  NY|    null|135000.0| 110000.0|
# |  SF| 90000.0|   null |  80000.0|
# +----+--------+-------+---------+

# Pivot con valores especificados (más eficiente)
pivot_specified = df.groupBy("city").pivot("dept", ["Engineering", "Design", "Marketing"]).agg(avg("salary"))

# Múltiples agregaciones en pivot
pivot_multi = df.groupBy("city").pivot("dept").agg(
    avg("salary").alias("avg_salary"),
    sum("salary").alias("total_salary")
)
pivot_multi.show()
```

> [!NOTE]
> `pivot()` con una lista especificada de valores es más eficiente porque Spark no necesita escanear todos los valores distintos primero. Sin esto, Spark ejecuta una consulta extra para descubrir valores únicos.

### Pivot con Agregaciones Complejas

```python
from pyspark.sql.functions import approx_count_distinct

pivot_complex = df.groupBy("city").pivot("dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary"),
    approx_count_distinct("name").alias("unique_employees")
)
pivot_complex.show()
```

## Rollup

`rollup()` crea subtotales y totales generales a lo largo de una jerarquía.

```python
# Rollup: jerarquía de (city, dept)
rollup_df = df.rollup("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

rollup_df.show()
# +----+-----------+-----+----------+
# |city|       dept|count|avg_salary|
# +----+-----------+-----+----------+
# |null|       null|    8|  125625.0|  <- total general
# |  LA|       null|    2|  110000.0|  <- subtotal LA
# |  LA|     Design|    1|   95000.0|
# |  LA|Engineering|    1|  125000.0|
# |  NY|       null|    4|  128750.0|  <- subtotal NY
# |  NY|Engineering|    3|  135000.0|
# |  NY|  Marketing|    1|  110000.0|
# |  SF|       null|    2|   85000.0|  <- subtotal SF
# |  SF|     Design|    1|   90000.0|
# |  SF|  Marketing|    1|   80000.0|
# +----+-----------+-----+----------+

# Subtotales de ciudad y total general
rollup_df.filter(col("dept").isNull()).show()
```

> [!WARNING]
> Los resultados de rollup incluyen valores `null` para representar filas de subtotal. Filtrar por `null` en la columna siendo enrollada identifica filas de subtotal. Cuidado de no confundir nulos reales de datos con nulos de subtotal.

## Cube

`cube()` genera todas las combinaciones posibles de columnas de agrupación (tabulación cruzada).

```python
# Cube: todas las combinaciones de (city, dept)
cube_df = df.cube("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

cube_df.show()
# +----+-----------+-----+----------+
# |city|       dept|count|avg_salary|
# +----+-----------+-----+----------+
# |null|       null|    8|  125625.0|  <- total general
# |null|     Design|    2|   92500.0|  <- Design en todas ciudades
# |null|Engineering|    4|  132500.0|  <- Engineering en todas ciudades
# |null|  Marketing|    2|   95000.0|  <- Marketing en todas ciudades
# |  LA|       null|    2|  110000.0|  <- subtotal LA
# |  LA|     Design|    1|   95000.0|
# |  LA|Engineering|    1|  125000.0|
# |  NY|       null|    4|  128750.0|  <- subtotal NY
# ...
```

### Rollup vs Cube

| Aspecto | Rollup | Cube |
|---|---|---|
| **Agrupaciones** | Subtotales jerárquicos + total general | Todas las combinaciones |
| **Número de grupos** | N+1 donde N es profundidad de jerarquía | 2^N donde N es conteo de columnas |
| **Caso de uso** | Jerarquías de fecha (año > mes > día) | Cubos OLAP multidimensionales |
| **Rendimiento** | Más rápido (menos grupos) | Más lento (grupos exponenciales) |
| **Filas resultantes** | 1 + suma de cardinalidades | Producto de todas las combinaciones de nivel |

## Grouping Sets

`GROUPING SETS` de SQL para control explícito sobre combinaciones de subtotales.

```python
# Equivalente a cube pero con conjuntos explícitos
from pyspark.sql.functions import expr

grouping_sets = df.groupBy("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).groupBy("city", "dept")  # No disponible directamente en API DataFrame

# Usar SQL en su lugar
df.createOrReplaceTempView("employees")
result = spark.sql("""
    SELECT city, dept,
           COUNT(*) as count,
           AVG(salary) as avg_salary
    FROM employees
    GROUP BY GROUPING SETS (
        (city, dept),
        (city),
        (dept),
        ()
    )
    ORDER BY city, dept
""")
result.show()
```

## Funciones de Ventana de Agregación

```python
from pyspark.sql.window import Window

# Total acumulado por departamento
window_spec = Window.partitionBy("dept").orderBy("salary")

df.withColumn("running_total", sum("salary").over(window_spec)) \
  .withColumn("rank", rank().over(window_spec)) \
  .show()
```

> [!NOTE]
> Las funciones de ventana se cubren en profundidad en la lección de Spark SQL Avanzado. Complementan las agregaciones groupBy permitiendo cálculos por grupo sin colapsar filas.

## Consejos de Rendimiento

1. **Especifique valores de pivot** para evitar el escaneo extra de valores distintos
2. **Use `approx_count_distinct()`** en lugar de `countDistinct()` en grandes conjuntos de datos
3. **Evite cube** en columnas de alta cardinalidad (explosión exponencial)
4. **Use `rollup`** para agregaciones jerárquicas que correspondan a jerarquías de negocio
5. **Filtre después de la agregación**, no antes, a menos que el filtro reduzca el tamaño del shuffle

## Preguntas de Práctica

1. ¿Cómo se computan múltiples agregaciones (count, sum, avg) en un `groupBy`?
2. ¿Cuál es la diferencia entre `rollup` y `cube`?
3. ¿Cuándo usarías `pivot()` y cómo especificar valores para eficiencia?
4. ¿Cómo se identifican filas de subtotal en un resultado de rollup?
5. ¿Qué sucede si haces pivot en una columna con alta cardinalidad (miles de valores)?
6. ¿Cómo difieren `collect_list()` y `collect_set()`?
7. ¿Qué logra `GROUPING SETS` que `cube` no puede?
8. ¿Por qué especificar valores de pivot explícitamente?
9. ¿Cómo se agrega condicionalmente (por ejemplo, salario promedio solo para NY)?
10. ¿Cuál es la compensación de rendimiento entre `cube` y `rollup`?
