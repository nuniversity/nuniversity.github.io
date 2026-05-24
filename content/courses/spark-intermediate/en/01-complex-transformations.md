---
title: "Complex Transformations"
description: "Master when/otherwise, nested types (struct, array, map), explode, and split for advanced data manipulation"
order: 1
duration: "35-45 minutes"
difficulty: "intermediate"
---

# Complex Transformations

Intermediate Spark developers must handle semi-structured and nested data. This lesson covers conditional logic, complex types, and array manipulations essential for real-world ETL pipelines.

## Conditional Logic with when/otherwise

`when()` and `otherwise()` provide DataFrame-native conditional logic similar to SQL's `CASE WHEN`.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import when, col, lit

spark = SparkSession.builder.appName("ComplexTransformations").master("local[*]").getOrCreate()

data = [
    ("Alice", 120000), ("Bob", 90000), ("Charlie", 150000),
    ("Diana", 75000), ("Eve", 130000), ("Frank", 50000)
]
df = spark.createDataFrame(data, ["name", "salary"])

# Single condition
df.withColumn("level", when(col("salary") >= 100000, "Senior")
    .otherwise("Junior")).show()

# Multiple conditions
df.withColumn("level", when(col("salary") >= 130000, "Lead")
    .when(col("salary") >= 100000, "Senior")
    .when(col("salary") >= 70000, "Mid")
    .otherwise("Junior")).show()

# Complex conditions with AND/OR
df.withColumn("category", when((col("salary") >= 100000) & (col("name") != "Charlie"), "High")
    .when(col("salary") < 70000, "Low")
    .otherwise("Medium")).show()
```

> [!NOTE]
> `when()` conditions are evaluated in order. The first matching condition wins. Place the most specific conditions first.

## Multiple Column Conditions

```python
from pyspark.sql.functions import when, col, lit

# Nested when
df.withColumn("range", when(col("salary").between(70000, 100000), "Mid-Range")
    .otherwise(when(col("salary") < 70000, "Entry").otherwise("Top"))).show()

# Using when in select
df.select(
    col("name"),
    col("salary"),
    when(col("salary") > 100000, "High").otherwise("Standard").alias("tier")
).show()
```

## Struct Type

A `struct` groups multiple fields into a single column, similar to a nested record.

```python
from pyspark.sql.functions import struct

# Create a struct column
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

# Access struct fields
df_with_address.select(
    col("name"),
    col("address.city"),
    col("address.state")
).show()

# Alternative syntax
df_with_address.select("name", "address.city", "address.state").show()
```

> [!SUCCESS]
> Struct types are the foundation for working with nested JSON and Parquet data. They model hierarchical relationships without requiring separate tables.

### Creating Structs from Existing Columns

```python
# Group existing columns into a struct
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

## Array Type

Arrays hold sequences of elements of the same type.

```python
from pyspark.sql.functions import array, split, col

# Create an array column
skills_data = [
    ("Alice", ["Python", "Spark", "SQL"]),
    ("Bob", ["Java", "Kubernetes"]),
    ("Charlie", ["R", "Python", "TensorFlow", "PyTorch"])
]
skills_df = spark.createDataFrame(skills_data, ["name", "skills"])
skills_df.show(truncate=False)

# Create arrays from columns
df.withColumn("nums", array(lit(1), lit(2), lit(3))).show()

# Split string into array
df.withColumn("name_chars", split(col("name"), "")).show(truncate=False)
```

## Explode

`explode()` transforms each array element into a separate row.

```python
from pyspark.sql.functions import explode

# Explode skills array
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

# Count skills per person
exploded.groupBy("name").agg(count("skill").alias("skill_count")).show()
```

> [!WARNING]
> `explode()` multiplies row count. If an array has 1000 elements, each original row becomes 1000 rows. For large arrays, this can cause data explosion.

### Explode Variants

```python
from pyspark.sql.functions import explode_outer, posexplode, posexplode_outer

# explode_outer — includes nulls (explode drops null arrays)
data_with_null = [
    ("Alice", ["Python", "SQL"]),
    ("Bob", None),
    ("Charlie", ["Scala"])
]
null_df = spark.createDataFrame(data_with_null, ["name", "skills"])

null_df.select("name", explode_outer("skills").alias("skill")).show()
# Bob appears with null skill (explode would drop Bob)

# posexplode — includes position index
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

## Map Type

Maps store key-value pairs where keys are strings and values are a single type.

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

# Access map values
map_df.select(
    col("name"),
    col("experience_years")["Python"].alias("python_years")
).show()

# Map keys and values
map_df.select(
    col("name"),
    map_keys(col("experience_years")).alias("skills"),
    map_values(col("experience_years")).alias("years")
).show(truncate=False)

# Create map from columns
df.withColumn("config", create_map(
    lit("base"), col("salary"),
    lit("bonus"), col("salary") * 0.15
)).show(truncate=False)
```

## Array Functions

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

## Complex Nested Transformations

```python
# Real-world: Parse nested JSON logs
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, ArrayType

json_data = """
{"user": "Alice", "events": [{"type": "click", "page": "/home", "ts": 100}, {"type": "view", "page": "/about", "ts": 200}]}
{"user": "Bob", "events": [{"type": "click", "page": "/pricing", "ts": 150}]}
""".strip().split("\n")

logs_df = spark.read.json(sc.parallelize(json_data))

# Explode events
events_df = logs_df.select(
    col("user"),
    explode(col("events")).alias("event")
)

# Extract event details
events_df.select(
    col("user"),
    col("event.type"),
    col("event.page"),
    col("event.ts")
).show()
```

## Practice Questions

1. How does `when()` differ from Python's `if-elif-else` in execution?
2. What is the difference between `explode()` and `explode_outer()`?
3. How do you access fields inside a struct column?
4. When would you use `posexplode()` instead of `explode()`?
5. How do you create a map column from existing columns?
6. What happens to rows with null arrays when using `explode()` vs `explode_outer()`?
7. How do you find the length of an array column?
8. What is the difference between `array_union` and `array_distinct`?
9. How do you extract a slice of elements from an array?
10. Write a transformation that splits a comma-separated string, explodes it, and groups by value.
