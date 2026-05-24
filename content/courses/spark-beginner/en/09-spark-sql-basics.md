---
title: "Spark SQL Basics"
description: "Use SparkSession.sql(), create temporary views, and run SQL queries on DataFrames for powerful data analysis"
order: 9
duration: "30-40 minutes"
difficulty: "beginner"
---

# Spark SQL Basics

Spark SQL lets you query structured data using standard SQL. It bridges the gap between programmatic DataFrames and traditional SQL analytics, enabling data analysts and engineers to use the same language for exploration and production pipelines.

## Why Spark SQL?

| Advantage | Description |
|---|---|
| **Familiar syntax** | SQL knowledge transfers directly |
| **Optimization** | Catalyst optimizer works same as DataFrame API |
| **Interoperability** | Mix SQL and DataFrame operations in one pipeline |
| **Tool support** | BI tools (Tableau, Power BI) connect via JDBC/ODBC |
| **Performance** | Same Tungsten execution engine |

## Creating Temporary Views

A temporary view registers a DataFrame as a SQL table within the Spark session.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("SparkSQL") \
    .master("local[*]") \
    .getOrCreate()

# Create a DataFrame
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

# Register as a temporary view
df.createOrReplaceTempView("employees")
```

> [!NOTE]
> `createOrReplaceTempView()` creates a session-scoped temporary view. It is not shared across sessions and disappears when the SparkSession stops. Use `createGlobalTempView()` for cross-session sharing.

## Running SQL Queries

```python
# Simple SELECT
result = spark.sql("SELECT * FROM employees")
result.show()

# Filtering
engineers = spark.sql("""
    SELECT name, age, salary
    FROM employees
    WHERE dept = 'Engineering'
    ORDER BY salary DESC
""")
engineers.show()

# Aggregation
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
> Spark SQL queries go through the same Catalyst optimizer as DataFrame operations. A query written in SQL and a query written with the DataFrame API produce identical execution plans.

## Combining SQL and DataFrame APIs

You can seamlessly move between SQL and DataFrame operations.

```python
# Start with SQL
high_earners = spark.sql("""
    SELECT name, salary, dept
    FROM employees
    WHERE salary > 100000
""")

# Continue with DataFrame API
high_earners_with_bonus = high_earners \
    .withColumn("bonus", high_earners.salary * 0.2) \
    .withColumn("total", high_earners.salary * 1.2)

high_earners_with_bonus.createOrReplaceTempView("high_earners")

# Back to SQL for final analysis
final = spark.sql("""
    SELECT dept,
           COUNT(*) as count,
           ROUND(AVG(total), 0) as avg_total
    FROM high_earners
    GROUP BY dept
""")
final.show()
```

## Creating Views from Different Sources

```python
# From CSV
df_csv = spark.read.option("header", "true").csv("data/employees.csv")
df_csv.createOrReplaceTempView("employees_csv")

# From JSON
df_json = spark.read.json("data/employees.json")
df_json.createOrReplaceTempView("employees_json")

# From multiple views, you can join
joined = spark.sql("""
    SELECT c.*, j.department
    FROM employees_csv c
    JOIN employees_json j ON c.emp_id = j.emp_id
""")
```

## Global Temporary Views

Global temp views are visible across all Spark sessions within the same application.

```python
# Create global temp view
df.createGlobalTempView("global_employees")

# Access via global_temp database
result = spark.sql("SELECT * FROM global_temp.global_employees")
result.show()

# In another session (within same application)
# spark2.sql("SELECT * FROM global_temp.global_employees")
```

> [!NOTE]
> Global temp views are bound to the Spark application's lifetime. They survive across sessions but are not persisted to disk.

## CTEs and Subqueries

Spark SQL supports Common Table Expressions (CTEs) and subqueries.

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

# Subquery
result = spark.sql("""
    SELECT name, dept, salary
    FROM employees
    WHERE salary > (
        SELECT AVG(salary) FROM employees
    )
""")
result.show()
```

## SQL Functions

Spark SQL provides a rich set of built-in functions.

```python
# String functions
spark.sql("""
    SELECT name,
           UPPER(name) as name_upper,
           LENGTH(name) as name_length,
           SUBSTRING(name, 1, 3) as name_prefix
    FROM employees
""").show()

# Date functions
spark.sql("""
    SELECT CURRENT_DATE as today,
           DATE_ADD(CURRENT_DATE, 7) as next_week,
           DATEDIFF('2024-12-31', CURRENT_DATE) as days_until_nye
""").show()

# Conditional functions
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

## DDL and DML Statements

Spark SQL supports DDL (Data Definition Language) for managing metadata.

```python
# Create database
spark.sql("CREATE DATABASE IF NOT EXISTS analytics")

# Use database
spark.sql("USE analytics")

# Create table from query
spark.sql("""
    CREATE TABLE IF NOT EXISTS high_salary_employees AS
    SELECT * FROM default.employees WHERE salary > 100000
""")

# DROP VIEW
spark.sql("DROP VIEW IF EXISTS employees")
```

> [!WARNING]
> DDL operations like `CREATE TABLE` create Hive metastore tables when Spark is configured with Hive support. Without Hive, tables are ephemeral and session-scoped.

## Performance Considerations

```python
# Check the query plan
spark.sql("SELECT * FROM employees WHERE salary > 100000").explain(True)
# == Parsed Logical Plan ==
# == Analyzed Logical Plan ==
# == Optimized Logical Plan ==
# == Physical Plan ==

# Cache a frequently queried view
spark.sql("CACHE TABLE employees")
spark.sql("UNCACHE TABLE employees")

# Set SQL configurations
spark.sql("SET spark.sql.shuffle.partitions=50")
```

| Optimization | SQL Syntax | Benefit |
|---|---|---|
| **Caching** | `CACHE TABLE t` | Avoids recomputation |
| **Broadcast hint** | `SELECT /*+ BROADCAST(t) */ *` | Forces broadcast join |
| **Coalesce hint** | `SELECT /*+ COALESCE(4) */ *` | Controls output partitions |
| **Repartition hint** | `SELECT /*+ REPARTITION(10) */ *` | Redistributes data |

## Key Takeaways

1. `createOrReplaceTempView()` registers DataFrames as SQL tables
2. SQL and DataFrame APIs are interchangeable and produce identical execution plans
3. CTEs, subqueries, and window functions work in Spark SQL
4. Temporary views are session-scoped; global temp views span sessions
5. SQL provides a familiar interface for analysts transitioning to Spark
6. Use `explain()` to understand and optimize query execution

## Practice Questions

1. How do you register a DataFrame as a SQL table?
2. What is the difference between a temporary view and a global temporary view?
3. How do you combine SQL query results with DataFrame operations?
4. What is a CTE and how do you write one in Spark SQL?
5. How does the Catalyst optimizer handle Spark SQL queries?
6. How do you check the execution plan of a SQL query?
7. What SQL function computes running totals? (Hint: window functions)
8. How do you cache a table in Spark SQL?
9. What is the `/*+ BROADCAST(t) */` hint used for?
10. Can you mix SQL and DataFrame APIs in the same pipeline? Give an example.
