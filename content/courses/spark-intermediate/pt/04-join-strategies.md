---
title: "Estratégias de Join"
description: "Entenda tipos de join (inner, outer, semi, anti), broadcast hash join, sort merge join e tratamento de skew join"
order: 4
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Estratégias de Join

Joins estão entre as operações mais caras no Spark. Escolher a estratégia de join correta pode significar a diferença entre um pipeline que executa em minutos versus um que falha com erros OOM. Esta lição cobre tipos de join, estratégias físicas de join e técnicas de otimização.

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

Retorna linhas onde as chaves correspondem em ambos os DataFrames.

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

Retorna todas as linhas do DataFrame esquerdo, com nulos onde o lado direito está faltando.

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

Retorna todas as linhas do DataFrame direito.

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

Retorna todas as linhas de ambos os DataFrames.

```python
full = employees.join(salaries, on="emp_id", how="full")
full.orderBy("emp_id").show()
```

### Left Semi Join

Retorna linhas do DataFrame esquerdo que têm correspondência no direito. Nenhuma coluna do lado direito é incluída.

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
# (Eve excluída porque emp_id 5 não tem registro de salário)
```

> [!SUCCESS]
> `left_semi` é a maneira mais eficiente de filtrar um DataFrame pela existência de chaves em outro. Evita embaralhar colunas do lado direito.

### Left Anti Join

Retorna linhas do DataFrame esquerdo que **não** têm correspondência no direito.

```python
anti = employees.join(salaries, on="emp_id", how="left_anti")
anti.show()
# +------+----+----+
# |emp_id|name|dept|
# +------+----+----+
# |     5| Eve|null|
# +------+----+----+
```

## Estratégias Físicas de Join

O planejador de consultas do Spark seleciona uma estratégia de join com base em estatísticas, dicas e configuração.

### Broadcast Hash Join (BHJ)

Para tabelas pequenas (padrão < 10 MB), Spark transmite a tabela inteira para todos os executores.

```python
from pyspark.sql.functions import broadcast

# Forçar dica de broadcast
small_df = salaries  # Assumindo que é pequeno
result = employees.join(broadcast(small_df), "emp_id", "inner")
result.explain()
# == Physical Plan ==
# BroadcastHashJoin ...
```

| Propriedade | Valor |
|---|---|
| **Melhor para** | Uma tabela pequena o suficiente para caber na memória do executor |
| **Sem shuffle** para a tabela pequena | Transmitida uma vez para todos os executores |
| **Limite** | `spark.sql.autoBroadcastJoinThreshold` (padrão 10 MB) |
| **Risco** | Transmitir uma tabela grande causa OOM ou gargalo no driver |

> [!NOTE]
> Para desabilitar broadcast join para uma consulta específica, defina `spark.sql.autoBroadcastJoinThreshold=-1` ou use as dicas `/*+ BROADCAST(t) */` e `/*+ NO_BROADCAST(t) */`.

### Sort Merge Join (SMJ)

Padrão para tabelas grandes. Ambos os lados são ordenados e mesclados.

```python
# Definir para preferir sort merge join
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", -1)

large_df1 = spark.range(1, 1000000)
large_df2 = spark.range(1, 1000000)

result = large_df1.join(large_df2, "id")
result.explain()
# == Physical Plan ==
# SortMergeJoin ...
```

| Propriedade | Valor |
|---|---|
| **Melhor para** | Tabelas grandes (ambos os lados) |
| **Requer** | Ordenação de ambos os lados pela chave de join |
| **Shuffle** | Ambos os lados embaralhados pela chave de join |
| **Escala para** | Qualquer tamanho (suportado por disco) |

### Shuffled Hash Join

Como SMJ mas usa hashing em vez de ordenação. Habilitado quando `spark.sql.join.preferSortMergeJoin=false`.

```python
spark.conf.set("spark.sql.join.preferSortMergeJoin", false)
```

### Broadcast Nested Loop Join

Fallback quando não há condição equi-join (cross join ou condição complexa).

```python
# Cross join (produto cartesiano)
cross = employees.crossJoin(salaries)
cross.show()

# Com condição não-equi
from pyspark.sql.functions import col
result = employees.alias("e").join(
    salaries.alias("s"),
    col("e.emp_id") < col("s.emp_id"),
    "inner"
)
```

> [!WARNING]
> Cross joins geram N×M linhas. Com dois conjuntos de 1 milhão de linhas cada, isso é 1 trilhão de linhas. Evite cross joins em dados grandes.

## Tratamento de Skew Join

Skew de dados — onde uma chave tem desproporcionalmente muitos valores — pode causar tarefas de longa cauda.

```python
# Verificar skew
skew_check = df.groupBy("join_key").agg(count("*").alias("cnt")) \
    .orderBy(col("cnt").desc())
skew_check.show(10)

# Habilitar otimização de skew join (Spark 3.x)
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")
```

> [!NOTE]
> O Adaptive Query Execution (AQE) do Spark 3.x pode detectar e dividir automaticamente partições distorcidas durante o join. Esta é uma grande melhoria em relação ao Spark 2.x, onde o skew tinha que ser tratado manualmente.

### Tratamento Manual de Skew

```python
# Salgar a chave distorcida (adicionar sufixo aleatório para dividir entre partições)
from pyspark.sql.functions import rand, concat, floor

skewed_key = "NY"

# Salgando o lado grande
salted_large = large_df \
    .withColumn("salt", (rand() * 10).cast("int")) \
    .withColumn("salted_key", concat(col("key"), lit("_"), col("salt")))

# Duplicando o lado pequeno
from pyspark.sql.functions import explode, array, lit

salted_small = small_df \
    .withColumn("salt", explode(array([lit(i) for i in range(10)]))) \
    .withColumn("salted_key", concat(col("key"), lit("_"), col("salt")))

# Join nas chaves salgadas e depois deduplicar
result = salted_large.join(salted_small, "salted_key").drop("salt")
```

## Resumo de Desempenho de Join

| Estratégia | Tabela Pequena | Tabela Grande | Shuffle | Memória |
|---|---|---|---|---|
| **Broadcast Hash** | < 10 MB | Qualquer tamanho | Nenhum (pequena transmitida) | Tabela pequena em cada executor |
| **Sort Merge** | Qualquer | Qualquer | Ambos os lados ordenados | Mínima (stream do disco) |
| **Shuffled Hash** | Qualquer | Qualquer | Ambos os lados hash | Um lado na tabela hash |
| **Broadcast Nested Loop** | < 10 MB | Qualquer | Nenhum | Alta (memória cross join) |

## Melhores Práticas

1. **Filtre antes de fazer join** para reduzir o volume de dados
2. **Selecione apenas colunas necessárias** antes do join
3. **Transmita tabelas pequenas** explicitamente com `broadcast()`
4. **Use `left_semi`** em vez de inner join quando você só precisa de colunas do lado esquerdo
5. **Monitore skew** usando os detalhes de estágio da Spark UI
6. **Habilite AQE** (`spark.sql.adaptive.enabled=true`) para tratamento automático de skew
7. **Evite produtos cartesianos** (cross joins)

## Perguntas de Prática

1. Quais são os cinco principais tipos de join no Spark?
2. Como `left_semi` difere de um inner join?
3. Quando o Spark escolhe broadcast hash join em vez de sort merge join?
4. Qual é o limite padrão de broadcast e como alterá-lo?
5. Como o sort merge join funciona internamente?
6. O que causa skew de dados e como isso afeta o desempenho do join?
7. Como o Adaptive Query Execution (AQE) lida com joins distorcidos?
8. O que é salting e quando você usaria?
9. Por que um cross join é perigoso em grandes conjuntos de dados?
10. Como você pode forçar um broadcast join usando uma dica?
