---
title: "Operações com DataFrame"
description: "Domine operações com DataFrame: select, filter, withColumn, drop, rename, distinct, sample com exemplos PySpark"
order: 8
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Operações com DataFrame

DataFrames fornecem um rico conjunto de operações para manipulação de dados. Essas operações são otimizadas pelo otimizador Catalyst e executadas através do motor Tungsten para máximo desempenho.

## Preparando Dados de Exemplo

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

Escolhe colunas específicas do DataFrame.

```python
# Selecionar coluna única
df.select("name").show()

# Selecionar múltiplas colunas
df.select("name", "age", "salary").show()

# Selecionar usando função col()
from pyspark.sql.functions import col
df.select(col("name"), col("salary") * 1.1).show()

# Selecionar todas as colunas
df.select("*").show()

# Selecionar com expressões
df.select(
    col("name"),
    col("salary"),
    (col("salary") / 12).alias("monthly_salary")
).show()
```

> [!NOTE]
> Usar a função `col()` é mais explícito e permite encadeamento de expressões de coluna. Nomes de coluna em string são convertidos para `col()` internamente.

## filter() / where()

Filtra linhas com base em uma condição.

```python
# Condição única
df.filter(col("age") > 30).show()
df.where(col("age") > 30).show()  # idêntico

# Múltiplas condições (AND)
df.filter((col("age") > 30) & (col("dept") == "Engineering")).show()

# Múltiplas condições (OR)
df.filter((col("dept") == "Design") | (col("dept") == "Marketing")).show()

# Expressões em string
df.filter("age > 30").show()
df.filter("age > 30 AND dept = 'Engineering'").show()

# isin para múltiplos valores
df.filter(col("city").isin("NY", "SF")).show()

# Padrões Like
df.filter(col("name").like("A%")).show()

# Negação
df.filter(~col("dept").isin("Engineering", "Design")).show()
```

> [!WARNING]
> Misturar os dois estilos de sintaxe (`df.filter("age > 30")` e `df.filter(col("age") > 30)`) na mesma expressão pode causar erros confusos. Escolha um estilo e seja consistente.

## withColumn()

Adiciona uma nova coluna ou substitui uma existente.

```python
# Adicionar uma coluna constante
df = df.withColumn("country", lit("USA"))
df.show()

# Derivar uma nova coluna de colunas existentes
df = df.withColumn(
    "bonus",
    col("salary") * 0.20
)
df.show()

# Coluna condicional com when/otherwise
df = df.withColumn(
    "salary_level",
    when(col("salary") > 130000, "High")
    .when(col("salary") > 100000, "Medium")
    .otherwise("Low")
)
df.show()

# Transformar coluna existente
df = df.withColumn(
    "name_upper",
    upper(col("name"))
)
df.show()

# Converter tipo de coluna
df = df.withColumn(
    "age_double",
    col("age").cast("double")
)
```

> [!NOTE]
> `withColumn()` não modifica o DataFrame original. Retorna um novo DataFrame com a coluna adicionada. DataFrames são imutáveis.

## drop()

Remove uma ou mais colunas do DataFrame.

```python
# Remover uma única coluna
df_no_bonus = df.drop("bonus")
df_no_bonus.show()

# Remover múltiplas colunas
df_clean = df.drop("country", "bonus", "salary_level")
df_clean.show()

# Remover colunas por condição
df_clean = df.drop(*[c for c in df.columns if c.startswith("name")])
```

## withColumnRenamed()

Renomeia uma coluna existente.

```python
# Renomear uma única coluna
df_renamed = df.withColumnRenamed("salary", "annual_salary")
df_renamed.show()

# Renomear múltiplas colunas
df_renamed = df \
    .withColumnRenamed("name", "employee_name") \
    .withColumnRenamed("dept", "department")
df_renamed.show()
```

## distinct() / dropDuplicates()

Remove linhas duplicadas.

```python
# Linhas distintas (todas as colunas)
df_distinct_dept = df.select("dept").distinct()
df_distinct_dept.show()

# Remover duplicatas baseado em subconjunto de colunas
df_cities = df.select("city").distinct()
df_cities.show()

# dropDuplicates com subconjunto
df_unique = df.dropDuplicates(["city", "dept"])
df_unique.show()
```

> [!SUCCESS]
> `dropDuplicates(["col1", "col2"])` é mais flexível que `distinct()`. Permite definir quais colunas determinam a unicidade enquanto mantém todos os outros valores de coluna da primeira linha correspondente.

## sample()

Retorna uma amostra aleatória dos dados.

```python
# Amostra aleatória (sem reposição)
sample_20 = df.sample(withReplacement=False, fraction=0.2)
sample_20.show()

# Amostra aleatória com semente (reproduzível)
sample_20 = df.sample(withReplacement=False, fraction=0.2, seed=42)

# Amostra com reposição
sample_over = df.sample(withReplacement=True, fraction=1.5)

# Amostragem fracionada por linha
weighted = df.sampleBy("dept", fractions={
    "Engineering": 0.5,
    "Design": 1.0,
    "Marketing": 0.75
}, seed=42)
```

## orderBy() / sort()

Ordena o DataFrame por uma ou mais colunas.

```python
# Ordenar ascendente (padrão)
df.orderBy("salary").show()
df.sort("salary").show()

# Ordenar descendente
df.orderBy(col("salary").desc()).show()
df.orderBy(col("salary").desc(), col("age").asc()).show()

# Usando função desc
from pyspark.sql.functions import desc
df.orderBy(desc("salary")).show()

# Expressão em string
df.sort("salary DESC").show()
```

## GroupBy e Agregação

```python
# Agrupar por departamento e contar
from pyspark.sql.functions import avg, max, min, sum, count

dept_stats = df.groupBy("dept").agg(
    count("*").alias("employee_count"),
    avg("salary").alias("avg_salary"),
    max("salary").alias("max_salary"),
    min("age").alias("min_age")
)
dept_stats.show()

# Múltiplas colunas de grupo
city_dept = df.groupBy("city", "dept").agg(
    sum("salary").alias("total_salary")
)
city_dept.show()
```

## Alias e Cast de Coluna

```python
# Alias para clareza
df.select(
    col("name").alias("Employee Name"),
    col("salary").cast("double").alias("Annual Compensation")
).show()

# Encadear operações
from pyspark.sql.types import DoubleType

df_processed = df \
    .withColumn("salary", col("salary").cast(DoubleType())) \
    .withColumn("bonus", col("salary") * 0.15) \
    .withColumnRenamed("salary", "base_salary") \
    .drop("country")
```

## Tabela Resumo de Operações

| Operação | Propósito | Retorna |
|---|---|---|
| `select()` | Escolher colunas | DataFrame |
| `filter()` / `where()` | Filtrar linhas por condição | DataFrame |
| `withColumn()` | Adicionar/substituir coluna | DataFrame |
| `drop()` | Remover colunas | DataFrame |
| `withColumnRenamed()` | Renomear coluna | DataFrame |
| `distinct()` | Linhas únicas | DataFrame |
| `dropDuplicates()` | Remover duplicatas por subconjunto | DataFrame |
| `sample()` | Amostragem aleatória | DataFrame |
| `orderBy()` / `sort()` | Ordenar linhas | DataFrame |
| `groupBy().agg()` | Agregação | DataFrame |

## Perguntas de Prática

1. Qual é a diferença entre `select("col1", "col2")` e `select(col("col1"), col("col2"))`?
2. Como você adiciona uma nova coluna derivada de colunas existentes?
3. Qual é a diferença entre `distinct()` e `dropDuplicates(["col1"])`?
4. Como você renomeia múltiplas colunas de uma vez?
5. Por que `withColumn()` é preferido em vez de atribuição direta de coluna?
6. Como você filtra com múltiplas condições (AND, OR)?
7. O que `sampleBy("dept", fractions={...}, seed=42)` faz?
8. Como você ordena em ordem descendente?
9. Qual é a diferença entre `filter` e `where`?
10. Como você remove uma coluna que contém valores nulos em um subconjunto específico?
