---
title: "Domain 3.1 — Data Loading and Unloading"
description: "Master Snowflake's bulk data loading and unloading: file formats, stages (internal and external), the COPY INTO command, error handling options, and best practices for high-throughput ingestion."
order: 10
difficulty: intermediate
duration: "75 min"
---

# Domain 3.1 — Data Loading and Unloading

## Exam Weight

**Domain 3.0 — Data Loading, Unloading, and Connectivity** accounts for **~18%** of the exam.

> [!NOTE]
> This lesson maps to **Exam Objective 3.1**: *Perform data loading and unloading*, including file formats, stages, the COPY INTO command, and error handling options.

---

## The Data Loading Process

Snowflake's bulk loading process follows this flow:

```
Source Files (CSV, JSON, Parquet, etc.)
           │
           ▼
      Stage (Internal or External)
           │
           ▼
    COPY INTO <table>
           │
           ▼
      Snowflake Table (micro-partitions)
```

---

## File Formats

A **File Format** defines how Snowflake parses files during loading and unloading. Supported types:

| Format | Type | Notes |
|---|---|---|
| **CSV** | Structured | Most common; highly configurable delimiter, quotes, encoding |
| **JSON** | Semi-structured | Loaded into VARIANT columns |
| **Avro** | Semi-structured | Schema embedded in file |
| **ORC** | Semi-structured | Columnar, often from Hadoop |
| **Parquet** | Semi-structured | Columnar, highly compressed |
| **XML** | Semi-structured | Hierarchical document format |

```sql
-- CSV file format
CREATE FILE FORMAT csv_format
    TYPE = CSV
    FIELD_DELIMITER = ','
    RECORD_DELIMITER = '\n'
    SKIP_HEADER = 1
    FIELD_OPTIONALLY_ENCLOSED_BY = '"'
    NULL_IF = ('NULL', 'null', 'N/A', '')
    EMPTY_FIELD_AS_NULL = TRUE
    ENCODING = 'UTF-8'
    TRIM_SPACE = TRUE;

-- JSON file format
CREATE FILE FORMAT json_format
    TYPE = JSON
    STRIP_OUTER_ARRAY = TRUE    -- remove the outer [] wrapper
    STRIP_NULL_VALUES = FALSE
    IGNORE_UTF8_ERRORS = FALSE;

-- Parquet file format
CREATE FILE FORMAT parquet_format
    TYPE = PARQUET
    SNAPPY_COMPRESSION = TRUE;

-- Inline format (no need to create named format)
COPY INTO my_table
FROM @my_stage
FILE_FORMAT = (TYPE = CSV FIELD_DELIMITER = '|' SKIP_HEADER = 1);
```

---

## Stages

A **stage** is the intermediary landing zone where files are placed before loading into Snowflake tables.

### Internal Stages

Snowflake manages the underlying storage:

| Stage Type | Syntax | Scope |
|---|---|---|
| **User stage** | `@~` | Per-user; private, not shareable |
| **Table stage** | `@%table_name` | Per-table; linked to a specific table |
| **Named internal stage** | `@stage_name` | Shared within account, most flexible |

```sql
-- Upload a file to a named internal stage using SnowSQL / CLI
PUT file:///local/path/orders.csv @my_stage AUTO_COMPRESS = TRUE;

-- Or via Snowflake CLI
snow stage copy ./orders.csv @my_stage/

-- List files in a stage
LIST @my_stage;
LIST @my_stage/orders/;

-- Remove files from a stage
REMOVE @my_stage/old_files/;
```

### External Stages

Data remains in **customer-owned cloud storage**:

```sql
-- External stage on Amazon S3
CREATE STAGE s3_orders_stage
    URL = 's3://my-bucket/orders/'
    STORAGE_INTEGRATION = my_s3_integration
    FILE_FORMAT = (FORMAT_NAME = csv_format)
    DIRECTORY = (ENABLE = TRUE);  -- enable directory table

-- External stage on Azure Blob Storage
CREATE STAGE azure_stage
    URL = 'azure://myaccount.blob.core.windows.net/mycontainer/data/'
    STORAGE_INTEGRATION = my_azure_integration
    FILE_FORMAT = (FORMAT_NAME = json_format);

-- External stage on Google Cloud Storage
CREATE STAGE gcs_stage
    URL = 'gcs://my-bucket/data/'
    STORAGE_INTEGRATION = my_gcs_integration;
```

### Storage Integrations

A **storage integration** securely connects Snowflake to cloud storage using an **IAM role / service principal** — no credentials stored in Snowflake:

```sql
CREATE STORAGE INTEGRATION my_s3_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = S3
    ENABLED = TRUE
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/snowflake-role'
    STORAGE_ALLOWED_LOCATIONS = ('s3://my-bucket/orders/', 's3://my-bucket/products/');

-- Get the IAM values to configure in AWS
DESC INTEGRATION my_s3_integration;
```

### Directory Tables

Enable **file listing** on external stages as a queryable table:

```sql
ALTER STAGE s3_orders_stage SET DIRECTORY = (ENABLE = TRUE);

-- Refresh the directory table metadata
ALTER STAGE s3_orders_stage REFRESH;

-- Query the directory table
SELECT * FROM DIRECTORY(@s3_orders_stage);
```

---

## COPY INTO — Loading Data

`COPY INTO <table>` is the primary bulk loading command:

```sql
-- Basic load
COPY INTO orders
FROM @my_stage/orders/
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- Load specific files
COPY INTO orders
FROM @my_stage/orders/
FILES = ('orders_2025_01.csv', 'orders_2025_02.csv')
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- Load using pattern matching
COPY INTO orders
FROM @my_stage/orders/
PATTERN = '.*orders_2025_.*\\.csv'
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- Transform during load (SELECT from stage)
COPY INTO orders (id, amount, load_ts)
FROM (
    SELECT $1::NUMBER, $2::DECIMAL(10,2), CURRENT_TIMESTAMP
    FROM @my_stage/orders/
)
FILE_FORMAT = (FORMAT_NAME = csv_format);
```

### Load Status Tracking

COPY INTO automatically tracks which files have been loaded to prevent duplicates:

```sql
-- View load history for a table (last 64 days)
SELECT *
FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
    TABLE_NAME => 'ORDERS',
    START_TIME => DATEADD('day', -7, CURRENT_TIMESTAMP)
));

-- Account-wide history
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.COPY_HISTORY
WHERE TABLE_NAME = 'ORDERS'
AND LAST_LOAD_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

> [!NOTE]
> Snowflake tracks the **64-day load history** per stage. Files loaded within the last 64 days are tracked and will **not be re-loaded** by default. To force a reload, use `FORCE = TRUE`.

---

## Error Handling Options

The `ON_ERROR` parameter controls how COPY INTO handles errors:

| Option | Behavior | Use Case |
|---|---|---|
| `CONTINUE` | Skip bad rows, load good rows | Tolerant loading |
| `SKIP_FILE` | Skip the entire file with errors | File-level quality gate |
| `SKIP_FILE_<n>` | Skip file if more than n errors occur | Threshold-based |
| `SKIP_FILE_<n>%` | Skip file if error rate exceeds n% | Percentage threshold |
| `ABORT_STATEMENT` | Abort entire COPY on first error (default) | Strict validation |

```sql
-- Continue loading, skip bad rows
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
ON_ERROR = 'CONTINUE';

-- Skip file if more than 5 errors
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
ON_ERROR = 'SKIP_FILE_5';

-- Skip file if more than 10% errors
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
ON_ERROR = 'SKIP_FILE_10%';

-- Check what was rejected
SELECT *
FROM TABLE(VALIDATE(orders, JOB_ID => '<copy_job_id>'));
```

### Validating Before Loading

```sql
-- Validate without actually loading (dry-run)
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
VALIDATION_MODE = 'RETURN_ERRORS';  -- returns error rows only

-- Or validate all rows
COPY INTO orders
FROM @my_stage
VALIDATION_MODE = 'RETURN_ALL_ERRORS';
```

---

## Semi-Structured Data Loading

### Loading JSON

```sql
-- Load JSON into a VARIANT column
CREATE TABLE raw_events (v VARIANT);

COPY INTO raw_events
FROM @json_stage
FILE_FORMAT = (TYPE = JSON STRIP_OUTER_ARRAY = TRUE);

-- Query nested JSON
SELECT
    v:event_type::STRING AS event_type,
    v:user.id::NUMBER AS user_id,
    v:user.name::STRING AS user_name,
    v:properties:page_url::STRING AS page_url
FROM raw_events;

-- Flatten arrays
SELECT
    v:order_id::NUMBER AS order_id,
    item.value:product_id::NUMBER AS product_id,
    item.value:quantity::NUMBER AS qty
FROM raw_events,
LATERAL FLATTEN(INPUT => v:items) item;
```

---

## Data Unloading with COPY INTO Location

`COPY INTO @stage` exports data from Snowflake to files:

```sql
-- Unload to internal stage
COPY INTO @my_stage/exports/orders_export
FROM orders
FILE_FORMAT = (TYPE = CSV HEADER = TRUE)
SINGLE = FALSE         -- multiple files (parallel export)
MAX_FILE_SIZE = 500000000;  -- 500 MB per file

-- Unload to external S3 stage
COPY INTO @s3_export_stage/orders/
FROM (SELECT * FROM orders WHERE order_date = CURRENT_DATE)
FILE_FORMAT = (TYPE = PARQUET)
HEADER = TRUE;

-- Unload as gzip-compressed CSV
COPY INTO @my_stage/compressed_export
FROM orders
FILE_FORMAT = (TYPE = CSV COMPRESSION = GZIP HEADER = TRUE);
```

### Unloading Best Practices

| Setting | Recommendation |
|---|---|
| `SINGLE = FALSE` | Use multiple files for large exports (parallel) |
| `MAX_FILE_SIZE` | Keep files at 100–500 MB for downstream compatibility |
| Compression | Use GZIP or SNAPPY to reduce transfer costs |
| File naming | Use `INCLUDE_QUERY_ID = TRUE` for unique filenames |

---

## Practice Questions

**Q1.** A COPY INTO command is executed and some rows have invalid data types. Which `ON_ERROR` option loads all valid rows while skipping only the bad rows?

- A) `ABORT_STATEMENT`
- B) `SKIP_FILE`
- C) `CONTINUE` ✅
- D) `RETURN_ERRORS`

**Q2.** Snowflake tracks COPY INTO load history for how many days per stage to prevent duplicate loading?

- A) 7 days
- B) 30 days
- C) 64 days ✅
- D) 90 days

**Q3.** Which COPY INTO parameter allows you to validate file contents without actually loading any data?

- A) `ON_ERROR = CONTINUE`
- B) `VALIDATION_MODE = 'RETURN_ERRORS'` ✅
- C) `FORCE = TRUE`
- D) `PURGE = TRUE`

**Q4.** An external stage uses a `STORAGE_INTEGRATION` instead of credentials. What is the primary security benefit?

- A) Data is encrypted automatically
- B) No cloud credentials are stored in Snowflake ✅
- C) The stage can only be used by SYSADMIN
- D) Files are automatically deleted after loading

**Q5.** Which special stage syntax refers to a table's auto-provisioned stage?

- A) `@~`
- B) `@stage_name`
- C) `@%table_name` ✅
- D) `@$table_name`

**Q6.** When unloading with `SINGLE = FALSE` (default), what advantage does this provide?

- A) Files are encrypted automatically
- B) Export runs in parallel across warehouse nodes ✅
- C) Files are compressed automatically
- D) Only one file format can be used

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. Load flow: **Files → Stage → COPY INTO → Table**
> 2. Internal stages: `@~` (user), `@%table` (table), `@name` (named)
> 3. `ON_ERROR = CONTINUE` = skip bad rows | `ABORT_STATEMENT` = fail on first error (default)
> 4. COPY history tracked for **64 days** per stage (prevents duplicate loads)
> 5. `VALIDATION_MODE` = dry-run to check errors without loading
> 6. Storage Integrations = IAM role auth; **no credentials in Snowflake**