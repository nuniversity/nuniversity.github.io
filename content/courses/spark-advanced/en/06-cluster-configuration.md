---
title: "Cluster Configuration"
description: "Configure Spark clusters: spark.sql.shuffle.partitions, spark.executor.memory, dynamic allocation, and resource optimization"
order: 6
duration: "35-45 minutes"
difficulty: "advanced"
---

# Cluster Configuration

Proper Spark configuration is essential for performance, stability, and cost efficiency. This lesson covers the most critical configuration parameters and how to tune them.

## Configuration Priority

Spark configuration follows a hierarchy:

| Priority | Source | Overrides |
|---|---|---|
| 1 (Highest) | `spark-submit --conf` | All below |
| 2 | `SparkSession.conf.set()` | Config file defaults |
| 3 | `spark-defaults.conf` | Hardcoded defaults |
| 4 (Lowest) | Hardcoded defaults | — |

## Core Resource Configuration

### Executor Resources

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("OptimizedApp") \
    .config("spark.executor.memory", "8g") \
    .config("spark.executor.cores", "4") \
    .config("spark.executor.instances", "10") \
    .config("spark.driver.memory", "4g") \
    .getOrCreate()
```

### Resource Calculation Formula

```
Total cores = executor.instances × executor.cores
Total memory = executor.instances × executor.memory

Example:
  10 executors × 4 cores = 40 cores
  10 executors × 8g = 80g total memory
  Overhead: 8g × 0.1 = 0.8g per executor (spark.executor.memoryOverhead)
```

> [!NOTE]
> Leave 1-2 cores per node for OS and Hadoop services. For YARN, container overhead reduces available memory. Set `spark.executor.memoryOverhead` to 10-15% of executor memory for JVM overhead.

### Memory Breakdown

```python
# Default memory allocation within an executor
# spark.executor.memory = 8g
# spark.memory.fraction = 0.6 (60% for execution + storage)
# spark.memory.storageFraction = 0.5 (50% of unified for storage)
#
# Execution: 8g × 0.6 × 0.5 = 2.4g
# Storage:   8g × 0.6 × 0.5 = 2.4g  (can borrow from execution)
# Reserved:  8g × 0.4 = 3.2g (user code, overhead)
```

## Shuffle Configuration

```python
# Shuffle partitions
spark.conf.set("spark.sql.shuffle.partitions", "200")

# Rule of thumb: 2-4 partitions per core
# 40 cores × 3 = 120 partitions

# Shuffle memory buffer
spark.conf.set("spark.shuffle.file.buffer", "64k")
spark.conf.set("spark.reducer.maxSizeInFlight", "96m")

# Shuffle compression
spark.conf.set("spark.shuffle.compress", "true")
spark.conf.set("spark.shuffle.spill.compress", "true")
spark.conf.set("spark.io.compression.codec", "snappy")
```

| Shuffle Parameter | Default | Description |
|---|---|---|
| `spark.sql.shuffle.partitions` | 200 | Partitions after shuffle |
| `spark.shuffle.file.buffer` | 32k | Buffer size for shuffle writes |
| `spark.reducer.maxSizeInFlight` | 48m | Max size of map output per reducer |
| `spark.shuffle.compress` | true | Compress shuffle output |
| `spark.shuffle.spill.compress` | true | Compress spilled data |

## Dynamic Allocation

Dynamic allocation adjusts executor count based on workload.

```python
# Enable dynamic allocation
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.minExecutors", "2")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "50")
spark.conf.set("spark.dynamicAllocation.initialExecutors", "5")
spark.conf.set("spark.dynamicAllocation.executorIdleTimeout", "60s")
spark.conf.set("spark.dynamicAllocation.cachedExecutorIdleTimeout", "120s")

# With shuffle tracking (keeps executors during shuffles)
spark.conf.set("spark.dynamicAllocation.shuffleTracking.enabled", "true")
```

> [!SUCCESS]
> Dynamic allocation is essential for multi-tenant clusters. It automatically scales down when demand is low and scales up during peak loads, improving cluster utilization.

### When to Use Dynamic Allocation

| Scenario | Recommended |
|---|---|
| Multi-tenant YARN cluster | Yes |
| Dedicated cluster | Maybe (fixed allocation simpler) |
| Streaming workloads | Maybe (consider fixed for predictable latency) |
| Kubernetes | Yes (auto-scaling) |
| Short ad-hoc queries | Yes |

## Adaptive Query Execution (AQE)

```python
# Enable AQE (default in Spark 3.x)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Dynamic partition coalescing
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitions", "10")
spark.conf.set("spark.sql.adaptive.coalescePartitions.maxPartitions", "500")
spark.conf.set("spark.sql.adaptive.coalescePartitions.parallelismFirst", "true")

# Skew join optimization
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")

# Dynamic join switch (broadcast vs sort-merge)
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
```

## Serialization and Compression

```python
# Kryo serialization (faster than Java serialization)
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "256m")
spark.conf.set("spark.kryo.registrationRequired", "false")

# Register custom classes for Kryo
spark.conf.set("spark.kryo.classesToRegister", 
    "com.example.MyClass,com.example.AnotherClass")

# RDD compression
spark.conf.set("spark.rdd.compress", "true")

# Broadcast compression
spark.conf.set("spark.broadcast.compress", "true")
```

## Network and I/O

```python
# Network timeouts
spark.conf.set("spark.network.timeout", "600s")
spark.conf.set("spark.executor.heartbeatInterval", "30s")
spark.conf.set("spark.sql.broadcastTimeout", "600")

# Max result size
spark.conf.set("spark.driver.maxResultSize", "4g")

# I/O optimizations
spark.conf.set("spark.hadoop.parquet.enable.summary-metadata", "false")
spark.conf.set("spark.sql.parquet.mergeSchema", "false")
spark.conf.set("spark.sql.parquet.filterPushdown", "true")
```

## Task and Parallelism

```python
# Task configuration
spark.conf.set("spark.task.maxFailures", "8")
spark.conf.set("spark.speculation", "true")
spark.conf.set("spark.speculation.interval", "100ms")
spark.conf.set("spark.speculation.multiplier", "1.5")

# Default parallelism
# spark.default.parallelism = max(2, total_cores)
# spark.sql.shuffle.partitions = 200 
```

## Common Configurations by Use Case

### Batch ETL

```python
spark.conf.set("spark.executor.memory", "4g")
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.sql.shuffle.partitions", "200")
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.dynamicAllocation.enabled", "true")
```

### Machine Learning

```python
spark.conf.set("spark.executor.memory", "16g")  # More memory for ML
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.sql.shuffle.partitions", "100")
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "256m")
```

### Streaming

```python
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.executor.cores", "3")
spark.conf.set("spark.sql.shuffle.partitions", "10")  # Fewer partitions
spark.conf.set("spark.streaming.backpressure.enabled", "true")
spark.conf.set("spark.streaming.kafka.maxRatePerPartition", "1000")
```

### Interactive/Ad-hoc

```python
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.sql.shuffle.partitions", "50")
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "20")
```

## Configuration CLI Examples

```bash
# spark-submit with configuration
spark-submit \
  --class com.example.Main \
  --master yarn \
  --deploy-mode cluster \
  --num-executors 20 \
  --executor-memory 8g \
  --executor-cores 4 \
  --driver-memory 4g \
  --conf spark.sql.shuffle.partitions=200 \
  --conf spark.sql.adaptive.enabled=true \
  --conf spark.dynamicAllocation.enabled=true \
  --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
  app.jar
```

## Practice Questions

1. What is the formula for calculating total cluster resources?
2. How does `spark.memory.fraction` divide executor memory?
3. When should you enable dynamic allocation?
4. What is the recommended value for `spark.sql.shuffle.partitions`?
5. How does AQE improve shuffle partition distribution?
6. What is the advantage of Kryo serialization over Java serialization?
7. How does speculation help with straggler tasks?
8. What configuration changes would you make for a streaming workload vs batch?
9. Why is `spark.sql.shuffle.partitions` set lower for streaming?
10. How do you configure Spark for a memory-intensive ML workload?
