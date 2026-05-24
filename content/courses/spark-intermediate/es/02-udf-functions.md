---
title: "Funciones UDF"
description: "Crea User Defined Functions (UDFs), Pandas UDFs y comprende consideraciones de rendimiento para funciones personalizadas en Spark"
order: 2
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Funciones UDF

Las funciones integradas de Spark cubren muchos casos de uso, pero la lógica personalizada a veces requiere User Defined Functions (UDFs). Esta lección cubre UDFs regulares, Pandas UDFs vectorizadas y las compensaciones de rendimiento entre ellas.

## Cuándo Usar UDFs

| Escenario | ¿Función Integrada Disponible? | ¿Usar UDF? |
|---|---|---|
| Lógica condicional (if/else) | `when()` / `otherwise()` | No |
| Manipulación simple de string | `substring`, `trim`, `regexp_extract` | No |
| Reglas de negocio complejas | Raramente | Sí |
| Cálculos de fecha personalizados | `datediff`, `add_months` | Raramente |
| Llamadas a bibliotecas externas | No | Sí |
| Inferencia de modelo ML por fila | No | Sí |

> [!NOTE]
> Siempre verifique si existe una función integrada antes de escribir una UDF. Las funciones integradas se ejecutan en la JVM de Spark y son mucho más rápidas que las UDFs Python.

## UDFs Python Regulares

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import udf, col
from pyspark.sql.types import StringType, IntegerType, DoubleType

spark = SparkSession.builder \
    .appName("UDFExamples") \
    .master("local[*]") \
    .getOrCreate()

data = [
    ("Alice", 120000),
    ("Bob", 90000),
    ("Charlie", 150000),
    ("Diana", 75000)
]
df = spark.createDataFrame(data, ["name", "salary"])

# Definir y registrar una UDF
def salary_tier(salary):
    if salary >= 130000:
        return "Lead"
    elif salary >= 100000:
        return "Senior"
    elif salary >= 70000:
        return "Mid"
    else:
        return "Junior"

tier_udf = udf(salary_tier, StringType())

# Aplicar UDF
df.withColumn("tier", tier_udf(col("salary"))).show()
```

> [!WARNING]
> Las UDFs Python regulares tienen alta sobrecarga de serialización. Cada fila se serializa de JVM a Python, se procesa y se serializa de vuelta. Esto puede ser 10-100x más lento que las funciones integradas.

### UDF con Múltiples Entradas

```python
def bonus_calculation(salary, performance_score):
    if performance_score >= 90:
        multiplier = 0.25
    elif performance_score >= 75:
        multiplier = 0.15
    else:
        multiplier = 0.05
    return salary * multiplier

performance_data = [
    ("Alice", 120000, 95),
    ("Bob", 90000, 80),
    ("Charlie", 150000, 70)
]
perf_df = spark.createDataFrame(performance_data, ["name", "salary", "score"])

bonus_udf = udf(bonus_calculation, DoubleType())

perf_df.withColumn("bonus", bonus_udf(col("salary"), col("score"))).show()
```

## Devolviendo Tipos Complejos desde UDFs

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

# Devolver un struct
def employee_profile(name, salary, score):
    tier = "Lead" if salary >= 130000 else "Senior" if salary >= 100000 else "Mid"
    bonus = salary * (0.25 if score >= 90 else 0.15 if score >= 75 else 0.05)
    return (tier, round(bonus, 2))

profile_schema = StructType([
    StructField("tier", StringType()),
    StructField("bonus", DoubleType())
])

profile_udf = udf(employee_profile, profile_schema)

perf_df.withColumn("profile", profile_udf("name", "salary", "score")) \
    .select("name", "profile.tier", "profile.bonus").show()
```

## Pandas UDFs (Vectorizadas)

Las Pandas UDFs procesan lotes de filas usando Apache Arrow para transferencia de datos zero-copy. Son significativamente más rápidas que las UDFs regulares.

```python
import pandas as pd
from pyspark.sql.functions import pandas_udf

# Scalar Pandas UDF (entrada -> salida, una fila entra, una fila sale)
@pandas_udf(StringType())
def salary_tier_vectorized(salary: pd.Series) -> pd.Series:
    return salary.apply(lambda x:
        "Lead" if x >= 130000 else
        "Senior" if x >= 100000 else
        "Mid" if x >= 70000 else "Junior"
    )

df.withColumn("tier", salary_tier_vectorized(col("salary"))).show()
```

> [!SUCCESS]
> Las Pandas UDFs usan Apache Arrow para transferencia de datos zero-copy entre JVM y Python, eliminando la sobrecarga de serialización. Pueden ser 10-100x más rápidas que las UDFs Python regulares.

### Pandas UDF con Múltiples Columnas

```python
@pandas_udf(DoubleType())
def bonus_vectorized(salary: pd.Series, score: pd.Series) -> pd.Series:
    mult = pd.cut(score, bins=[0, 74, 89, 100], labels=[0.05, 0.15, 0.25],
                  include_lowest=True).astype(float)
    return salary * mult

perf_df.withColumn("bonus", bonus_vectorized("salary", "score")).show()
```

## Pandas UDFs de Mapa Agrupado

Patrón split-apply-combine: procesa cada grupo como un DataFrame pandas.

```python
# Grouped apply — recibe todas las filas de un grupo como un DataFrame pandas
@pandas_udf(perf_df.schema, PandasUDFType.GROUPED_MAP)
def rank_within_dept(pdf):
    pdf["rank"] = pdf["salary"].rank(ascending=False)
    return pdf

# Nota: En Spark 3.x+, usa el patrón decorator
from pyspark.sql.functions import PandasUDFType

grouped = perf_df.groupby("dept").apply(rank_within_dept)
```

> [!NOTE]
> Las Grouped map UDFs se han actualizado en Spark 3.x. Usa `applyInPandas()` para un control más explícito sobre el esquema de salida.

### applyInPandas

```python
# Definir esquemas de entrada y salida
from pyspark.sql.types import LongType

perf_df_with_dept = perf_df.withColumn("dept", 
    when(col("name") == "Alice", "Engineering")
    .when(col("name") == "Bob", "Engineering")
    .otherwise("Marketing"))

def compute_rank(key, pdf):
    pdf["rank"] = pdf["salary"].rank(ascending=False)
    return pdf

output_schema = perf_df_with_dept.schema.add("rank", DoubleType())

result = perf_df_with_dept.groupby("dept").applyInPandas(
    compute_rank, schema=output_schema
)
result.show()
```

## Pandas UDFs de Agregación Agrupada

```python
@pandas_udf(DoubleType(), PandasUDFType.GROUPED_AGG)
def median_salary(v):
    return v.median()

perf_df_with_dept.groupby("dept").agg(
    median_salary(col("salary")).alias("median_salary")
).show()
```

## Comparación de Rendimiento

| Tipo UDF | Serialización | Velocidad | Caso de Uso |
|---|---|---|---|
| **UDF Python Regular** | Pickle (JVM <-> Python) | Lenta | Lógica simple, datos pequeños |
| **Pandas UDF (Scalar)** | Apache Arrow (zero-copy) | 10-100x más rápida | Operaciones por lotes en columnas |
| **Grouped Map Pandas UDF** | Arrow | Rápida | Lógica compleja por grupo |
| **Grouped Aggregate** | Arrow | Rápida | Agregaciones personalizadas |
| **Función Integrada** | Ninguna (JVM nativa) | Más rápida | Siempre preferir si está disponible |

> [!WARNING]
> Incluso con Pandas UDFs, hay sobrecarga al mover datos de JVM a Python. Para máximo rendimiento, reescribe la lógica crítica en Scala UDFs o usa funciones integradas.

## Registrando UDFs para Spark SQL

```python
# Registrar para uso en consultas SQL
spark.udf.register("sql_tier", salary_tier, StringType())

df.createOrReplaceTempView("employees")
spark.sql("""
    SELECT name, salary, sql_tier(salary) as tier
    FROM employees
""").show()

# Registrar Pandas UDF para SQL
spark.udf.register("sql_tier_vec", salary_tier_vectorized)
spark.sql("""
    SELECT name, salary, sql_tier_vec(salary) as tier
    FROM employees
""").show()
```

## Mejores Prácticas

1. **Prefiere funciones integradas** siempre que sea posible
2. **Usa Pandas UDFs** en lugar de UDFs regulares para rendimiento
3. **Minimiza llamadas UDF** — agrupa operaciones en una UDF en lugar de múltiples
4. **Evita UDFs en límites de shuffle** cuando sea posible
5. **Prueba UDFs localmente** antes de ejecutar a escala
6. **Establece `spark.sql.execution.arrow.pyspark.enabled=true`** para Pandas UDFs

## Preguntas de Práctica

1. ¿Cuál es la diferencia de rendimiento entre UDFs regulares y Pandas UDFs?
2. ¿Cómo mejora Apache Arrow el rendimiento de las Pandas UDFs?
3. ¿Cuándo deberías usar una función integrada en lugar de una UDF?
4. ¿Cómo se registra una UDF para usar en consultas Spark SQL?
5. ¿Para qué sirve `applyInPandas()`?
6. ¿Cómo se devuelve un struct desde una UDF?
7. ¿Qué sucede con el rendimiento de la UDF a medida que aumenta el tamaño del clúster?
8. ¿Cómo se manejan los valores nulos dentro de una UDF?
9. ¿Para qué sirve `PandasUDFType.GROUPED_AGG`?
10. ¿Por qué elegirías una Scala UDF sobre una Python UDF para producción?
