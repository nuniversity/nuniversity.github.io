---
title: "Installing Spark and SparkSession"
description: "Install Apache Spark locally, set up PySpark, configure SparkSession, and verify your installation"
order: 3
duration: "30-40 minutes"
difficulty: "beginner"
---

# Installing Spark and SparkSession

Before writing Spark code, you need a working installation. This guide covers installing Spark locally, configuring PySpark, and understanding the SparkSession entry point.

## Prerequisites

- **Java 8/11/17**: Spark runs on the JVM. Install OpenJDK.
- **Python 3.8+**: Required for PySpark.
- **pip**: Python package manager.

```bash
# Check prerequisites
java -version
python --version
pip --version
```

> [!NOTE]
> Spark 3.5.x requires Java 17 support (runs on Java 8/11/17). Spark 3.4 and earlier work best with Java 11.

## Installing Spark

### Option 1: Using pip (PySpark only)

The simplest way to get started with PySpark:

```bash
pip install pyspark
```

This installs PySpark and a pre-built Spark runtime. No separate Spark download needed.

### Option 2: Manual Installation

Download from [spark.apache.org/downloads.html](https://spark.apache.org/downloads.html).

```bash
# Extract Spark
wget https://dlcdn.apache.org/spark/spark-3.5.1/spark-3.5.1-bin-hadoop3.tgz
tar -xzf spark-3.5.1-bin-hadoop3.tgz
sudo mv spark-3.5.1-bin-hadoop3 /opt/spark

# Set environment variables
echo 'export SPARK_HOME=/opt/spark' >> ~/.bashrc
echo 'export PATH=$SPARK_HOME/bin:$PATH' >> ~/.bashrc
echo 'export PYTHONPATH=$SPARK_HOME/python:$PYTHONPATH' >> ~/.bashrc
source ~/.bashrc
```

### Verify Installation

```bash
# Run Spark shell
pyspark

# Or run a quick test
spark-submit --version
```

> [!SUCCESS]
> Running `pyspark` launches an interactive Spark session. You're ready to write Spark code!

## SparkSession

`SparkSession` is the unified entry point for all Spark functionality. It replaces `SparkContext`, `SQLContext`, and `HiveContext` from older versions.

### Creating a SparkSession

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("MyFirstApp") \
    .config("spark.sql.shuffle.partitions", "4") \
    .config("spark.executor.memory", "2g") \
    .getOrCreate()
```

> [!NOTE]
> `getOrCreate()` reuses an existing SparkSession if one exists, preventing errors when running in the Spark shell or notebook environments where a session may already be active.

### Key Configuration Options

| Config Key | Default | Description |
|---|---|---|
| `spark.app.name` | (none) | Application name for UI |
| `spark.master` | `local[*]` | Cluster URL or `local[N]` |
| `spark.sql.shuffle.partitions` | `200` | Partitions for shuffles |
| `spark.executor.memory` | `1g` | Memory per executor |
| `spark.driver.memory` | `1g` | Memory for driver |
| `spark.executor.cores` | `1` | Cores per executor |
| `spark.sql.adaptive.enabled` | `true` | AQE optimization |

### Local Mode

For development and testing, use local mode:

```python
# Use all available cores
spark = SparkSession.builder \
    .appName("LocalMode") \
    .master("local[*]") \
    .getOrCreate()

# Use exactly 4 cores
spark = SparkSession.builder \
    .appName("LocalMode") \
    .master("local[4]") \
    .getOrCreate()
```

> [!WARNING]
> Local mode runs everything in a single JVM. It's great for learning and small tests but does not simulate real distributed behavior. Race conditions or serialization bugs may only appear in cluster mode.

## PySpark Configuration Methods

### Using config() method

```python
spark = SparkSession.builder \
    .appName("ConfigExample") \
    .config("spark.sql.shuffle.partitions", "50") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .getOrCreate()
```

### Using a configuration dictionary

```python
conf = {
    "spark.sql.shuffle.partitions": "50",
    "spark.sql.adaptive.enabled": "true",
    "spark.executor.memory": "4g",
    "spark.driver.memory": "2g"
}

spark = SparkSession.builder \
    .appName("DictConfig") \
    .config(map=conf) \
    .getOrCreate()
```

### Using spark-defaults.conf

Create `$SPARK_HOME/conf/spark-defaults.conf`:

```
spark.master                     yarn
spark.executor.memory            8g
spark.driver.memory              2g
spark.sql.shuffle.partitions     200
spark.sql.adaptive.enabled       true
```

## Verifying SparkSession

```python
# Check Spark session is working
print(spark.version)
print(spark.sparkContext.defaultParallelism)

# Simple sanity check
df = spark.range(1, 100)
print(df.count())
```

## Environment-Specific Setup

### Google Colab / Jupyter

```python
!pip install pyspark

from pyspark.sql import SparkSession
spark = SparkSession.builder \
    .appName("ColabDemo") \
    .master("local[*]") \
    .getOrCreate()
```

### Databricks

Databricks notebooks have a pre-configured `spark` variable. No setup needed.

```python
# Databricks — spark already exists
display(spark.range(10))
```

### Docker

```bash
docker run -it --rm \
  -p 8888:8888 \
  -v $(pwd):/home/jovyan/work \
  jupyter/pyspark-notebook
```

## Common Installation Issues

| Issue | Solution |
|---|---|
| `java not found` | Install JDK 8/11/17 and set `JAVA_HOME` |
| `Py4JJavaError` | Version mismatch between PySpark and Spark |
| `OutOfMemoryError` | Increase `spark.driver.memory` |
| `ModuleNotFoundError: pyspark` | Activate virtual environment or reinstall |
| `HADOOP_HOME` warning | Set `HADOOP_HOME` or ignore on Windows without Hadoop |

## Key Takeaways

1. Install PySpark via `pip install pyspark` for the quickest setup
2. `SparkSession` is the unified entry point for all Spark APIs
3. `local[N]` runs on N cores in a single JVM for development
4. Configuration can be set programmatically or via config files
5. Different environments (Colab, Databricks, Docker) have specific setup steps

## Practice Questions

1. What is the difference between `SparkContext` and `SparkSession`?
2. What does `master("local[*]")` mean?
3. How do you set the amount of memory allocated to each executor?
4. What is the purpose of `getOrCreate()` vs `create()`?
5. How would you configure the number of shuffle partitions?
6. What installation methods are available for PySpark?
7. Why might a `Py4JJavaError` occur?
8. How do you check which version of Spark is running?
9. What environment variables are needed for a manual Spark installation?
10. How does Spark configuration in `spark-defaults.conf` differ from programmatic config?
