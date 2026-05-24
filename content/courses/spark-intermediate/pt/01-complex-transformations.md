---
title: "Transformações Complexas"
description: "Domine when/otherwise, tipos aninhados (struct, array, map), explode e split para manipulação avançada de dados"
order: 1
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Transformações Complexas

Desenvolvedores Spark intermediários devem lidar com dados semiestruturados e aninhados. Esta lição cobre lógica condicional, tipos complexos e manipulações de array essenciais para pipelines ETL do mundo real.

## Lógica Condicional com when/otherwise

`when()` e `otherwise()` fornecem lógica condicional nativa do DataFrame similar ao `CASE WHEN` do SQL.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import when, col, lit

spark = SparkSession.builder.appName("ComplexTransformations").master("local[*]").getOrCreate()

data = [
    ("Alice", 120000), ("Bob", 90000), ("Charlie", 150000),
    ("Diana", 75000), ("Eve", 130000), ("Frank", 50000)
]
df = spark.createDataFrame(data, ["name", "salary"])

# Condição única
df.withColumn("level", when(col("salary") >= 100000, "Senior")
    .otherwise("Junior")).show()

# Múltiplas condições
df.withColumn("level", when(col("salary") >= 130000, "Lead")
    .when(col("salary") >= 100000, "Senior")
    .when(col("salary") >= 70000, "Mid")
    .otherwise("Junior")).show()

# Condições complexas com AND/OR
df.withColumn("category", when((col("salary") >= 100000) & (col("name") != "Charlie"), "High")
    .when(col("salary") < 70000, "Low")
    .otherwise("Medium")).show()
```

> [!NOTE]
> As condições `when()` são avaliadas em ordem. A primeira condição correspondente vence. Coloque as condições mais específicas primeiro.

## Condições de Múltiplas Colunas

```python
from pyspark.sql.functions import when, col, lit

# when aninhado
df.withColumn("range", when(col("salary").between(70000, 100000), "Mid-Range")
    .otherwise(when(col("salary") < 70000, "Entry").otherwise("Top"))).show()

# Usando when em select
df.select(
    col("name"),
    col("salary"),
    when(col("salary") > 100000, "High").otherwise("Standard").alias("tier")
).show()
```

## Tipo Struct

Um `struct` agrupa múltiplos campos em uma única coluna, similar a um registro aninhado.

```python
from pyspark.sql.functions import struct

# Criar uma coluna struct
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

# Acessar campos struct
df_with_address.select(
    col("name"),
    col("address.city"),
    col("address.state")
).show()

# Sintaxe alternativa
df_with_address.select("name", "address.city", "address.state").show()
```

> [!SUCCESS]
> Tipos struct são a base para trabalhar com dados JSON e Parquet aninhados. Eles modelam relações hierárquicas sem exigir tabelas separadas.

### Criando Structs a partir de Colunas Existentes

```python
# Agrupar colunas existentes em um struct
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

Arrays armazenam sequências de elementos do mesmo tipo.

```python
from pyspark.sql.functions import array, split, col

# Criar uma coluna array
skills_data = [
    ("Alice", ["Python", "Spark", "SQL"]),
    ("Bob", ["Java", "Kubernetes"]),
    ("Charlie", ["R", "Python", "TensorFlow", "PyTorch"])
]
skills_df = spark.createDataFrame(skills_data, ["name", "skills"])
skills_df.show(truncate=False)

# Criar arrays a partir de colunas
df.withColumn("nums", array(lit(1), lit(2), lit(3))).show()

# Dividir string em array
df.withColumn("name_chars", split(col("name"), "")).show(truncate=False)
```

## Explode

`explode()` transforma cada elemento do array em uma linha separada.

```python
from pyspark.sql.functions import explode

# Explodir array de habilidades
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

# Contar habilidades por pessoa
exploded.groupBy("name").agg(count("skill").alias("skill_count")).show()
```

> [!WARNING]
> `explode()` multiplica a contagem de linhas. Se um array tem 1000 elementos, cada linha original se torna 1000 linhas. Para arrays grandes, isso pode causar explosão de dados.

### Variantes de Explode

```python
from pyspark.sql.functions import explode_outer, posexplode, posexplode_outer

# explode_outer — inclui nulos (explode descarta arrays nulos)
data_with_null = [
    ("Alice", ["Python", "SQL"]),
    ("Bob", None),
    ("Charlie", ["Scala"])
]
null_df = spark.createDataFrame(data_with_null, ["name", "skills"])

null_df.select("name", explode_outer("skills").alias("skill")).show()
# Bob aparece com skill nulo (explode descartaria Bob)

# posexplode — inclui índice de posição
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

Maps armazenam pares chave-valor onde as chaves são strings e os valores são de um único tipo.

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

# Acessar valores do map
map_df.select(
    col("name"),
    col("experience_years")["Python"].alias("python_years")
).show()

# Chaves e valores do map
map_df.select(
    col("name"),
    map_keys(col("experience_years")).alias("skills"),
    map_values(col("experience_years")).alias("years")
).show(truncate=False)

# Criar map a partir de colunas
df.withColumn("config", create_map(
    lit("base"), col("salary"),
    lit("bonus"), col("salary") * 0.15
)).show(truncate=False)
```

## Funções de Array

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

## Transformações Aninhadas Complexas

```python
# Mundo real: Analisar logs JSON aninhados
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, ArrayType

json_data = """
{"user": "Alice", "events": [{"type": "click", "page": "/home", "ts": 100}, {"type": "view", "page": "/about", "ts": 200}]}
{"user": "Bob", "events": [{"type": "click", "page": "/pricing", "ts": 150}]}
""".strip().split("\n")

logs_df = spark.read.json(sc.parallelize(json_data))

# Explodir eventos
events_df = logs_df.select(
    col("user"),
    explode(col("events")).alias("event")
)

# Extrair detalhes do evento
events_df.select(
    col("user"),
    col("event.type"),
    col("event.page"),
    col("event.ts")
).show()
```

## Perguntas de Prática

1. Como `when()` difere do `if-elif-else` do Python na execução?
2. Qual é a diferença entre `explode()` e `explode_outer()`?
3. Como você acessa campos dentro de uma coluna struct?
4. Quando você usaria `posexplode()` em vez de `explode()`?
5. Como você cria uma coluna map a partir de colunas existentes?
6. O que acontece com linhas com arrays nulos ao usar `explode()` vs `explode_outer()`?
7. Como você encontra o comprimento de uma coluna array?
8. Qual é a diferença entre `array_union` e `array_distinct`?
9. Como você extrai uma fatia de elementos de um array?
10. Escreva uma transformação que divide uma string separada por vírgulas, explode e agrupa por valor.
