---
title: "DataFrames Basics"
description: "Create DataFrames from RDDs, CSV, and JSON files; understand schema inference vs explicit schema definition"
order: 7
duration: "30-40 minutes"
difficulty: "beginner"
---

# DataFrames Basics

DataFrames are the primary high-level API in modern Spark. They organize data into named columns, similar to a table in a relational database or a DataFrame in Python's pandas library. DataFrames provide better performance than RDDs thanks to the Catalyst optimizer and Tungsten execution engine.

## DataFrame vs RDD

| Aspect | RDD | DataFrame |
|---|---|---|
| **API Level** | Low-level | High-level |
| **Schema** | No schema (raw objects) | Named columns with types |
| **Optimization** | Manual optimization | Catalyst optimizer |
| **Serialization** | Java/Python serialization | Tungsten (binary format) |
| **Performance** | Slower | 5-10x faster |
| **SQL Support** | No | Yes (Spark SQL) |
| **Use Case** | Unstructured data, custom logic | Structured/semi-structured data |

> [!NOTE]
> In Spark 3.x, DataFrames are the recommended API for most use cases. They offer better performance, richer optimizations, and a more user-friendly interface.

## Creating DataFrames

### From a SparkSession

```python
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

spark = SparkSession.builder \
    .appName("DataFrameBasics") \
    .master("local[*]") \
    .getOrCreate()
```

### From a List of Rows

```python
from pyspark.sql import Row

data = [
    Row(name="Alice", age=34, dept="Engineering"),
    Row(name="Bob", age=28, dept="Design"),
    Row(name="Charlie", age=41, dept="Engineering"),
    Row(name="Diana", age=25, dept="Marketing")
]

df = spark.createDataFrame(data)
df.show()
# +-------+---+-----------+
# |   name|age|       dept|
# +-------+---+-----------+
# |  Alice| 34|Engineering|
# |    Bob| 28|     Design|
# |Charlie| 41|Engineering|
# |  Diana| 25|  Marketing|
# +-------+---+-----------+
```

### From a Python Dictionary List

```python
data = [
    {"name": "Alice", "age": 34, "dept": "Engineering"},
    {"name": "Bob", "age": 28, "dept": "Design"}
]

df = spark.createDataFrame(data)
df.printSchema()
# root
#  |-- name: string (nullable = true)
#  |-- age: long (nullable = true)
#  |-- dept: string (nullable = true)
```

### From an RDD

```python
rdd = sc.parallelize([
    ("Alice", 34, "Engineering"),
    ("Bob", 28, "Design"),
    ("Charlie", 41, "Engineering")
])

# Infer column names and types
df = rdd.toDF(["name", "age", "dept"])
df.show()
```

> [!SUCCESS]
> The `toDF()` method on RDDs is the simplest bridge between RDD and DataFrame APIs. The schema is inferred from the first row's types.

### From CSV Files

```python
# Schema inference (Spark reads first few rows to infer types)
df = spark.read.csv("data/people.csv", header=True, inferSchema=True)
df.show()
df.printSchema()

# Without header — Spark assigns _c0, _c1, ... column names
df_no_header = spark.read.csv("data/people.csv", inferSchema=True)
df_no_header.show()
```

| CSV Option | Default | Description |
|---|---|---|
| `header` | `false` | First line is column names |
| `inferSchema` | `false` | Infer column types from data |
| `sep` | `,` | Field delimiter |
| `quote` | `"` | Quote character |
| `escape` | `\` | Escape character |
| `mode` | `PERMISSIVE` | Parse mode (PERMISSIVE, DROPMALFORMED, FAILFAST) |
| `nullValue` | `""` | What string represents null |
| `dateFormat` | `yyyy-MM-dd` | Date format string |

```python
# Explicit CSV options
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("sep", "|") \
    .option("nullValue", "NA") \
    .csv("data/pipe_delimited.txt")
```

### From JSON Files

```python
# JSON (each line is a JSON object)
df = spark.read.json("data/people.json")
df.show()
df.printSchema()

# Multi-line JSON (pretty-printed)
df = spark.read \
    .option("multiLine", "true") \
    .json("data/people_pretty.json")
```

> [!NOTE]
> Spark expects JSON files in "JSON Lines" format where each line is a separate JSON object. For pretty-printed JSON (multiple lines per object), use `multiLine=true`.

## Schema Inference vs Explicit Schema

### Schema Inference

Spark reads a sample of data to determine column names and types.

```python
df_inferred = spark.read \
    .option("inferSchema", "true") \
    .option("samplingRatio", "0.1") \
    .csv("data/large_file.csv")
```

**Advantages**: Quick, no code maintenance, good for exploration
**Disadvantages**:
- Extra pass over data (up to 10% more time)
- May infer wrong types (string instead of int if first 1000 rows are null)
- Performance overhead

> [!WARNING]
> Schema inference reads a sample of data to determine types. If the sample is not representative (e.g., all null values in the first rows), you get incorrect types. Always verify inferred schemas on production data.

### Explicit Schema

Define the schema programmatically for full control and better performance.

```python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType

schema = StructType([
    StructField("name", StringType(), nullable=False),
    StructField("age", IntegerType(), nullable=True),
    StructField("salary", DoubleType(), nullable=True),
    StructField("dept", StringType(), nullable=False)
])

df = spark.read \
    .schema(schema) \
    .csv("data/people.csv")
print(df.printSchema())
```

**Advantages**:
- No extra pass for sampling
- Type safety — no surprise type changes
- Better performance (no inference overhead)

**Disadvantages**:
- More code to write
- Schema must match data exactly

### DDL String Syntax

Spark supports DDL strings for compact schema definitions.

```python
ddl_schema = "name STRING, age INT, salary DOUBLE, dept STRING"

df = spark.read \
    .schema(ddl_schema) \
    .csv("data/people.csv")
```

## Exploring DataFrame Schema

```python
# Print schema tree
df.printSchema()

# Get schema as a StructType object
schema = df.schema
print(schema)

# Get column names
print(df.columns)  # ['name', 'age', 'dept']

# Get data types
for field in df.schema.fields:
    print(f"{field.name}: {field.dataType}")
```

## Data Types in Spark

| DataType | Description | Example |
|---|---|---|
| `StringType` | Text strings | `"hello"` |
| `IntegerType` | 4-byte integer | `42` |
| `LongType` | 8-byte integer | `10000000000L` |
| `FloatType` | 4-byte float | `3.14f` |
| `DoubleType` | 8-byte float | `3.14159265` |
| `BooleanType` | True/False | `True` |
| `DateType` | Date only | `2024-01-15` |
| `TimestampType` | Date and time | `2024-01-15 14:30:00` |
| `ArrayType` | List of elements | `[1, 2, 3]` |
| `MapType` | Key-value pairs | `{"a": 1}` |
| `StructType` | Nested structure | `(a: 1, b: "x")` |

## Handling Null Values

```python
# Create DataFrame with nulls
data = [
    (1, "Alice", None),
    (2, None, 50000.0),
    (3, "Bob", 60000.0)
]
df = spark.createDataFrame(data, ["id", "name", "salary"])

# Drop rows with any nulls
df.dropna().show()

# Drop rows where specific columns are null
df.dropna(subset=["name", "salary"]).show()

# Fill nulls with a value
df.fillna({"name": "Unknown", "salary": 0.0}).show()
```

## Key Takeaways

1. DataFrames are the recommended Spark API for structured data
2. Create DataFrames from RDDs, CSV, JSON, Python collections, and databases
3. Schema inference is convenient but dangerous for production
4. Explicit schemas provide type safety and better performance
5. DDL strings offer compact schema definitions
6. Null handling functions (`dropna`, `fillna`) manage missing data

## Practice Questions

1. What advantages do DataFrames have over RDDs?
2. How does the Catalyst optimizer improve DataFrame performance?
3. What is the difference between `toDF()` and `createDataFrame()`?
4. Why is schema inference potentially dangerous for production pipelines?
5. How do you define a schema with a DDL string?
6. What CSV options control header and delimiter handling?
7. When would you use `multiLine=true` for JSON files?
8. What is "JSON Lines" format and why does Spark prefer it?
9. How do you check the schema of an existing DataFrame?
10. What happens if you set `inferSchema=false` without providing a schema?
