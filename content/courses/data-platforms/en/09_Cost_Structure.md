---
title: "Cost Structure & Optimization"
description: "Understand the diverse billing models of AWS, Snowflake, and Databricks. Learn practical FinOps techniques, cost 'gotchas', and optimization playbooks for real-world scenarios."
order: 9
difficulty: advanced
duration: "50 min"
---

# Cost Structure & Optimization

> **Bottom Line:** There is no universally cheapest platform — it depends entirely on workload shape. SQL-heavy, concurrent BI workloads tend to favour Snowflake. Large-scale batch and ML tends to favour Databricks on Spot instances. AWS can win on pure infrastructure cost but loses on engineering time. "The cloud is infinite scale, limited only by your CFO's heart — or budget."

---

## 9.1 Cost Model Fundamentals

Each platform uses a different billing unit, which makes direct comparison difficult:

```
AWS Redshift:   $/hour per node type  OR  $/RPU-second (Serverless)
AWS Athena:     $5.00 per TB scanned
AWS Glue:       $0.44 per DPU-hour (Data Processing Unit)
AWS EMR:        EC2 instance cost + $0.048/vCore-hour (EMR fee)

Snowflake:      Credits (1 credit = $2-4 USD depending on edition/region)
                Storage: ~$23/TB/month (compressed)
                Data Transfer: standard AWS/GCP/Azure rates

Databricks:     DBUs (Databricks Units) × instance cost
                DBU rates vary: Standard < Premium < Enterprise
                Instance cost = EC2/AKS/GCE underlying VM
```

---

## 9.2 AWS Cost Structure

### Redshift Pricing

```
Redshift Provisioned (ra3 nodes, us-east-1):
  ra3.xlplus   (4 vCPU,  32 GB RAM)  = $1.086/hour/node
  ra3.4xlarge  (12 vCPU, 96 GB RAM)  = $3.26/hour/node
  ra3.16xlarge (48 vCPU, 384 GB RAM) = $13.04/hour/node
  
  Managed Storage: $0.024/GB-month
  Spectrum:        $5.00 per TB scanned (on S3 data)

Redshift Serverless (us-east-1):
  $0.375 per RPU-second (128 GB RAM per RPU, billed per second)
  Min 8 RPUs → $3.00/second at minimum config
  
  Example: 1 query using 32 RPUs for 60 seconds = 32 × 60 × $0.375 = $720... 
  Wait — that's per RPU-HOUR, not per RPU-second.
  
  Correction: $0.375/RPU-HOUR
  1 query: 32 RPUs × (60 sec / 3600 sec) × $0.375 = $0.20 per query
  
  Monthly cap: ~$0.375 × 32 RPUs × 720 hours = $8,640/month at max utilisation

Reserved Instances (1 year, all upfront):
  ra3.4xlarge: $3.26 → ~$1.63/hour (50% savings)
  ra3.16xlarge: $13.04 → ~$6.52/hour (50% savings)
```

### Athena + Glue Pricing

```python
# Athena cost calculator
def athena_cost_estimate(query_count, avg_tb_scanned_per_query):
    athena_rate = 5.00  # $5 per TB scanned
    
    # Cost optimization factors:
    # Parquet/ORC: ~75% reduction in data scanned vs CSV
    # Partitioning: 80-99% reduction for selective queries
    
    raw_cost = query_count * avg_tb_scanned_per_query * athena_rate
    optimised_cost = raw_cost * 0.25  # With Parquet + partitioning
    
    return {
        "monthly_raw_cost": f"${raw_cost:,.2f}",
        "monthly_optimised_cost": f"${optimised_cost:,.2f}",
        "savings_with_optimisation": f"${raw_cost - optimised_cost:,.2f}"
    }

# Example: 1,000 queries/day, 0.1 TB/query average
result = athena_cost_estimate(
    query_count=30_000,    # Monthly
    avg_tb_scanned_per_query=0.1
)
# Without optimisation: $15,000/month
# With Parquet + partitioning: $3,750/month
```

---

## 9.3 Snowflake Cost Structure

### Credit Consumption Breakdown

```
Snowflake Credit = ~$2.00-4.00 USD (varies: Standard < Enterprise < Business Critical)
Typical Enterprise pricing: $3.00/credit in us-east-1

Virtual Warehouse Credits per Hour:
  X-Small:  1 credit/hr   = $3/hr
  Small:    2 credits/hr  = $6/hr
  Medium:   4 credits/hr  = $12/hr
  Large:    8 credits/hr  = $24/hr
  X-Large:  16 credits/hr = $48/hr
  2X-Large: 32 credits/hr = $96/hr
  3X-Large: 64 credits/hr = $192/hr
  4X-Large: 128 credits/hr = $384/hr

Storage: ~$23/TB/month (compressed — typical 3-5x compression on raw data)
Data Transfer: Standard cloud egress rates

Cloud Services: 10% of daily compute (threshold — above this is billed separately)
```

### Snowflake Cost Gotchas 💰

```sql
-- ⚠️ GOTCHA 1: AUTO_CLUSTERING costs credits silently
-- If you use CLUSTER BY on a large, frequently-updated table,
-- Snowflake automatically re-clusters in the background — this costs credits!
-- Monitor with:
SELECT
    start_time,
    table_name,
    credits_used,
    bytes_reclustered
FROM SNOWFLAKE.ACCOUNT_USAGE.AUTOMATIC_CLUSTERING_HISTORY
WHERE start_time >= DATEADD('day', -7, CURRENT_TIMESTAMP())
ORDER BY credits_used DESC;

-- ⚠️ GOTCHA 2: Multi-cluster warehouse costs multiply!
-- A LARGE VW with MAX_CLUSTER_COUNT = 5 can cost 8 × 5 = 40 credits/hr
-- if all 5 clusters are active simultaneously

-- ⚠️ GOTCHA 3: Fail-Safe + Time Travel storage costs
-- Data within Time Travel (90 days on Enterprise) + 7-day Fail-Safe
-- is billed at standard storage rates
-- A table with 1TB current data + 90 days of changes could easily be 3-5TB billed

-- ⚠️ GOTCHA 4: Snowpipe serverless credits
-- Snowpipe charges serverless compute credits SEPARATE from VW credits
-- Monitor with:
SELECT
    pipe_name,
    credits_used
FROM SNOWFLAKE.ACCOUNT_USAGE.PIPE_USAGE_HISTORY
WHERE start_time >= DATEADD('day', -30, CURRENT_TIMESTAMP())
ORDER BY credits_used DESC;

-- ✅ COST OPTIMIZATION 1: Aggressive auto-suspend
ALTER WAREHOUSE dev_wh SET AUTO_SUSPEND = 60;    -- 60 seconds idle
ALTER WAREHOUSE analytics_wh SET AUTO_SUSPEND = 120;

-- ✅ COST OPTIMIZATION 2: Resource monitors
CREATE RESOURCE MONITOR monthly_budget
    WITH CREDIT_QUOTA = 5000       -- Total monthly credit limit
    FREQUENCY = MONTHLY
    START_TIMESTAMP = IMMEDIATELY
    TRIGGERS
        ON 75 PERCENT DO NOTIFY
        ON 90 PERCENT DO NOTIFY
        ON 100 PERCENT DO SUSPEND_IMMEDIATE;  -- Hard stop at limit

ALTER ACCOUNT SET RESOURCE_MONITOR = monthly_budget;

-- ✅ COST OPTIMIZATION 3: Query result cache reduces compute
-- Identical queries within 24hrs use zero compute (result cache)
-- Design dashboards to re-run the same query text for cache hits

-- ✅ COST OPTIMIZATION 4: Use Snowflake's query profile to find expensive queries
SELECT
    query_id,
    query_text,
    execution_time / 1000.0 AS execution_seconds,
    credits_used_cloud_services,
    bytes_scanned / 1e9 AS gb_scanned
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE execution_time > 30000  -- > 30 seconds
  AND start_time >= DATEADD('day', -7, CURRENT_TIMESTAMP())
ORDER BY execution_time DESC
LIMIT 25;
```

---

## 9.4 Databricks Cost Structure

### DBU Pricing Model

```
DBU Rate depends on:
  1. Workspace tier: Standard < Premium < Enterprise
  2. Cluster type: All-Purpose > Jobs > SQL Warehouse > DLT
  3. Photon enabled: Photon DBUs cost more but may reduce runtime

Approximate DBU rates (Enterprise tier, AWS, us-east-1):
  All-Purpose:    $0.55/DBU
  Jobs:           $0.30/DBU (automated pipelines — significant savings!)
  SQL Warehouse:  $0.22/DBU (serverless SQL)
  DLT Core:       $0.20/DBU
  DLT Advanced:   $0.36/DBU (with change data capture)

DBU consumption depends on instance type:
  m5.xlarge   (4 vCPU)  = 1 DBU/hr
  m5.4xlarge  (16 vCPU) = 4 DBU/hr
  r5.8xlarge  (32 vCPU) = 8 DBU/hr
  
Total Cost = (DBU/hr × DBU rate) + (EC2 instance cost)

Example — 10-worker r5.4xlarge cluster (Jobs tier):
  DBUs: 10 workers × 4 DBU × $0.30 = $12/hr
  EC2:  10 × r5.4xlarge = 10 × $1.008 = $10.08/hr
  Total: ~$22/hr for the cluster
```

### Databricks Cost Gotchas 💰

```python
# ⚠️ GOTCHA 1: All-Purpose clusters are expensive — use Job clusters for pipelines
# All-Purpose (interactive): $0.55/DBU
# Jobs (automated):          $0.30/DBU
# → Always use Job clusters for production pipelines (save 45%)

# ⚠️ GOTCHA 2: Spot instance interruptions can re-run expensive jobs
# Use SPOT_WITH_FALLBACK to get spot savings without full interruption risk
# aws_attributes: {"availability": "SPOT_WITH_FALLBACK", "spot_bid_price_percent": 100}

# ⚠️ GOTCHA 3: Driver node is often undersized or oversized
# Driver collects results from workers — needs enough RAM for final aggregation
# Oversized driver wastes money; undersized driver causes OOM

# ⚠️ GOTCHA 4: Photon costs more per DBU but runs faster
# Photon-enabled clusters: ~2x DBU rate but often 2-5x faster for SQL
# Do the math: same query at 2x cost but 4x faster = 2x cheaper overall

# ✅ COST OPTIMIZATION 1: Spot instances (70% savings typically)
aws_attributes = {
    "availability": "SPOT_WITH_FALLBACK",
    "spot_bid_price_percent": 100,
    "first_on_demand": 1  # Keep 1 on-demand node (driver) for stability
}

# ✅ COST OPTIMIZATION 2: Auto-terminate idle clusters
auto_termination_minutes = 30  # Job clusters auto-terminate after job completes

# ✅ COST OPTIMIZATION 3: Cluster policies to enforce cost guardrails
cluster_policy = {
    "aws_attributes.availability": {
        "type": "fixed",
        "value": "SPOT_WITH_FALLBACK"
    },
    "autoscale.min_workers": {"type": "range", "minValue": 1, "maxValue": 4},
    "autoscale.max_workers": {"type": "range", "minValue": 2, "maxValue": 20},
    "auto_termination_minutes": {"type": "fixed", "value": 60}
}

# ✅ COST OPTIMIZATION 4: Serverless SQL Warehouses for BI
# Serverless SQL Warehouses scale to zero when idle — no idle cost
# Classic warehouses need minimum cluster running (minimum ~$0.22/DBU × 1 cluster)
```

---

## 9.5 Cost Comparison: Real-World Scenarios

### Scenario A: 1 TB/day Batch ETL Pipeline

```
Workload: Transform 1TB of raw data daily, ~4 hours runtime

AWS Glue (serverless Spark):
  2 DPUs × 4 hours × $0.44/DPU-hr = $3.52/run = ~$105/month

Databricks (Jobs cluster, Spot instances, r5.2xlarge × 5):
  DBUs: 5 × 2 DBU × 4 hr × $0.30 = $12/run
  EC2 (Spot): 5 × $0.126/hr × 4 hr = $2.52/run
  Total: $14.52/run = ~$436/month

Snowflake (Medium VW, 4 hours/day):
  4 credits/hr × 4 hr × $3.00 = $48/run = ~$1,440/month

Winner: AWS Glue (for serverless batch ETL at this scale)
Note: Snowflake is not designed for heavy ETL — use it for serving, not transformation
```

### Scenario B: 500 Concurrent BI Dashboard Users

```
Workload: 500 users, each running 10 queries/hour, 10-second avg query duration

AWS Redshift (Serverless):
  Peak: ~100 concurrent queries
  Estimated: 32 RPUs × 8 hrs/day × $0.375/RPU-hr = $86.40/day = $2,592/month
  (+concurrency scaling costs at peak)

Snowflake (Multi-cluster LARGE VW, max 5 clusters):
  Avg 2 active clusters × 8 credits/hr × $3.00 × 8 hrs = $384/day peak
  With auto-suspend and off-peak: ~$200/day → $6,000/month

Databricks SQL Warehouse (Serverless):
  At 500 users: likely 8-16 cluster units × 8 hrs × $0.22/DBU × 8 DBU
  Estimated: ~$180/day → $5,400/month

Winner: AWS Redshift (Serverless) for pure SQL BI concurrency at this scale
Note: Snowflake wins on operational simplicity; results may vary with query complexity
```

### Scenario C: ML Model Training (100M rows, monthly)

```
Workload: Feature engineering + training a gradient boosting model, monthly

AWS SageMaker Training (ml.m5.4xlarge, 2 hours):
  2 hrs × $0.922/hr = $1.84/run = ~$22/year (if monthly)

Databricks (All-Purpose cluster, r5.4xlarge × 8 workers + driver, 3 hrs):
  DBUs: 9 × 4 DBU × 3 hr × $0.55 = $59.40
  EC2: 9 × $1.008 × 3 hr = $27.22
  Total: ~$86.62/run = ~$1,040/year

Snowflake Snowpark ML (2X-Large VW, 2 hours):
  32 credits/hr × 2 hr × $3.00 = $192/run = ~$2,304/year

Winner: AWS SageMaker by a wide margin for structured ML training
Note: Databricks wins when feature engineering (Spark) + training is one pipeline
```

---

## 9.6 Cost Optimization Playbook

### Universal Cost Levers

| Lever | AWS | Snowflake | Databricks |
|-------|-----|-----------|------------|
| **Right-sizing** | Instance type selection | VW size tuning | Cluster worker type |
| **Auto-scaling** | EMR auto-scale, Redshift Serverless | Multi-cluster VW | Cluster autoscale |
| **Idle suspension** | EMR termination, Glue serverless | VW auto-suspend (60s!) | Cluster auto-terminate |
| **Reserved capacity** | Reserved Instances (1yr/3yr) | Pre-purchased credits | DBU pre-purchase |
| **Spot/Preemptible** | EC2 Spot (up to 90% savings) | ❌ N/A | Spot with fallback |
| **Query optimisation** | Redshift sort/dist keys, Athena partitioning | Clustering keys, result cache | Delta ZORDER, AQE |
| **Storage tiering** | S3 Intelligent-Tiering | Time Travel retention policy | VACUUM + Optimize |
| **Monitoring** | AWS Cost Explorer, Budgets | Resource Monitors, ACCOUNT_USAGE | Databricks Cost Dashboard |

---

## 9.7 FinOps Tooling

```
AWS:
  - AWS Cost Explorer (visualise spending)
  - AWS Budgets (alerts + automatic actions)
  - AWS Compute Optimizer (right-sizing recommendations)
  - CloudWatch cost allocation tags

Snowflake:
  - SNOWFLAKE.ACCOUNT_USAGE schema (query history, warehouse metering)
  - Resource Monitors (credit caps + alerts)
  - Snowflake Budgets (per-object cost limits)
  - Third-party: Finout, CloudHealth, re:dash

Databricks:
  - Databricks Cost Dashboard (native)
  - Cluster usage tags (map to teams/projects)
  - Databricks Cluster Policies (enforce cost guardrails)
  - Third-party: Finout, Monte Carlo, Atlan
```
