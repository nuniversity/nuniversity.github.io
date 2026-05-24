---
title: "DataFrame Operations"
description: "Master DataFrame operations: select, filter, withColumn, drop, rename, distinct, sample with PySpark examples"
order: 8
duration: "30-40 minutes"
difficulty: "beginner"
---

# DataFrame Operations

DataFrames provide a rich set of operations for data manipulation. These operations are optimized by the Catalyst optimizer and executed through the Tungsten engine for maximum performance.

## Preparing Sample Data

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

Chooses specific columns from the DataFrame.

```python
# Select single column
df.select("name").show()

# Select multiple columns
df.select("name", "age", "salary").show()

# Select using col() function
from pyspark.sql.functions import col
df.select(col("name"), col("salary") * 1.1).show()

# Select all columns
df.select("*").show()

# Select with expressions
df.select(
    col("name"),
    col("salary"),
    (col("salary") / 12).alias("monthly_salary")
).show()
```

> [!NOTE]
> Using `col()` function is more explicit and enables chaining of column expressions. String column names are converted to `col()` internally.

## filter() / where()

Filters rows based on a condition.

```python
# Single condition
df.filter(col("age") > 30).show()
df.where(col("age") > 30).show()  # identical

# Multiple conditions (AND)
df.filter((col("age") > 30) & (col("dept") == "Engineering")).show()

# Multiple conditions (OR)
df.filter((col("dept") == "Design") | (col("dept") == "Marketing")).show()

# String expressions
df.filter("age > 30").show()
df.filter("age > 30 AND dept = 'Engineering'").show()

# isin for multiple values
df.filter(col("city").isin("NY", "SF")).show()

# Like patterns
df.filter(col("name").like("A%")).show()

# Negation
df.filter(~col("dept").isin("Engineering", "Design")).show()
```

> [!WARNING]
> Mixing the two syntax styles (`df.filter("age > 30")` and `df.filter(col("age") > 30)`) in the same expression can cause confusing errors. Pick one style and be consistent.

## withColumn()

Adds a new column or replaces an existing one.

```python
# Add a constant column
df = df.withColumn("country", lit("USA"))
df.show()

# Derive a new column from existing columns
df = df.withColumn(
    "bonus",
    col("salary") * 0.20
)
df.show()

# Conditional column with when/otherwise
df = df.withColumn(
    "salary_level",
    when(col("salary") > 130000, "High")
    .when(col("salary") > 100000, "Medium")
    .otherwise("Low")
)
df.show()

# Transform existing column
df = df.withColumn(
    "name_upper",
    upper(col("name"))
)
df.show()

# Cast column type
df = df.withColumn(
    "age_double",
    col("age").cast("double")
)
```

> [!NOTE]
> `withColumn()` does not modify the original DataFrame. It returns a new DataFrame with the added column. DataFrames are immutable.

## drop()

Removes one or more columns from the DataFrame.

```python
# Drop a single column
df_no_bonus = df.drop("bonus")
df_no_bonus.show()

# Drop multiple columns
df_clean = df.drop("country", "bonus", "salary_level")
df_clean.show()

# Drop columns by condition
df_clean = df.drop(*[c for c in df.columns if c.startswith("name")])
```

## withColumnRenamed()

Renames an existing column.

```python
# Rename a single column
df_renamed = df.withColumnRenamed("salary", "annual_salary")
df_renamed.show()

# Rename multiple columns
df_renamed = df \
    .withColumnRenamed("name", "employee_name") \
    .withColumnRenamed("dept", "department")
df_renamed.show()
```

## distinct() / dropDuplicates()

Removes duplicate rows.

```python
# Distinct rows (all columns)
df_distinct_dept = df.select("dept").distinct()
df_distinct_dept.show()

# Drop duplicates based on subset of columns
df_cities = df.select("city").distinct()
df_cities.show()

# dropDuplicates with subset
df_unique = df.dropDuplicates(["city", "dept"])
df_unique.show()
```

> [!SUCCESS]
> `dropDuplicates(["col1", "col2"])` is more flexible than `distinct()`. It lets you define which columns determine uniqueness while keeping all other column values from the first matching row.

## sample()

Returns a random sample of the data.

```python
# Random sample (without replacement)
sample_20 = df.sample(withReplacement=False, fraction=0.2)
sample_20.show()

# Random sample with seed (reproducible)
sample_20 = df.sample(withReplacement=False, fraction=0.2, seed=42)

# Sample with replacement
sample_over = df.sample(withReplacement=True, fraction=1.5)

# Fractional sampling per row
weighted = df.sampleBy("dept", fractions={
    "Engineering": 0.5,
    "Design": 1.0,
    "Marketing": 0.75
}, seed=42)
```

## orderBy() / sort()

Sorts the DataFrame by one or more columns.

```python
# Sort ascending (default)
df.orderBy("salary").show()
df.sort("salary").show()

# Sort descending
df.orderBy(col("salary").desc()).show()
df.orderBy(col("salary").desc(), col("age").asc()).show()

# Using desc function
from pyspark.sql.functions import desc
df.orderBy(desc("salary")).show()

# String expression
df.sort("salary DESC").show()
```

## GroupBy and Aggregation

```python
# Group by department and count
from pyspark.sql.functions import avg, max, min, sum, count

dept_stats = df.groupBy("dept").agg(
    count("*").alias("employee_count"),
    avg("salary").alias("avg_salary"),
    max("salary").alias("max_salary"),
    min("age").alias("min_age")
)
dept_stats.show()

# Multiple group by columns
city_dept = df.groupBy("city", "dept").agg(
    sum("salary").alias("total_salary")
)
city_dept.show()
```

## Column Alias and Cast

```python
# Alias for clarity
df.select(
    col("name").alias("Employee Name"),
    col("salary").cast("double").alias("Annual Compensation")
).show()

# Chain operations
from pyspark.sql.types import DoubleType

df_processed = df \
    .withColumn("salary", col("salary").cast(DoubleType())) \
    .withColumn("bonus", col("salary") * 0.15) \
    .withColumnRenamed("salary", "base_salary") \
    .drop("country")
```

## Operation Summary Table

| Operation | Purpose | Returns |
|---|---|---|
| `select()` | Choose columns | DataFrame |
| `filter()` / `where()` | Filter rows by condition | DataFrame |
| `withColumn()` | Add/replace column | DataFrame |
| `drop()` | Remove columns | DataFrame |
| `withColumnRenamed()` | Rename column | DataFrame |
| `distinct()` | Unique rows | DataFrame |
| `dropDuplicates()` | Remove duplicates by subset | DataFrame |
| `sample()` | Random sampling | DataFrame |
| `orderBy()` / `sort()` | Sort rows | DataFrame |
| `groupBy().agg()` | Aggregation | DataFrame |

## Practice Questions

1. What is the difference between `select("col1", "col2")` and `select(col("col1"), col("col2"))`?
2. How do you add a new column derived from existing columns?
3. What is the difference between `distinct()` and `dropDuplicates(["col1"])`?
4. How do you rename multiple columns at once?
5. Why is `withColumn()` preferred over direct column assignment?
6. How do you filter with multiple conditions (AND, OR)?
7. What does `sampleBy("dept", fractions={...}, seed=42)` do?
8. How do you sort in descending order?
9. What is the difference between `filter` and `where`?
10. How do you drop a column that contains null values in a specific subset?
