---
title: "ETL Best Practices"
description: "Design robust ETL pipelines with incremental loads, late data handling, schema evolution, and production best practices"
order: 8
duration: "35-45 minutes"
difficulty: "intermediate"
---

# ETL Best Practices

Extract, Transform, Load (ETL) pipelines are the backbone of data engineering. This lesson covers production-ready patterns for building reliable, maintainable, and efficient Spark ETL pipelines.

## ETL Pipeline Architecture

```
Source Systems
  (DB, Kafka, APIs, Files)
       |
   Extract
       |
   Staging Area (Raw)
       |
   Transform (Clean, Enrich)
       |
   Load (Curated)
       |
   Consumption Layer
  (BI, ML, Analytics)
```

```python
# Basic ETL Pipeline Structure
def extract(spark, source_config):
    """Extract raw data from source."""
    if source_config["type"] == "csv":
        return spark.read \
            .option("header", "true") \
            .option("inferSchema", "false") \
            .schema(source_config["schema"]) \
            .csv(source_config["path"])
    elif source_config["type"] == "jdbc":
        return spark.read \
            .format("jdbc") \
            .option("url", source_config["url"]) \
            .option("dbtable", source_config["table"]) \
            .option("user", source_config["user"]) \
            .option("password", source_config["password"]) \
            .load()

def transform(df):
    """Apply business logic transformations."""
    return df \
        .filter(col("amount").isNotNull()) \
        .withColumn("processed_date", current_date()) \
        .withColumn("amount_usd", when(col("currency") == "EUR", col("amount") * 1.18)
                                   .otherwise(col("amount")))

def load(df, target_config):
    """Write cleaned data to target."""
    df.write \
        .mode(target_config.get("mode", "append")) \
        .partitionBy(target_config.get("partition_cols", [])) \
        .option("compression", "snappy") \
        .format(target_config.get("format", "parquet")) \
        .save(target_config["path"])
```

## Incremental Loads

Full loads become impractical as data grows. Incremental loads process only new or changed data.

```python
# Incremental load pattern using watermark
def incremental_load(spark, source_table, watermark_col, last_run):
    """Load only records newer than last_run."""
    
    df = spark.read \
        .format("jdbc") \
        .option("url", source_config["url"]) \
        .option("dbtable", f"""
            (SELECT * FROM {source_table}
             WHERE {watermark_col} > '{last_run}'
             AND {watermark_col} <= '{current_run}') tmp
        """) \
        .load()
    
    return df

# Write to partitioned table
df.write \
    .mode("append") \
    .partitionBy("year", "month", "day") \
    .parquet("data/sales/")
```

> [!NOTE]
> For incremental loads, always store the last successful watermark (max timestamp processed) in a metadata table, file, or database. This enables recovery and prevents data loss.

### Change Data Capture (CDC)

```python
# Handling CDC (inserts, updates, deletes)
def process_cdc(cdc_df):
    """Apply CDC changes to target table."""
    
    # Separate operations
    inserts = cdc_df.filter(col("operation") == "I")
    updates = cdc_df.filter(col("operation") == "U")
    deletes = cdc_df.filter(col("operation") == "D")
    
    # Current state
    current = spark.read.parquet("data/target/")
    
    # Apply deletes
    remaining = current.join(
        deletes.select("id"),
        on="id",
        how="left_anti"
    )
    
    # Apply upserts
    from delta.tables import DeltaTable  # Requires Delta Lake
    # See Delta Lake lesson (Advanced course) for merge details
    return remaining
```

## Handling Late Data

Late-arriving data can corrupt aggregations and reports.

```python
from pyspark.sql.functions import current_timestamp, col

# Strategy 1: Partition overwrite
def handle_late_data(late_df, target_path):
    """Reprocess only affected partitions."""
    
    # Determine affected partitions
    affected_partitions = late_df \
        .select(col("event_date")) \
        .distinct() \
        .collect()
    
    for row in affected_partitions:
        date = row.event_date
        
        # Read existing partition
        existing = spark.read \
            .parquet(f"{target_path}/event_date={date}")
        
        # Merge with late data
        updated = existing.union(late_df.filter(col("event_date") == date))
        
        # Overwrite partition
        updated.write \
            .mode("overwrite") \
            .option("partitionOverwriteMode", "dynamic") \
            .parquet(target_path)

# Strategy 2: Watermark-based reprocessing
def reprocess_late_data(spark, source_path, watermark_days=3):
    """Reprocess last N days including late arrivals."""
    
    cutoff_date = date.today() - timedelta(days=watermark_days)
    
    df = spark.read \
        .option("basePath", source_path) \
        .parquet(f"{source_path}/event_date > '{cutoff_date}'/")
    
    return df.transform(apply_business_logic)
```

> [!WARNING]
> Late data handling is a complex trade-off. Setting a short reprocessing window (1-2 days) captures most late data while limiting cost. Longer windows increase accuracy but also increase processing time and storage.

## Schema Evolution

Data sources change over time. Production pipelines must handle schema evolution gracefully.

```python
# Schema evolution strategies

# Strategy 1: Merge schema (Parquet)
spark.conf.set("spark.sql.parquet.mergeSchema", "true")
df = spark.read.parquet("data/evolving_source/")

# Strategy 2: Use case-insensitive schema
spark.conf.set("spark.sql.caseSensitive", "false")

# Strategy 3: Column default values
def safe_read_with_evolution(spark, path, expected_schema):
    """Read data, adding missing columns with null defaults."""
    
    df = spark.read.parquet(path)
    existing_cols = set(df.columns)
    
    for field in expected_schema.fields:
        if field.name not in existing_cols:
            df = df.withColumn(field.name, lit(None).cast(field.dataType))
    
    return df.select([f.name for f in expected_schema.fields])

# Strategy 4: Dynamic column handling
def handle_new_columns(df, known_columns):
    """Separate known and unknown columns."""
    
    new_cols = [c for c in df.columns if c not in known_columns]
    
    known_df = df.select(*known_columns)
    if new_cols:
        # Log new columns
        print(f"New columns detected: {new_cols}")
        # Store raw data for later processing
        df.select("id", *new_cols).write.json("data/new_columns/")
    
    return known_df
```

## Quality Checks

```python
def run_quality_checks(df, checks):
    """Run data quality checks and fail if violations exceed threshold."""
    
    results = {}
    for check in checks:
        check_name = check["name"]
        condition = check["condition"]
        threshold = check.get("threshold", 0)
        
        violation_count = df.filter(~expr(condition)).count()
        violation_pct = violation_count / df.count() * 100
        
        results[check_name] = {
            "violations": violation_count,
            "percentage": violation_pct,
            "passed": violation_pct <= threshold
        }
        
        if not results[check_name]["passed"]:
            print(f"QUALITY CHECK FAILED: {check_name}")
            print(f"  Violations: {violation_count} ({violation_pct:.2f}%)")
    
    # Fail pipeline if critical checks fail
    critical_failures = [r for r in results.values() 
                        if not r["passed"]]
    if critical_failures:
        raise Exception(f"{len(critical_failures)} quality checks failed")
    
    return results

# Example quality checks
quality_checks = [
    {"name": "no_null_keys", "condition": "id IS NOT NULL", "threshold": 0},
    {"name": "positive_amount", "condition": "amount > 0", "threshold": 0.1},
    {"name": "valid_dates", "condition": "event_date <= current_date()", "threshold": 0},
]

run_quality_checks(df, quality_checks)
```

## Pipeline Modularity

```python
# Reusable ETL components

class ETLPipeline:
    def __init__(self, spark, config):
        self.spark = spark
        self.config = config
        self.audit_log = []
    
    def extract(self):
        """Extract from source."""
        self._log("Starting extract")
        df = self._read_source()
        self._log(f"Extracted {df.count()} rows")
        return df
    
    def transform(self, df):
        """Apply transformations."""
        self._log("Starting transform")
        for transform_fn in self.config["transforms"]:
            df = transform_fn(df)
        self._log(f"Transform complete: {df.count()} rows")
        return df
    
    def validate(self, df):
        """Run quality checks."""
        self._log("Starting validation")
        run_quality_checks(df, self.config["quality_checks"])
        return df
    
    def load(self, df):
        """Load to target."""
        self._log("Starting load")
        df.write \
            .mode(self.config["write_mode"]) \
            .partitionBy(self.config["partition_cols"]) \
            .parquet(self.config["target_path"])
        self._log(f"Loaded {df.count()} rows")
    
    def run(self):
        """Execute pipeline."""
        df = self.extract()
        df = self.transform(df)
        df = self.validate(df)
        self.load(df)
        return self.audit_log
    
    def _log(self, message):
        self.audit_log.append({
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "pipeline": self.config["name"]
        })
```

## Production Checklist

1. **Incremental processing** — Never full-scan growing tables
2. **Idempotent pipelines** — Re-running produces same result
3. **Schema evolution** — Handle column additions gracefully
4. **Watermark tracking** — Store last successful run timestamp
5. **Quality checks** — Validate before loading
6. **Partitioned output** — Organize for query efficiency
7. **Audit logging** — Track rows processed, failures, runtime
8. **Error handling** — Try/catch with retry logic
9. **Resource configuration** — Right-size executor resources

## Practice Questions

1. What is the difference between full load and incremental load?
2. How do you track watermarks for incremental processing?
3. What strategies can handle late-arriving data?
4. How do you manage schema evolution when source schemas change?
5. What are the critical quality checks for an ETL pipeline?
6. Why is idempotency important in ETL pipelines?
7. How do you handle change data capture (CDC) in Spark?
8. What logging and auditing should ETL pipelines include?
9. How do you reprocess data when business logic changes?
10. Design an ETL pipeline for daily sales data from a PostgreSQL database.
