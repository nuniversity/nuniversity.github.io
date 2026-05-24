---
title: "Agregações Avançadas"
description: "Domine groupBy com agg, múltiplas agregações, pivot, rollup e cube para análise avançada de dados"
order: 3
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Agregações Avançadas

`groupBy` básico com `count()` apenas arranha a superfície. Spark fornece capacidades poderosas de agregação incluindo múltiplas métricas por grupo, pivot e análise multidimensional com rollup e cube.

## GroupBy com Múltiplas Agregações

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

# Múltiplas agregações
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
> Você pode passar qualquer número de expressões de agregação para `agg()`. Cada uma recebe seu próprio alias para nomenclatura limpa de colunas.

## Agregação com Filtragem

```python
# Agregação condicional (contar apenas linhas correspondentes)
dept_condition = df.groupBy("dept").agg(
    count("*").alias("total"),
    count(when(col("salary") > 100000, 1)).alias("high_earners"),
    sum(when(col("city") == "NY", col("salary"))).alias("ny_salary_total"),
    avg(when(col("city") == "SF", col("salary"))).alias("sf_avg_salary")
)
dept_condition.show()
```

## Usando agg com Dicionário

```python
# Expressões de agregação como dict
from pyspark.sql.functions import expr

agg_exprs = {
    "salary": ["count", "sum", "avg", "max", "min"],
    "name": "count"
}

dept_stats_dict = df.groupBy("dept").agg(agg_exprs)
dept_stats_dict.show()
```

> [!WARNING]
> Agregação baseada em dict produz nomes de coluna multinível como `salary_sum`, `salary_avg`. Use a API baseada em expressão para nomenclatura mais limpa.

## Coletando Valores

```python
# Coletar nomes por departamento como listas
dept_names = df.groupBy("dept").agg(
    collect_list("name").alias("names_list"),
    collect_set("name").alias("names_set"),
    collect_list("salary").alias("salaries")
)
dept_names.show(truncate=False)
```

> [!SUCCESS]
> `collect_list()` e `collect_set()` são inestimáveis para criar arrays prontos para JSON para sistemas downstream como Elasticsearch ou Kafka.

## Agrupando por Múltiplas Colunas

```python
# Group by multi-coluna
city_dept = df.groupBy("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

city_dept.show()
```

## Pivot

`pivot()` transforma valores únicos de uma coluna em colunas separadas.

```python
# Pivot simples — departamentos como colunas, salário médio como valores
pivot_df = df.groupBy("city").pivot("dept").agg(avg("salary"))
pivot_df.show()
# +----+--------+-------+---------+
# |city|  Design|Engineer|Marketing|
# +----+--------+-------+---------+
# |  LA| 95000.0|125000.0|     null|
# |  NY|    null|135000.0| 110000.0|
# |  SF| 90000.0|   null |  80000.0|
# +----+--------+-------+---------+

# Pivot com valores especificados (mais eficiente)
pivot_specified = df.groupBy("city").pivot("dept", ["Engineering", "Design", "Marketing"]).agg(avg("salary"))

# Múltiplas agregações em pivot
pivot_multi = df.groupBy("city").pivot("dept").agg(
    avg("salary").alias("avg_salary"),
    sum("salary").alias("total_salary")
)
pivot_multi.show()
```

> [!NOTE]
> `pivot()` com uma lista especificada de valores é mais eficiente porque o Spark não precisa escanear todos os valores distintos primeiro. Sem isso, o Spark executa uma consulta extra para descobrir valores únicos.

### Pivot com Agregações Complexas

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

`rollup()` cria subtotais e totais gerais ao longo de uma hierarquia.

```python
# Rollup: hierarquia de (city, dept)
rollup_df = df.rollup("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

rollup_df.show()
# +----+-----------+-----+----------+
# |city|       dept|count|avg_salary|
# +----+-----------+-----+----------+
# |null|       null|    8|  125625.0|  <- total geral
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

# Subtotais de cidade e total geral
rollup_df.filter(col("dept").isNull()).show()
```

> [!WARNING]
> Resultados de rollup incluem valores `null` para representar linhas de subtotal. Filtrar por `null` na coluna sendo rolada identifica linhas de subtotal. Cuidado para não confundir nulos reais de dados com nulos de subtotal.

## Cube

`cube()` gera todas as combinações possíveis de colunas de agrupamento (tabulação cruzada).

```python
# Cube: todas as combinações de (city, dept)
cube_df = df.cube("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

cube_df.show()
# +----+-----------+-----+----------+
# |city|       dept|count|avg_salary|
# +----+-----------+-----+----------+
# |null|       null|    8|  125625.0|  <- total geral
# |null|     Design|    2|   92500.0|  <- Design em todas cidades
# |null|Engineering|    4|  132500.0|  <- Engineering em todas cidades
# |null|  Marketing|    2|   95000.0|  <- Marketing em todas cidades
# |  LA|       null|    2|  110000.0|  <- subtotal LA
# |  LA|     Design|    1|   95000.0|
# |  LA|Engineering|    1|  125000.0|
# |  NY|       null|    4|  128750.0|  <- subtotal NY
# ...
```

### Rollup vs Cube

| Aspecto | Rollup | Cube |
|---|---|---|
| **Agrupamentos** | Subtotais hierárquicos + total geral | Todas as combinações |
| **Número de grupos** | N+1 onde N é profundidade da hierarquia | 2^N onde N é contagem de colunas |
| **Caso de uso** | Hierarquias de data (ano > mês > dia) | Cubos OLAP multidimensionais |
| **Desempenho** | Mais rápido (menos grupos) | Mais lento (grupos exponenciais) |
| **Linhas resultantes** | 1 + soma das cardinalidades | Produto de todas as combinações de nível |

## Grouping Sets

`GROUPING SETS` do SQL para controle explícito sobre combinações de subtotais.

```python
# Equivalente a cube mas com conjuntos explícitos
from pyspark.sql.functions import expr

grouping_sets = df.groupBy("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).groupBy("city", "dept")  # Não disponível diretamente na API DataFrame

# Usar SQL em vez disso
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

## Funções de Janela de Agregação

```python
from pyspark.sql.window import Window

# Total acumulado por departamento
window_spec = Window.partitionBy("dept").orderBy("salary")

df.withColumn("running_total", sum("salary").over(window_spec)) \
  .withColumn("rank", rank().over(window_spec)) \
  .show()
```

> [!NOTE]
> Funções de janela são cobertas em profundidade na lição de Spark SQL Avançado. Elas complementam agregações groupBy permitindo cálculos por grupo sem colapsar linhas.

## Dicas de Desempenho

1. **Especifique valores de pivot** para evitar a varredura extra de valores distintos
2. **Use `approx_count_distinct()`** em vez de `countDistinct()` em grandes conjuntos de dados
3. **Evite cube** em colunas de alta cardinalidade (explosão exponencial)
4. **Use `rollup`** para agregações hierárquicas que correspondem a hierarquias de negócio
5. **Filtre após a agregação**, não antes, a menos que o filtro reduza o tamanho do shuffle

## Perguntas de Prática

1. Como você computa múltiplas agregações (count, sum, avg) em um `groupBy`?
2. Qual é a diferença entre `rollup` e `cube`?
3. Quando você usaria `pivot()` e como especificar valores para eficiência?
4. Como você identifica linhas de subtotal em um resultado de rollup?
5. O que acontece se você fizer pivot em uma coluna com alta cardinalidade (milhares de valores)?
6. Como `collect_list()` e `collect_set()` diferem?
7. O que `GROUPING SETS` realiza que `cube` não pode?
8. Por que especificar valores de pivot explicitamente?
9. Como você agrega condicionalmente (por exemplo, salário médio apenas para NY)?
10. Qual é a compensação de desempenho entre `cube` e `rollup`?
