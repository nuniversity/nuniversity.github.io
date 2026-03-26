---
title: "Data Sharing & Collaboration"
description: "Learn modern live data sharing paradigms. Dive into Snowflake's zero-copy data sharing, Databricks' open-source Delta Sharing, and AWS cross-account architectural patterns."
order: 8
difficulty: advanced
duration: "45 min"
---

# Data Sharing & Collaboration

> **Bottom Line:** Snowflake's data sharing is architecturally superior for sharing governed, live data across organisations — it's a genuine competitive moat. Databricks Delta Sharing is a strong open-standards alternative. AWS requires significant engineering to achieve equivalent cross-account sharing.

---

## 8.1 Data Sharing Paradigms

There are three fundamentally different approaches to sharing data between organisations or cloud accounts:

```
Paradigm 1: COPY-BASED SHARING (traditional)
  Provider → ETL/Export → File/API → Consumer loads into their platform
  ✅ Consumer has full autonomy
  ❌ Data staleness, high transfer costs, no governance continuity

Paradigm 2: QUERY FEDERATION (virtual sharing)
  Consumer runs queries that reach back to provider's data
  ✅ Always fresh data
  ❌ Provider pays compute, latency, complex network config

Paradigm 3: LIVE REFERENCE SHARING (modern)
  Consumer queries data using their own compute
  Data reads happen from provider's storage, provider pays storage
  ✅ Zero data movement, always current, controlled access
  ✅ This is what Snowflake does natively
```

---

## 8.2 Snowflake Data Sharing

Snowflake's sharing model is its strongest competitive differentiator. Data is shared by **granting access to Snowflake's internal storage layer** — no data movement, no ETL, no file exports.

### Direct Sharing Between Snowflake Accounts

```sql
-- PROVIDER SIDE: Share live data with another Snowflake account

-- Step 1: Create a share object
CREATE SHARE ecommerce_partner_share
    COMMENT = 'Live sales data for strategic partner Acme Corp';

-- Step 2: Grant objects into the share
GRANT USAGE ON DATABASE ecommerce TO SHARE ecommerce_partner_share;
GRANT USAGE ON SCHEMA ecommerce.analytics TO SHARE ecommerce_partner_share;
GRANT SELECT ON TABLE ecommerce.analytics.daily_revenue TO SHARE ecommerce_partner_share;
GRANT SELECT ON VIEW ecommerce.analytics.public_product_catalog TO SHARE ecommerce_partner_share;
-- ⚠️ You can share tables, views, and secure views
-- ⚠️ Secure views let you filter rows BEFORE sharing (e.g., only APAC data)

-- Step 3: Add consumer account
ALTER SHARE ecommerce_partner_share
    ADD ACCOUNTS = 'acmecorp.us-east-1';  -- Consumer's Snowflake account identifier

-- Step 4: Optionally grant SELECT with explicit share to a specific role
GRANT SELECT ON TABLE ecommerce.analytics.orders
    TO SHARE ecommerce_partner_share;


-- CONSUMER SIDE: Create a database from the share
CREATE DATABASE acme_partner_data
    FROM SHARE provider_account.ecommerce_partner_share;

-- Query the shared data (using consumer's own warehouse — consumer pays compute)
SELECT * FROM acme_partner_data.analytics.daily_revenue
WHERE revenue_date >= '2024-01-01';
-- This is LIVE data — no copy exists on consumer's account
-- Storage is on provider's account — provider pays storage
```

### Secure Views for Filtered Sharing

```sql
-- Provider: Create a secure view to share only APAC data with an APAC partner
CREATE SECURE VIEW ecommerce.sharing.apac_orders AS
SELECT
    order_id,
    region,
    product_category,
    revenue,
    order_date
    -- Note: customer PII columns intentionally excluded
FROM ecommerce.analytics.orders
WHERE region = 'APAC';

-- The SECURE keyword ensures the view definition is hidden from consumers
-- Consumers cannot see the underlying table structure or filter logic

GRANT SELECT ON VIEW ecommerce.sharing.apac_orders
    TO SHARE apac_partner_share;
```

### Snowflake Data Clean Rooms

Clean Rooms allow two organisations to run joint analyses on their combined data **without either party seeing the other's raw data**:

```sql
-- Clean Room enables privacy-preserving analytics
-- Example: Retailer + Advertiser want to measure ad campaign effectiveness

-- RETAILER'S perspective: Share purchase data without revealing customer details
-- ADVERTISER'S perspective: Share ad exposure data without revealing campaign details

-- Both parties see only AGGREGATE results — never individual records

-- The Clean Room runs approved SQL templates
-- Template: "What % of users who saw ad X made a purchase within 7 days?"
-- Result: "34.2%" — but neither party sees the matched customer list

-- Clean Room creation (simplified):
CALL SAMOOHA_BY_SNOWFLAKE.LIBRARY.CREATE_CLEAN_ROOM('ad_effectiveness_room');
CALL SAMOOHA_BY_SNOWFLAKE.LIBRARY.REGISTER_DB_WITH_CLEAN_ROOM(
    'ad_effectiveness_room',
    'ecommerce_purchases_db'
);
```

### Snowflake Marketplace

```
Snowflake Marketplace: A data commerce platform with 2,000+ datasets

Categories:
  ├── Financial Data (Bloomberg, Refinitiv, S&P, FactSet)
  ├── Weather & Climate (Weather Source, Knoema)
  ├── Geospatial (SafeGraph, Precisely, HERE)
  ├── Healthcare & Life Sciences (IQVIA, Komodo Health)
  ├── Demographics (Experian, Claritas)
  └── Economic Indicators (IMF, World Bank — free datasets)

How it works:
  1. Consumer browses Marketplace in Snowflake UI
  2. Clicks "Get" on a listing
  3. A shared database appears in their account within seconds
  4. Consumer queries it using their own warehouse
  5. Data is always current (live share, no ETL)
  6. Provider bills consumer directly or via listing fee
```

---

## 8.3 Databricks Delta Sharing

Delta Sharing is an open protocol (Linux Foundation) for sharing Delta Lake data across platforms — not just Databricks-to-Databricks:

```
Delta Sharing Architecture:
  ┌─────────────────────┐         ┌───────────────────────────────┐
  │  Data Provider       │         │  Data Consumer                 │
  │  (Databricks)        │         │                               │
  │                      │ HTTPS   │  - Databricks                 │
  │  Delta Lake Table ──►│────────►│  - Pandas (any Python client) │
  │  (Parquet on S3)     │  token  │  - Apache Spark (any)         │
  │                      │         │  - Power BI                   │
  │  Delta Sharing       │         │  - Tableau                    │
  │  Server (REST API)   │         │  - Java client                │
  └─────────────────────┘         └───────────────────────────────┘
```

### Setting Up Delta Sharing (Provider)

```python
# In Databricks, Unity Catalog manages Delta Sharing natively

# Step 1: Create a Share object in Unity Catalog
spark.sql("""
    CREATE SHARE ecommerce_partner_share
    COMMENT 'Live e-commerce data for partners'
""")

# Step 2: Add tables to the share
spark.sql("""
    ALTER SHARE ecommerce_partner_share
    ADD TABLE ecommerce_prod.gold.daily_revenue
    COMMENT 'Daily revenue aggregates'
    PARTITIONS (region = 'APAC')  -- Share only APAC partition!
""")

# Or with row filtering via a shared view
spark.sql("""
    ALTER SHARE ecommerce_partner_share
    ADD TABLE ecommerce_prod.gold.orders
    PARTITION (order_date >= '2024-01-01')
""")

# Step 3: Create a recipient (external consumer)
spark.sql("""
    CREATE RECIPIENT acme_corp_recipient
    COMMENT 'Acme Corporation strategic partner'
    -- For external consumers (non-Databricks), a token is generated
    -- For Databricks-to-Databricks, use the Unity Catalog metastore sharing identifier
""")

# Step 4: Grant share to recipient
spark.sql("""
    GRANT SELECT ON SHARE ecommerce_partner_share
    TO RECIPIENT acme_corp_recipient
""")

# Retrieve the activation link / credentials for the consumer
activate_link = spark.sql(
    "SHOW RECIPIENTS LIKE 'acme_corp_recipient'"
).collect()[0]['activation_link']
```

### Consuming Delta Sharing Data (Consumer Side — Any Platform)

```python
# Consumer: Pandas (no Databricks required — open protocol!)
import delta_sharing

# Profile file contains the share server URL + token
profile_file = "/path/to/acme_corp.share"  # Received from provider

# List available tables
client = delta_sharing.SharingClient(profile_file)
shares = client.list_shares()
tables = client.list_all_tables()

# Load data into Pandas
df = delta_sharing.load_as_pandas(
    f"{profile_file}#ecommerce_partner_share.gold.daily_revenue"
)

# Or load into Spark (from any Spark environment, not just Databricks)
df_spark = delta_sharing.load_as_spark(
    f"{profile_file}#ecommerce_partner_share.gold.daily_revenue"
)

# Streaming from a Delta Share (for continuously updated tables)
stream = delta_sharing.load_as_spark_streaming(
    f"{profile_file}#ecommerce_partner_share.gold.order_events",
    starting_version=0
)
```

---

## 8.4 AWS Cross-Account Data Sharing

AWS does not have a native "data marketplace" product equivalent to Snowflake's. Data sharing across AWS accounts requires more engineering:

### Pattern 1: S3 Cross-Account Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowPartnerAccountRead",
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::999888777666:role/PartnerDataAccessRole"
    },
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::my-data-lake/shared/partner-data/*",
      "arn:aws:s3:::my-data-lake"
    ],
    "Condition": {
      "StringEquals": {"s3:prefix": ["shared/partner-data/"]}
    }
  }]
}
```

**⚠️ Limitation:** This shares raw files, not governed tables. The consumer must handle schema interpretation, format changes, and data quality themselves.

### Pattern 2: AWS Data Exchange

AWS Data Exchange is AWS's equivalent of the Snowflake Marketplace — a data product marketplace:

```
AWS Data Exchange:
  - List datasets as products with pricing
  - Consumers subscribe to get S3 access to data files
  - Automatic data delivery to consumer's S3 bucket
  - API datasets (live queries, not file-based) supported
  
  Limitations vs. Snowflake Marketplace:
  - File-based by default (not live queries, unless API data product)
  - Consumer must load data into their warehouse/lake
  - No zero-copy sharing — data is physically copied
  - Fewer financial/premium datasets than Snowflake Marketplace
```

### Pattern 3: Amazon Redshift Data Sharing

Redshift has native data sharing between Redshift clusters (intra-AWS):

```sql
-- PRODUCER CLUSTER (Redshift)
-- Create a datashare
CREATE DATASHARE ecommerce_share;

-- Add objects to the share
ALTER DATASHARE ecommerce_share
    ADD SCHEMA analytics;

ALTER DATASHARE ecommerce_share
    ADD TABLE analytics.daily_revenue;

-- Grant to another AWS account's Redshift cluster
GRANT USAGE ON DATASHARE ecommerce_share
    TO ACCOUNT '999888777666' VIA DATA CATALOG;

-- CONSUMER (another account's Redshift)
-- Create a database from the share
CREATE DATABASE shared_ecommerce
    FROM DATASHARE ecommerce_share
    OF ACCOUNT '123456789012' NAMESPACE 'abc123-def456-...';

-- Query (uses consumer's compute, data stays on producer's storage)
SELECT * FROM shared_ecommerce.analytics.daily_revenue;
```

**⚠️ Limitation:** Redshift Data Sharing only works between Redshift clusters. It cannot share to Athena, EMR, or non-AWS consumers.

---

## 8.5 Collaboration Features

### Snowflake: Notebooks and Streamlit in Snowflake

```python
# Streamlit in Snowflake — Build data apps without leaving Snowflake
import streamlit as st
from snowflake.snowpark.context import get_active_session

session = get_active_session()

st.title("📊 Executive Revenue Dashboard")
st.markdown("*Live data from Snowflake — no data export required*")

# Load data using Snowpark (all compute stays in Snowflake)
df = session.table("gold.daily_revenue").to_pandas()

col1, col2, col3 = st.columns(3)
col1.metric("Total Revenue", f"${df['revenue'].sum():,.0f}")
col2.metric("YoY Growth", "12.4%", "+2.1%")
col3.metric("Active Regions", df['region'].nunique())

st.line_chart(df.set_index('order_date')['revenue'])
```

### Databricks: Notebooks and Dashboards

```python
# Databricks Notebook — shareable, real-time collaborative
# Supports: Python, SQL, R, Scala
# Version controlled via Git integration

# Example: Collaborative analysis notebook
# (Multiple users can attach to the same cluster)

%python
from pyspark.sql import functions as F

# Everyone in the notebook sees real data from Unity Catalog
orders = spark.table("ecommerce_prod.gold.daily_revenue")

# Widget for parameterised analysis (interactive)
dbutils.widgets.dropdown("region", "APAC", ["APAC", "EMEA", "AMER", "All"])
selected_region = dbutils.widgets.get("region")

if selected_region != "All":
    orders = orders.filter(F.col("region") == selected_region)

display(orders.groupBy("order_date").agg(F.sum("revenue").alias("daily_revenue")))
```

---

## 8.6 Data Sharing Comparison Matrix

| Capability | AWS | Snowflake | Databricks |
|-----------|-----|-----------|------------|
| **Live, zero-copy sharing** | ⚠️ Redshift only (intra-AWS) | ⚡ Native, any account | ✅ Delta Sharing (any platform) |
| **Cross-cloud sharing** | ❌ AWS-only | ✅ S3/GCS/ADLS accounts | ✅ S3/GCS/ADLS |
| **Cross-organisation sharing** | ⚠️ S3 bucket policy (coarse) | ⚡ Best-in-class | ✅ Delta Sharing protocol |
| **Marketplace** | ✅ AWS Data Exchange | ⚡ Largest curated ecosystem | ✅ Databricks Marketplace 🔬 |
| **Privacy-preserving** | ⚠️ AWS Clean Rooms | ✅ Snowflake Clean Rooms | ⚠️ Third-party required |
| **Consumer platform agnostic** | N/A | ❌ Snowflake-to-Snowflake only | ✅ Any Spark/Pandas client |
| **Governance on shared data** | ⚠️ Limited | ✅ Row/column-level filters | ✅ Partition-level filters |
| **Monetisation support** | ✅ Data Exchange pricing | ✅ Marketplace listings | ✅ Marketplace 🔬 |
| **Open protocol** | ✅ S3 open format | ❌ Proprietary | ✅ Open Delta Sharing spec |
