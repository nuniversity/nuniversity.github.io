---
title: "Reference Architecture Patterns"
description: "Analyze production-grade reference architectures including the Modern Data Lakehouse, Enterprise SQL Data Warehouse, Lambda and Kappa patterns, and multi-platform Data Mesh topologies."
order: 12
difficulty: advanced
duration: "90 min"
---

# Reference Architecture Patterns

> **Bottom Line:** No single architecture pattern fits all scenarios. This section provides production-grade reference architectures for the most common enterprise data platform use cases, annotated with specific service choices and the reasoning behind them.

---

## 12.1 Pattern 1: Modern Data Lakehouse (Databricks-Centric)

**Best For:** Data engineering + ML-heavy organisations, open format preference, Python-native teams.

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     MODERN DATA LAKEHOUSE ARCHITECTURE                       │
 └─────────────────────────────────────────────────────────────────────────────┘

 DATA SOURCES                    INGEST                    STORE (Bronze)
 ┌──────────────┐          ┌──────────────────┐         ┌─────────────────┐
 │ Operational  │ Debezium │  MSK / Kafka     │ Streams │  S3 Raw Zone    │
 │ Databases    ├─────────►│  (Event Stream)  ├────────►│  (JSON/Avro)    │
 │ (RDS, Mongo) │          └──────────────────┘         └────────┬────────┘
 │              │                                                 │
 │ SaaS Apps    │ Fivetran │  AWS AppFlow     │         ┌────────▼────────┐
 │ (Salesforce  ├─────────►│  (Batch/Sched.)  ├────────►│  Auto Loader    │
 │  HubSpot)    │          └──────────────────┘         │  → Bronze Delta │
 │              │                                        └────────┬────────┘
 │ Clickstream  │ Kinesis  │  Kinesis Streams │                  │
 │ (Web/App)    ├─────────►│  → Firehose →S3  │                  │
 └──────────────┘          └──────────────────┘                  │

                                    PROCESS (Databricks)
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                    DATABRICKS PLATFORM                                    │
 │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
 │  │  DLT Pipeline    │  │  Batch Jobs       │  │  ML Workflows        │   │
 │  │  (Bronze→Silver  │  │  (dbt on         │  │  (MLflow + Feature   │   │
 │  │   →Gold via DLT) │  │   Databricks)    │  │   Store + AutoML)    │   │
 │  └─────────┬────────┘  └────────┬──────────┘  └─────────┬────────────┘   │
 │            │                   │                         │                │
 │  ┌─────────▼───────────────────▼─────────────────────────▼────────────┐  │
 │  │                    UNITY CATALOG                                     │  │
 │  │  Metastore: Bronze → Silver → Gold → Feature Store → ML Models      │  │
 │  └─────────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────┘

                                    SERVE
 ┌──────────────────────────────────────────────────────────────────────────┐
 │   SQL Warehouse ──► BI Tools (Power BI, Tableau, Looker)                 │
 │   Databricks AI Gateway ──► LLM-powered apps                            │
 │   Model Serving REST API ──► Real-time ML predictions                   │
 │   Delta Sharing ──► External partners / downstream consumers            │
 └──────────────────────────────────────────────────────────────────────────┘
```

### Implementation Checklist

```python
# 1. Set up Unity Catalog metastore (one-time, per region)
# - Create storage credential for S3
# - Create external location pointing to your S3 bucket
# - Create catalogs: bronze, silver, gold, ml_prod

# 2. Configure Auto Loader for each source
auto_loader_config = {
    "format": "cloudFiles",
    "cloudFiles.format": "json",  # or avro, parquet, csv
    "cloudFiles.schemaLocation": "s3://my-lake/schemas/{table}/",
    "cloudFiles.inferColumnTypes": "true",
    "cloudFiles.maxFilesPerTrigger": 500
}

# 3. Deploy DLT pipeline for Medallion processing
# (See 05_Data_Ingestion.md for full DLT code)

# 4. Set up Databricks Workflows for orchestration
workflow_config = {
    "tasks": [
        {"task_key": "ingest", "notebook_task": {"notebook_path": "/pipelines/01_ingest"}},
        {"task_key": "transform", "depends_on": [{"task_key": "ingest"}],
         "notebook_task": {"notebook_path": "/pipelines/02_transform"}},
        {"task_key": "ml_features", "depends_on": [{"task_key": "transform"}],
         "notebook_task": {"notebook_path": "/pipelines/03_features"}}
    ]
}

# 5. Configure model serving endpoint
# (See 07_AI_and_ML.md for model serving code)
```

---

## 12.2 Pattern 2: Enterprise SQL Data Warehouse (Snowflake-Centric)

**Best For:** SQL-dominant analytics, large analyst teams, cross-org data sharing, minimal engineering overhead.

```
 DATA SOURCES               INGEST                     SNOWFLAKE
 ┌──────────────┐      ┌───────────────────┐     ┌─────────────────────────────┐
 │ ERP/CRM/     │      │   Fivetran        │     │  Raw Layer                  │
 │ Databases    ├─────►│   (300+ sources)  ├────►│  COPY INTO → Raw Tables     │
 │              │      └───────────────────┘     │                             │
 │ Files (S3)   │      ┌───────────────────┐     │  Transform Layer            │
 │              ├─────►│   Snowpipe        ├────►│  dbt models → Silver Tables │
 │ SaaS Events  │      │   (S3 triggers)   │     │                             │
 │              │      └───────────────────┘     │  Analytics Layer            │
 │ APIs         │      ┌───────────────────┐     │  Gold views / tables        │
 │              ├─────►│   Kafka Connector ├────►│  Served to BI tools         │
 └──────────────┘      └───────────────────┘     │                             │
                                                  │  Governance                 │
                                                  │  RBAC + Masking + Row ACL   │
                                                  └────────────┬────────────────┘
                                                               │
               ┌───────────────────────────────────────────────┤
               │                                               │
    ┌──────────▼──────────┐                    ┌──────────────▼──────────────┐
    │  BI Tools            │                    │  Data Sharing               │
    │  Tableau / Power BI  │                    │  → Partner Accounts         │
    │  Looker / Sigma      │                    │  → Snowflake Marketplace    │
    │  Streamlit in SF     │                    │  → Data Clean Rooms         │
    └─────────────────────┘                    └─────────────────────────────┘
```

### dbt Project Structure for Snowflake

```
dbt_project/
├── models/
│   ├── staging/           ← Stage raw Fivetran/Snowpipe tables
│   │   ├── stg_orders.sql
│   │   ├── stg_customers.sql
│   │   └── stg_products.sql
│   ├── intermediate/      ← Complex joins and business logic
│   │   ├── int_customer_order_history.sql
│   │   └── int_product_performance.sql
│   └── marts/             ← Final, business-facing models
│       ├── finance/
│       │   └── fct_revenue.sql
│       ├── marketing/
│       │   └── dim_customer_segments.sql
│       └── core/
│           └── fct_orders.sql
├── macros/                ← Reusable Jinja macros
├── tests/                 ← Data quality tests
│   ├── generic/
│   └── singular/
└── dbt_project.yml
```

```sql
-- Example dbt model: marts/finance/fct_revenue.sql
{{
  config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    cluster_by=['order_date'],
    post_hook=[
      "{{ grant_select_to_role('fct_revenue', 'ANALYST_FINANCE') }}"
    ]
  )
}}

WITH orders AS (
    SELECT * FROM {{ ref('int_customer_order_history') }}
    {% if is_incremental() %}
    WHERE order_date >= (SELECT MAX(order_date) - INTERVAL '3 days' FROM {{ this }})
    {% endif %}
),
exchange_rates AS (
    SELECT * FROM {{ ref('stg_exchange_rates') }}
),
final AS (
    SELECT
        o.order_id,
        o.customer_id,
        o.region,
        o.order_date,
        o.revenue AS revenue_local,
        o.currency,
        o.revenue * er.rate_to_usd AS revenue_usd,
        o.product_category,
        CURRENT_TIMESTAMP() AS dbt_updated_at
    FROM orders o
    LEFT JOIN exchange_rates er
        ON o.currency = er.currency_code
        AND o.order_date = er.rate_date
)
SELECT * FROM final
```

---

## 12.3 Pattern 3: Lambda Architecture (Real-Time + Batch)

**Best For:** Use cases requiring both real-time dashboards AND accurate historical analytics (e.g., fraud detection, operational dashboards).

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                      LAMBDA ARCHITECTURE                                   │
 │                                                                            │
 │  Data Source (e.g., payment events)                                        │
 │              │                                                             │
 │    ┌─────────▼──────────────────────────────────────────┐                 │
 │    │              Amazon MSK / Kinesis                   │                 │
 │    │              (Event backbone)                       │                 │
 │    └─────────┬──────────────────────┬────────────────────┘                 │
 │              │                      │                                      │
 │   SPEED LAYER│               BATCH LAYER│                                  │
 │   ┌──────────▼──────────┐  ┌───────────▼──────────────┐                  │
 │   │ Databricks           │  │ Databricks               │                  │
 │   │ Structured Streaming │  │ Batch Jobs               │                  │
 │   │ → 30-second windows  │  │ → Full reprocessing      │                  │
 │   │ → Redis / DynamoDB   │  │ → Gold Delta tables      │                  │
 │   │   (low latency)      │  │   (accurate)             │                  │
 │   └──────────┬───────────┘  └───────────┬──────────────┘                  │
 │              │                          │                                  │
 │   ┌──────────▼──────────────────────────▼──────────────┐                  │
 │   │                 SERVING LAYER                        │                  │
 │   │  Query router: real-time data + historical data      │                  │
 │   │  → Dashboards see merged view                        │                  │
 │   └─────────────────────────────────────────────────────┘                  │
 └───────────────────────────────────────────────────────────────────────────┘
```

```python
# Lambda: Speed layer (Structured Streaming → live metrics)
speed_query = (
    kafka_stream
        .withWatermark("event_timestamp", "1 minute")
        .groupBy(
            F.window("event_timestamp", "30 seconds"),
            "region"
        )
        .agg(
            F.sum("amount").alias("live_revenue"),
            F.count("*").alias("live_tx_count")
        )
        .writeStream
        .format("delta")
        .outputMode("append")
        .option("checkpointLocation", "s3://my-bucket/ckpt/speed/")
        .trigger(processingTime="5 seconds")
        .toTable("analytics.realtime.revenue_windows_5s")
)

# Lambda: Batch layer (accurate, reprocessable historical data)
from pyspark.sql import SparkSession

def run_batch_reprocess(date: str):
    """Run daily batch to correct any speed layer approximations."""
    daily_data = spark.table("ecommerce_prod.bronze.payment_events") \
        .filter(F.col("event_date") == date)

    accurate_aggregates = daily_data.groupBy("region", "event_date") \
        .agg(
            F.sum("amount").alias("total_revenue"),
            F.countDistinct("customer_id").alias("unique_customers"),
            F.count("*").alias("transaction_count")
        )

    accurate_aggregates.write \
        .format("delta") \
        .mode("overwrite") \
        .option("replaceWhere", f"event_date = '{date}'") \
        .saveAsTable("analytics.gold.daily_revenue_accurate")
```

---

## 12.4 Pattern 4: Kappa Architecture (Stream-Only)

**Best For:** When batch and stream processing can be unified (modern preferred approach). Databricks Structured Streaming handles both.

```
                  ┌────────────────────────────────────────┐
                  │         KAPPA ARCHITECTURE              │
                  │  (No separate batch path)               │
                  └────────────────────────────────────────┘

 Data Source → MSK/Kinesis → Databricks Structured Streaming → Delta Lake
                                       │
                          ┌────────────▼─────────────┐
                          │  Single processing path   │
                          │  handles BOTH:            │
                          │  - Real-time streaming    │
                          │  - Historical reprocessing│
                          │    (replay from offset 0) │
                          └────────────┬──────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │  Delta Lake               │
                          │  (Streaming sink,         │
                          │   queryable by SQL WH)    │
                          └──────────────────────────┘

Reprocessing = set Kafka offset to 0 (or desired timestamp) and replay
```

---

## 12.5 Pattern 5: Hybrid Multi-Platform (Best-of-Breed)

**Best For:** Large enterprises, 100+ engineers, complex workload mix, ML + BI + sharing all critical.

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                    HYBRID BEST-OF-BREED ARCHITECTURE                         │
 └─────────────────────────────────────────────────────────────────────────────┘

 SOURCE SYSTEMS          STREAMING              LAKE STORAGE
 ┌──────────────┐   ┌─────────────────┐    ┌────────────────────┐
 │ OLTP (RDS)   │   │  Amazon MSK     │    │  Amazon S3         │
 │ SaaS (APIs)  ├──►│  (Event bus)    ├───►│  (Open storage)    │
 │ IoT Sensors  │   │                 │    │  Parquet / Delta   │
 └──────────────┘   └─────────────────┘    └────────┬───────────┘
                                                     │
                          ┌──────────────────────────▼──────────────────────┐
                          │              DATABRICKS (Data Plane)              │
                          │                                                   │
                          │  Ingestion: Auto Loader / Structured Streaming    │
                          │  Transform: DLT (Bronze → Silver → Gold)         │
                          │  ML: Feature Store → MLflow → Model Serving       │
                          │  Governance: Unity Catalog (files, tables, models)│
                          └──────────────────────────┬──────────────────────┘
                                                     │
                          ┌──────────────────────────▼──────────────────────┐
                          │         SNOWFLAKE (Serving Layer)                 │
                          │                                                   │
                          │  Ingest: Snowpipe from S3 Gold tables             │
                          │  Serve: Virtual Warehouses for BI                 │
                          │  Share: Data Sharing / Marketplace / Clean Rooms  │
                          │  Apps: Streamlit in Snowflake                     │
                          └──────────────────────────┬──────────────────────┘
                                                     │
          ┌───────────────────────────────────────────┼──────────────────────────┐
          │                                           │                          │
 ┌────────▼────────┐                     ┌───────────▼────────┐    ┌───────────▼──────┐
 │  BI & Reporting  │                     │  Data Sharing       │    │  ML Predictions  │
 │  Tableau/Looker  │                     │  Partners/Customers │    │  REST API        │
 │  Power BI        │                     │  Marketplace        │    │  (Databricks)    │
 └─────────────────┘                     └────────────────────┘    └──────────────────┘
```

### Data Flow: Databricks → Snowflake (Production Pattern)

```python
# Option 1: Write Gold Delta tables to S3, Snowpipe loads into Snowflake
# (Recommended for decoupling)

# Step 1: Databricks writes Gold table to S3 as Parquet
(
    gold_df.write
        .format("parquet")
        .mode("overwrite")
        .partitionBy("order_date")
        .save("s3://my-lake/snowflake-landing/gold/orders/")
)

# Step 2: Snowpipe (configured with SQS auto-ingest) picks up new files automatically
# (See 05_Data_Ingestion.md for Snowpipe setup)

# Option 2: Use Spark Snowflake Connector (direct write, simpler)
(
    gold_df.write
        .format("snowflake")
        .option("sfURL", "myorg-myaccount.snowflakecomputing.com")
        .option("sfDatabase", "ECOMMERCE")
        .option("sfSchema", "GOLD")
        .option("sfWarehouse", "LOADER_WH")
        .option("dbtable", "ORDERS_DAILY")
        .option("private_key_file", "/path/to/rsa_key.p8")
        .mode("overwrite")
        .save()
)
# ⚠️ Direct connector is simpler but creates tight coupling
# ⚠️ Snowflake bills for compute on the receiving COPY operation
```

---

## 12.6 Pattern 6: Data Mesh with Shared Infrastructure

**Best For:** Large organisations (>500 engineers), multiple independent domains, federated governance.

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                       DATA MESH TOPOLOGY                                │
 │                                                                         │
 │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
 │  │  DOMAIN: Finance  │  │  DOMAIN: Marketing│  │  DOMAIN: Ops    │     │
 │  │                  │  │                  │  │                  │     │
 │  │  Own: Tables,    │  │  Own: Tables,    │  │  Own: Tables,    │     │
 │  │  Pipelines, SLAs │  │  Pipelines, SLAs │  │  Pipelines, SLAs │     │
 │  │                  │  │                  │  │                  │     │
 │  │  Catalog: UC     │  │  Catalog: UC     │  │  Catalog: UC     │     │
 │  │  (finance.*)     │  │  (marketing.*)   │  │  (ops.*)         │     │
 │  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
 │                                                                         │
 │  ┌─────────────────────────────────────────────────────────────────┐   │
 │  │           SHARED INFRASTRUCTURE PLANE                            │   │
 │  │                                                                  │   │
 │  │  Unity Catalog Metastore  (central governance, federated access) │   │
 │  │  S3 Data Lake             (shared storage, domain-prefix namespacing)  │
 │  │  Databricks Platform      (shared compute, domain-isolated workspace)  │
 │  │  MSK / Kinesis            (shared event bus)                     │   │
 │  │  Snowflake                (shared serving layer, cross-domain BI)│   │
 │  └─────────────────────────────────────────────────────────────────┘   │
 └────────────────────────────────────────────────────────────────────────┘
```

### Unity Catalog Multi-Domain Setup

```sql
-- Central platform team sets up metastore and top-level catalogs
-- Domain teams own their catalogs

-- Finance domain catalog
CREATE CATALOG finance_prod;
ALTER CATALOG finance_prod SET OWNER TO `finance-data-team@company.com`;
GRANT USE CATALOG ON CATALOG finance_prod TO `finance-data-team@company.com`;
GRANT CREATE SCHEMA ON CATALOG finance_prod TO `finance-data-team@company.com`;

-- Marketing domain catalog
CREATE CATALOG marketing_prod;
ALTER CATALOG marketing_prod SET OWNER TO `marketing-data-team@company.com`;

-- Cross-domain access (controlled, explicit grants)
-- Marketing team needs Finance's revenue data (approved cross-domain use)
GRANT SELECT ON TABLE finance_prod.gold.revenue_by_customer
    TO `marketing-data-team@company.com`;

-- Shared "platform" catalog for cross-domain reference data
CREATE CATALOG shared_platform;
GRANT SELECT ON ALL TABLES IN CATALOG shared_platform
    TO `all-data-teams@company.com`;
```

---

## 12.7 Architecture Anti-Patterns to Avoid

```
❌ ANTI-PATTERN 1: Using Snowflake as your primary ETL engine
   Snowflake VWs billed per credit-hour = expensive for heavy Spark-equivalent transforms
   → Use Databricks or Glue for transformation, Snowflake for serving

❌ ANTI-PATTERN 2: Running all workloads on one large Redshift cluster
   A single large provisioned cluster cannot optimally serve BI + ETL + ML simultaneously
   → Isolate workloads with Redshift Serverless or separate clusters

❌ ANTI-PATTERN 3: All-Purpose Databricks clusters for production pipelines
   All-Purpose clusters cost 2x more than Job clusters
   → Always use Job clusters for scheduled pipelines

❌ ANTI-PATTERN 4: S3 with CSV files and no partitioning
   Athena at $5/TB scanned on 10TB CSV = $50/query
   → Convert to Parquet, partition by date, add file compression

❌ ANTI-PATTERN 5: Snowflake Time Travel on every table for 90 days
   90-day Time Travel on a table with heavy updates = 3-5x storage multiplication
   → Tune Time Travel per table: 1 day for staging tables, 90 days for critical facts

❌ ANTI-PATTERN 6: Building ML models directly in Snowflake SQL
   Snowflake Cortex ML Functions are good for simple regression/classification
   But complex feature engineering on 100M+ rows needs Spark (Databricks)

❌ ANTI-PATTERN 7: Ignoring the Glue Catalog
   Building AWS data lakes without registering tables in Glue Catalog means
   Athena, EMR, Redshift Spectrum cannot discover or join your data
   → Always register all datasets in Glue Catalog from day 1

❌ ANTI-PATTERN 8: Point-to-point platform integrations without event bus
   Direct RDS → Redshift, direct CRM → Snowflake without a central event bus
   creates a brittle, unobservable architecture
   → Route all events through MSK or Kinesis as the single source of truth
```

---

## 12.8 Quick Reference: Service Equivalence Map

| Capability | AWS | Snowflake | Databricks |
|-----------|-----|-----------|------------|
| **Object Storage** | S3 | S3/GCS/ADLS (managed) | S3/GCS/ADLS (customer) |
| **SQL Warehouse** | Redshift | Virtual Warehouse | SQL Warehouse |
| **Ad-hoc SQL** | Athena | Snowsight + VW | SQL Warehouse |
| **ETL/ELT Jobs** | Glue ETL | Snowpark, dbt | Databricks Jobs, dbt |
| **Stream Processing** | Kinesis Analytics, MSK | ❌ (Tasks = micro-batch) | Structured Streaming |
| **Metadata Catalog** | Glue Data Catalog | Snowflake native | Unity Catalog |
| **Governance** | Lake Formation | Native policies | Unity Catalog |
| **Orchestration** | MWAA (Airflow), Step Functions | Tasks + DAGs | Databricks Workflows |
| **Notebooks** | SageMaker Studio | Snowflake Notebooks | Databricks Notebooks |
| **ML Training** | SageMaker Training | Snowpark ML | MLflow + Spark |
| **LLM Integration** | Bedrock | Cortex | Mosaic AI / AI Gateway |
| **Data Sharing** | Data Exchange, Redshift Sharing | Data Sharing, Marketplace | Delta Sharing |
| **CI/CD Integration** | CodePipeline, GitHub Actions | SchemaChange, dbt Cloud | Databricks Asset Bundles |
| **Monitoring** | CloudWatch | ACCOUNT_USAGE | Databricks Observability |
