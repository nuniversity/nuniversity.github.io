---
title: "Python for Data Engineering"
description: "A comprehensive foundation in Python for data engineering, covering essential libraries, best practices, and hands-on implementations. You'll learn to build robust, performant data pipelines using modern tools like Polars and PyArrow."
order: 4
duration: "15 minutes"
difficulty: "beginner"
---

**Prerequisites:**
- Basic Python knowledge
- Understanding of data structures
- Familiarity with command-line operations

**Learning Outcomes:**
By the end of this module, you will be able to:
- Build efficient data pipelines using Polars
- Implement production-grade error handling and logging
- Work with columnar data formats using PyArrow
- Write testable, maintainable data engineering code
- Apply performance optimization techniques

## Python Fundamentals Review

### Data Structures

Python provides four fundamental data structures that are essential for data engineering tasks.

#### Lists

Lists are ordered, mutable sequences ideal for storing collections of items.

```
# Creating and manipulating lists
data_sources = ['postgres', 'mongodb', 'api']
data_sources.append('s3')
data_sources.extend(['kafka', 'redis'])

# List indexing and slicing
first_source = data_sources[0]  # 'postgres'
last_two = data_sources[-2:]    # ['kafka', 'redis']

# Common operations
sorted_sources = sorted(data_sources)
unique_count = len(set(data_sources))
```

**Use Cases in Data Engineering:**
- Storing processing steps in ETL pipelines
- Managing lists of file paths
- Accumulating validation errors

#### Dictionaries

Dictionaries store key-value pairs, providing O(1) lookup time.

```python
# Database configuration
db_config = {
    'host': 'localhost',
    'port': 5432,
    'database': 'analytics',
    'user': 'data_engineer'
}

# Accessing values
host = db_config['host']
port = db_config.get('port', 5432)  # With default

# Iterating
for key, value in db_config.items():
    print(f"{key}: {value}")

# Dictionary comprehension
env_vars = {k: v for k, v in db_config.items() if k != 'user'}

# Merging dictionaries (Python 3.9+)
defaults = {'timeout': 30, 'retries': 3}
full_config = defaults | db_config
```

**Use Cases in Data Engineering:**
- Configuration management
- Metadata storage
- Lookup tables and mappings

#### Sets

Sets are unordered collections of unique elements.

```python
# Deduplication
processed_ids = {101, 102, 103, 102, 101}  # {101, 102, 103}

# Set operations
current_tables = {'users', 'orders', 'products'}
required_tables = {'users', 'orders', 'inventory'}

missing_tables = required_tables - current_tables  # {'inventory'}
common_tables = current_tables & required_tables   # {'users', 'orders'}
all_tables = current_tables | required_tables      # Union

# Membership testing (O(1))
if 'users' in current_tables:
    print("Users table exists")
```

**Use Cases in Data Engineering:**
- Removing duplicates
- Tracking processed records
- Schema validation

#### Tuples

Tuples are immutable sequences, often used for fixed collections.

```python
# Database connection tuple
connection = ('localhost', 5432, 'postgres')
host, port, database = connection  # Unpacking

# Named tuples for clarity
from collections import namedtuple

Connection = namedtuple('Connection', ['host', 'port', 'database'])
conn = Connection('localhost', 5432, 'postgres')
print(conn.host)  # More readable than conn[0]

# Using as dictionary keys (immutable)
pipeline_cache = {
    ('extract', 'users'): 'completed',
    ('transform', 'users'): 'in_progress'
}
```

**Use Cases in Data Engineering:**
- Return multiple values from functions
- Immutable configuration
- Dictionary keys for complex lookups

### Functions and Lambda Expressions

#### Function Fundamentals

```python
def extract_data(source: str, date: str, limit: int = 1000) -> list:
    """
    Extract data from a specified source.
    
    Args:
        source: Data source identifier
        date: Date in YYYY-MM-DD format
        limit: Maximum number of records to extract
        
    Returns:
        List of extracted records
    """
    print(f"Extracting from {source} for {date}")
    # Extraction logic here
    return []

# Function with keyword arguments
result = extract_data(source='api', date='2025-01-01', limit=500)
```

#### Advanced Function Patterns

```python
# Functions returning functions
def create_validator(min_value: float):
    def validate(value: float) -> bool:
        return value >= min_value
    return validate

is_positive = create_validator(0)
is_positive(5)  # True

# Decorators for data pipelines
from functools import wraps
import time

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        print(f"{func.__name__} took {duration:.2f}s")
        return result
    return wrapper

@timing_decorator
def process_large_dataset(data):
    # Processing logic
    time.sleep(1)
    return data

# *args and **kwargs
def flexible_pipeline(*steps, **config):
    """Execute variable number of pipeline steps."""
    for step in steps:
        step(**config)
```

#### Lambda Expressions

Lambda functions are anonymous, single-expression functions.

```python
# Basic lambda
square = lambda x: x ** 2
square(5)  # 25

# Common use cases
data = [1, 2, 3, 4, 5]

# With map
doubled = list(map(lambda x: x * 2, data))

# With filter
evens = list(filter(lambda x: x % 2 == 0, data))

# With sorted
records = [
    {'name': 'Alice', 'age': 30},
    {'name': 'Bob', 'age': 25}
]
sorted_by_age = sorted(records, key=lambda x: x['age'])

# In data transformations
transformations = {
    'uppercase': lambda x: x.upper(),
    'lowercase': lambda x: x.lower(),
    'titlecase': lambda x: x.title()
}

text = "hello world"
transformed = transformations['uppercase'](text)
```

**When to Use Lambdas:**
- Simple, one-line operations
- Sorting with custom keys
- Quick transformations in `map`, `filter`

**When to Avoid:**
- Complex logic (use regular functions)
- Need for documentation
- Reusable operations

### List Comprehensions and Generators

#### List Comprehensions

List comprehensions provide concise syntax for creating lists.

```python
# Basic syntax: [expression for item in iterable if condition]

# Traditional approach
squares = []
for x in range(10):
    squares.append(x ** 2)

# List comprehension
squares = [x ** 2 for x in range(10)]

# With condition
even_squares = [x ** 2 for x in range(10) if x % 2 == 0]

# Nested comprehensions
matrix = [[i + j for j in range(3)] for i in range(3)]
# [[0, 1, 2], [1, 2, 3], [2, 3, 4]]

# Flattening nested structures
nested = [[1, 2], [3, 4], [5, 6]]
flat = [item for sublist in nested for item in sublist]
# [1, 2, 3, 4, 5, 6]

# Data engineering examples
file_paths = [
    f"data/year={year}/month={month:02d}/data.parquet"
    for year in range(2023, 2026)
    for month in range(1, 13)
]

# Transforming dictionaries
records = [{'id': 1, 'value': 10}, {'id': 2, 'value': 20}]
values = [r['value'] for r in records if r['value'] > 15]
```

#### Dictionary and Set Comprehensions

```python
# Dictionary comprehension
config = ['host=localhost', 'port=5432', 'db=analytics']
config_dict = {
    item.split('=')[0]: item.split('=')[1]
    for item in config
}

# Set comprehension
file_extensions = {path.split('.')[-1] for path in file_paths}

# Swapping keys and values
original = {'a': 1, 'b': 2, 'c': 3}
swapped = {v: k for k, v in original.items()}
```

#### Generators

Generators produce values lazily, one at a time, making them memory-efficient.

```python
# Generator expression (similar to list comprehension)
squares_gen = (x ** 2 for x in range(1000000))  # No memory allocation yet

# Only computes values when needed
for square in squares_gen:
    if square > 100:
        break

# Generator function
def read_large_file(file_path):
    """Yield lines one at a time instead of loading entire file."""
    with open(file_path, 'r') as f:
        for line in f:
            yield line.strip()

# Usage
for line in read_large_file('huge_file.csv'):
    process_line(line)

# Chaining generators
def filter_records(records):
    """Filter out invalid records."""
    for record in records:
        if record.get('valid'):
            yield record

def transform_records(records):
    """Transform valid records."""
    for record in records:
        yield {**record, 'processed': True}

# Pipeline
raw_data = read_large_file('data.jsonl')
valid_data = filter_records(raw_data)
processed_data = transform_records(valid_data)

# Data engineering pattern: batch processing
def batch_generator(iterable, batch_size):
    """Yield batches of items."""
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) == batch_size:
            yield batch
            batch = []
    if batch:  # Don't forget remaining items
        yield batch

# Usage
for batch in batch_generator(range(1000), batch_size=100):
    process_batch(batch)
```

**List vs Generator:**
- Lists: Use when you need the entire collection in memory, random access, or multiple iterations
- Generators: Use for large datasets, one-time iteration, or memory constraints

### Exception Handling and Logging

#### Exception Handling Fundamentals

```python
# Basic try-except
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"Error: {e}")

# Multiple exceptions
try:
    data = fetch_data('api_endpoint')
    process_data(data)
except ConnectionError:
    print("Failed to connect to API")
except ValueError as e:
    print(f"Invalid data format: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")

# Finally clause
def save_to_database(data):
    connection = None
    try:
        connection = create_connection()
        connection.insert(data)
    except DatabaseError as e:
        print(f"Database error: {e}")
        raise
    finally:
        if connection:
            connection.close()  # Always executed

# Else clause
try:
    data = load_data()
except FileNotFoundError:
    print("File not found")
else:
    # Only runs if no exception occurred
    process_data(data)
```

#### Custom Exceptions

```python
class DataValidationError(Exception):
    """Raised when data validation fails."""
    pass

class PipelineError(Exception):
    """Base exception for pipeline errors."""
    pass

class ExtractionError(PipelineError):
    """Raised during data extraction."""
    pass

class TransformationError(PipelineError):
    """Raised during data transformation."""
    pass

# Using custom exceptions
def validate_schema(data, required_columns):
    missing = set(required_columns) - set(data.columns)
    if missing:
        raise DataValidationError(
            f"Missing required columns: {missing}"
        )
```

#### Exception Handling Patterns for Data Engineering

```python
# Retry pattern
import time
from typing import Callable, Any

def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    backoff_factor: float = 2.0
) -> Any:
    """Retry function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = backoff_factor ** attempt
            print(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
            time.sleep(wait_time)

# Usage
def fetch_api_data():
    # API call that might fail
    pass

result = retry_with_backoff(fetch_api_data, max_retries=5)

# Context manager for error handling
from contextlib import contextmanager

@contextmanager
def error_handler(step_name: str):
    """Context manager for consistent error handling."""
    try:
        print(f"Starting: {step_name}")
        yield
        print(f"Completed: {step_name}")
    except Exception as e:
        print(f"Failed: {step_name} - {e}")
        raise

# Usage
with error_handler("Data Extraction"):
    data = extract_data()

with error_handler("Data Transformation"):
    transformed = transform_data(data)
```

#### Logging

Logging is essential for monitoring production data pipelines.

```python
import logging
from pathlib import Path

# Basic logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pipeline.log'),
        logging.StreamHandler()  # Also print to console
    ]
)

logger = logging.getLogger(__name__)

# Logging levels
logger.debug("Detailed diagnostic information")
logger.info("General informational messages")
logger.warning("Warning messages")
logger.error("Error messages")
logger.critical("Critical errors")

# Logging in functions
def process_file(file_path: str):
    logger.info(f"Processing file: {file_path}")
    try:
        # Processing logic
        logger.debug(f"File size: {Path(file_path).stat().st_size} bytes")
        result = perform_processing()
        logger.info(f"Successfully processed {file_path}")
        return result
    except Exception as e:
        logger.error(f"Failed to process {file_path}: {e}", exc_info=True)
        raise

# Advanced logging configuration
def setup_logging(log_file: str, level: str = "INFO"):
    """Configure logging with rotation."""
    from logging.handlers import RotatingFileHandler
    
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level))
    
    # Rotating file handler (max 10MB, keep 5 backups)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5
    )
    file_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    )
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(
        logging.Formatter('%(levelname)s - %(message)s')
    )
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# Structured logging
def log_pipeline_metrics(step: str, duration: float, records: int):
    logger.info(
        "Pipeline metrics",
        extra={
            'step': step,
            'duration_seconds': duration,
            'records_processed': records
        }
    )

# Logging with context
class PipelineLogger:
    def __init__(self, pipeline_id: str):
        self.pipeline_id = pipeline_id
        self.logger = logging.getLogger(__name__)
    
    def log(self, level: str, message: str, **kwargs):
        log_func = getattr(self.logger, level)
        log_func(f"[Pipeline {self.pipeline_id}] {message}", extra=kwargs)

# Usage
pipeline_logger = PipelineLogger("ETL_001")
pipeline_logger.log("info", "Starting extraction", source="postgres")
```

**Best Practices:**
- Use appropriate log levels
- Include context in log messages
- Log before and after critical operations
- Use structured logging for metrics
- Implement log rotation for production
- Never log sensitive data (passwords, PII)

---

## Working with Polars

Polars is a blazingly fast DataFrame library built in Rust with a Python API. It's designed for performance and handles larger-than-memory datasets efficiently.

### Introduction to Polars DataFrame Library

#### Why Polars?

**Advantages:**
- 10-100x faster than Pandas for many operations
- Better memory efficiency
- Built-in lazy evaluation
- Parallel processing by default
- Expressive API similar to Pandas
- Native support for Arrow memory format

#### Installation

```bash
pip install polars
```

#### Basic DataFrame Operations

```python
import polars as pl
from datetime import datetime, date

# Creating DataFrames
df = pl.DataFrame({
    'user_id': [1, 2, 3, 4, 5],
    'name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'age': [25, 30, 35, 28, 32],
    'city': ['New York', 'London', 'Paris', 'Tokyo', 'Berlin'],
    'signup_date': [
        date(2023, 1, 15),
        date(2023, 2, 20),
        date(2023, 3, 10),
        date(2023, 4, 5),
        date(2023, 5, 12)
    ]
})

# Viewing data
print(df)
print(df.head(3))
print(df.describe())

# Schema inspection
print(df.schema)
print(df.dtypes)
print(df.columns)
print(df.shape)

# Selecting columns
names = df.select('name')
multiple = df.select(['name', 'age'])

# Using expressions
selected = df.select([
    pl.col('name'),
    pl.col('age')
])

# Column operations
df_with_new = df.with_columns([
    (pl.col('age') + 10).alias('age_in_10_years'),
    pl.col('name').str.to_uppercase().alias('name_upper')
])

# Filtering
adults = df.filter(pl.col('age') >= 30)
specific_cities = df.filter(pl.col('city').is_in(['London', 'Paris']))

# Sorting
sorted_df = df.sort('age', descending=True)
multi_sort = df.sort(['city', 'age'])

# Row operations
first_three = df.head(3)
last_two = df.tail(2)
sampled = df.sample(n=3)  # Random sample
```

#### Polars Expressions

Expressions are the core of Polars' power and expressiveness.

```python
# Basic expressions
df.select([
    pl.col('age').mean().alias('avg_age'),
    pl.col('age').max().alias('max_age'),
    pl.col('age').min().alias('min_age'),
    pl.col('age').std().alias('std_age')
])

# String operations
df.select([
    pl.col('name').str.lengths().alias('name_length'),
    pl.col('name').str.slice(0, 3).alias('name_prefix'),
    pl.col('city').str.contains('on').alias('has_on')
])

# Date operations
df.select([
    pl.col('signup_date').dt.year().alias('signup_year'),
    pl.col('signup_date').dt.month().alias('signup_month'),
    pl.col('signup_date').dt.day().alias('signup_day')
])

# Conditional expressions
df.select([
    pl.when(pl.col('age') >= 30)
      .then(pl.lit('Senior'))
      .otherwise(pl.lit('Junior'))
      .alias('category')
])

# Chaining expressions
df.select([
    pl.col('name')
      .str.to_lowercase()
      .str.replace('a', 'x')
      .str.lengths()
      .alias('modified_name_length')
])
```

### Lazy vs. Eager Evaluation

#### Eager Evaluation

Eager evaluation executes operations immediately.

```python
# Eager mode (default)
df_eager = pl.DataFrame({
    'a': range(1000000),
    'b': range(1000000, 2000000)
})

result = (
    df_eager
    .filter(pl.col('a') > 500000)
    .select(['a', 'b'])
    .head(10)
)
# Each operation executes immediately
```

#### Lazy Evaluation

Lazy evaluation builds a query plan and optimizes before execution.

```python
# Lazy mode
df_lazy = pl.scan_csv('large_file.csv')  # Doesn't load data yet

# Build query plan
query = (
    df_lazy
    .filter(pl.col('amount') > 1000)
    .group_by('customer_id')
    .agg([
        pl.col('amount').sum().alias('total_amount'),
        pl.col('transaction_id').count().alias('transaction_count')
    ])
    .sort('total_amount', descending=True)
    .head(100)
)

# View optimized query plan
print(query.explain())

# Execute query
result = query.collect()  # Only now does execution happen

# Stream results (for very large datasets)
for batch in query.collect_streaming():
    process_batch(batch)
```

#### When to Use Lazy vs Eager

**Use Eager:**
- Small datasets that fit in memory
- Interactive exploration
- Quick prototyping
- Immediate results needed

**Use Lazy:**
- Large datasets
- Complex query chains
- Need query optimization
- Memory-constrained environments
- Streaming processing

#### Lazy Evaluation Benefits

```python
# Lazy evaluation can optimize this
lazy_query = (
    pl.scan_csv('huge_file.csv')
    .filter(pl.col('year') == 2024)  # Predicate pushdown
    .select(['id', 'amount'])        # Projection pushdown
    .head(1000)                      # Slice pushdown
)

# Polars will:
# 1. Only read 'id', 'amount', 'year' columns
# 2. Filter while reading (predicate pushdown)
# 3. Stop after 1000 rows (slice pushdown)
# Instead of reading entire file then filtering

result = lazy_query.collect()
```

### Reading and Writing Data

#### Reading CSV Files

```python
# Basic CSV read
df = pl.read_csv('data.csv')

# With options
df = pl.read_csv(
    'data.csv',
    separator=',',
    has_header=True,
    skip_rows=0,
    n_rows=1000,  # Limit rows
    columns=['id', 'name', 'amount'],  # Specific columns
    dtypes={'id': pl.Int64, 'amount': pl.Float64},  # Specify types
    null_values=['NA', 'NULL', ''],
    encoding='utf8'
)

# Lazy reading (recommended for large files)
df_lazy = pl.scan_csv(
    'large_data.csv',
    with_column_names=lambda cols: [col.lower() for col in cols]
)

# Reading multiple files
df = pl.read_csv('data_*.csv')  # Glob pattern

# Streaming read for very large files
reader = pl.read_csv_batched('huge_file.csv', batch_size=10000)
for batch in reader:
    process_batch(batch)
```

#### Writing CSV Files

```python
# Basic write
df.write_csv('output.csv')

# With options
df.write_csv(
    'output.csv',
    separator=',',
    has_header=True,
    quote='"',
    datetime_format='%Y-%m-%d %H:%M:%S'
)
```

#### Reading JSON

```python
# JSON lines format (recommended)
df = pl.read_ndjson('data.ndjson')

# Regular JSON array
df = pl.read_json('data.json')

# Lazy reading
df_lazy = pl.scan_ndjson('large_data.ndjson')

# From JSON string
import json
json_str = '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]'
df = pl.read_json(json_str.encode())
```

#### Writing JSON

```python
# Write as JSON lines (recommended for large data)
df.write_ndjson('output.ndjson')

# Write as JSON array
df.write_json('output.json')

# Pretty printed
df.write_json('output.json', pretty=True)
```

#### Reading Parquet

Parquet is the recommended format for data engineering.

```python
# Basic read
df = pl.read_parquet('data.parquet')

# Lazy read (recommended)
df_lazy = pl.scan_parquet('large_data.parquet')

# Read specific columns
df = pl.read_parquet('data.parquet', columns=['id', 'amount'])

# Read multiple files
df = pl.scan_parquet('data/*.parquet')

# Read with filters (predicate pushdown)
df = pl.scan_parquet('data.parquet').filter(
    pl.col('year') == 2024
).collect()

# Read partitioned data
df = pl.scan_parquet('data/year=*/month=*/data.parquet')
```

#### Writing Parquet

```python
# Basic write
df.write_parquet('output.parquet')

# With compression
df.write_parquet(
    'output.parquet',
    compression='snappy',  # Options: 'snappy', 'gzip', 'brotli', 'lz4', 'zstd'
    compression_level=None
)

# Statistics for better filtering
df.write_parquet(
    'output.parquet',
    statistics=True,
    use_pyarrow=False
)

# Partitioned write
df.write_parquet(
    'output_partitioned',
    partition_by=['year', 'month']
)
```

#### Other Formats

```python
# Database connections
import polars as pl

# Read from database
connection_uri = "postgresql://user:password@localhost:5432/db"
query = "SELECT * FROM users WHERE active = true"
df = pl.read_database(query, connection_uri)

# Excel files (requires openpyxl)
df = pl.read_excel('data.xlsx', sheet_name='Sheet1')
df.write_excel('output.xlsx')

# Feather/Arrow IPC
df = pl.read_ipc('data.feather')
df.write_ipc('output.feather')

# Delta Lake (requires deltalake package)
df = pl.read_delta('delta_table_path')
df.write_delta('output_delta_path')
```

### Data Transformations and Aggregations

#### Column Transformations

```python
# Adding new columns
df = pl.DataFrame({
    'product': ['A', 'B', 'C'],
    'price': [10.0, 20.0, 30.0],
    'quantity': [5, 3, 7]
})

df_transformed = df.with_columns([
    (pl.col('price') * pl.col('quantity')).alias('total'),
    (pl.col('price') * 1.1).alias('price_with_tax'),
    pl.lit('USD').alias('currency')
])

# Modifying existing columns
df = df.with_columns([
    (pl.col('price') * 2).alias('price')  # Overwrites 'price'
])

# Multiple transformations
df = df.with_columns([
    pl.col('product').str.to_lowercase().alias('product_lower'),
    pl.when(pl.col('quantity') > 5)
      .then(pl.lit('High'))
      .otherwise(pl.lit('Low'))
      .alias('stock_level')
])
```

#### Filtering and Selection

```python
# Simple filtering
high_value = df.filter(pl.col('price') > 15)

# Multiple conditions
filtered = df.filter(
    (pl.col('price') > 10) & (pl.col('quantity') < 10)
)

# Using expressions
filtered = df.filter(
    pl.col('product').str.contains('A') | 
    pl.col('price').is_between(15, 25)
)

# Selecting with expressions
selected = df.select([
    pl.col('product'),
    pl.col('price').round(2).alias('rounded_price'),
    (pl.col('price') * pl.col('quantity')).alias('total')
])

# Exclude columns
without_quantity = df.select(pl.exclude('quantity'))

# Select by data type
numeric_cols = df.select(pl.col(pl.Float64, pl.Int64))
```

#### Aggregations

```python
# Basic aggregations
summary = df.select([
    pl.col('price').mean().alias('avg_price'),
    pl.col('price').sum().alias('total_price'),
    pl.col('quantity').max().alias('max_quantity'),
    pl.col('product').n_unique().alias('unique_products')
])

# Multiple aggregations per column
stats = df.select([
    pl.col('price').mean().alias('price_mean'),
    pl.col('price').median().alias('price_median'),
    pl.col('price').std().alias('price_std')
])

# Aggregation functions
df.select([
    pl.col('price').min(),
    pl.col('price').max(),
    pl.col('price').sum(),
    pl.col('price').mean(),
    pl.col('price').median(),
    pl.col('price').std(),
    pl.col('price').var(),
    pl.col('price').quantile(0.95),
    pl.col('product').n_unique(),
    pl.count()
])
```

#### Window Functions

```python
df = pl.DataFrame({
    'category': ['A', 'A', 'B', 'B', 'C'],
    'value': [10, 20, 15, 25, 30]
})

# Row number within groups
df_with_rank = df.with_columns([
    pl.col('value').rank().over('category').alias('rank_in_category')
])

# Running sum
df_with_cumsum = df.with_columns([
    pl.col('value').cum_sum().over('category').alias('cumulative_sum')
])

# Moving average
df_with_ma = df.with_columns([
    pl.col('value').rolling_mean(window_size=2).over('category').alias('moving_avg')
])

# Lag and lead
df_with_lag = df.with_columns([
    pl.col('value').shift(1).over('category').alias('previous_value'),
    pl.col('value').shift(-1).over('category').alias('next_value')
])

# Percentage of total within group
df_with_pct = df.with_columns([
    (pl.col('value') / pl.col('value').sum().over('category') * 100)
    .alias('pct_of_category')
])
```

#### String Operations

```python
df = pl.DataFrame({
    'email': ['alice@example.com', 'bob@test.org', 'charlie@demo.net'],
    'name': ['Alice Smith', 'Bob Jones', 'Charlie Brown']
})

# String methods
df_transformed = df.with_columns([
    pl.col('email').str.split('@').list.get(0).alias('username'),
    pl.col('email').str.split('@').list.get(1).alias('domain'),
    pl.col('name').str.to_lowercase().alias('name_lower'),
    pl.col('name').str.lengths().alias('name_length'),
    pl.col('name').str.contains('Smith').alias('is_smith')
])

# String replacement
df = df.with_columns([
    pl.col('email').str.replace('@', '_at_').alias('email_safe')
])

# Extract with regex
df = df.with_columns([
    pl.col('email').str.extract(r'([a-z]+)@', 1).alias('username_regex')
])
```

#### Date and Time Operations

```python
df = pl.DataFrame({
    'date': pl.date_range(
        date(2024, 1, 1),
        date(2024, 12, 31),
        interval='1mo',
        eager=True
    )
})

# Date components
df = df.with_columns([
    pl.col('date').dt.year().alias('year'),
    pl.col('date').dt.month().alias('month'),
    pl.col('date').dt.day().alias('day'),
    pl.col('date').dt.weekday().alias('weekday'),
    pl.col('date').dt.ordinal_day().alias('day_of_year')
])

# Date arithmetic
df = df.with_columns([
    (pl.col('date') + pl.duration(days=7)).alias('next_week'),
    (pl.col('date') - pl.duration(months=1)).alias('last_month')
])

# Truncate dates
df = df.with_columns([
    pl.col('date').dt.truncate('1mo').alias('month_start'),
    pl.col('date').dt.truncate('1w').alias('week_start')
])
```

### Joins and Group Operations

#### Join Operations

```python
# Sample DataFrames
users = pl.DataFrame({
    'user_id': [1, 2, 3, 4],
    'name': ['Alice', 'Bob', 'Charlie', 'David']
})

orders = pl.DataFrame({
    'order_id': [101, 102, 103, 104, 105],
    'user_id': [1, 2, 2, 3, 5],
    'amount': [100, 200, 150, 300, 250]
})

# Inner join (only matching records)
inner = users.join(orders, on='user_id', how='inner')

# Left join (all users, matching orders)
left = users.join(orders, on='user_id', how='left')

# Right join (all orders, matching users)
right = users.join(orders, on='user_id', how='right')

# Outer join (all records from both)
outer = users.join(orders, on='user_id', how='outer')

# Semi join (users who have orders, but don't include order data)
semi = users.join(orders, on='user_id', how='semi')

# Anti join (users who don't have orders)
anti = users.join(orders, on='user_id', how='anti')

# Join with different column names
products = pl.DataFrame({
    'product_id': [1, 2, 3],
    'product_name': ['Widget', 'Gadget', 'Tool']
})

order_items = pl.DataFrame({
    'item_id': [1, 2, 3],
    'prod_id': [1, 2, 1],
    'quantity': [5, 3, 2]
})

joined = order_items.join(
    products,
    left_on='prod_id',
    right_on='product_id',
    how='left'
)

# Multiple join keys
df1 = pl.DataFrame({
    'year': [2024, 2024, 2025],
    'month': [1, 2, 1],
    'value': [100, 200, 150]
})

df2 = pl.DataFrame({
    'year': [2024, 2024, 2025],
    'month': [1, 2, 1],
    'category': ['A', 'B', 'A']
})

joined = df1.join(df2, on=['year', 'month'], how='inner')

# Handling duplicate column names
joined = users.join(
    orders,
    on='user_id',
    how='left',
    suffix='_order'
)
```

#### Group By Operations

```python
# Basic group by
sales = pl.DataFrame({
    'region': ['North', 'South', 'North', 'East', 'South', 'East'],
    'product': ['A', 'B', 'A', 'C', 'B', 'A'],
    'amount': [100, 200, 150, 300, 250, 180],
    'quantity': [5, 10, 7, 15, 12, 9]
})

# Single aggregation
region_totals = sales.group_by('region').agg(
    pl.col('amount').sum().alias('total_amount')
)

# Multiple aggregations
region_stats = sales.group_by('region').agg([
    pl.col('amount').sum().alias('total_amount'),
    pl.col('amount').mean().alias('avg_amount'),
    pl.col('quantity').sum().alias('total_quantity'),
    pl.count().alias('num_transactions')
])

# Multiple grouping columns
product_region = sales.group_by(['region', 'product']).agg([
    pl.col('amount').sum().alias('total_amount'),
    pl.col('quantity').sum().alias('total_quantity')
])

# Group by with sorting
sorted_groups = sales.group_by('region').agg([
    pl.col('amount').sum().alias('total_amount')
]).sort('total_amount', descending=True)

# Complex aggregations
complex_agg = sales.group_by('region').agg([
    pl.col('amount').filter(pl.col('quantity') > 8).sum().alias('high_qty_amount'),
    pl.col('product').n_unique().alias('unique_products'),
    pl.col('amount').max().alias('max_amount'),
    pl.col('amount').quantile(0.5).alias('median_amount')
])

# Aggregating lists
grouped_lists = sales.group_by('region').agg([
    pl.col('product').alias('products_list'),
    pl.col('amount').alias('amounts_list')
])

# Group by with expressions
sales_with_category = sales.with_columns([
    pl.when(pl.col('amount') > 200)
      .then(pl.lit('High'))
      .otherwise(pl.lit('Low'))
      .alias('amount_category')
])

category_stats = sales_with_category.group_by('amount_category').agg([
    pl.col('amount').mean().alias('avg_amount'),
    pl.count().alias('count')
])
```

#### Advanced Grouping

```python
# Group by with maintain_order
ordered_groups = sales.group_by('region', maintain_order=True).agg([
    pl.col('amount').sum().alias('total')
])

# Rolling group by (time-based)
time_series = pl.DataFrame({
    'date': pl.date_range(
        date(2024, 1, 1),
        date(2024, 1, 10),
        interval='1d',
        eager=True
    ),
    'value': [10, 20, 15, 25, 30, 35, 40, 45, 50, 55]
})

rolling = time_series.with_columns([
    pl.col('value').rolling_sum(window_size=3).alias('rolling_sum_3d')
])

# Group by dynamic (time-based grouping)
dynamic_grouped = time_series.group_by_dynamic(
    'date',
    every='3d'
).agg([
    pl.col('value').sum().alias('sum_per_3_days')
])

# Pivot operations
pivot_data = pl.DataFrame({
    'region': ['North', 'North', 'South', 'South'],
    'quarter': ['Q1', 'Q2', 'Q1', 'Q2'],
    'sales': [100, 150, 200, 250]
})

pivoted = pivot_data.pivot(
    values='sales',
    index='region',
    columns='quarter'
)

# Melt (unpivot)
melted = pivoted.melt(
    id_vars='region',
    value_vars=['Q1', 'Q2'],
    variable_name='quarter',
    value_name='sales'
)
```

### Performance Optimization Techniques

#### Query Optimization

```python
# Use lazy evaluation for complex queries
lazy_df = pl.scan_parquet('large_data.parquet')

optimized_query = (
    lazy_df
    .filter(pl.col('year') == 2024)  # Predicate pushdown
    .select(['id', 'amount', 'category'])  # Projection pushdown
    .group_by('category')
    .agg(pl.col('amount').sum())
    .sort('amount', descending=True)
    .head(10)  # Slice pushdown
)

# View optimization plan
print(optimized_query.explain())

# Execute
result = optimized_query.collect()
```

#### Memory Management

```python
# Streaming for large datasets
lazy_query = pl.scan_csv('huge_file.csv').filter(
    pl.col('amount') > 1000
)

# Process in batches to control memory
for batch in lazy_query.collect_streaming(batch_size=10000):
    process_batch(batch)

# Use appropriate data types
df = pl.DataFrame({
    'id': [1, 2, 3],  # Int64 by default
    'small_int': [1, 2, 3],
    'category': ['A', 'B', 'C']
})

# Optimize data types
df_optimized = df.with_columns([
    pl.col('small_int').cast(pl.Int8),  # Save memory for small integers
    pl.col('category').cast(pl.Categorical)  # Categorical for repeated strings
])

print(f"Original size: {df.estimated_size('mb')} MB")
print(f"Optimized size: {df_optimized.estimated_size('mb')} MB")
```

#### Parallel Processing

```python
# Polars uses all CPU cores by default
# Control parallelism if needed
import os
os.environ['POLARS_MAX_THREADS'] = '4'

# Parallel reading of multiple files
df = pl.scan_parquet('data/*.parquet').collect()

# Parallel group by (automatic)
result = df.group_by('category').agg([
    pl.col('value').sum()
])  # Automatically parallelized
```

#### Efficient Operations

```python
# Use expressions instead of apply
# Slow (row-by-row apply)
def slow_transform(df):
    return df.with_columns([
        pl.col('value').map_elements(lambda x: x * 2).alias('doubled')
    ])

# Fast (vectorized expression)
def fast_transform(df):
    return df.with_columns([
        (pl.col('value') * 2).alias('doubled')
    ])

# Use filter pushdown
# Less efficient
df = pl.read_parquet('data.parquet')
filtered = df.filter(pl.col('year') == 2024)

# More efficient (lazy with pushdown)
df = pl.scan_parquet('data.parquet').filter(
    pl.col('year') == 2024
).collect()

# Batch operations
# Inefficient (multiple passes)
df = df.with_columns([(pl.col('a') * 2).alias('a2')])
df = df.with_columns([(pl.col('b') * 3).alias('b3')])
df = df.with_columns([(pl.col('c') * 4).alias('c4')])

# Efficient (single pass)
df = df.with_columns([
    (pl.col('a') * 2).alias('a2'),
    (pl.col('b') * 3).alias('b3'),
    (pl.col('c') * 4).alias('c4')
])
```

#### Caching and Persistence

```python
# Cache intermediate results in lazy queries
lazy_df = pl.scan_parquet('data.parquet')

# Use cache when result is reused
cached_query = lazy_df.filter(
    pl.col('year') == 2024
).cache()  # Cache this intermediate result

result1 = cached_query.group_by('category').agg([
    pl.col('amount').sum()
]).collect()

result2 = cached_query.group_by('region').agg([
    pl.col('amount').mean()
]).collect()

# Write intermediate results for reuse
intermediate = lazy_df.filter(
    pl.col('year') == 2024
).collect()

intermediate.write_parquet('intermediate_result.parquet')
```

#### Benchmarking

```python
import time

def benchmark_operation(func, *args, **kwargs):
    """Benchmark a Polars operation."""
    start = time.time()
    result = func(*args, **kwargs)
    duration = time.time() - start
    print(f"{func.__name__} took {duration:.4f} seconds")
    return result

# Example
df = pl.DataFrame({'a': range(1000000)})

def method1():
    return df.with_columns([(pl.col('a') * 2).alias('doubled')])

def method2():
    return df.select([pl.col('a'), (pl.col('a') * 2).alias('doubled')])

result1 = benchmark_operation(method1)
result2 = benchmark_operation(method2)
```

---

## PyArrow and Apache Arrow

Apache Arrow is a cross-language development platform for in-memory data. PyArrow is the Python implementation.

### Understanding the Arrow Memory Format

#### Why Arrow?

**Benefits:**
- Zero-copy data sharing between processes
- Columnar memory layout for efficient analytics
- Language-agnostic standard
- Fast serialization/deserialization
- Integration with Parquet, databases, and analytics tools

#### Arrow Memory Layout

```python
import pyarrow as pa
import numpy as np

# Arrow uses columnar format
# Traditional row-based: [row1_col1, row1_col2, row2_col1, row2_col2, ...]
# Arrow columnar: [all_col1_values] [all_col2_values] [...]

# Benefits of columnar:
# 1. Better compression
# 2. Vectorized operations
# 3. Only read needed columns
# 4. Cache-friendly for analytics
```

### Working with PyArrow Tables and RecordBatches

#### Creating Arrays

```python
import pyarrow as pa

# From Python list
arr = pa.array([1, 2, 3, 4, 5])
print(arr.type)  # int64

# With specific type
arr_int32 = pa.array([1, 2, 3], type=pa.int32())
arr_float = pa.array([1.0, 2.0, 3.0], type=pa.float64())

# With nulls
arr_with_nulls = pa.array([1, 2, None, 4, 5])
print(arr_with_nulls.null_count)  # 1

# From NumPy
np_arr = np.array([1, 2, 3, 4, 5])
arrow_arr = pa.array(np_arr)

# Different data types
string_arr = pa.array(['a', 'b', 'c'])
date_arr = pa.array([date(2024, 1, 1), date(2024, 1, 2)])
bool_arr = pa.array([True, False, True])

# Nested types
list_arr = pa.array([[1, 2], [3, 4, 5], [6]])
struct_arr = pa.array([
    {'x': 1, 'y': 'a'},
    {'x': 2, 'y': 'b'}
], type=pa.struct([('x', pa.int64()), ('y', pa.string())]))
```

#### Creating Tables

```python
# From dictionary
data = {
    'id': [1, 2, 3, 4, 5],
    'name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'age': [25, 30, 35, 28, 32],
    'score': [85.5, 90.0, 78.5, 88.0, 92.5]
}

table = pa.table(data)

# With schema
schema = pa.schema([
    ('id', pa.int32()),
    ('name', pa.string()),
    ('age', pa.int8()),
    ('score', pa.float32())
])

table = pa.table(data, schema=schema)

# From arrays
id_arr = pa.array([1, 2, 3])
name_arr = pa.array(['Alice', 'Bob', 'Charlie'])

table = pa.table({
    'id': id_arr,
    'name': name_arr
})

# Table operations
print(table.schema)
print(table.num_rows)
print(table.num_columns)
print(table.column_names)
print(table.shape)

# Access columns
id_column = table['id']
name_column = table.column('name')

# Slice table
subset = table.slice(0, 3)  # First 3 rows

# Select columns
subset = table.select(['id', 'name'])

# Add column
table = table.append_column('doubled_age', pa.array([50, 60, 70]))

# Remove column
table = table.remove_column(table.schema.get_field_index('doubled_age'))
```

#### RecordBatches

RecordBatches are like Tables but represent a single chunk of data.

```python
# Create RecordBatch
data = {
    'id': pa.array([1, 2, 3]),
    'value': pa.array([10, 20, 30])
}

batch = pa.record_batch(data)

# RecordBatch from Table
table = pa.table(data)
batch = table.to_batches()[0]

# Convert back to Table
table_from_batch = pa.Table.from_batches([batch])

# Concatenate batches
batch1 = pa.record_batch({'id': [1, 2]}, schema=schema)
batch2 = pa.record_batch({'id': [3, 4]}, schema=schema)
table = pa.Table.from_batches([batch1, batch2])
```

#### Schema Management

```python
# Define schema
schema = pa.schema([
    pa.field('id', pa.int32(), nullable=False),
    pa.field('name', pa.string()),
    pa.field('tags', pa.list_(pa.string())),
    pa.field('metadata', pa.struct([
        ('created', pa.timestamp('ms')),
        ('updated', pa.timestamp('ms'))
    ]))
])

# Add metadata
schema = schema.with_metadata({'source': 'production'})

# Schema comparison
schema1 = pa.schema([('a', pa.int32()), ('b', pa.string())])
schema2 = pa.schema([('a', pa.int32()), ('b', pa.string())])
print(schema1.equals(schema2))  # True

# Schema evolution
new_field = pa.field('c', pa.float64())
extended_schema = schema1.append(new_field)
```

---

# Study Review

This comprehensive module teaches modern Python-based data engineering, focusing on high-performance tools and production-ready practices.

## Core Topics Covered

**1. Python Fundamentals (Refresher)**
- Essential data structures: lists, dictionaries, sets, and tuples with data engineering use cases
- Advanced functions, decorators, and lambda expressions
- List comprehensions vs generators for memory-efficient processing
- Production-grade exception handling and logging strategies

**2. Polars DataFrame Library**
- Modern, Rust-based alternative to Pandas (10-100x faster)
- Lazy vs eager evaluation for query optimization
- Reading/writing multiple formats (CSV, JSON, Parquet, databases)
- Complex transformations: filtering, aggregations, window functions
- Advanced joins and group operations
- Performance optimization techniques including predicate pushdown and streaming

**3. Apache Arrow & PyArrow**
- Understanding columnar memory format
- Zero-copy data sharing between processes
- Working with Arrow Tables and RecordBatches
- Schema management and data type handling
