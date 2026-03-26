---
title: "Governance, Security & Compliance"
description: "Master data governance frameworks spanning identity, access control, and data lineage. Compare implementation strategies using AWS Lake Formation, Snowflake RBAC, and Databricks Unity Catalog."
order: 6
difficulty: advanced
duration: "60 min"
---

# Governance, Security & Compliance

> **Bottom Line:** Unity Catalog is the most ambitious governance model — unified, code-first, spanning files through to ML models. Lake Formation is the most flexible for complex AWS-native environments. Snowflake's governance is mature, well-integrated, and requires the least configuration overhead — but is bounded by the Snowflake platform.

---

## 6.1 Governance Framework Overview

Data governance covers five critical domains. Here's how each platform addresses them:

```
┌─────────────────────────────────────────────────────────────────────┐
│             GOVERNANCE DOMAIN MAP                                    │
│                                                                      │
│  1. IDENTITY       Who is this person/service?                       │
│     └─► IAM Users/Roles | Snowflake Users/Roles | Databricks Users  │
│                                                                      │
│  2. ACCESS CONTROL What can they read/write/execute?                 │
│     └─► Lake Formation | RBAC/ABAC | Unity Catalog ACLs             │
│                                                                      │
│  3. DATA QUALITY   Is the data accurate and complete?                │
│     └─► Glue Data Quality | Snowflake Constraints | DLT Expectations │
│                                                                      │
│  4. DATA LINEAGE   Where did this data come from?                    │
│     └─► Glue + DataZone | Snowflake Access History | Unity Lineage  │
│                                                                      │
│  5. DATA CATALOG   Where can I find this data?                       │
│     └─► AWS Glue Catalog / DataZone | Snowflake | Unity Catalog     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6.2 AWS Governance: Lake Formation + IAM

### The IAM Foundation

Everything in AWS governance starts with IAM (Identity and Access Management). IAM alone is insufficient for fine-grained data lake control — that's where Lake Formation adds value.

```
IAM alone (pre-Lake Formation):
  Permission: s3:GetObject on arn:aws:s3:::my-data-lake/*
  → User can read EVERYTHING in the bucket. No table/column/row awareness.

With Lake Formation:
  LF Permission: SELECT on db=ecommerce, table=orders, columns=[order_id, amount]
  + IAM: s3:GetObject (Lake Formation intercepts and enforces column-level)
  → User can only read two specific columns. Row filters also possible.
```

### Lake Formation Permission Model

```python
import boto3

lf = boto3.client('lakeformation', region_name='us-east-1')

# Grant table-level SELECT to a data analyst
lf.grant_permissions(
    Principal={'DataLakePrincipalIdentifier': 'arn:aws:iam::123456789:role/DataAnalystRole'},
    Resource={
        'Table': {
            'CatalogId': '123456789',
            'DatabaseName': 'ecommerce',
            'Name': 'orders'
        }
    },
    Permissions=['SELECT'],
    PermissionsWithGrantOption=[]
)

# Grant column-level access (include specific columns)
lf.grant_permissions(
    Principal={'DataLakePrincipalIdentifier': 'arn:aws:iam::123456789:role/LimitedAnalystRole'},
    Resource={
        'TableWithColumns': {
            'CatalogId': '123456789',
            'DatabaseName': 'ecommerce',
            'Name': 'customers',
            'ColumnWildcard': {
                'ExcludedColumnNames': ['ssn', 'date_of_birth', 'credit_card_number']
                # These columns are EXCLUDED — all others are accessible
            }
        }
    },
    Permissions=['SELECT']
)

# Create a row-level filter (requires Lake Formation + AWS Glue governed tables)
lf.create_data_cells_filter(
    TableData={
        'TableCatalogId': '123456789',
        'DatabaseName': 'ecommerce',
        'TableName': 'orders',
        'Name': 'apac_region_filter',
        'RowFilter': {
            'FilterExpression': "region = 'APAC'"  # Only APAC rows visible
        },
        'ColumnWildcard': {}  # All columns
    }
)
```

### AWS Tag-Based Access Control (ABAC with LF Tags)

```python
# Create LF tags (attribute-based)
lf.create_lf_tag(TagKey='classification', TagValues=['public', 'internal', 'confidential', 'restricted'])
lf.create_lf_tag(TagKey='domain', TagValues=['finance', 'marketing', 'hr', 'engineering'])

# Assign tags to database objects
lf.add_lf_tags_to_resource(
    Resource={'Database': {'Name': 'hr_data'}},
    LFTags=[
        {'TagKey': 'classification', 'TagValues': ['restricted']},
        {'TagKey': 'domain', 'TagValues': ['hr']}
    ]
)

# Grant access based on tags (ABAC — scales across thousands of tables)
lf.grant_permissions(
    Principal={'DataLakePrincipalIdentifier': 'arn:aws:iam::123456789:role/HRAnalystRole'},
    Resource={
        'LFTagPolicy': {
            'ResourceType': 'TABLE',
            'Expression': [
                {'TagKey': 'domain', 'TagValues': ['hr']},
                {'TagKey': 'classification', 'TagValues': ['restricted', 'internal']}
            ]
        }
    },
    Permissions=['SELECT', 'DESCRIBE']
)
# This single grant gives access to ALL current AND future tables tagged domain=hr
# This is ABAC's key advantage over table-by-table RBAC grants
```

---

## 6.3 Snowflake Governance

### Role Hierarchy Design

Snowflake's security model is **role-based (RBAC)**. Designing a clean role hierarchy is critical for maintainability:

```sql
-- Recommended Snowflake RBAC hierarchy pattern
-- (Snowflake Object Hierarchy: Account > Database > Schema > Table/View)

-- Account-level system roles (built-in):
-- ACCOUNTADMIN → SYSADMIN → (custom roles)
--                         → SECURITYADMIN → USERADMIN

-- Create functional roles (what the person does)
CREATE ROLE analyst_finance;
CREATE ROLE analyst_marketing;
CREATE ROLE data_engineer;
CREATE ROLE data_scientist;

-- Create object-level roles (what the object requires)
CREATE ROLE db_ecommerce_read;
CREATE ROLE db_ecommerce_write;

-- Grant object permissions to object roles
GRANT USAGE ON DATABASE ecommerce TO ROLE db_ecommerce_read;
GRANT USAGE ON ALL SCHEMAS IN DATABASE ecommerce TO ROLE db_ecommerce_read;
GRANT SELECT ON ALL TABLES IN DATABASE ecommerce TO ROLE db_ecommerce_read;
GRANT SELECT ON FUTURE TABLES IN DATABASE ecommerce TO ROLE db_ecommerce_read;

-- Grant object roles to functional roles (composability)
GRANT ROLE db_ecommerce_read TO ROLE analyst_finance;
GRANT ROLE db_ecommerce_read TO ROLE analyst_marketing;

-- Grant functional roles to users
GRANT ROLE analyst_finance TO USER alice;
GRANT ROLE data_engineer TO USER bob;

-- Verify permissions (as SECURITYADMIN)
SHOW GRANTS TO ROLE analyst_finance;
SHOW GRANTS ON TABLE ecommerce.analytics.orders;
```

### Snowflake Dynamic Data Masking

```sql
-- Create a masking policy for PII columns
CREATE MASKING POLICY pii_email_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('DATA_ENGINEER', 'ACCOUNTADMIN') THEN val
        WHEN CURRENT_ROLE() = 'ANALYST_MARKETING' THEN REGEXP_REPLACE(val, '.+@', '****@')
        ELSE '**REDACTED**'
    END;

-- Apply masking policy to a column
ALTER TABLE customers
    MODIFY COLUMN email SET MASKING POLICY pii_email_mask;

-- Test: As analyst_marketing role, email shows as ****@domain.com
-- As data_engineer role, email shows as alice@company.com (unmasked)
-- As any other role, email shows as **REDACTED**
```

### Snowflake Row Access Policies

```sql
-- Create a row access policy (team-based data segregation)
CREATE ROW ACCESS POLICY regional_data_policy AS (region VARCHAR)
RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() = 'GLOBAL_ADMIN' THEN TRUE          -- See everything
        WHEN CURRENT_ROLE() = 'APAC_ANALYST' THEN region = 'APAC'
        WHEN CURRENT_ROLE() = 'EMEA_ANALYST' THEN region = 'EMEA'
        WHEN CURRENT_ROLE() = 'AMER_ANALYST' THEN region = 'AMER'
        ELSE FALSE
    END;

-- Attach to table
ALTER TABLE sales
    ADD ROW ACCESS POLICY regional_data_policy ON (region);

-- Now, queries automatically filtered by role — no WHERE clause needed by analyst
-- APAC_ANALYST running: SELECT * FROM sales;
-- → Snowflake internally adds: WHERE regional_data_policy(region) = TRUE
-- → Returns only APAC rows
```

### Snowflake Object Tagging for Data Classification

```sql
-- Create custom tags
CREATE TAG classification
    ALLOWED_VALUES 'public', 'internal', 'confidential', 'pii';

CREATE TAG data_owner
    COMMENT 'Team responsible for this object';

-- Apply tags to objects
ALTER TABLE customers
    SET TAG classification = 'pii', data_owner = 'customer-data-team';

ALTER COLUMN customers.email
    SET TAG classification = 'pii';

-- Query tagged objects across the account (discovery)
SELECT
    object_database,
    object_schema,
    object_name,
    column_name,
    tag_name,
    tag_value
FROM SNOWFLAKE.ACCOUNT_USAGE.TAG_REFERENCES
WHERE tag_name = 'CLASSIFICATION'
  AND tag_value = 'pii'
ORDER BY object_database, object_name;
```

---

## 6.4 Databricks Unity Catalog

Unity Catalog (UC) is Databricks' most significant recent platform addition. It provides a **single governance layer** spanning the entire Databricks workspace.

### Unity Catalog Object Hierarchy

```
Unity Catalog Metastore (1 per cloud region, shared across workspaces)
├── Catalog: ecommerce_prod
│   ├── Schema: raw
│   │   ├── Table: orders (Delta)
│   │   ├── Table: customers (Delta)
│   │   └── Volume: /raw_files/  ← Governs files, not just tables!
│   ├── Schema: silver
│   │   ├── Table: orders_clean
│   │   └── View: active_customers
│   └── Schema: gold
│       └── Table: daily_revenue
├── Catalog: ml_prod
│   ├── Schema: feature_store
│   │   └── Table: customer_features
│   └── Schema: models
│       └── Registered Model: churn_predictor  ← ML models governed!
└── Catalog: shared_external
    └── Schema: partner_data
        └── Table: external_orders  ← External table pointing to S3
```

### Unity Catalog Privilege Grants

```sql
-- Grant hierarchical privileges (inherits downward)
GRANT USE CATALOG ON CATALOG ecommerce_prod TO `data-engineers@company.com`;
GRANT USE SCHEMA ON SCHEMA ecommerce_prod.silver TO `data-engineers@company.com`;
GRANT SELECT ON TABLE ecommerce_prod.silver.orders_clean TO `analysts@company.com`;

-- Grant on all current AND future tables in a schema
GRANT SELECT ON ALL TABLES IN SCHEMA ecommerce_prod.gold TO `bi-team@company.com`;
ALTER SCHEMA ecommerce_prod.gold
  SET OWNER TO `bi-team@company.com`;  -- Owner has all privileges

-- Row-level security via Row Filter function
CREATE FUNCTION ecommerce_prod.silver.region_filter(region_col STRING)
RETURNS BOOLEAN
RETURN
  IS_ACCOUNT_GROUP_MEMBER('apac-analysts') AND region_col = 'APAC'
  OR IS_ACCOUNT_GROUP_MEMBER('emea-analysts') AND region_col = 'EMEA'
  OR IS_ACCOUNT_GROUP_MEMBER('global-admins');

ALTER TABLE ecommerce_prod.silver.orders_clean
  SET ROW FILTER ecommerce_prod.silver.region_filter ON (region);

-- Column masking
CREATE FUNCTION ecommerce_prod.silver.mask_email(email STRING)
RETURNS STRING
RETURN
  CASE WHEN IS_ACCOUNT_GROUP_MEMBER('pii-access')
    THEN email
    ELSE CONCAT(LEFT(email, 2), '***@***.***')
  END;

ALTER TABLE ecommerce_prod.silver.customers
  ALTER COLUMN email SET MASK ecommerce_prod.silver.mask_email;
```

### Unity Catalog Data Lineage

Unity Catalog automatically captures **column-level lineage** across notebooks, SQL queries, Delta Live Tables, and ML workflows:

```python
# Lineage is captured automatically — no code changes needed
# Just query or write tables registered in Unity Catalog

# Example: This Spark job's lineage is automatically tracked
df = spark.read.table("ecommerce_prod.silver.orders_clean")   # Input
features = df.select(
    "customer_id",
    F.avg("revenue").over(Window.partitionBy("customer_id")).alias("avg_revenue")
)
features.write.mode("overwrite").saveAsTable("ml_prod.feature_store.customer_features")
# Output: ml_prod.feature_store.customer_features

# In Unity Catalog UI / API, you can now trace:
# ecommerce_prod.silver.orders_clean → ml_prod.feature_store.customer_features
# Column level: orders_clean.revenue → customer_features.avg_revenue
```

```python
# Programmatic lineage query via Databricks SDK
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()

lineage = w.lineage_tracking.table_lineage(
    table_name="ml_prod.feature_store.customer_features",
    include_entity_lineage=True
)

for upstream in lineage.upstreams:
    print(f"Upstream: {upstream.table_info.full_name}")
    for col_link in upstream.column_links:
        print(f"  {col_link.source_column_name} → {col_link.target_column_name}")
```

---

## 6.5 Encryption and Network Security

### Encryption At Rest

| Layer | AWS | Snowflake | Databricks |
|-------|-----|-----------|------------|
| **Default encryption** | SSE-S3 (AES-256) | AES-256 (managed by Snowflake) | AES-256 on S3/ADLS |
| **Customer-managed keys** | ✅ SSE-KMS (AWS KMS) | ✅ Tri-Secret Secure (Snowflake + customer key) | ✅ Customer-managed KMS |
| **Key rotation** | ✅ Automatic (KMS) | ✅ Annual (or manual) | ✅ AWS KMS rotation |
| **Column-level encryption** | ⚠️ Manual (application-level) | ⚠️ Manual (UDFs) | ⚠️ Manual (UDFs) |

**Snowflake Tri-Secret Secure:** A unique model where Snowflake holds half the key and the customer holds the other half. If Snowflake loses access to the customer's key (e.g., customer revokes it), Snowflake cannot decrypt the data. This addresses a key compliance concern.

### Network Isolation

```
AWS VPC Architecture for Data Platform:
┌─────────────────────────────────────────────────────────┐
│  VPC: 10.0.0.0/16                                        │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │  Private Subnet A     │  │  Private Subnet B         │  │
│  │  10.0.1.0/24          │  │  10.0.2.0/24              │  │
│  │  (Redshift / EMR)     │  │  (Lambda / Glue workers)  │  │
│  └──────────────────────┘  └──────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  VPC Endpoints (PrivateLink)                       │   │
│  │  - S3 Gateway Endpoint (free)                      │   │
│  │  - Glue Interface Endpoint                         │   │
│  │  - Kinesis Interface Endpoint                      │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  Security Groups:                                        │
│  - Redshift: Allow port 5439 from specific CIDR only     │
│  - EMR: Allow port 8888 (Jupyter) from bastion only      │
└─────────────────────────────────────────────────────────┘
        │ AWS PrivateLink
        ▼
┌──────────────┐    ┌─────────────────────────────────────┐
│  Snowflake   │    │  Databricks (Data Plane in your VPC) │
│  PrivateLink │    │  - Clusters run in your EC2          │
│  Endpoint    │    │  - S3 access via VPC endpoint        │
└──────────────┘    └─────────────────────────────────────┘
```

---

## 6.6 Compliance and Audit

### Audit Logging Comparison

| Capability | AWS (CloudTrail + Lake Formation) | Snowflake | Databricks |
|-----------|----------------------------------|-----------|------------|
| **Query history** | ✅ CloudTrail (API calls) | ✅ QUERY_HISTORY (90 days) | ✅ Query history (60 days) |
| **Data access audit** | ✅ LF Access Logs → CloudTrail | ✅ ACCESS_HISTORY | ✅ Unity Catalog audit logs |
| **Column-level access tracking** | ✅ Via LF + CloudTrail | ✅ Columns accessed per query | ✅ Via Unity Catalog |
| **User login/session audit** | ✅ CloudTrail | ✅ LOGIN_HISTORY | ✅ Audit log delivery |
| **Export to SIEM** | ✅ CloudTrail → S3 → SIEM | ✅ Via ACCOUNT_USAGE → Snowflake Connector | ✅ Audit log streaming |

```sql
-- Snowflake: Find all queries that accessed PII columns
SELECT
    query_id,
    user_name,
    role_name,
    query_text,
    start_time,
    oc.value:objectDomain::STRING AS domain,
    oc.value:objectName::STRING AS object_name,
    col.value:columnName::STRING AS column_name
FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY,
    LATERAL FLATTEN(input => DIRECT_OBJECTS_ACCESSED) oc,
    LATERAL FLATTEN(input => oc.value:columns) col
WHERE col.value:columnName::STRING IN ('SSN', 'EMAIL', 'CREDIT_CARD', 'DATE_OF_BIRTH')
  AND start_time >= DATEADD('day', -30, CURRENT_TIMESTAMP())
ORDER BY start_time DESC;
```

---

## 6.7 Governance Capability Comparison

| Capability | AWS Lake Formation | Snowflake | Databricks Unity Catalog |
|-----------|-------------------|-----------|--------------------------|
| **Centralised catalog** | ✅ Glue Catalog | ✅ Snowflake native | ✅ Unity Catalog |
| **RBAC** | ✅ IAM roles + LF | ✅ Native, mature | ✅ Native |
| **ABAC (tag-based)** | ✅ LF Tags | ✅ Object tags (policy-linked) | ✅ Group-based + tags |
| **Column masking** | ✅ LF column masking | ✅ Dynamic Data Masking | ✅ Column masks |
| **Row-level security** | ✅ LF row filters | ✅ Row Access Policies | ✅ Row filters |
| **Data lineage** | ⚠️ Via DataZone (basic) | ✅ Access History (query-level) | ⚡ Column-level, automatic |
| **Cross-workspace governance** | ✅ (via IAM + LF) | ✅ (account-level) | ✅ (one metastore per region) |
| **ML model governance** | ⚠️ SageMaker (separate) | ⚠️ Limited | ✅ Registered models in UC |
| **File governance** | ⚠️ S3 policies (coarse) | ❌ Only for tables | ✅ Volumes (files governed) |
| **Multi-cloud governance** | ❌ AWS only | ✅ Multi-cloud account | ✅ Multi-cloud (separate metastores) |
| **Data quality rules** | ✅ Glue Data Quality | ✅ Constraints + alerts | ✅ DLT expectations |

---

*Next: [07 — AI & Machine Learning Capabilities](./07_AI_and_ML.md)*
