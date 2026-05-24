---
title: "Funções UDF"
description: "Crie User Defined Functions (UDFs), Pandas UDFs e entenda considerações de desempenho para funções personalizadas no Spark"
order: 2
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Funções UDF

Funções integradas do Spark cobrem muitos casos de uso, mas a lógica personalizada às vezes requer User Defined Functions (UDFs). Esta lição cobre UDFs regulares, Pandas UDFs vetorizadas e as compensações de desempenho entre elas.

## Quando Usar UDFs

| Cenário | Função Integrada Disponível? | Usar UDF? |
|---|---|---|
| Lógica condicional (if/else) | `when()` / `otherwise()` | Não |
| Manipulação simples de string | `substring`, `trim`, `regexp_extract` | Não |
| Regras de negócio complexas | Raramente | Sim |
| Cálculos de data personalizados | `datediff`, `add_months` | Raramente |
| Chamadas de bibliotecas externas | Não | Sim |
| Inferência de modelo ML por linha | Não | Sim |

> [!NOTE]
> Sempre verifique se existe uma função integrada antes de escrever uma UDF. Funções integradas executam na JVM do Spark e são muito mais rápidas que UDFs Python.

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

# Definir e registrar uma UDF
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
> UDFs Python regulares têm alta sobrecarga de serialização. Cada linha é serializada da JVM para Python, processada e serializada de volta. Isso pode ser 10-100x mais lento que funções integradas.

### UDF com Múltiplas Entradas

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

## Retornando Tipos Complexos de UDFs

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

# Retornar um struct
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

## Pandas UDFs (Vetorizadas)

Pandas UDFs processam lotes de linhas usando Apache Arrow para transferência de dados zero-copy. Elas são significativamente mais rápidas que UDFs regulares.

```python
import pandas as pd
from pyspark.sql.functions import pandas_udf

# Scalar Pandas UDF (entrada -> saída, uma linha entra, uma linha sai)
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
> Pandas UDFs usam Apache Arrow para transferência de dados zero-copy entre JVM e Python, eliminando a sobrecarga de serialização. Elas podem ser 10-100x mais rápidas que UDFs Python regulares.

### Pandas UDF com Múltiplas Colunas

```python
@pandas_udf(DoubleType())
def bonus_vectorized(salary: pd.Series, score: pd.Series) -> pd.Series:
    mult = pd.cut(score, bins=[0, 74, 89, 100], labels=[0.05, 0.15, 0.25],
                  include_lowest=True).astype(float)
    return salary * mult

perf_df.withColumn("bonus", bonus_vectorized("salary", "score")).show()
```

## Pandas UDFs de Map Agrupado

Padrão split-apply-combine: processa cada grupo como um DataFrame pandas.

```python
# Grouped apply — recebe todas as linhas de um grupo como um DataFrame pandas
@pandas_udf(perf_df.schema, PandasUDFType.GROUPED_MAP)
def rank_within_dept(pdf):
    pdf["rank"] = pdf["salary"].rank(ascending=False)
    return pdf

# Nota: No Spark 3.x+, use o padrão decorator
from pyspark.sql.functions import PandasUDFType

grouped = perf_df.groupby("dept").apply(rank_within_dept)
```

> [!NOTE]
> Grouped map UDFs foram atualizadas no Spark 3.x. Use `applyInPandas()` para controle mais explícito sobre o esquema de saída.

### applyInPandas

```python
# Definir esquemas de entrada e saída
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

## Pandas UDFs de Agregação Agrupada

```python
@pandas_udf(DoubleType(), PandasUDFType.GROUPED_AGG)
def median_salary(v):
    return v.median()

perf_df_with_dept.groupby("dept").agg(
    median_salary(col("salary")).alias("median_salary")
).show()
```

## Comparação de Desempenho

| Tipo UDF | Serialização | Velocidade | Caso de Uso |
|---|---|---|---|
| **UDF Python Regular** | Pickle (JVM <-> Python) | Lenta | Lógica simples, dados pequenos |
| **Pandas UDF (Scalar)** | Apache Arrow (zero-copy) | 10-100x mais rápida | Operações em lote em colunas |
| **Grouped Map Pandas UDF** | Arrow | Rápida | Lógica complexa por grupo |
| **Grouped Aggregate** | Arrow | Rápida | Agregações personalizadas |
| **Função Integrada** | Nenhuma (JVM nativa) | Mais rápida | Sempre preferir se disponível |

> [!WARNING]
> Mesmo com Pandas UDFs, há sobrecarga ao mover dados da JVM para Python. Para máximo desempenho, reescreva lógica crítica em Scala UDFs ou use funções integradas.

## Registrando UDFs para Spark SQL

```python
# Registrar para uso em consultas SQL
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

## Melhores Práticas

1. **Prefira funções integradas** sempre que possível
2. **Use Pandas UDFs** em vez de UDFs regulares para desempenho
3. **Minimize chamadas de UDF** — agrupe operações em uma UDF em vez de múltiplas
4. **Evite UDFs em limites de shuffle** quando possível
5. **Teste UDFs localmente** antes de executar em escala
6. **Defina `spark.sql.execution.arrow.pyspark.enabled=true`** para Pandas UDFs

## Perguntas de Prática

1. Qual é a diferença de desempenho entre UDFs regulares e Pandas UDFs?
2. Como o Apache Arrow melhora o desempenho das Pandas UDFs?
3. Quando você deve usar uma função integrada em vez de uma UDF?
4. Como você registra uma UDF para uso em consultas Spark SQL?
5. Para que serve `applyInPandas()`?
6. Como você retorna um struct de uma UDF?
7. O que acontece com o desempenho da UDF à medida que o tamanho do cluster aumenta?
8. Como você lida com valores nulos dentro de uma UDF?
9. Para que serve `PandasUDFType.GROUPED_AGG`?
10. Por que você escolheria uma Scala UDF em vez de uma Python UDF para produção?
