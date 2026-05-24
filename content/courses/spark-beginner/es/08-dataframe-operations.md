---
title: "Operaciones con DataFrame"
description: "Domina operaciones con DataFrame: select, filter, withColumn, drop, rename, distinct, sample con ejemplos PySpark"
order: 8
duration: "30-40 minutos"
difficulty: "principiante"
---

# Operaciones con DataFrame

Los DataFrames proporcionan un rico conjunto de operaciones para la manipulación de datos. Estas operaciones son optimizadas por el optimizador Catalyst y ejecutadas a través del motor Tungsten para máximo rendimiento.

## Preparando Datos de Ejemplo

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, upper, lit, when

spark = SparkSession.builder \
    .appName("DataFrameOps") \
    .master("local[*]") \
    .getOrCreate()

data = [
    ("Alice", 34, "Engineering", 120000, "NY"),
    ("Bob", 28, "Design", 90000, "SF"),
    ("Charlie", 41, "Engineering", 150000, "NY"),
    ("Diana", 25, "Marketing", 80000, "SF"),
    ("Eve", 38, "Engineering", 135000, "NY"),
    ("Frank", 30, "Design", 95000, "LA"),
    ("Grace", 45, "Marketing", 110000, "NY"),
    ("Henry", 32, "Engineering", 125000, "LA")
]

df = spark.createDataFrame(data, ["name", "age", "dept", "salary", "city"])
df.show()
```

## select()

Selecciona columnas específicas del DataFrame.

```python
# Seleccionar columna única
df.select("name").show()

# Seleccionar múltiples columnas
df.select("name", "age", "salary").show()

# Seleccionar usando función col()
from pyspark.sql.functions import col
df.select(col("name"), col("salary") * 1.1).show()

# Seleccionar todas las columnas
df.select("*").show()

# Seleccionar con expresiones
df.select(
    col("name"),
    col("salary"),
    (col("salary") / 12).alias("monthly_salary")
).show()
```

> [!NOTE]
> Usar la función `col()` es más explícito y permite encadenar expresiones de columna. Los nombres de columna en string se convierten a `col()` internamente.

## filter() / where()

Filtra filas basándose en una condición.

```python
# Condición única
df.filter(col("age") > 30).show()
df.where(col("age") > 30).show()  # idéntico

# Múltiples condiciones (AND)
df.filter((col("age") > 30) & (col("dept") == "Engineering")).show()

# Múltiples condiciones (OR)
df.filter((col("dept") == "Design") | (col("dept") == "Marketing")).show()

# Expresiones en string
df.filter("age > 30").show()
df.filter("age > 30 AND dept = 'Engineering'").show()

# isin para múltiples valores
df.filter(col("city").isin("NY", "SF")).show()

# Patrones Like
df.filter(col("name").like("A%")).show()

# Negación
df.filter(~col("dept").isin("Engineering", "Design")).show()
```

> [!WARNING]
> Mezclar los dos estilos de sintaxis (`df.filter("age > 30")` y `df.filter(col("age") > 30)`) en la misma expresión puede causar errores confusos. Elija un estilo y sea consistente.

## withColumn()

Añade una nueva columna o reemplaza una existente.

```python
# Añadir una columna constante
df = df.withColumn("country", lit("USA"))
df.show()

# Derivar una nueva columna de columnas existentes
df = df.withColumn(
    "bonus",
    col("salary") * 0.20
)
df.show()

# Columna condicional con when/otherwise
df = df.withColumn(
    "salary_level",
    when(col("salary") > 130000, "High")
    .when(col("salary") > 100000, "Medium")
    .otherwise("Low")
)
df.show()

# Transformar columna existente
df = df.withColumn(
    "name_upper",
    upper(col("name"))
)
df.show()

# Convertir tipo de columna
df = df.withColumn(
    "age_double",
    col("age").cast("double")
)
```

> [!NOTE]
> `withColumn()` no modifica el DataFrame original. Devuelve un nuevo DataFrame con la columna añadida. Los DataFrames son inmutables.

## drop()

Elimina una o más columnas del DataFrame.

```python
# Eliminar una sola columna
df_no_bonus = df.drop("bonus")
df_no_bonus.show()

# Eliminar múltiples columnas
df_clean = df.drop("country", "bonus", "salary_level")
df_clean.show()

# Eliminar columnas por condición
df_clean = df.drop(*[c for c in df.columns if c.startswith("name")])
```

## withColumnRenamed()

Renombra una columna existente.

```python
# Renombrar una sola columna
df_renamed = df.withColumnRenamed("salary", "annual_salary")
df_renamed.show()

# Renombrar múltiples columnas
df_renamed = df \
    .withColumnRenamed("name", "employee_name") \
    .withColumnRenamed("dept", "department")
df_renamed.show()
```

## distinct() / dropDuplicates()

Elimina filas duplicadas.

```python
# Filas distintas (todas las columnas)
df_distinct_dept = df.select("dept").distinct()
df_distinct_dept.show()

# Eliminar duplicados basado en subconjunto de columnas
df_cities = df.select("city").distinct()
df_cities.show()

# dropDuplicates con subconjunto
df_unique = df.dropDuplicates(["city", "dept"])
df_unique.show()
```

> [!SUCCESS]
> `dropDuplicates(["col1", "col2"])` es más flexible que `distinct()`. Permite definir qué columnas determinan la unicidad mientras mantiene todos los demás valores de columna de la primera fila coincidente.

## sample()

Devuelve una muestra aleatoria de los datos.

```python
# Muestra aleatoria (sin reemplazo)
sample_20 = df.sample(withReplacement=False, fraction=0.2)
sample_20.show()

# Muestra aleatoria con semilla (reproducible)
sample_20 = df.sample(withReplacement=False, fraction=0.2, seed=42)

# Muestra con reemplazo
sample_over = df.sample(withReplacement=True, fraction=1.5)

# Muestreo fraccionado por fila
weighted = df.sampleBy("dept", fractions={
    "Engineering": 0.5,
    "Design": 1.0,
    "Marketing": 0.75
}, seed=42)
```

## orderBy() / sort()

Ordena el DataFrame por una o más columnas.

```python
# Ordenar ascendente (predeterminado)
df.orderBy("salary").show()
df.sort("salary").show()

# Ordenar descendente
df.orderBy(col("salary").desc()).show()
df.orderBy(col("salary").desc(), col("age").asc()).show()

# Usando función desc
from pyspark.sql.functions import desc
df.orderBy(desc("salary")).show()

# Expresión en string
df.sort("salary DESC").show()
```

## GroupBy y Agregación

```python
# Agrupar por departamento y contar
from pyspark.sql.functions import avg, max, min, sum, count

dept_stats = df.groupBy("dept").agg(
    count("*").alias("employee_count"),
    avg("salary").alias("avg_salary"),
    max("salary").alias("max_salary"),
    min("age").alias("min_age")
)
dept_stats.show()

# Múltiples columnas de grupo
city_dept = df.groupBy("city", "dept").agg(
    sum("salary").alias("total_salary")
)
city_dept.show()
```

## Alias y Cast de Columna

```python
# Alias para claridad
df.select(
    col("name").alias("Employee Name"),
    col("salary").cast("double").alias("Annual Compensation")
).show()

# Encadenar operaciones
from pyspark.sql.types import DoubleType

df_processed = df \
    .withColumn("salary", col("salary").cast(DoubleType())) \
    .withColumn("bonus", col("salary") * 0.15) \
    .withColumnRenamed("salary", "base_salary") \
    .drop("country")
```

## Tabla Resumen de Operaciones

| Operación | Propósito | Devuelve |
|---|---|---|
| `select()` | Elegir columnas | DataFrame |
| `filter()` / `where()` | Filtrar filas por condición | DataFrame |
| `withColumn()` | Añadir/reemplazar columna | DataFrame |
| `drop()` | Eliminar columnas | DataFrame |
| `withColumnRenamed()` | Renombrar columna | DataFrame |
| `distinct()` | Filas únicas | DataFrame |
| `dropDuplicates()` | Eliminar duplicados por subconjunto | DataFrame |
| `sample()` | Muestreo aleatorio | DataFrame |
| `orderBy()` / `sort()` | Ordenar filas | DataFrame |
| `groupBy().agg()` | Agregación | DataFrame |

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `select("col1", "col2")` y `select(col("col1"), col("col2"))`?
2. ¿Cómo se añade una nueva columna derivada de columnas existentes?
3. ¿Cuál es la diferencia entre `distinct()` y `dropDuplicates(["col1"])`?
4. ¿Cómo se renombran múltiples columnas a la vez?
5. ¿Por qué `withColumn()` es preferido en lugar de la asignación directa de columna?
6. ¿Cómo se filtra con múltiples condiciones (AND, OR)?
7. ¿Qué hace `sampleBy("dept", fractions={...}, seed=42)`?
8. ¿Cómo se ordena en orden descendente?
9. ¿Cuál es la diferencia entre `filter` y `where`?
10. ¿Cómo se elimina una columna que contiene valores nulos en un subconjunto específico?
