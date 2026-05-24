---
title: "Reading and Writing Data Sources"
description: "Master reading/writing CSV, JSON, Parquet, Avro, and ORC formats with partitioning, save modes, and compression"
order: 7
duration: "35-45 minutes"
difficulty: "intermediate"
---

# Reading and Writing Data Sources

Spark supports numerous data formats, each with trade-offs for performance, schema support, and compression. Choosing the right format and write strategy is crucial for building efficient data pipelines.

## Supported Formats

| Format | Schema | Compression | Splittable | Best For |
|---|---|---|---|---|
| **Parquet** | Yes (native) | Snappy, gzip, zstd | Yes | Analytics, columnar access |
| **ORC** | Yes (native) | Snappy, zlib, zstd | Yes | Hive/ACID workloads |
| **Avro** | Yes (embedded) | Snappy, deflate | Yes | Streaming, Kafka |
| **JSON** | Schema inferred | gzip | Yes (line-delimited) | Semi-structured, interoperability |
| **CSV** | Schema inferred | gzip | Yes | Legacy systems, simple tables |

## Reading Data Sources

### Parquet (Columnar, Default)

```python
# Read Parquet (schema preserved natively)
df = spark.read.parquet("data/sales.parquet")

# Read with schema pruning (only read needed columns)
df = spark.read.parquet("data/sales.parquet").select("date", "amount")

# Read partitioned Parquet
df = spark.read.parquet("data/sales/", basePath="data/sales/")
```

> [!SUCCESS]
> Parquet is the recommended format for analytics. Its columnar storage, predicate pushdown, and schema preservation make it the most performant choice for Spark.

### ORC (Optimized Row Columnar)

```python
# Read ORC
df = spark.read.orc("data/sales.orc")

# With schema
schema = StructType([...])
df = spark.read.schema(schema).orc("data/sales.orc")
```

### Avro (Row-Based)

```python
# Read Avro (requires spark-avro package)
df = spark.read.format("avro").load("data/events.avro")

# Read specific Avro schema version
df = spark.read \
    .option("avroSchema", '{"type":"record","name":"Event","fields":[{"name":"id","type":"int"}]}') \
    .format("avro") \
    .load("data/specific.avro")
```

### CSV

```python
# Read CSV with full options
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("sep", ",") \
    .option("quote", "\"") \
    .option("escape", "\\") \
    .option("mode", "PERMISSIVE") \
    .option("nullValue", "NULL") \
    .option("dateFormat", "yyyy-MM-dd") \
    .option("timestampFormat", "yyyy-MM-dd HH:mm:ss") \
    .option("maxColumns", "2048") \
    .csv("data/people.csv")
```

> [!WARNING]
> CSV has no native schema. Inference requires an extra pass over data. Always provide an explicit schema for production pipelines.

### JSON

```python
# Read JSON Lines (one JSON object per line)
df = spark.read.json("data/events.json")

# Read multi-line JSON
df = spark.read \
    .option("multiLine", "true") \
    .option("primitivesAsString", "false") \
    .option("prefersDecimal", "false") \
    .option("allowComments", "false") \
    .option("allowUnquotedFieldNames", "false") \
    .json("data/nested_data.json")

# Read compressed JSON
df = spark.read.json("data/events.json.gz")
```

## Writing Data Sources

### Write Modes

```python
# Overwrite (replace existing data)
df.write.mode("overwrite").parquet("output/")

# Append (add to existing data)
df.write.mode("append").parquet("output/")

# Ignore (do nothing if output exists)
df.write.mode("ignore").parquet("output/")

# ErrorIfExists (default — fail if output exists)
df.write.mode("errorifexists").parquet("output/")
```

> [!NOTE]
> `overwrite` replaces the entire output directory, not individual files. If you want to overwrite only specific partitions, use dynamic partition overwrite.

### Writing with Partitioning

```python
# Partition by one or more columns
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales_partitioned")

# Dynamic partition overwrite (only overwrites matched partitions)
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales_partitioned")
```

### Writing with Compression

```python
# Parquet compression
df.write \
    .option("compression", "snappy") \
    .parquet("output/sales_snappy.parquet")

# Available codecs: snappy, gzip, lzo, brotli, lz4, zstd
# Snappy: Fast + moderate compression (best for most use cases)
# Gzip: Slow + high compression (archival, slow storage)
# Zstd: Fast + good compression (balance)

# ORC compression
df.write \
    .option("compression", "zlib") \
    .orc("output/sales.orc")

# CSV compression
df.write \
    .option("compression", "gzip") \
    .csv("output/sales_csv_gz/")

# JSON compression
df.write \
    .option("compression", "gzip") \
    .json("output/sales_json_gz/")
```

## Advanced Write Options

```python
# Control output file count
df.coalesce(4).write.parquet("output/")  # 4 output files
df.repartition(10).write.parquet("output/")  # 10 output files

# Max records per file (avoid small files)
df.write \
    .option("maxRecordsPerFile", 500000) \
    .parquet("output/")

# Single file output
df.coalesce(1).write \
    .option("header", "true") \
    .csv("output/single_file.csv")
```

## Reading from Multiple Sources

```python
# Read all Parquet files in a directory
df = spark.read.parquet("data/year=2024/*/")

# Read with path globs
df = spark.read \
    .option("basePath", "data/") \
    .parquet("data/year=2024/month=*/day=*/")

# Read multiple specific paths
df = spark.read.parquet("data/sales_2024.parquet", "data/sales_2025.parquet")
```

## Schema Merging

```python
# Parquet schema merging (two files with different schemas)
spark.conf.set("spark.sql.parquet.mergeSchema", "true")

df1 = spark.createDataFrame([(1, "Alice")], ["id", "name"])
df1.write.mode("overwrite").parquet("data/merge_test/")

df2 = spark.createDataFrame([(2, 50000)], ["id", "salary"])
df2.write.mode("append").parquet("data/merge_test/")

merged = spark.read.parquet("data/merge_test/")
merged.printSchema()
# id, name, salary  (all columns merged)
```

> [!WARNING]
> Schema merging is expensive — it requires reading all files to discover their schemas before processing. Use it only when necessary.

## Format Conversion Examples

```python
# CSV to Parquet (common ETL pattern)
df_csv = spark.read.option("header", "true").csv("data/input/")
df_csv.write.parquet("data/processed/")

# JSON to ORC (for Hive compatibility)
df_json = spark.read.json("data/events.json")
df_json.write.orc("data/events_processed/")

# Parquet to Avro (for Kafka sink)
df_parquet = spark.read.parquet("data/sales.parquet")
df_parquet.write.format("avro").save("data/sales_avro/")
```

## Data Source Performance Comparison

| Operation | Parquet | ORC | Avro | JSON | CSV |
|---|---|---|---|---|---|
| **Read speed** | Fastest | Fast | Moderate | Slow | Slow |
| **Write speed** | Moderate | Slow | Fast | Moderate | Fast |
| **Compression ratio** | 4-8x | 5-10x | 2-4x | 2-5x | 2-5x |
| **Schema evolution** | Good | Good | Excellent | Good | Poor |
| **Splittable** | Yes | Yes | Yes | Yes (line) | Yes |
| **Nested data** | Excellent | Excellent | Good | Native | Poor |

## Practice Questions

1. What are the advantages of Parquet over CSV for analytics workloads?
2. How do write modes (overwrite, append, ignore) differ?
3. When would you use Avro instead of Parquet?
4. What compression codec offers the best balance of speed and compression?
5. How do you control the number of output files when writing?
6. What is dynamic partition overwrite and when is it useful?
7. How does schema merging work in Parquet?
8. What is the purpose of `maxRecordsPerFile`?
9. How do you read data from multiple partitioned directories?
10. How do you convert a CSV dataset to Parquet efficiently?
