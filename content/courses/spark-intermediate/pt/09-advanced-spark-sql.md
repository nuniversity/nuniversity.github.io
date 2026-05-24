---
title: "Spark SQL Avançado"
description: "Domine técnicas avançadas de SQL: funções janela, subconsultas, hints de broadcast, agregações complexas e otimização de consultas"
order: 9
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Spark SQL Avançado

Spark SQL oferece todo o poder do SQL ANSI com integração de otimizador. Esta lição cobre funções janela, subconsultas, hints de consulta e padrões avançados para análise de dados.

## Funções Janela

Funções janela realizam cálculos através de linhas relacionadas à linha atual sem colapsar o conjunto de resultados.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("AdvancedSparkSQL") \
    .master("local[*]") \
    .getOrCreate()

data = [
    ("Alice", "Engineering", "NY", 120000, "2024-01-15"),
    ("Bob", "Design", "SF", 90000, "2024-02-20"),
    ("Charlie", "Engineering", "NY", 150000, "2024-01-10"),
    ("Diana", "Marketing", "SF", 80000, "2024-03-05"),
    ("Eve", "Engineering", "NY", 135000, "2024-02-01"),
    ("Frank", "Design", "LA", 95000, "2024-01-20"),
    ("Grace", "Marketing", "NY", 110000, "2024-02-15"),
    ("Henry", "Engineering", "LA", 125000, "2024-03-01")
]

df = spark.createDataFrame(data, ["name", "dept", "city", "salary", "start_date"])
df.createOrReplaceTempView("employees")
```

### Funções de Ranqueamento

```python
# RANK, DENSE_RANK, ROW_NUMBER
ranking = spark.sql("""
    SELECT name, dept, salary,
           ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) as row_num,
           RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rank,
           DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as dense_rank,
           NTILE(4) OVER (PARTITION BY dept ORDER BY salary DESC) as quartile
    FROM employees
""")
ranking.show()
```

| Função | Comportamento | Tratamento de Duplicatas |
|---|---|---|
| `ROW_NUMBER()` | Número sequencial, sem empates | Números diferentes para valores iguais |
| `RANK()` | Mesmo ranking para valores iguais, com saltos | 1, 2, 2, 4 |
| `DENSE_RANK()` | Mesmo ranking para valores iguais, sem saltos | 1, 2, 2, 3 |
| `NTILE(n)` | Divide em n buckets | Distribuição uniforme |

> [!SUCCESS]
> `ROW_NUMBER()` é ideal para deduplicação (manter a primeira ocorrência). `RANK()` e `DENSE_RANK()` são melhores para consultas tipo ranking onde empates importam.

### Funções Janela de Agregação

```python
# Totais acumulados e médias móveis
aggregate_window = spark.sql("""
    SELECT name, dept, salary, start_date,
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date) as running_total,
           AVG(salary) OVER (PARTITION BY dept ORDER BY start_date 
                             ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) as moving_avg_2,
           MAX(salary) OVER (PARTITION BY dept) as dept_max,
           MIN(salary) OVER (PARTITION BY dept) as dept_min,
           salary - AVG(salary) OVER (PARTITION BY dept) as diff_from_avg
    FROM employees
    ORDER BY dept, start_date
""")
aggregate_window.show()
```

### Especificações de Moldura de Janela

```python
# Diferentes tipos de moldura
frames = spark.sql("""
    SELECT name, dept, salary, start_date,
           -- Padrão: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date) as default_frame,
           -- ROWS: linhas físicas
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date
                             ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) as sliding_window,
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date
                             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as whole_partition,
           -- RANGE: linhas lógicas por valor
           SUM(salary) OVER (PARTITION BY dept ORDER BY salary
                             RANGE BETWEEN 10000 PRECEDING AND CURRENT ROW) as within_range
    FROM employees
    ORDER BY dept, start_date
""")
frames.show()
```

> [!NOTE]
> `ROWS` opera em deslocamentos físicos de linhas. `RANGE` opera em faixas de valores. `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` inclui a linha atual mais uma antes e uma depois. `RANGE BETWEEN 1000 PRECEDING AND CURRENT ROW` inclui todas as linhas cujo valor está dentro de 1000 do valor da linha atual.

## Subconsultas

### Subconsultas Correlacionadas

```python
# Funcionários que ganham mais que a média do departamento
correlated = spark.sql("""
    SELECT e1.name, e1.dept, e1.salary
    FROM employees e1
    WHERE e1.salary > (
        SELECT AVG(e2.salary)
        FROM employees e2
        WHERE e2.dept = e1.dept
    )
    ORDER BY salary DESC
""")
correlated.show()

# Subconsulta EXISTS
exists_query = spark.sql("""
    SELECT DISTINCT dept
    FROM employees e1
    WHERE EXISTS (
        SELECT 1 FROM employees e2
        WHERE e2.dept = e1.dept
        AND e2.salary > 120000
    )
""")
exists_query.show()

# NOT EXISTS (encontrar departamentos sem funcionários de alta renda)
not_exists = spark.sql("""
    SELECT DISTINCT dept
    FROM employees e1
    WHERE NOT EXISTS (
        SELECT 1 FROM employees e2
        WHERE e2.dept = e1.dept AND e2.salary > 130000
    )
""")
not_exists.show()
```

### Subconsultas Escalares

```python
# Subconsulta em SELECT
scalar = spark.sql("""
    SELECT name, salary,
           salary / (SELECT AVG(salary) FROM employees) as ratio_to_overall,
           salary / (SELECT AVG(salary) FROM employees 
                     WHERE dept = e.dept) as ratio_to_dept
    FROM employees e
""")
scalar.show()

# Subconsulta em WHERE com IN
in_subquery = spark.sql("""
    SELECT name, dept, salary
    FROM employees
    WHERE dept IN (
        SELECT dept
        FROM employees
        GROUP BY dept
        HAVING AVG(salary) > 100000
    )
""")
in_subquery.show()
```

> [!WARNING]
> Subconsultas correlacionadas podem ser lentas em grandes conjuntos de dados porque podem executar por linha. O otimizador do Spark frequentemente as reescreve como joins. Verifique com `explain()`.

## Hints de Consulta

### Hints de Broadcast

```python
# Forçar broadcast hash join
broadcast_hint = spark.sql("""
    SELECT /*+ BROADCAST(small) */
           l.*, s.description
    FROM large_table l
    JOIN small_table s ON l.key = s.key
""")

# Múltiplos hints de broadcast
broadcast_multi = spark.sql("""
    SELECT /*+ BROADCAST(s1, s2) */
           l.*, s1.desc1, s2.desc2
    FROM large l
    JOIN small1 s1 ON l.key1 = s1.key
    JOIN small2 s2 ON l.key2 = s2.key
""")
```

### Outros Hints de Consulta

```python
# Hint de reparticionamento
repartition_hint = spark.sql("""
    SELECT /*+ REPARTITION(100) */
           *
    FROM large_table
""")

# Hint de coalescência
coalesce_hint = spark.sql("""
    SELECT /*+ COALESCE(10) */
           *
    FROM large_table
""")

# Hint de shuffle hash join
shuffle_hint = spark.sql("""
    SELECT /*+ SHUFFLE_HASH(large) */
           l.*, s.*
    FROM large_table l
    JOIN small_table s ON l.key = s.key
""")

# Hint de merge join
merge_hint = spark.sql("""
    SELECT /*+ MERGE(large, big) */
           *
    FROM large_table l
    JOIN big_table b ON l.key = b.key
""")
```

> [!NOTE]
> Hints são consultivos, não obrigatórios. O otimizador do Spark pode ignorá-los se determinar um plano melhor. Use `explain()` para verificar se o hint foi aplicado.

## Padrões de Agregação Complexa

```python
# Agregações cumulativas com janelas
cumulative = spark.sql("""
    SELECT dept,
           salary,
           SUM(salary) OVER (PARTITION BY dept ORDER BY salary
                             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total,
           salary - LAG(salary, 1, 0) OVER (PARTITION BY dept ORDER BY salary) as diff_from_prev,
           salary - LEAD(salary, 1, 0) OVER (PARTITION BY dept ORDER BY salary) as diff_to_next,
           FIRST_VALUE(salary) OVER (PARTITION BY dept ORDER BY salary) as first_in_dept,
           LAST_VALUE(salary) OVER (PARTITION BY dept ORDER BY salary
                                    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_in_dept
    FROM employees
    ORDER BY dept, salary
""")
cumulative.show()

# Agregação condicional com cláusula FILTER
conditional = spark.sql("""
    SELECT dept,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE salary > 120000) as high_earners,
           AVG(salary) FILTER (WHERE city = 'NY') as ny_avg_salary,
           AVG(salary) FILTER (WHERE city = 'SF') as sf_avg_salary
    FROM employees
    GROUP BY dept
""")
conditional.show()
```

## Gerenciamento de Views e Tabelas

```python
# View temporária
df.createOrReplaceTempView("employees")
spark.sql("SELECT * FROM employees").show()

# View temporária global (visível entre sessões)
df.createGlobalTempView("global_employees")
spark.sql("SELECT * FROM global_temp.global_employees").show()

# Tabela Hive persistente (requer suporte Hive)
spark.sql("""
    CREATE TABLE IF NOT EXISTS analytics.employees
    USING parquet
    PARTITIONED BY (dept)
    AS SELECT * FROM employees
""")

# Descrever view
spark.sql("DESCRIBE employees").show()
spark.sql("SHOW TABLES").show()
```

## Otimização de Desempenho com SQL

```python
# Verificar plano de consulta
spark.sql("SELECT * FROM employees WHERE salary > 100000").explain(True)

# Cachear tabelas populares
spark.sql("CACHE TABLE employees")
spark.sql("CACHE TABLE departments")

# Descachear quando terminar
spark.sql("UNCACHE TABLE employees")

# Definir configurações de sessão
spark.sql("SET spark.sql.adaptive.enabled=true")
spark.sql("SET spark.sql.shuffle.partitions=50")
```

## Perguntas de Prática

1. Qual é a diferença entre `ROW_NUMBER()`, `RANK()` e `DENSE_RANK()`?
2. Como você calcula uma média móvel de 7 dias usando funções janela?
3. Qual é a diferença entre `ROWS` e `RANGE` em uma moldura de janela?
4. Como uma subconsulta correlacionada difere de uma subconsulta regular?
5. O que o hint `/*+ BROADCAST(t) */` faz?
6. Como você encontra os 3 funcionários mais bem pagos por departamento?
7. Para que serve `NTILE(10)`?
8. Como você calcula um total acumulado com uma função janela?
9. Quando você usaria `LAST_VALUE()` com `UNBOUNDED FOLLOWING`?
10. Como você verifica se o otimizador aplicou seu hint?
