---
title: "Fundamentos do Spark SQL"
description: "Use SparkSession.sql(), crie visualizações temporárias e execute consultas SQL em DataFrames para análise de dados poderosa"
order: 9
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Fundamentos do Spark SQL

Spark SQL permite consultar dados estruturados usando SQL padrão. Ele preenche a lacuna entre DataFrames programáticos e análise SQL tradicional, permitindo que analistas e engenheiros de dados usem a mesma linguagem para exploração e pipelines de produção.

## Por que Spark SQL?

| Vantagem | Descrição |
|---|---|
| **Sintaxe familiar** | Conhecimento SQL transfere diretamente |
| **Otimização** | Otimizador Catalyst funciona igual à API DataFrame |
| **Interoperabilidade** | Misture operações SQL e DataFrame em um pipeline |
| **Suporte a ferramentas** | Ferramentas de BI (Tableau, Power BI) conectam via JDBC/ODBC |
| **Desempenho** | Mesmo motor de execução Tungsten |

## Criando Visualizações Temporárias

Uma visualização temporária registra um DataFrame como uma tabela SQL dentro da sessão Spark.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("SparkSQL") \
    .master("local[*]") \
    .getOrCreate()

# Criar um DataFrame
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

# Registrar como visualização temporária
df.createOrReplaceTempView("employees")
```

> [!NOTE]
> `createOrReplaceTempView()` cria uma visualização temporária com escopo de sessão. Não é compartilhada entre sessões e desaparece quando a SparkSession para. Use `createGlobalTempView()` para compartilhamento entre sessões.

## Executando Consultas SQL

```python
# SELECT simples
result = spark.sql("SELECT * FROM employees")
result.show()

# Filtragem
engineers = spark.sql("""
    SELECT name, age, salary
    FROM employees
    WHERE dept = 'Engineering'
    ORDER BY salary DESC
""")
engineers.show()

# Agregação
dept_stats = spark.sql("""
    SELECT dept,
           COUNT(*) as emp_count,
           ROUND(AVG(salary), 0) as avg_salary,
           MAX(salary) as max_salary
    FROM employees
    GROUP BY dept
    ORDER BY avg_salary DESC
""")
dept_stats.show()
```

> [!SUCCESS]
> Consultas Spark SQL passam pelo mesmo otimizador Catalyst que as operações DataFrame. Uma consulta escrita em SQL e uma consulta escrita com a API DataFrame produzem planos de execução idênticos.

## Combinando SQL e APIs DataFrame

Você pode transitar perfeitamente entre operações SQL e DataFrame.

```python
# Começar com SQL
high_earners = spark.sql("""
    SELECT name, salary, dept
    FROM employees
    WHERE salary > 100000
""")

# Continuar com API DataFrame
high_earners_with_bonus = high_earners \
    .withColumn("bonus", high_earners.salary * 0.2) \
    .withColumn("total", high_earners.salary * 1.2)

high_earners_with_bonus.createOrReplaceTempView("high_earners")

# Voltar ao SQL para análise final
final = spark.sql("""
    SELECT dept,
           COUNT(*) as count,
           ROUND(AVG(total), 0) as avg_total
    FROM high_earners
    GROUP BY dept
""")
final.show()
```

## Criando Visualizações de Diferentes Fontes

```python
# De CSV
df_csv = spark.read.option("header", "true").csv("data/employees.csv")
df_csv.createOrReplaceTempView("employees_csv")

# De JSON
df_json = spark.read.json("data/employees.json")
df_json.createOrReplaceTempView("employees_json")

# De múltiplas visualizações, você pode fazer join
joined = spark.sql("""
    SELECT c.*, j.department
    FROM employees_csv c
    JOIN employees_json j ON c.emp_id = j.emp_id
""")
```

## Visualizações Temporárias Globais

Visualizações temporárias globais são visíveis em todas as sessões Spark dentro da mesma aplicação.

```python
# Criar visualização temporária global
df.createGlobalTempView("global_employees")

# Acessar via banco de dados global_temp
result = spark.sql("SELECT * FROM global_temp.global_employees")
result.show()

# Em outra sessão (dentro da mesma aplicação)
# spark2.sql("SELECT * FROM global_temp.global_employees")
```

> [!NOTE]
> Visualizações temporárias globais estão vinculadas ao tempo de vida da aplicação Spark. Elas sobrevivem entre sessões mas não são persistidas em disco.

## CTEs e Subconsultas

Spark SQL suporta Common Table Expressions (CTEs) e subconsultas.

```python
# CTE
result = spark.sql("""
    WITH dept_avg AS (
        SELECT dept, AVG(salary) as avg_dept_salary
        FROM employees
        GROUP BY dept
    ),
    above_avg AS (
        SELECT e.name, e.dept, e.salary, a.avg_dept_salary
        FROM employees e
        JOIN dept_avg a ON e.dept = a.dept
        WHERE e.salary > a.avg_dept_salary
    )
    SELECT * FROM above_avg
    ORDER BY salary DESC
""")
result.show()

# Subconsulta
result = spark.sql("""
    SELECT name, dept, salary
    FROM employees
    WHERE salary > (
        SELECT AVG(salary) FROM employees
    )
""")
result.show()
```

## Funções SQL

Spark SQL fornece um rico conjunto de funções integradas.

```python
# Funções de string
spark.sql("""
    SELECT name,
           UPPER(name) as name_upper,
           LENGTH(name) as name_length,
           SUBSTRING(name, 1, 3) as name_prefix
    FROM employees
""").show()

# Funções de data
spark.sql("""
    SELECT CURRENT_DATE as today,
           DATE_ADD(CURRENT_DATE, 7) as next_week,
           DATEDIFF('2024-12-31', CURRENT_DATE) as days_until_nye
""").show()

# Funções condicionais
spark.sql("""
    SELECT name, salary,
           CASE
               WHEN salary > 130000 THEN 'High'
               WHEN salary > 100000 THEN 'Medium'
               ELSE 'Low'
           END as salary_level
    FROM employees
""").show()
```

## Instruções DDL e DML

Spark SQL suporta DDL (Data Definition Language) para gerenciamento de metadados.

```python
# Criar banco de dados
spark.sql("CREATE DATABASE IF NOT EXISTS analytics")

# Usar banco de dados
spark.sql("USE analytics")

# Criar tabela a partir de consulta
spark.sql("""
    CREATE TABLE IF NOT EXISTS high_salary_employees AS
    SELECT * FROM default.employees WHERE salary > 100000
""")

# DROP VIEW
spark.sql("DROP VIEW IF EXISTS employees")
```

> [!WARNING]
> Operações DDL como `CREATE TABLE` criam tabelas no metastore Hive quando o Spark está configurado com suporte Hive. Sem Hive, as tabelas são efêmeras e com escopo de sessão.

## Considerações de Desempenho

```python
# Verificar o plano da consulta
spark.sql("SELECT * FROM employees WHERE salary > 100000").explain(True)
# == Parsed Logical Plan ==
# == Analyzed Logical Plan ==
# == Optimized Logical Plan ==
# == Physical Plan ==

# Cachear uma visualização consultada frequentemente
spark.sql("CACHE TABLE employees")
spark.sql("UNCACHE TABLE employees")

# Definir configurações SQL
spark.sql("SET spark.sql.shuffle.partitions=50")
```

| Otimização | Sintaxe SQL | Benefício |
|---|---|---|
| **Caching** | `CACHE TABLE t` | Evita recálculo |
| **Broadcast hint** | `SELECT /*+ BROADCAST(t) */ *` | Força broadcast join |
| **Coalesce hint** | `SELECT /*+ COALESCE(4) */ *` | Controla partições de saída |
| **Repartition hint** | `SELECT /*+ REPARTITION(10) */ *` | Redistribui dados |

## Principais Conclusões

1. `createOrReplaceTempView()` registra DataFrames como tabelas SQL
2. APIs SQL e DataFrame são intercambiáveis e produzem planos de execução idênticos
3. CTEs, subconsultas e funções de janela funcionam no Spark SQL
4. Visualizações temporárias têm escopo de sessão; visões temporárias globais abrangem sessões
5. SQL fornece uma interface familiar para analistas em transição para Spark
6. Use `explain()` para entender e otimizar a execução de consultas

## Perguntas de Prática

1. Como você registra um DataFrame como uma tabela SQL?
2. Qual é a diferença entre uma visualização temporária e uma visualização temporária global?
3. Como você combina resultados de consultas SQL com operações DataFrame?
4. O que é uma CTE e como escrever uma no Spark SQL?
5. Como o otimizador Catalyst lida com consultas Spark SQL?
6. Como você verifica o plano de execução de uma consulta SQL?
7. Qual função SQL calcula totais acumulados? (Dica: funções de janela)
8. Como você cacheia uma tabela no Spark SQL?
9. Para que serve a dica `/*+ BROADCAST(t) */`?
10. Você pode misturar APIs SQL e DataFrame no mesmo pipeline? Dê um exemplo.
