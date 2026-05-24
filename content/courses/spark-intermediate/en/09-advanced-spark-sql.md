---
title: "Advanced Spark SQL"
description: "Master advanced SQL techniques: window functions, subqueries, broadcast hints, complex aggregations, and query optimization"
order: 9
duration: "35-45 minutes"
difficulty: "intermediate"
---

# Advanced Spark SQL

Spark SQL offers the full power of ANSI SQL with optimizer integration. This lesson covers window functions, subqueries, query hints, and advanced patterns for data analysis.

## Window Functions

Window functions perform calculations across rows related to the current row without collapsing the result set.

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

### Ranking Functions

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

| Function | Behavior | Duplicate Handling |
|---|---|---|
| `ROW_NUMBER()` | Sequential number, no ties | Different numbers for equal values |
| `RANK()` | Same rank for equal values, gaps | 1, 2, 2, 4 |
| `DENSE_RANK()` | Same rank for equal values, no gaps | 1, 2, 2, 3 |
| `NTILE(n)` | Split into n buckets | Even distribution |

> [!SUCCESS]
> `ROW_NUMBER()` is ideal for deduplication (keep the first occurrence). `RANK()` and `DENSE_RANK()` are better for leaderboard-style queries where ties matter.

### Aggregate Window Functions

```python
# Running totals and moving averages
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

### Window Frame Specifications

```python
# Different frame types
frames = spark.sql("""
    SELECT name, dept, salary, start_date,
           -- Default: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date) as default_frame,
           -- ROWS: physical rows
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date
                             ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) as sliding_window,
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date
                             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as whole_partition,
           -- RANGE: logical rows by value
           SUM(salary) OVER (PARTITION BY dept ORDER BY salary
                             RANGE BETWEEN 10000 PRECEDING AND CURRENT ROW) as within_range
    FROM employees
    ORDER BY dept, start_date
""")
frames.show()
```

> [!NOTE]
> `ROWS` operates on physical row offsets. `RANGE` operates on value ranges. `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` includes the current row plus one before and one after. `RANGE BETWEEN 1000 PRECEDING AND CURRENT ROW` includes all rows whose value is within 1000 of the current row's value.

## Subqueries

### Correlated Subqueries

```python
# Employees earning more than dept average
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

# EXISTS subquery
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

# NOT EXISTS (find departments with no high earners)
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

### Scalar Subqueries

```python
# Subquery in SELECT
scalar = spark.sql("""
    SELECT name, salary,
           salary / (SELECT AVG(salary) FROM employees) as ratio_to_overall,
           salary / (SELECT AVG(salary) FROM employees 
                     WHERE dept = e.dept) as ratio_to_dept
    FROM employees e
""")
scalar.show()

# Subquery in WHERE with IN
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
> Correlated subqueries can be slow on large datasets because they may execute per row. Spark's optimizer often rewrites them as joins. Check `explain()` to verify.

## Query Hints

### Broadcast Hints

```python
# Force broadcast hash join
broadcast_hint = spark.sql("""
    SELECT /*+ BROADCAST(small) */
           l.*, s.description
    FROM large_table l
    JOIN small_table s ON l.key = s.key
""")

# Multiple broadcast hints
broadcast_multi = spark.sql("""
    SELECT /*+ BROADCAST(s1, s2) */
           l.*, s1.desc1, s2.desc2
    FROM large l
    JOIN small1 s1 ON l.key1 = s1.key
    JOIN small2 s2 ON l.key2 = s2.key
""")
```

### Other Query Hints

```python
# Repartition hint
repartition_hint = spark.sql("""
    SELECT /*+ REPARTITION(100) */
           *
    FROM large_table
""")

# Coalesce hint
coalesce_hint = spark.sql("""
    SELECT /*+ COALESCE(10) */
           *
    FROM large_table
""")

# Shuffle hash join hint
shuffle_hint = spark.sql("""
    SELECT /*+ SHUFFLE_HASH(large) */
           l.*, s.*
    FROM large_table l
    JOIN small_table s ON l.key = s.key
""")

# Merge join hint
merge_hint = spark.sql("""
    SELECT /*+ MERGE(large, big) */
           *
    FROM large_table l
    JOIN big_table b ON l.key = b.key
""")
```

> [!NOTE]
> Hints are advisory, not mandatory. Spark's optimizer may ignore them if it determines a better plan. Use `explain()` to verify the hint was applied.

## Complex Aggregation Patterns

```python
# Cumulative aggregations with windows
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

# Conditional aggregation with FILTER clause
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

## Managing Views and Tables

```python
# Temporary view
df.createOrReplaceTempView("employees")
spark.sql("SELECT * FROM employees").show()

# Global temporary view (visible across sessions)
df.createGlobalTempView("global_employees")
spark.sql("SELECT * FROM global_temp.global_employees").show()

# Persistent Hive table (requires Hive support)
spark.sql("""
    CREATE TABLE IF NOT EXISTS analytics.employees
    USING parquet
    PARTITIONED BY (dept)
    AS SELECT * FROM employees
""")

# Describe view
spark.sql("DESCRIBE employees").show()
spark.sql("SHOW TABLES").show()
```

## Performance Optimization with SQL

```python
# Check query plan
spark.sql("SELECT * FROM employees WHERE salary > 100000").explain(True)

# Cache hot tables
spark.sql("CACHE TABLE employees")
spark.sql("CACHE TABLE departments")

# Uncache when done
spark.sql("UNCACHE TABLE employees")

# Set session configurations
spark.sql("SET spark.sql.adaptive.enabled=true")
spark.sql("SET spark.sql.shuffle.partitions=50")
```

## Practice Questions

1. What is the difference between `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()`?
2. How do you compute a 7-day moving average using window functions?
3. What is the difference between `ROWS` and `RANGE` in a window frame?
4. How does a correlated subquery differ from a regular subquery?
5. What does the `/*+ BROADCAST(t) */` hint do?
6. How do you find the top 3 highest-paid employees per department?
7. What is `NTILE(10)` used for?
8. How do you compute a running total with a window function?
9. When would you use `LAST_VALUE()` with `UNBOUNDED FOLLOWING`?
10. How do you check if the optimizer applied your hint?
