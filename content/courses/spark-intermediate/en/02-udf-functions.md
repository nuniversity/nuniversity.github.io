---
title: "UDF Functions"
description: "Create User Defined Functions (UDFs), Pandas UDFs, and understand performance considerations for custom functions in Spark"
order: 2
duration: "35-45 minutes"
difficulty: "intermediate"
---

# UDF Functions

Built-in Spark functions cover many use cases, but custom logic sometimes requires User Defined Functions (UDFs). This lesson covers regular UDFs, vectorized Pandas UDFs, and the performance trade-offs between them.

## When to Use UDFs

| Scenario | Built-in Available? | Use UDF? |
|---|---|---|
| Conditional logic (if/else) | `when()` / `otherwise()` | No |
| Simple string manipulation | `substring`, `trim`, `regexp_extract` | No |
| Complex business rules | Rarely | Yes |
| Custom date calculations | `datediff`, `add_months` | Rarely |
| External library calls | No | Yes |
| Row-wise ML model inference | No | Yes |

> [!NOTE]
> Always check if a built-in function exists before writing a UDF. Built-in functions execute in Spark's JVM and are much faster than Python UDFs.

## Regular Python UDFs

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import udf, col
from pyspark.sql.types import StringType, IntegerType, DoubleType

spark = SparkSession.builder \
    .appName("UDFExamples") \
    .master("local[*]") \
    .getOrCreate()

data = [
    ("Alice", 120000),
    ("Bob", 90000),
    ("Charlie", 150000),
    ("Diana", 75000)
]
df = spark.createDataFrame(data, ["name", "salary"])

# Define and register a UDF
def salary_tier(salary):
    if salary >= 130000:
        return "Lead"
    elif salary >= 100000:
        return "Senior"
    elif salary >= 70000:
        return "Mid"
    else:
        return "Junior"

tier_udf = udf(salary_tier, StringType())

# Apply UDF
df.withColumn("tier", tier_udf(col("salary"))).show()
```

> [!WARNING]
> Regular Python UDFs have high serialization overhead. Each row is serialized from JVM to Python, processed, and serialized back. This can be 10-100x slower than built-in functions.

### UDF with Multiple Inputs

```python
def bonus_calculation(salary, performance_score):
    if performance_score >= 90:
        multiplier = 0.25
    elif performance_score >= 75:
        multiplier = 0.15
    else:
        multiplier = 0.05
    return salary * multiplier

performance_data = [
    ("Alice", 120000, 95),
    ("Bob", 90000, 80),
    ("Charlie", 150000, 70)
]
perf_df = spark.createDataFrame(performance_data, ["name", "salary", "score"])

bonus_udf = udf(bonus_calculation, DoubleType())

perf_df.withColumn("bonus", bonus_udf(col("salary"), col("score"))).show()
```

## Returning Complex Types from UDFs

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

# Return a struct
def employee_profile(name, salary, score):
    tier = "Lead" if salary >= 130000 else "Senior" if salary >= 100000 else "Mid"
    bonus = salary * (0.25 if score >= 90 else 0.15 if score >= 75 else 0.05)
    return (tier, round(bonus, 2))

profile_schema = StructType([
    StructField("tier", StringType()),
    StructField("bonus", DoubleType())
])

profile_udf = udf(employee_profile, profile_schema)

perf_df.withColumn("profile", profile_udf("name", "salary", "score")) \
    .select("name", "profile.tier", "profile.bonus").show()
```

## Pandas UDFs (Vectorized)

Pandas UDFs process batches of rows using Apache Arrow for zero-copy data transfer. They are significantly faster than regular UDFs.

```python
import pandas as pd
from pyspark.sql.functions import pandas_udf

# Scalar Pandas UDF (input -> output, one row in, one row out)
@pandas_udf(StringType())
def salary_tier_vectorized(salary: pd.Series) -> pd.Series:
    return salary.apply(lambda x:
        "Lead" if x >= 130000 else
        "Senior" if x >= 100000 else
        "Mid" if x >= 70000 else "Junior"
    )

df.withColumn("tier", salary_tier_vectorized(col("salary"))).show()
```

> [!SUCCESS]
> Pandas UDFs use Apache Arrow for zero-copy data transfer between JVM and Python, eliminating serialization overhead. They can be 10-100x faster than regular Python UDFs.

### Pandas UDF with Multiple Columns

```python
@pandas_udf(DoubleType())
def bonus_vectorized(salary: pd.Series, score: pd.Series) -> pd.Series:
    mult = pd.cut(score, bins=[0, 74, 89, 100], labels=[0.05, 0.15, 0.25],
                  include_lowest=True).astype(float)
    return salary * mult

perf_df.withColumn("bonus", bonus_vectorized("salary", "score")).show()
```

## Grouped Map Pandas UDFs

Split-apply-combine pattern: process each group as a pandas DataFrame.

```python
# Grouped apply — receives all rows for a group as a pandas DataFrame
@pandas_udf(perf_df.schema, PandasUDFType.GROUPED_MAP)
def rank_within_dept(pdf):
    pdf["rank"] = pdf["salary"].rank(ascending=False)
    return pdf

# Note: In Spark 3.x+, use the decorator pattern
from pyspark.sql.functions import PandasUDFType

grouped = perf_df.groupby("dept").apply(rank_within_dept)
```

> [!NOTE]
> Grouped map UDFs have been updated in Spark 3.x. Use `applyInPandas()` for more explicit control over the output schema.

### applyInPandas

```python
# Define input and output schemas
from pyspark.sql.types import LongType

perf_df_with_dept = perf_df.withColumn("dept", 
    when(col("name") == "Alice", "Engineering")
    .when(col("name") == "Bob", "Engineering")
    .otherwise("Marketing"))

def compute_rank(key, pdf):
    pdf["rank"] = pdf["salary"].rank(ascending=False)
    return pdf

output_schema = perf_df_with_dept.schema.add("rank", DoubleType())

result = perf_df_with_dept.groupby("dept").applyInPandas(
    compute_rank, schema=output_schema
)
result.show()
```

## Grouped Aggregate Pandas UDFs

```python
@pandas_udf(DoubleType(), PandasUDFType.GROUPED_AGG)
def median_salary(v):
    return v.median()

perf_df_with_dept.groupby("dept").agg(
    median_salary(col("salary")).alias("median_salary")
).show()
```

## Performance Comparison

| UDF Type | Serialization | Speed | Use Case |
|---|---|---|---|
| **Regular Python UDF** | Pickle (JVM <-> Python) | Slow | Simple logic, small data |
| **Pandas UDF (Scalar)** | Apache Arrow (zero-copy) | 10-100x faster | Batch operations on columns |
| **Grouped Map Pandas UDF** | Arrow | Fast | Per-group complex logic |
| **Grouped Aggregate** | Arrow | Fast | Custom aggregations |
| **Built-in Function** | None (JVM native) | Fastest | Always prefer if available |

> [!WARNING]
> Even with Pandas UDFs, there is overhead in moving data from JVM to Python. For maximum performance, rewrite critical logic in Scala UDFs or use built-in functions.

## Registering UDFs for Spark SQL

```python
# Register for use in SQL queries
spark.udf.register("sql_tier", salary_tier, StringType())

df.createOrReplaceTempView("employees")
spark.sql("""
    SELECT name, salary, sql_tier(salary) as tier
    FROM employees
""").show()

# Register Pandas UDF for SQL
spark.udf.register("sql_tier_vec", salary_tier_vectorized)
spark.sql("""
    SELECT name, salary, sql_tier_vec(salary) as tier
    FROM employees
""").show()
```

## Best Practices

1. **Prefer built-in functions** whenever possible
2. **Use Pandas UDFs** over regular UDFs for performance
3. **Minimize UDF calls** — batch operations in one UDF rather than multiple
4. **Avoid UDFs on shuffle boundaries** when possible
5. **Test UDFs locally** before running at scale
6. **Set `spark.sql.execution.arrow.pyspark.enabled=true`** for Pandas UDFs

## Practice Questions

1. What is the performance difference between regular UDFs and Pandas UDFs?
2. How does Apache Arrow improve Pandas UDF performance?
3. When should you use a built-in function instead of a UDF?
4. How do you register a UDF for use in Spark SQL queries?
5. What is `applyInPandas()` used for?
6. How do you return a struct from a UDF?
7. What happens to UDF performance as cluster size increases?
8. How do you handle null values inside a UDF?
9. What is the `PandasUDFType.GROUPED_AGG` used for?
10. Why might you choose a Scala UDF over a Python UDF for production?
