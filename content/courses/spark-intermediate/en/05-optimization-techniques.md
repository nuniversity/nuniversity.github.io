---
title: "Optimization Techniques"
description: "Deep dive into Catalyst optimizer, Tungsten execution, broadcast variables, and accumulators for performance optimization"
order: 5
duration: "35-45 minutes"
difficulty: "intermediate"
---

# Optimization Techniques

Spark's performance comes from its advanced optimization engine. Understanding the Catalyst optimizer, Tungsten execution, broadcast variables, and accumulators helps you write efficient Spark applications.

## Catalyst Optimizer

Catalyst is Spark SQL's query optimizer. It transforms DataFrame/SQL queries into efficient physical execution plans.

### Optimization Phases

```
User Code -> Unresolved Logical Plan -> Analyzed Logical Plan
  -> Optimized Logical Plan -> Physical Plans -> Selected Physical Plan
  -> RDDs (execution)
```

### Phase 1: Analysis

Resolves column names, types, and table references.

```python
df = spark.range(1000).select("id", col("id") * 2 as "doubled")
df.explain(True)
# == Parsed Logical Plan ==
# == Analyzed Logical Plan ==  <- column types resolved
# == Optimized Logical Plan ==
# == Physical Plan ==
```

### Phase 2: Logical Optimization

Applies rule-based optimizations:
- **Predicate pushdown**: Move filters closer to data sources
- **Projection pruning**: Select only needed columns early
- **Constant folding**: Evaluate constant expressions at compile time
- **Null propagation**: Simplify expressions involving nulls

```python
# Example: Catalyst pushes filter to data source
df = spark.read.parquet("data/sales.parquet")
optimized = df.filter(col("amount") > 100).select("id", "amount")
optimized.explain()
# Filter pushed to Parquet scan (predicate pushdown)
```

> [!SUCCESS]
> Predicate pushdown is one of the most impactful optimizations. When reading Parquet, filtering on a column reads only the relevant row groups, dramatically reducing I/O.

### Phase 3: Physical Planning

Converts logical plan to one or more physical plans and selects the cheapest using cost-based optimization.

```python
# Show physical plan selection
df.join(small_df, "key").explain(True)
# == Physical Plan ==
# BroadcastHashJoin or SortMergeJoin chosen based on stats
```

### Phase 4: Code Generation

Generates optimized Java bytecode using Tungsten.

## Tungsten Execution Engine

Tungsten improves performance through three mechanisms:

### 1. Off-Heap Memory Management

```python
# Enable off-heap memory
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")
```

Tungsten manages memory directly using `sun.misc.Unsafe`, bypassing JVM garbage collection overhead.

### 2. Cache-Aware Computation

Data is laid out in compact binary format (unsafe rows) for CPU cache efficiency.

### 3. Whole-Stage Code Generation (WSCG)

```python
# Check if WSCG is enabled
print(spark.conf.get("spark.sql.codegen.wholeStage"))
# true (default)

# View generated code
df.explain("codegen")
```

> [!NOTE]
> Whole-stage code generation collapses multiple operators into a single function, eliminating virtual function calls and increasing CPU efficiency. This is why Spark SQL/DataFrames are faster than RDDs.

## Broadcast Variables

Broadcast variables let you cache a large read-only value on each executor, avoiding costly shuffles.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("Broadcast").master("local[*]").getOrCreate()
sc = spark.sparkContext

# Create a broadcast variable
lookup_table = {
    "NY": "New York",
    "SF": "San Francisco",
    "LA": "Los Angeles",
    "CHI": "Chicago"
}
broadcast_lookup = sc.broadcast(lookup_table)

# Use in RDD operations
cities_rdd = sc.parallelize(["NY", "SF", "LA", "CHI", "NY", "SF"])
full_names = cities_rdd.map(lambda code: broadcast_lookup.value.get(code, "Unknown"))
print(full_names.collect())
# ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'New York', 'San Francisco']
```

### Broadcast vs Collect

| Aspect | Broadcast | Collect |
|---|---|---|
| **Data location** | Copied to each executor | Sent to driver only |
| **Use case** | Lookup tables, ML models | Small results for driver |
| **Memory** | One copy per executor | One copy on driver |
| **Performance** | Fast for executors | Bottleneck on driver |

> [!WARNING]
> Broadcast variables are read-only. If you need to update them, destroy the old variable and create a new one. Broadcasting a variable larger than executor memory causes OOM errors.

### Broadcasting in DataFrames

```python
# DataFrame broadcast hint
from pyspark.sql.functions import broadcast

# Explicit broadcast of small table
large_df.join(broadcast(small_df), "key").explain()
# BroadcastHashJoin

# Check broadcast threshold
print(spark.conf.get("spark.sql.autoBroadcastJoinThreshold"))
# 10485760 (10 MB)
```

### Broadcasting ML Models

```python
import pickle
from pyspark.ml.classification import LogisticRegressionModel

# Load model and broadcast to all executors
model = LogisticRegressionModel.load("models/lr_model")
broadcast_model = sc.broadcast(model)

# Apply model in parallel
predictions = features_rdd.map(lambda features: broadcast_model.value.predict(features))
```

## Accumulators

Accumulators provide distributed counters for aggregating values across tasks.

```python
# Create accumulators
total_rows = sc.accumulator(0)
total_errors = sc.accumulator(0)
empty_lines = sc.accumulator(0)

def process_line(line):
    total_rows.add(1)
    if not line.strip():
        empty_lines.add(1)
        return None
    if "ERROR" in line:
        total_errors.add(1)
    return line

rdd = sc.parallelize(["INFO: OK", "ERROR: Failed", "", "ERROR: Timeout", "INFO: Done"])
processed = rdd.map(process_line).filter(lambda x: x is not None)

# Actions trigger accumulator updates
result = processed.collect()

print(f"Total rows: {total_rows.value}")     # 5
print(f"Empty lines: {empty_lines.value}")   # 1
print(f"Errors: {total_errors.value}")        # 2
```

> [!NOTE]
> Accumulators are only updated when an action runs. Transformations may compute them multiple times (task retries). Named accumulators are visible in the Spark UI.

### Named Accumulators

```python
# Named accumulators appear in Spark UI
from pyspark.util import InheritableThreadLocal

# Better approach: use sc.accumulator with name
from pyspark.accumulators import AccumulatorParam

class StringAccumulatorParam(AccumulatorParam):
    def zero(self, value):
        return ""
    def addInPlace(self, val1, val2):
        return val1 + val2

error_log = sc.accumulator("", StringAccumulatorParam())

def log_error(line):
    if "ERROR" in line:
        error_log.add(line + "\n")
    return line
```

### Accumulator Use Cases

```python
# Validation and quality metrics
valid_rows = sc.accumulator(0)
invalid_rows = sc.accumulator(0)
null_fields = sc.accumulator(0)

def validate(row):
    try:
        if row["age"] < 0:
            invalid_rows.add(1)
            return None
        if row["name"] is None:
            null_fields.add(1)
        valid_rows.add(1)
        return row
    except Exception:
        invalid_rows.add(1)
        return None

# Custom monitoring
bytes_processed = sc.accumulator(0)

def track_bytes(line):
    bytes_processed.add(len(line.encode("utf-8")))
    return line
```

## AQE (Adaptive Query Execution)

Spark 3.x's AQE dynamically optimizes queries at runtime.

```python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

| AQE Feature | Benefit |
|---|---|
| **Dynamic coalescing** | Reduces partitions when data is small |
| **Dynamic join switching** | Switches to broadcast if stats reveal small table |
| **Dynamic skew handling** | Splits skewed join partitions |
| **Optimized local shuffle reader** | Avoids shuffle when possible |

## Performance Checklist

1. **Use DataFrames/SQL** over RDDs (Catalyst + Tungsten)
2. **Enable AQE** for dynamic optimization
3. **Broadcast small tables** with explicit hints
4. **Cache intermediate results** used by multiple actions
5. **Filter early** (predicate pushdown)
6. **Select needed columns** only (projection pruning)
7. **Avoid UDFs** when built-in functions suffice
8. **Use accumulators** for monitoring, not business logic

## Practice Questions

1. What are the four phases of the Catalyst optimizer?
2. How does predicate pushdown improve query performance?
3. What is whole-stage code generation and why is it faster?
4. When would you use a broadcast variable instead of a broadcast join hint?
5. How do accumulators differ from regular variables?
6. What happens to an accumulator value if a task fails and is retried?
7. Why is Tungsten's off-heap memory management faster?
8. What three dynamic optimizations does AQE provide?
9. How do you check if whole-stage code generation is enabled?
10. What information appears in `df.explain("codegen")`?
