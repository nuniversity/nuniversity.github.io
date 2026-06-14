---
title: "Essential dbt Packages for Production Projects"
description: "Master the must-have dbt packages for every production project: dbt-utils, dbt-expectations, dbt-audit-helper, dbt-codegen, elementary, dbt-project-evaluator, and more — all configured for an Amazon Redshift environment."
order: 10
duration: "55 min"
difficulty: "advanced"
---

# Essential dbt Packages for Production Projects

The dbt package ecosystem means you should never write a surrogate key function, a pivot macro, or a date spine from scratch. The community has already solved these problems, tested them at scale, and published them on dbt Hub. This module covers the packages that belong in every production dbt-Redshift project, why they exist, and how to use their most important features.

---

## Package Management Fundamentals

All packages are declared in `packages.yml` and installed with `dbt deps`.

```yaml
# packages.yml
packages:
  # Core utilities — install this in every project
  - package: dbt-labs/dbt_utils
    version: 1.3.0

  # Great Expectations-style data quality tests
  - package: calogica/dbt_expectations
    version: 0.10.4

  # Dataset comparison for migrations and refactors
  - package: dbt-labs/audit_helper
    version: 0.10.0

  # Code generation from sources and warehouse introspection
  - package: dbt-labs/dbt_codegen
    version: 0.12.1

  # Data observability and anomaly detection
  - package: elementary-data/elementary
    version: 0.16.1

  # DAG quality and documentation coverage enforcement
  - package: dbt-labs/dbt_project_evaluator
    version: 0.13.0

  # dbt artifact mart (run metadata in warehouse tables)
  - package: brooklyn-data/dbt_artifacts
    version: 2.3.0
```

```bash
# Install all declared packages
dbt deps

# Update a specific package
dbt deps --upgrade
```

[!TIP]
Always pin package versions exactly in `packages.yml`. Floating versions (`>=1.0.0`) cause non-reproducible builds when packages release breaking changes. Update versions deliberately, after reading the changelog.

---

## 1. dbt-utils: The Foundation Package

`dbt-labs/dbt_utils` is the most important dbt package — it provides core macros and tests that nearly every other package depends on.

### Surrogate Keys

```sql
-- models/marts/dim_customers.sql
select
    -- Generate a surrogate key from multiple natural keys
    {{ dbt_utils.generate_surrogate_key(['user_id', 'account_id']) }} as customer_key,
    user_id,
    account_id,
    email,
    customer_segment
from {{ ref('stg_customers') }}
```

`generate_surrogate_key` produces a consistent MD5 hash across warehouses. On Redshift it compiles to `md5(cast(coalesce(cast(user_id as varchar), '_dbt_utils_surrogate_key_null_') || '-' || ...) as varchar)`.

### Star — Select All Except

```sql
-- Select all columns except internal load metadata columns
select
    {{ dbt_utils.star(
        from=ref('stg_orders'),
        except=['_fivetran_synced', '_fivetran_deleted', 'loaded_at']
    ) }}
from {{ ref('stg_orders') }}
```

### Union Relations

```sql
-- models/marts/fct_all_events.sql
{{ config(materialized='incremental', incremental_strategy='append') }}

{{
    dbt_utils.union_relations(
        relations=[
            ref('stg_web_events'),
            ref('stg_mobile_events'),
            ref('stg_api_events')
        ],
        column_override={"event_timestamp": "timestamp"},
        include=["event_id", "user_id", "event_type", "event_timestamp", "properties"]
    )
}}
```

### Date Spine

```sql
-- models/marts/dim_date.sql
{{ config(materialized='table', dist='all', sort='date_day') }}

{{
    dbt_utils.date_spine(
        datepart="day",
        start_date="cast('2020-01-01' as date)",
        end_date="cast('2030-12-31' as date)"
    )
}}
```

### Useful Generic Tests

```yaml
models:
  - name: fct_orders
    columns:
      - name: order_id
        data_tests:
          # Ensure no values are empty strings (not caught by not_null)
          - dbt_utils.not_empty_string

      - name: total_amount
        data_tests:
          # Value must be between two other columns in the same row
          - dbt_utils.expression_is_true:
              expression: ">= 0"

    data_tests:
      # Table-level: ensure at least N rows exist
      - dbt_utils.recency:
          datepart: hour
          field: order_date
          interval: 6      # fails if newest order is > 6 hours old

      # Row count is within expected range
      - dbt_utils.equal_rowcount:
          compare_model: ref('stg_orders')

      # Not-null proportion (useful for raw source tables)
      - dbt_utils.not_null_proportion:
          at_least: 0.95
          column_name: customer_id
```

---

## 2. dbt-expectations: Great Expectations for dbt

`calogica/dbt_expectations` adds 50+ data quality tests inspired by the Great Expectations library — far beyond dbt's built-in generic tests.

```yaml
# packages.yml already includes calogica/dbt_expectations

models:
  - name: fct_orders
    data_tests:
      # Table must have exactly these columns (catches accidental schema changes)
      - dbt_expectations.expect_table_columns_to_match_ordered_list:
          column_list:
            - order_id
            - customer_id
            - order_date
            - status
            - total_amount
            - customer_segment
            - region

      # Row count must be within 20% of yesterday's count
      - dbt_expectations.expect_table_row_count_to_be_between:
          min_value: 1000
          max_value: 10000000

    columns:
      - name: order_date
        data_tests:
          # Date must be between two bounds
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: "'2020-01-01'"
              max_value: "current_date"
              row_condition: "order_date is not null"

          # No gaps in daily date coverage (critical for time-series facts)
          - dbt_expectations.expect_row_values_to_have_data_for_every_n_datepart:
              date_col: order_date
              date_part: day
              test_start_date: "'2024-01-01'"

      - name: total_amount
        data_tests:
          # Value distribution: mean should be between $50 and $500
          - dbt_expectations.expect_column_mean_to_be_between:
              min_value: 50
              max_value: 500

          # Standard deviation check (detects data distribution drift)
          - dbt_expectations.expect_column_stdev_to_be_between:
              min_value: 10
              max_value: 1000

          # No outliers > 3 sigma from the mean
          - dbt_expectations.expect_column_values_to_be_within_n_stdevs:
              n: 3

      - name: email
        data_tests:
          # Regex validation for email format
          - dbt_expectations.expect_column_values_to_match_regex:
              regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
              row_condition: "email is not null"
```

---

## 3. dbt-audit-helper: Safe Refactoring and Migrations

`dbt-labs/audit_helper` is your safety net when refactoring models or migrating from one SQL pattern to another. It compares two relations row-by-row and column-by-column.

### Compare Row Counts

```bash
# As a dbt operation
dbt run-operation audit_helper.compare_row_counts --args '{
    "a_relation": "analytics.marts.fct_orders",
    "b_relation": "analytics.marts_v2.fct_orders"
}'
```

### Compare Column Values

```bash
# Column-by-column value comparison between old and new model
dbt run-operation audit_helper.compare_column_values --args '{
    "a_relation": "analytics.marts.fct_orders",
    "b_relation": "analytics.marts_v2.fct_orders",
    "primary_key": "order_id",
    "columns_to_compare": ["total_amount", "status", "customer_segment"]
}'
```

Output:

```
column_name     | match_count | a_only_count | b_only_count | mismatch_count
----------------|-------------|--------------|--------------|---------------
total_amount    | 99,847      | 0            | 0            | 153
status          | 100,000     | 0            | 0            | 0
customer_segment| 99,993      | 0            | 0            | 7
```

### Workflow: Safe Migration

```bash
# Step 1: Build new model alongside old one
dbt run --select fct_orders_v2

# Step 2: Compare — zero mismatches required before cutover
dbt run-operation audit_helper.compare_column_values --args '{...}'

# Step 3: Compare row counts
dbt run-operation audit_helper.compare_row_counts --args '{...}'

# Step 4: If clean, rename and switch refs
```

---

## 4. dbt-codegen: Eliminate Boilerplate

`dbt-labs/dbt_codegen` generates YAML and SQL from your warehouse schema — eliminating the tedious manual work of writing source configurations and base models.

### Generate Source YAML from Redshift

```bash
# Generate sources.yml for an entire schema
dbt run-operation codegen.generate_source --args '{
    "schema_name": "raw",
    "database_name": "analytics",
    "generate_columns": true,
    "include_descriptions": true,
    "table_pattern": "orders%"    # only tables matching this pattern
}'
```

Output (paste into `models/staging/sources.yml`):

```yaml
version: 2
sources:
  - name: raw
    database: analytics
    schema: raw
    tables:
      - name: orders
        description: ""
        columns:
          - name: order_id
            description: ""
          - name: customer_id
            description: ""
          # ... all columns
```

### Generate Base Models

```bash
# Generate a staging model SQL from a source table
dbt run-operation codegen.generate_base_model --args '{
    "source_name": "raw",
    "table_name": "orders",
    "leading_commas": false
}'
```

Output (paste into `models/staging/stg_orders.sql`):

```sql
with source as (

    select * from {{ source('raw', 'orders') }}

),

renamed as (

    select
        order_id,
        customer_id,
        status,
        total_amount,
        created_at,
        updated_at

    from source

)

select * from renamed
```

### Generate Model YAML

```bash
# Generate schema.yml for an already-materialized model
dbt run-operation codegen.generate_model_yaml --args '{
    "model_names": ["fct_orders", "dim_customers"],
    "upstream_descriptions": true
}'
```

---

## 5. Elementary: Data Observability

`elementary-data/elementary` adds anomaly detection as native dbt tests — it monitors your data for volume, freshness, schema, and value distribution anomalies without external tooling.

```yaml
# models/marts/facts/schema.yml
models:
  - name: fct_orders
    data_tests:
      # Alert if row count drops/spikes more than 20% vs. trailing 7-day average
      - elementary.volume_anomalies:
          timestamp_column: order_date
          sensitivity: 3         # standard deviations
          days_back: 14          # training window

      # Alert if newest row is older than expected
      - elementary.freshness_anomalies:
          timestamp_column: order_date
          sensitivity: 3

    columns:
      - name: total_amount
        data_tests:
          # Alert if value distribution changes significantly
          - elementary.column_anomalies:
              column_anomalies:
                - null_count
                - null_rate
                - average
                - standard_deviation
                - max_value
              timestamp_column: order_date
              sensitivity: 3

      - name: status
        data_tests:
          # Alert if category distribution changes (e.g., sudden spike in Cancelled)
          - elementary.dimension_anomalies:
              timestamp_column: order_date
              sensitivity: 3
```

Elementary writes test results to a mart of tables in your warehouse. Configure the schema:

```yaml
# dbt_project.yml
vars:
  elementary:
    elementary_database: analytics
    elementary_schema: elementary    # dedicated schema for observability tables
    days_back: 30                    # how many days of history to retain
```

```bash
# Install elementary and run its models
dbt deps
dbt run --select elementary

# Generate the Elementary report (HTML observability dashboard)
pip install elementary-data
edr report
```

---

## 6. dbt-project-evaluator: DAG Quality Enforcement

`dbt-labs/dbt_project_evaluator` analyzes your dbt project's structure and flags anti-patterns.

```bash
# Run all evaluator checks
dbt build --select package:dbt_project_evaluator
```

Key checks it runs:

| Evaluator Model | What it catches |
| :--- | :--- |
| `fct_undocumented_models` | Models missing description |
| `fct_missing_primary_key_tests` | Models without unique + not_null tests |
| `fct_model_fanout` | Models with too many direct parents (spaghetti DAG) |
| `fct_rejoining_of_upstream_concepts` | Models that join two branches sharing a common ancestor |
| `fct_direct_join_to_source` | Mart models that join directly to raw sources |
| `fct_hard_coded_references` | Models using hardcoded schema names instead of `ref()` |
| `fct_unused_sources` | Sources declared but never referenced |

Configure thresholds in your `dbt_project.yml`:

```yaml
# dbt_project.yml
vars:
  dbt_project_evaluator:
    documentation_coverage_target: 80       # % of models that must be documented
    test_coverage_target: 80                # % of models that must have tests
    max_fanout_models: 5                    # max direct parents per model
    primary_key_test_macros:               # what counts as a PK test
      - dbt_utils.unique_combination_of_columns
      - unique
```

---

## 7. dbt-artifacts: Run Metadata in Your Warehouse

`brooklyn-data/dbt_artifacts` loads dbt run metadata (model timings, test results, source freshness) into warehouse tables — enabling dashboards over your pipeline health.

```yaml
# packages.yml
packages:
  - package: brooklyn-data/dbt_artifacts
    version: 2.3.0
```

```yaml
# dbt_project.yml
vars:
  dbt_artifacts:
    dbt_artifacts_database: analytics
    dbt_artifacts_schema: dbt_artifacts
```

Use on-run-end hooks to capture metadata after every run:

```yaml
# dbt_project.yml
on-run-end:
  - "{{ dbt_artifacts.upload_results(results) }}"
```

Query pipeline health directly from Redshift:

```sql
-- Which models are slowest in production?
select
    model_execution_time_ms,
    name,
    schema_name,
    materialization,
    run_started_at
from analytics.dbt_artifacts.fct_dbt__model_executions
where run_started_at > current_date - 7
order by model_execution_time_ms desc
limit 20;

-- Test pass rate over time
select
    date_trunc('day', run_started_at)::date as run_date,
    count_if(status = 'pass') as passed,
    count_if(status = 'fail') as failed,
    count(*) as total,
    round(count_if(status = 'pass') * 100.0 / count(*), 1) as pass_rate_pct
from analytics.dbt_artifacts.fct_dbt__test_executions
where run_started_at > current_date - 30
group by 1
order by 1;
```

---

## Recommended `packages.yml` Template

```yaml
# packages.yml — production-ready template for dbt + Redshift
packages:
  # Core — required
  - package: dbt-labs/dbt_utils
    version: 1.3.0

  # Testing
  - package: calogica/dbt_expectations
    version: 0.10.4

  # Refactoring and migration safety
  - package: dbt-labs/audit_helper
    version: 0.10.0

  # Code generation
  - package: dbt-labs/dbt_codegen
    version: 0.12.1

  # Observability and anomaly detection
  - package: elementary-data/elementary
    version: 0.16.1

  # DAG quality enforcement
  - package: dbt-labs/dbt_project_evaluator
    version: 0.13.0

  # Run metadata in warehouse
  - package: brooklyn-data/dbt_artifacts
    version: 2.3.0
```

---

## 5 Practice Questions

```question
{
  "id": "dbt-rs-10-q1",
  "type": "multiple-choice",
  "question": "Why should package versions always be pinned exactly in packages.yml rather than using a range like `>=1.0.0`?",
  "options": [
    "dbt deps does not support version ranges",
    "Floating versions cause non-reproducible builds — a package release with breaking changes silently breaks your project",
    "Pinned versions run faster than floating versions",
    "AWS Redshift requires exact version pinning for compliance"
  ],
  "correct": 1,
  "explanation": "Floating version constraints mean `dbt deps` may install a newer package version that contains breaking changes, making builds non-reproducible across environments. Exact pinning ensures every environment installs identical package versions."
}
```

```question
{
  "id": "dbt-rs-10-q2",
  "type": "multiple-choice",
  "question": "What does `dbt_utils.star(from=ref('stg_orders'), except=['loaded_at'])` do?",
  "options": [
    "Counts all rows in stg_orders excluding rows where loaded_at is null",
    "Generates a SELECT * that explicitly lists all columns from stg_orders except loaded_at",
    "Creates a surrogate key excluding the loaded_at column",
    "Unions stg_orders with all other staging tables except loaded_at"
  ],
  "correct": 1,
  "explanation": "dbt_utils.star() introspects the relation's columns and generates an explicit SELECT list of all columns minus those in the except list. This avoids SELECT * while still adapting automatically when new columns are added upstream."
}
```

```question
{
  "id": "dbt-rs-10-q3",
  "type": "multiple-choice",
  "question": "When would you use dbt-audit-helper's `compare_column_values` operation?",
  "options": [
    "To generate YAML schema files from warehouse column metadata",
    "To safely validate that a refactored model produces identical output to the original before cutting over",
    "To detect anomalies in column value distributions over time",
    "To compare column names between two schemas for documentation drift"
  ],
  "correct": 1,
  "explanation": "compare_column_values compares actual data values between two relations (e.g., old vs. new model) on a column-by-column basis. It is the primary tool for validating refactors and migrations before switching downstream references."
}
```

```question
{
  "id": "dbt-rs-10-q4",
  "type": "multiple-choice",
  "question": "What does `elementary.volume_anomalies` detect that a standard `dbt_utils.recency` test cannot?",
  "options": [
    "Missing rows based on foreign key relationships",
    "Sudden drops or spikes in row volume compared to a trailing historical baseline, not just staleness",
    "Duplicate primary keys in the model",
    "Schema changes like dropped or renamed columns"
  ],
  "correct": 1,
  "explanation": "dbt_utils.recency only checks whether the most recent timestamp is within a fixed interval. elementary.volume_anomalies detects unusual patterns relative to a historical baseline — for example, a 50% drop in daily order volume that recency alone would miss."
}
```

```question
{
  "id": "dbt-rs-10-q5",
  "type": "multiple-choice",
  "question": "The `fct_direct_join_to_source` evaluator check flags which anti-pattern?",
  "options": [
    "Staging models that reference more than one source",
    "Mart or intermediate models that bypass the staging layer and join directly to raw source tables",
    "Snapshots that use the check strategy instead of timestamp",
    "Seeds that are larger than 1,000 rows"
  ],
  "correct": 1,
  "explanation": "Joining raw source tables directly in mart models violates the layered architecture (staging → intermediate → mart). It makes the mart fragile to raw schema changes and prevents reuse of staging-layer transformations."
}
```

```question
{
  "id": "dbt-rs-10-q6",
  "type": "multiple-choice",
  "question": "What does the `on-run-end` hook with `dbt_artifacts.upload_results(results)` enable?",
  "options": [
    "Automatic deployment of dbt docs after every run",
    "Loading of dbt run metadata (model timings, test results) into warehouse tables for pipeline health dashboards",
    "Uploading of dbt artifacts to S3 for Slim CI",
    "Notifying Slack when models fail"
  ],
  "correct": 1,
  "explanation": "dbt_artifacts captures the run results object (passed by dbt at run-end) and writes model execution times, test pass/fail counts, and source freshness data into warehouse tables. This enables SQL-based dashboards over your pipeline health."
}
```

---

[!SUCCESS]
### Key Takeaways

- Always pin package versions exactly in `packages.yml` — floating versions cause silent, non-reproducible breakages.
- `dbt-utils` is mandatory: surrogate keys, `star()`, `date_spine`, `union_relations`, and advanced generic tests belong in every project.
- `dbt-expectations` adds 50+ statistical and structural data tests that go far beyond dbt's built-in suite.
- `dbt-audit-helper` is your safety net during refactoring — compare column values and row counts between old and new models before cutting over.
- `dbt-codegen` eliminates boilerplate: generate `sources.yml`, base staging models, and schema YAML from your warehouse catalog in seconds.
- `elementary` adds statistical anomaly detection as native dbt tests — volume spikes, distribution shifts, and freshness anomalies are caught without external observability tools.
- `dbt-project-evaluator` enforces DAG quality standards and documentation coverage in CI, preventing architectural debt from accumulating.
- `dbt-artifacts` loads run metadata into warehouse tables, enabling SQL-based pipeline health dashboards directly in Redshift.