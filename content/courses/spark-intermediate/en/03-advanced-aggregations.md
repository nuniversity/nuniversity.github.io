---
title: "Advanced Aggregations"
description: "Master groupBy with agg, multiple aggregations, pivot, rollup, and cube for advanced data analysis"
order: 3
duration: "35-45 minutes"
difficulty: "intermediate"
---

# Advanced Aggregations

Basic `groupBy` with `count()` only scratches the surface. Spark provides powerful aggregation capabilities including multiple metrics per group, pivoting, and multi-dimensional analysis with rollup and cube.

## GroupBy with Multiple Aggregations

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

# Multiple aggregations
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
> You can pass any number of aggregation expressions to `agg()`. Each gets its own alias for clean column naming.

## Aggregation with Filtering

```python
# Conditional aggregation (count only matching rows)
dept_condition = df.groupBy("dept").agg(
    count("*").alias("total"),
    count(when(col("salary") > 100000, 1)).alias("high_earners"),
    sum(when(col("city") == "NY", col("salary"))).alias("ny_salary_total"),
    avg(when(col("city") == "SF", col("salary"))).alias("sf_avg_salary")
)
dept_condition.show()
```

## Using agg with Dictionary

```python
# Aggregation expressions as a dict
from pyspark.sql.functions import expr

agg_exprs = {
    "salary": ["count", "sum", "avg", "max", "min"],
    "name": "count"
}

dept_stats_dict = df.groupBy("dept").agg(agg_exprs)
dept_stats_dict.show()
```

> [!WARNING]
> Dict-based aggregation produces multi-level column names like `salary_sum`, `salary_avg`. Use the expression-based API for cleaner column naming.

## Collecting Values

```python
# Collect names per department as lists
dept_names = df.groupBy("dept").agg(
    collect_list("name").alias("names_list"),
    collect_set("name").alias("names_set"),
    collect_list("salary").alias("salaries")
)
dept_names.show(truncate=False)
```

> [!SUCCESS]
> `collect_list()` and `collect_set()` are invaluable for creating JSON-ready arrays for downstream systems like Elasticsearch or Kafka.

## Grouping by Multiple Columns

```python
# Multi-column group by
city_dept = df.groupBy("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

city_dept.show()
```

## Pivot

`pivot()` transforms unique values from a column into separate columns.

```python
# Simple pivot — departments as columns, average salary as values
pivot_df = df.groupBy("city").pivot("dept").agg(avg("salary"))
pivot_df.show()
# +----+--------+-------+---------+
# |city|  Design|Engineer|Marketing|
# +----+--------+-------+---------+
# |  LA| 95000.0|125000.0|     null|
# |  NY|    null|135000.0| 110000.0|
# |  SF| 90000.0|   null |  80000.0|
# +----+--------+-------+---------+

# Pivot with specified values (more efficient)
pivot_specified = df.groupBy("city").pivot("dept", ["Engineering", "Design", "Marketing"]).agg(avg("salary"))

# Multiple aggregations in pivot
pivot_multi = df.groupBy("city").pivot("dept").agg(
    avg("salary").alias("avg_salary"),
    sum("salary").alias("total_salary")
)
pivot_multi.show()
```

> [!NOTE]
>`pivot()` with a specified list of values is more efficient because Spark doesn't need to scan all distinct values first. Without it, Spark runs an extra query to discover unique values.

### Pivot with Complex Aggregations

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

`rollup()` creates subtotals and grand totals along a hierarchy.

```python
# Rollup: hierarchy of (city, dept)
rollup_df = df.rollup("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

rollup_df.show()
# +----+-----------+-----+----------+
# |city|       dept|count|avg_salary|
# +----+-----------+-----+----------+
# |null|       null|    8|  125625.0|  <- grand total
# |  LA|       null|    2|  110000.0|  <- LA subtotal
# |  LA|     Design|    1|   95000.0|
# |  LA|Engineering|    1|  125000.0|
# |  NY|       null|    4|  128750.0|  <- NY subtotal
# |  NY|Engineering|    3|  135000.0|
# |  NY|  Marketing|    1|  110000.0|
# |  SF|       null|    2|   85000.0|  <- SF subtotal
# |  SF|     Design|    1|   90000.0|
# |  SF|  Marketing|    1|   80000.0|
# +----+-----------+-----+----------+

# City subtotals and grand total
rollup_df.filter(col("dept").isNull()).show()
```

> [!WARNING]
> Rollup results include `null` values to represent subtotal rows. Filtering for `null` on the column being rolled up identifies subtotal rows. Be careful not to confuse real data nulls with subtotal nulls.

## Cube

`cube()` generates all possible combinations of grouping columns (cross-tabulation).

```python
# Cube: all combinations of (city, dept)
cube_df = df.cube("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).orderBy("city", "dept")

cube_df.show()
# +----+-----------+-----+----------+
# |city|       dept|count|avg_salary|
# +----+-----------+-----+----------+
# |null|       null|    8|  125625.0|  <- grand total
# |null|     Design|    2|   92500.0|  <- Design across all cities
# |null|Engineering|    4|  132500.0|  <- Engineering across all cities
# |null|  Marketing|    2|   95000.0|  <- Marketing across all cities
# |  LA|       null|    2|  110000.0|  <- LA subtotal
# |  LA|     Design|    1|   95000.0|
# |  LA|Engineering|    1|  125000.0|
# |  NY|       null|    4|  128750.0|  <- NY subtotal
# ...
```

### Rollup vs Cube

| Aspect | Rollup | Cube |
|---|---|---|
| **Groupings** | Hierarchical subtotals + grand total | All combinations |
| **Number of groups** | N+1 where N is hierarchy depth | 2^N where N is column count |
| **Use case** | Date hierarchies (year > month > day) | Multi-dimensional OLAP cubes |
| **Performance** | Faster (fewer groups) | Slower (exponential groups) |
| **Result rows** | 1 + sum of cardinalities | Product of all level combinations |

## Grouping Sets

SQL's `GROUPING SETS` for explicit control over subtotal combinations.

```python
# Equivalent to cube but with explicit sets
from pyspark.sql.functions import expr

grouping_sets = df.groupBy("city", "dept").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary")
).groupBy("city", "dept")  # Not directly available in DataFrame API

# Use SQL instead
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

## Window Aggregate Functions

```python
from pyspark.sql.window import Window

# Running total per department
window_spec = Window.partitionBy("dept").orderBy("salary")

df.withColumn("running_total", sum("salary").over(window_spec)) \
  .withColumn("rank", rank().over(window_spec)) \
  .show()
```

> [!NOTE]
> Window functions are covered in depth in the Advanced Spark SQL lesson. They complement groupBy aggregations by allowing per-group calculations without collapsing rows.

## Performance Tips

1. **Specify pivot values** to avoid the extra distinct-value scan
2. **Use `approx_count_distinct()`** instead of `countDistinct()` on large datasets
3. **Avoid cube** on high-cardinality columns (exponential explosion)
4. **Use `rollup`** for hierarchical aggregations that match business hierarchies
5. **Filter after aggregation**, not before, unless the filter reduces shuffle size

## Practice Questions

1. How do you compute multiple aggregates (count, sum, avg) in one `groupBy`?
2. What is the difference between `rollup` and `cube`?
3. When would you use `pivot()` and how do you specify values for efficiency?
4. How do you identify subtotal rows in a rollup result?
5. What happens if you pivot on a column with high cardinality (thousands of values)?
6. How do `collect_list()` and `collect_set()` differ?
7. What does `GROUPING SETS` accomplish that `cube` cannot?
8. Why specify pivot values explicitly?
9. How do you conditionally aggregate (e.g., average salary only for NY)?
10. What is the performance trade-off between `cube` and `rollup`?
