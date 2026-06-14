---
title: "Snapshots, Seeds, and Advanced Sources"
description: "Master dbt snapshots for Slowly Changing Dimensions on Redshift using the new YAML-based snapshot spec (dbt 1.9+), configure seeds for reference data, and design production-grade source configurations with freshness checks and Redshift Spectrum integration."
order: 7
duration: "50 min"
difficulty: "advanced"
---

# Snapshots, Seeds, and Advanced Sources

Three dbt resource types are often underutilized in advanced projects: snapshots for tracking historical changes, seeds for small reference datasets, and sources for raw data declarations. On Redshift, each has specific performance considerations and new features introduced in dbt-core 1.9.

---

## Snapshots: Tracking Slowly Changing Dimensions

Snapshots implement **Type 2 Slowly Changing Dimensions (SCD2)** — they track how a row changes over time by keeping all historical versions with validity timestamps.

### The New YAML Snapshot Spec (dbt-core 1.9+)

Before dbt 1.9, snapshots could only be defined in `.sql` files with a `{% snapshot %}` block. Now they can be declared entirely in YAML:

```yaml
# snapshots/schema.yml (dbt 1.9+ YAML spec)
snapshots:
  - name: snap_customers
    description: "SCD2 snapshot of the customers dimension"
    relation: source('crm', 'customers')    # source to snapshot

    config:
      # Strategy: check for changes by comparing hash of specified columns
      strategy: check
      unique_key: customer_id
      check_cols:
        - email
        - phone
        - customer_segment
        - billing_address
        - shipping_address

      # Redshift performance configs
      target_schema: snapshots
      target_database: analytics

      # Custom meta column names (dbt 1.9+)
      snapshot_meta_column_names:
        dbt_scd_id:     _scd_id
        dbt_updated_at: _updated_at
        dbt_valid_from: _valid_from
        dbt_valid_to:   _valid_to

      # Handle hard deletes — mark records as deleted when they disappear
      invalidate_hard_deletes: true

      # Redshift-specific
      dist: customer_id
      sort: [_valid_from, _valid_to]
      sort_type: compound
      backup: true
```

### Timestamp-Based Strategy

```yaml
snapshots:
  - name: snap_orders
    relation: source('oms', 'orders')

    config:
      strategy: timestamp
      unique_key: order_id
      updated_at: updated_at           # column that tracks last modification

      target_schema: snapshots

      snapshot_meta_column_names:
        dbt_scd_id:     _scd_id
        dbt_updated_at: _updated_at
        dbt_valid_from: _valid_from
        dbt_valid_to:   _valid_to

      # Custom indicator for "current" records (dbt 1.9+)
      # Default is NULL; set to a future date for BI tool compatibility
      dbt_valid_to_current: '9999-12-31'

      dist: order_id
      sort: [_valid_from]
      sort_type: compound
```

With `dbt_valid_to_current: '9999-12-31'`, current records show `_valid_to = '9999-12-31'` instead of `NULL`, which is much more BI-tool-friendly in Tableau or QuickSight date filters.

### SQL-Based Snapshot (still supported)

```sql
-- snapshots/snap_products.sql
{% snapshot snap_products %}

{{ config(
    target_schema='snapshots',
    strategy='check',
    unique_key='product_id',
    check_cols=['product_name', 'price', 'category', 'is_active'],
    invalidate_hard_deletes=true,
    snapshot_meta_column_names={
        'dbt_scd_id':     '_scd_id',
        'dbt_updated_at': '_updated_at',
        'dbt_valid_from': '_valid_from',
        'dbt_valid_to':   '_valid_to'
    },
    dbt_valid_to_current='9999-12-31',
    dist='product_id',
    sort=['_valid_from'],
    sort_type='compound'
) }}

select
    product_id,
    product_name,
    price,
    category,
    subcategory,
    is_active,
    supplier_id
from {{ source('catalog', 'products') }}

{% endsnapshot %}
```

### Running Snapshots

```bash
# Run all snapshots
dbt snapshot

# Run a specific snapshot
dbt snapshot --select snap_customers

# Snapshot + downstream models in one command
dbt build --select snap_customers+
```

### Querying Snapshots

```sql
-- Current state only
select *
from analytics.snapshots.snap_customers
where _valid_to = '9999-12-31';

-- Historical state as of a point in time
select *
from analytics.snapshots.snap_customers
where _valid_from <= '2024-06-01'
  and (_valid_to > '2024-06-01' or _valid_to = '9999-12-31');

-- Full change history for a customer
select *
from analytics.snapshots.snap_customers
where customer_id = 42
order by _valid_from;
```

---

## Seeds: Reference Data Management

Seeds are CSV files stored in your dbt project that are loaded into the warehouse on `dbt seed`. They're ideal for small, slowly-changing reference tables.

### Configuring Seeds for Redshift

```yaml
# dbt_project.yml
seeds:
  my_analytics:
    # Default configs for all seeds
    +schema: reference
    +backup: false

    # Specific seed configs
    country_codes:
      +column_types:
        iso_code:    varchar(2)
        iso3_code:   varchar(3)
        country_name: varchar(100)
        region:       varchar(50)
      +dist: all          # small lookup table — copy to all nodes
      +sort: iso_code

    status_mapping:
      +column_types:
        raw_status:     varchar(10)
        display_status: varchar(50)
        is_terminal:    boolean
      +dist: all
```

### Seed Files

```
seeds/
├── country_codes.csv
├── status_mapping.csv
└── region_hierarchy.csv
```

```csv
# seeds/status_mapping.csv
raw_status,display_status,is_terminal
P,Pending,false
S,Shipped,false
D,Delivered,true
C,Cancelled,true
RJ,Rejected,true
RF,Refunded,true
```

### Loading Seeds

```bash
# Load all seeds
dbt seed

# Load and show row counts
dbt seed --show

# Load only changed seeds (uses file hash comparison)
dbt seed --select status_mapping

# Full refresh a seed (truncate + reload)
dbt seed --full-refresh --select status_mapping
```

### When to Use Seeds vs. Source Tables

| Situation | Use |
| :--- | :--- |
| Small lookup table (< 1,000 rows), changes rarely | Seed |
| Reference data owned by another team | Source |
| Country codes, status mappings, fiscal calendars | Seed |
| Customer master data from CRM | Source |
| Data that changes more than once a week | Source with snapshot |

---

## Advanced Source Configuration

Sources declare external tables (raw data) that dbt models build upon. Advanced source configuration adds freshness checks, quoting, and Redshift Spectrum support.

### Production Source Configuration

```yaml
# models/staging/sources.yml
version: 2

sources:
  - name: raw_events
    description: "Raw clickstream events from Kinesis Firehose → S3 → Redshift COPY"
    database: analytics
    schema: raw

    # Source-level freshness: warn if any table in this source is stale
    freshness:
      warn_after: {count: 1, period: hour}
      error_after: {count: 6, period: hour}

    # Column quoting (Redshift is case-insensitive but may need quoting for reserved words)
    quoting:
      database: false
      schema: false
      identifier: false

    tables:
      - name: events
        description: "Raw page view and click events"
        identifier: raw_events_partitioned    # actual table name if different from 'events'

        # Table-level freshness override
        freshness:
          warn_after: {count: 30, period: minute}
          error_after: {count: 2, period: hour}
          filter: "event_date >= current_date - 2"   # only check recent partitions

        # Which column determines freshness
        loaded_at_field: event_timestamp

        columns:
          - name: event_id
            description: "UUID for the event"
            data_tests:
              - not_null
              - unique:
                  config:
                    severity: warn    # duplicates are expected in raw layer

          - name: event_timestamp
            description: "UTC timestamp of the event"
            data_tests:
              - not_null

      - name: users
        description: "Raw user records from Firehose"
        loaded_at_field: _fivetran_synced
        freshness:
          warn_after: {count: 4, period: hour}
          error_after: {count: 24, period: hour}
```

### Checking Source Freshness

```bash
# Check all sources
dbt source freshness

# Check specific source
dbt source freshness --select source:raw_events

# Include in CI pipeline
dbt source freshness && dbt run --select staging
```

### Redshift Spectrum External Sources

Sources can point to Redshift Spectrum external tables (data in S3):

```yaml
sources:
  - name: spectrum_raw
    description: "External tables via Redshift Spectrum pointing to S3 data lake"
    database: analytics
    schema: spectrum_schema    # external schema created via CREATE EXTERNAL SCHEMA

    tables:
      - name: events_parquet
        description: "Parquet events partitioned by year/month/day in S3"
        # No freshness checks — Spectrum tables are partitioned externally

        columns:
          - name: event_id
          - name: event_timestamp
          - name: year
            description: "Partition column"
          - name: month
            description: "Partition column"
          - name: day
            description: "Partition column"
```

Staging model over Spectrum:

```sql
-- models/staging/stg_spectrum_events.sql
{{ config(
    materialized='view',
    bind=false        -- REQUIRED for Spectrum sources
) }}

select
    event_id,
    user_id,
    event_type,
    event_timestamp::timestamp as event_timestamp,
    properties::super          as properties
from {{ source('spectrum_raw', 'events_parquet') }}
where year  = date_part('year',  current_date)
  and month = date_part('month', current_date)
  and day   = date_part('day',   current_date)
```

[!IMPORTANT]
Views referencing Redshift Spectrum external tables **must** use `bind: false` (late-binding views). Standard bound views cannot reference external tables and will fail with a compilation error.

---

## 5 Practice Questions

```question
{
  "id": "dbt-rs-07-q1",
  "type": "multiple-choice",
  "question": "What does `dbt_valid_to_current: '9999-12-31'` do in a snapshot configuration?",
  "options": [
    "Sets the snapshot's expiration date",
    "Replaces NULL in the dbt_valid_to column of current records with the specified date, improving BI tool compatibility",
    "Limits the snapshot to records updated before 9999-12-31",
    "Sets the maximum retention period for historical snapshot records"
  ],
  "correct": 1,
  "explanation": "By default, current snapshot records have NULL in dbt_valid_to. Setting dbt_valid_to_current='9999-12-31' replaces NULL with that date, which is much easier to use in BI tools that struggle with NULL date filters."
}
```

```question
{
  "id": "dbt-rs-07-q2",
  "type": "multiple-choice",
  "question": "What is the purpose of `snapshot_meta_column_names` in dbt 1.9+ snapshot config?",
  "options": [
    "To rename the snapshot table itself",
    "To customize the names of dbt's automatically added metadata columns (dbt_valid_from, dbt_valid_to, etc.)",
    "To map source column names to snapshot column names",
    "To set the display names in dbt docs"
  ],
  "correct": 1,
  "explanation": "snapshot_meta_column_names allows you to rename dbt's auto-generated metadata columns (dbt_scd_id, dbt_updated_at, dbt_valid_from, dbt_valid_to) to custom names that align with your organization's naming conventions."
}
```

```question
{
  "id": "dbt-rs-07-q3",
  "type": "multiple-choice",
  "question": "Why must views over Redshift Spectrum external tables use `bind: false`?",
  "options": [
    "Spectrum tables are read-only and bind: true would attempt a write",
    "Standard (bound) views cannot reference external tables — Redshift requires late-binding views for Spectrum compatibility",
    "bind: false improves Spectrum query performance",
    "Redshift Serverless requires bind: false for all views"
  ],
  "correct": 1,
  "explanation": "Redshift does not support bound views over Spectrum external tables. The view definition would fail at creation time. Late-binding views (bind: false) uncouple the view definition from its dependencies, enabling Spectrum references."
}
```

```question
{
  "id": "dbt-rs-07-q4",
  "type": "multiple-choice",
  "question": "Which snapshot strategy should you use when the source table has no `updated_at` column but you want to detect any column value change?",
  "options": [
    "strategy: timestamp",
    "strategy: check with check_cols specified",
    "strategy: merge",
    "strategy: append"
  ],
  "correct": 1,
  "explanation": "The check strategy computes a hash of the specified columns and flags a row as changed when the hash differs from the stored value. This does not require an updated_at timestamp column."
}
```

```question
{
  "id": "dbt-rs-07-q5",
  "type": "multiple-choice",
  "question": "A source table has a `freshness.filter` config set to `\"event_date >= current_date - 2\"`. What does this do?",
  "options": [
    "Deletes data older than 2 days from the source",
    "Limits the freshness check to rows within the last 2 days, avoiding full table scans on large partitioned tables",
    "Filters source data for all staging models referencing this source",
    "Sets the source's TTL to 2 days"
  ],
  "correct": 1,
  "explanation": "The filter in freshness config is added as a WHERE clause to the freshness check query. On large partitioned tables, this prevents a full scan by limiting the check to recent partitions only."
}
```

```question
{
  "id": "dbt-rs-07-q6",
  "type": "multiple-choice",
  "question": "You have a seed file with 800 rows of country codes that rarely changes. Should you set dist: all or dist: even?",
  "options": [
    "dist: even — even distribution is always the safe default",
    "dist: all — copy the full small table to every compute node for co-located joins",
    "dist: key — always use a key for lookup tables",
    "No dist config — seeds use auto distribution automatically"
  ],
  "correct": 1,
  "explanation": "Small reference tables like country codes (800 rows) benefit from dist: all. Every node gets a full copy, enabling co-located joins with any fact or dimension table regardless of that table's distribution key."
}
```

---

[!SUCCESS]
### Key Takeaways

- dbt 1.9+ allows snapshots to be declared entirely in YAML with `snapshot_meta_column_names` for custom column naming and `dbt_valid_to_current` for BI-friendly current-record indicators.
- Use `strategy: timestamp` when a reliable `updated_at` column exists; use `strategy: check` when you need hash-based change detection.
- Set `invalidate_hard_deletes: true` to close historical records when rows disappear from the source.
- Seeds are ideal for small, rarely-changing reference data (<1,000 rows). Use `dist: all` so every join with the seed is co-located.
- Source freshness filters (`freshness.filter`) limit freshness check queries to recent partitions — essential for large, time-partitioned raw tables.
- Views over Redshift Spectrum external tables require `bind: false` — standard views cannot reference external tables.