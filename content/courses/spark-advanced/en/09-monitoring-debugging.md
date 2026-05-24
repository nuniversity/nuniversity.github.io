---
title: "Monitoring and Debugging"
description: "Use Spark UI, history server, log analysis, metrics, and debugging strategies to diagnose and fix Spark issues"
order: 9
duration: "35-45 minutes"
difficulty: "advanced"
---

# Monitoring and Debugging

Even well-tuned Spark applications encounter issues. This lesson covers monitoring tools, debugging strategies, and diagnostic techniques for identifying and resolving performance problems and errors.

## Spark UI

The Spark UI is the primary tool for monitoring running and completed applications. Access it at `http://<driver>:4040`.

### UI Tabs Overview

| Tab | Information | How to Use |
|---|---|---|
| **Jobs** | Job-level DAG, status, duration | Identify slow jobs |
| **Stages** | Stage details, shuffle read/write, spill | Find data skew, spills |
| **Storage** | Cached RDDs/DataFrames | Verify caching is working |
| **Environment** | Configuration values | Check effective config |
| **Executors** | Per-executor metrics | Identify failing executors |
| **SQL** | SQL query plans | Optimize queries |

```python
# Enable event log for history server
spark.conf.set("spark.eventLog.enabled", "true")
spark.conf.set("spark.eventLog.dir", "hdfs://namenode:9000/spark-logs/")
```

### Reading the Stage Page

Key metrics in the Stage details:

```
- Duration: Time per task
- Shuffle Read/Write: Data shuffled
- Spill (Memory): Data spilled to memory (acceptable)
- Spill (Disk): Data spilled to disk (bad — OOM risk)
- Shuffle Read Size/Records: Look for skew (>10x average)
- GC Time: Time spent in garbage collection
```

> [!NOTE]
> Disk spill is the strongest indicator of insufficient memory. If you see any disk spill, increase executor memory or reduce partition size.

### Using the SQL Tab

```python
# View SQL query plan
spark.sql("SELECT * FROM large_table JOIN small_table ON key").explain(True)

# Enable SQL metrics
spark.conf.set("spark.sql.ui.retainedExecutions", "50")
```

## History Server

The History Server persists Spark UI data after the application ends.

```bash
# Start the history server
./sbin/start-history-server.sh

# Access at http://<host>:18080
```

```python
# Write event logs for history server
spark.conf.set("spark.eventLog.enabled", "true")
spark.conf.set("spark.eventLog.dir", "file:///tmp/spark-logs/")
spark.conf.set("spark.history.fs.logDirectory", "file:///tmp/spark-logs/")
```

## Log Analysis

### Setting Log Levels

```python
# Reduce Spark log verbosity
from pyspark import SparkContext
sc = spark.sparkContext
sc.setLogLevel("WARN")

# Levels: ALL < DEBUG < INFO < WARN < ERROR < FATAL < OFF

# Enable driver logs
# In log4j.properties:
# log4j.logger.org.apache.spark=INFO
# log4j.logger.org.apache.hadoop=WARN
```

### Capturing Executor Logs

```bash
# In spark-submit:
--conf spark.executor.extraJavaOptions=-Dlog4j.configuration=file:log4j.properties

# YARN logs
yarn logs -applicationId application_123456789_0001
```

## Metrics and Monitoring

### Built-in Metrics

```python
# Enable metrics
# conf/metrics.properties
# *.sink.servlet.class=org.apache.spark.metrics.sink.MetricsServlet
# *.source.jvm.class=org.apache.spark.metrics.source.JvmSource
```

### Custom Streaming Metrics

```python
from pyspark.sql.functions import col, count, sum, window, current_timestamp

# Track streaming progress
streaming_query = streaming_df.writeStream \
    .format("console") \
    .queryName("metrics_stream") \
    .trigger(processingTime="10 seconds") \
    .start()

# Query progress
import json
last_progress = streaming_query.lastProgress
if last_progress:
    print(f"Rows processed: {last_progress['numInputRows']}")
    print(f"Input rows per second: {last_progress['inputRowsPerSecond']}")
    print(f"Processing rate: {last_progress['processedRowsPerSecond']}")

# List active streams
for q in spark.streams.active:
    status = q.status
    print(f"Stream {q.name}: {status['message']}")
```

### Accumulators for Custom Monitoring

```python
# Custom metrics with accumulators
rows_processed = sc.accumulator(0)
errors_found = sc.accumulator(0)
bytes_processed = sc.accumulator(0.0)

def monitor_row(row):
    rows_processed.add(1)
    if row.get("status", 200) >= 400:
        errors_found.add(1)
    return row

# After action
print(f"Rows: {rows_processed.value}, Errors: {errors_found.value}")
```

## Common Errors and Solutions

### OutOfMemoryError

```
java.lang.OutOfMemoryError: Java heap space
```

```python
# Solutions:
# 1. Increase executor memory
spark.conf.set("spark.executor.memory", "8g")

# 2. Increase overhead
spark.conf.set("spark.executor.memoryOverhead", "1g")

# 3. Reduce partition size
spark.conf.set("spark.sql.shuffle.partitions", "200")

# 4. Reduce data per task
df.repartition(100)

# 5. Use DISK_ONLY for large caches
df.persist(StorageLevel.DISK_ONLY)

# 6. Enable off-heap
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")
```

### Data Skew

Tasks taking significantly longer than others:

```python
# Identify skew
def check_skew(df, key_col):
    """Identify skewed keys."""
    stats = df.groupBy(key_col).agg(
        count("*").alias("count")
    ).orderBy(col("count").desc())
    
    stats.show(10)
    top = stats.first()
    print(f"Top key: {top[key_col]} with {top['count']} rows")

# Solutions:
# 1. Salting (add random suffix to skewed keys)
# 2. Enable AQE skew join (Spark 3.x)
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# 3. Increase partitions
spark.conf.set("spark.sql.shuffle.partitions", "200")
```

### Shuffle Issues

```python
# Shuffle errors
# ERROR: ExecutorLostFailure
# ERROR: java.io.FileNotFoundException

# Solutions:
# 1. Increase shuffle buffer
spark.conf.set("spark.shuffle.file.buffer", "64k")
spark.conf.set("spark.reducer.maxSizeInFlight", "96m")

# 2. Enable shuffle tracking
spark.conf.set("spark.dynamicAllocation.shuffleTracking.enabled", "true")

# 3. Increase network timeout
spark.conf.set("spark.network.timeout", "800s")
```

### Serialization Errors

```
org.apache.spark.SparkException: Task not serializable
```

```python
# Solutions:
# 1. Make classes Serializable
class MyClass:
    def __init__(self):
        self.data = []
    def __getstate__(self):
        return self.__dict__
    def __setstate__(self, state):
        self.__dict__ = state

# 2. Use Kryo serialization
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

# 3. Define functions at module level (not inside classes)
def my_function(x):
    return x * 2

# 4. Broadcast large objects
broadcast_data = sc.broadcast(large_dictionary)
```

## Debugging Checklist

```
Q: Is the job running?
  |-- YES -> Go to Spark UI
  |-- NO -> Check error logs
  
Q: Slow tasks?
  |-- Data skew? -> Salt or increase partitions
  |-- Spilling to disk? -> Increase memory
  |-- GC overhead? -> Tune GC or use off-heap
  
Q: Job failing?
  |-- OOM? -> Increase memory, reduce partition size
  |-- Connection timeout? -> Increase network timeout
  |-- Serialization error? -> Check class serializability
  |-- File not found? -> Check paths, use hadoop fs -ls
  
Q: Wrong results?
  |-- Check join conditions
  |-- Verify null handling
  |-- Check data types
  |-- Review UDFs for correctness
```

## Performance Profiling

```python
# Profile a DataFrame transformation
import time

def time_transform(df, transform_fn, name="transform"):
    start = time.time()
    result = transform_fn(df)
    result.count()  # Force action
    duration = time.time() - start
    print(f"{name}: {duration:.2f}s")
    return result, duration

# Compare approaches
result1, t1 = time_transform(df, lambda d: d.groupBy("key").agg(sum("value")))
result2, t2 = time_transform(df, lambda d: d.groupBy("key").sum("value"))
print(f"Speedup: {t1/t2:.1f}x")

# Memory profiling
def profile_storage(df, action="count"):
    """Profile storage and memory."""
    initial = sc.getRDDStorageInfo()
    result = getattr(df, action)()
    final = sc.getRDDStorageInfo()
    
    for info in final:
        print(f"RDD: {info.name}")
        print(f"  Memory: {info.memSize / 1024**2:.0f} MB")
        print(f"  Disk: {info.diskSize / 1024**2:.0f} MB")
    
    return result
```

## Practice Questions

1. What information does each Spark UI tab provide?
2. How does the History Server differ from the live Spark UI?
3. What metrics on the Stage page indicate performance problems?
4. How do you enable event logging for the History Server?
5. What does disk spill indicate and how do you fix it?
6. How do you identify and fix data skew?
7. What causes "Task not serializable" and how do you fix it?
8. How do you use accumulators for custom monitoring?
9. How would you debug a job that runs fine on small data but fails on large data?
10. How do you access and parse executor logs?
