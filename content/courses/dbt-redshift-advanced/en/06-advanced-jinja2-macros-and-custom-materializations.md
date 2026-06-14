---
title: "Advanced Jinja2 Macros and Custom Materializations"
description: "Write production-grade Jinja2 macros for DRY SQL patterns, build reusable macro libraries, and create custom materializations for Redshift-specific patterns like append-only event logs and external table refresh."
order: 6
duration: "70 min"
difficulty: "advanced"
---

# Advanced Jinja2 Macros and Custom Materializations

Jinja2 is dbt's template engine — it transforms SQL from a static query language into a dynamic, composable one. Mastering Jinja2 is the difference between a project that scales to 500 models with a small team and one that becomes unmaintainable. This module covers production-grade macro patterns and custom materializations for Redshift-specific use cases.

---

## Jinja2 in dbt: What's Available

dbt extends Jinja2 with its own functions and objects. The three layers are:

```
┌─────────────────────────────────────┐
│  dbt-specific functions              │
│  ref(), source(), config(), this     │
│  run_query(), log(), execute        │
├─────────────────────────────────────┤
│  Standard Jinja2                     │
│  {% if %}, {% for %}, {% set %}      │
│  filters, tests, whitespace control  │
├─────────────────────────────────────┤
│  Python built-ins exposed by Jinja2  │
│  range(), namespace(), loop.*        │
└─────────────────────────────────────┘
```

---

## Macro Fundamentals: Beyond the Basics

### Variable Scoping with namespace()

Jinja2 loop variables don't update outer scope without `namespace()`:

```sql
-- macros/utils/string_utils.sql

-- WRONG: result is always empty string after the loop
{% macro join_columns_wrong(columns) %}
    {% set result = '' %}
    {% for col in columns %}
        {% set result = result ~ col %}  {# This does NOT update outer result #}
    {% endfor %}
    {{ result }}
{% endmacro %}

-- CORRECT: use namespace() for mutable state inside loops
{% macro join_columns(columns, separator=', ') %}
    {% set ns = namespace(parts=[]) %}
    {% for col in columns %}
        {% set ns.parts = ns.parts + [col] %}
    {% endfor %}
    {{ ns.parts | join(separator) }}
{% endmacro %}
```

### Returning Values from Macros

```sql
-- macros/utils/get_column_names.sql
{% macro get_column_names(relation) %}
    {% set query %}
        select column_name
        from information_schema.columns
        where table_schema = '{{ relation.schema }}'
          and table_name   = '{{ relation.name }}'
        order by ordinal_position
    {% endset %}

    {% set results = run_query(query) %}

    {% if execute %}
        {% set columns = results.columns[0].values() %}
        {{ return(columns) }}
    {% else %}
        {{ return([]) }}
    {% endif %}
{% endmacro %}
```

Using the returned value:

```sql
-- models/marts/facts/fct_orders.sql
{% set cols = get_column_names(ref('stg_orders')) %}
select
    {% for col in cols %}
        {{ col }}{% if not loop.last %},{% endif %}
    {% endfor %}
from {{ ref('stg_orders') }}
```

---

## Production Macro Library for Redshift

### 1. Dynamic Union of Multiple Sources

```sql
-- macros/redshift/union_relations.sql
{% macro union_relations(relations, col_names=none) %}
    {%- for relation in relations -%}
        select
            {%- if col_names is not none -%}
                {%- for col in col_names %}
            {{ col }}{% if not loop.last %},{% endif %}
                {%- endfor %}
            {%- else -%}
            *
            {%- endif %}
        from {{ relation }}
        {% if not loop.last %}union all{% endif %}
    {%- endfor -%}
{% endmacro %}
```

Usage:

```sql
-- models/marts/fct_all_events.sql
{{ union_relations([
    ref('fct_web_events'),
    ref('fct_mobile_events'),
    ref('fct_api_events')
]) }}
```

### 2. Pivot Macro (Redshift-safe)

Redshift does not have a native PIVOT. This macro generates the CASE/SUM pattern:

```sql
-- macros/redshift/pivot.sql
{% macro pivot(
    column,
    values,
    alias=true,
    agg='sum',
    then_value=1,
    else_value=0,
    quote_identifiers=false,
    distinct=false
) %}
    {%- for value in values %}
    {{ agg }}(
        {%- if distinct %} distinct {% endif -%}
        case
            when {{ column }} = '{{ value }}'
            then {{ then_value }}
            else {{ else_value }}
        end
    )
    {%- if alias %} as {% if quote_identifiers %}"{{ value }}"{% else %}{{ value | replace(' ', '_') | lower }}{% endif %}{% endif %}
    {%- if not loop.last %},{%- endif %}
    {%- endfor %}
{% endmacro %}
```

```sql
-- models/marts/fct_order_status_pivot.sql
select
    report_date,
    {{ pivot(
        column='status',
        values=['Pending', 'Shipped', 'Cancelled', 'Rejected'],
        agg='count'
    ) }}
from {{ ref('fct_orders') }}
group by 1
```

### 3. Generate Date Spine

```sql
-- macros/redshift/date_spine.sql
{% macro date_spine(start_date, end_date, datepart='day') %}
    with date_series as (
        select
            (
                '{{ start_date }}'::date
                + generate_series(
                    0,
                    datediff(
                        '{{ datepart }}',
                        '{{ start_date }}'::date,
                        '{{ end_date }}'::date
                    )
                ) * interval '1 {{ datepart }}'
            )::date as date_day
    )
    select date_day from date_series
{% endmacro %}
```

```sql
-- models/marts/dim_date.sql
{{ config(materialized='table', dist='all', sort='date_day') }}

{{ date_spine(
    start_date='2020-01-01',
    end_date='2030-12-31',
    datepart='day'
) }}
```

### 4. Redshift UNLOAD to S3 Macro

```sql
-- macros/redshift/unload_to_s3.sql
{% macro unload_to_s3(
    relation,
    s3_path,
    iam_role,
    format='PARQUET',
    partition_by=none,
    max_file_size='6.2 GB',
    parallel=true
) %}
    {% set query %}
        unload (
            'select * from {{ relation }}'
        )
        to '{{ s3_path }}'
        iam_role '{{ iam_role }}'
        format {{ format }}
        {% if partition_by %}
        partition by ({{ partition_by | join(', ') }})
        {% endif %}
        allowoverwrite
        maxfilesize '{{ max_file_size }}'
        {% if parallel %}parallel on{% else %}parallel off{% endif %};
    {% endset %}

    {% if execute %}
        {% do run_query(query) %}
        {{ log("Unloaded " ~ relation ~ " to " ~ s3_path, info=true) }}
    {% endif %}
{% endmacro %}
```

Usage as an operation:

```bash
dbt run-operation unload_to_s3 --args "{
    relation: 'analytics.marts.fct_orders',
    s3_path: 's3://my-data-lake/exports/fct_orders/',
    iam_role: 'arn:aws:iam::123456789012:role/RedshiftS3Role',
    format: 'PARQUET',
    partition_by: ['order_date']
}"
```

### 5. Adaptive Sort Key Recommendation Macro

```sql
-- macros/redshift/recommend_sort_keys.sql
{% macro recommend_sort_keys(schema, table, limit=10) %}
    {% set query %}
        select
            schemaname,
            tablename,
            "column"    as column_name,
            usename     as query_count,
            plannode
        from svl_qlog
        join pg_user using (usesysid)
        where schemaname = '{{ schema }}'
          and tablename  = '{{ table }}'
        order by query_count desc
        limit {{ limit }}
    {% endset %}

    {% if execute %}
        {% set results = run_query(query) %}
        {% for row in results.rows %}
            {{ log(row, info=true) }}
        {% endfor %}
    {% endif %}
{% endmacro %}
```

---

## Custom Materializations

Custom materializations let you define new persistence patterns beyond dbt's built-ins. They are Jinja2 blocks stored in `macros/materializations/`.

### Anatomy of a Custom Materialization

```sql
-- macros/materializations/append_only_table.sql
{% materialization append_only_table, adapter='redshift' %}

    {# Required configuration #}
    {%- set target_relation = this.incorporate(type='table') -%}

    {# Get the run adapter #}
    {%- set existing_relation = load_cached_relation(this) -%}

    {# Run pre-hooks #}
    {{ run_hooks(pre_hooks) }}

    {# Create table on first run #}
    {% if existing_relation is none %}
        {% call statement('main') %}
            {{ create_table_as(false, target_relation, sql) }}
        {% endcall %}

    {# Append on subsequent runs #}
    {% else %}
        {% call statement('main') %}
            insert into {{ target_relation }}
            ({{ sql }})
        {% endcall %}
    {% endif %}

    {# Run post-hooks #}
    {{ run_hooks(post_hooks) }}

    {# Update the relation cache #}
    {{ return({'relations': [target_relation]}) }}

{% endmaterialization %}
```

Using the custom materialization:

```sql
-- models/raw/raw_click_stream.sql
{{ config(
    materialized='append_only_table',
    dist='session_id',
    sort=['event_timestamp'],
    sort_type='compound',
    backup=false
) }}

select
    session_id,
    user_id,
    event_timestamp,
    page_url,
    referrer
from {{ source('raw', 'click_stream') }}
where loaded_at > (
    select coalesce(
        max(event_timestamp)::timestamp,
        '1970-01-01'::timestamp
    )
    from {{ this }}
)
```

### Custom Materialization: Redshift External Table Refresh

For Redshift Spectrum external tables that need periodic metadata refresh:

```sql
-- macros/materializations/spectrum_external_table.sql
{% materialization spectrum_external_table, adapter='redshift' %}

    {%- set external_schema = config.require('external_schema') -%}
    {%- set s3_location     = config.require('s3_location') -%}
    {%- set file_format     = config.get('file_format', 'parquet') -%}
    {%- set partition_cols  = config.get('partition_cols', []) -%}
    {%- set table_properties = config.get('table_properties', {}) -%}

    {%- set target_relation = this.incorporate(type='table') -%}

    {{ run_hooks(pre_hooks) }}

    -- Drop and recreate the external table definition
    {% call statement('main') %}
        {% if load_cached_relation(this) is not none %}
            drop table if exists {{ external_schema }}.{{ this.identifier }};
        {% endif %}

        create external table {{ external_schema }}.{{ this.identifier }}
        ({{ sql }})
        {% if partition_cols %}
        partitioned by ({{ partition_cols | join(', ') }})
        {% endif %}
        stored as {{ file_format }}
        location '{{ s3_location }}';

        {% if partition_cols %}
        -- Auto-discover partitions
        msck repair table {{ external_schema }}.{{ this.identifier }};
        {% endif %}
    {% endcall %}

    {{ run_hooks(post_hooks) }}

    {{ return({'relations': [target_relation]}) }}

{% endmaterialization %}
```

---

## Macro Testing and Documentation

### Documenting Macros

```yaml
# macros/schema.yml
macros:
  - name: pivot
    description: >
      Generates a pivot table using CASE/SUM expressions. Redshift-compatible.
      Use instead of native PIVOT which Redshift does not support.
    arguments:
      - name: column
        type: string
        description: "The column to pivot on"
      - name: values
        type: list
        description: "Distinct values to pivot into columns"
      - name: agg
        type: string
        description: "Aggregation function (default: sum)"
      - name: alias
        type: boolean
        description: "Whether to alias generated columns (default: true)"

  - name: unload_to_s3
    description: "UNLOAD a relation to S3 in Parquet or CSV format"
    arguments:
      - name: relation
        type: relation
        description: "The dbt relation to unload"
      - name: s3_path
        type: string
        description: "S3 destination path (must end with /)"
      - name: iam_role
        type: string
        description: "IAM role ARN with S3 write and Redshift UNLOAD permissions"
```

### Testing Macros via `dbt run-operation`

```bash
# Test the date_spine macro output
dbt run-operation date_spine --args "{'start_date': '2024-01-01', 'end_date': '2024-01-07'}"

# Test UNLOAD macro in dry-run mode (check SQL compilation)
dbt compile --select fct_orders  # ensure model compiles first
```

---

## 5 Practice Questions

```question
{
  "id": "dbt-rs-06-q1",
  "type": "multiple-choice",
  "question": "Why is `namespace()` needed when updating a variable inside a Jinja2 `{% for %}` loop?",
  "options": [
    "For performance — namespace() caches loop results",
    "Jinja2 loop blocks have their own scope; variables set inside a loop do not update the outer scope without namespace()",
    "Redshift requires namespace() for parameterized queries",
    "namespace() is only needed for recursive macros"
  ],
  "correct": 1,
  "explanation": "Jinja2 enforces scoping such that variable assignments inside a loop block do not propagate to the outer scope. namespace() creates a mutable object whose attributes can be updated and read across scope boundaries."
}
```

```question
{
  "id": "dbt-rs-06-q2",
  "type": "multiple-choice",
  "question": "In a custom materialization, what does `config.require('my_param')` do differently from `config.get('my_param')`?",
  "options": [
    "require() fetches the value from the warehouse; get() reads from profiles.yml",
    "require() raises an error if the config is missing; get() returns None or a default value",
    "require() enforces a data type; get() accepts any type",
    "There is no difference — they are aliases"
  ],
  "correct": 1,
  "explanation": "config.require() raises a dbt compilation error if the specified config is not defined in the model's config block. config.get() returns None or an optional default value if the config is missing."
}
```

```question
{
  "id": "dbt-rs-06-q3",
  "type": "multiple-choice",
  "question": "The `{% materialization my_mat, adapter='redshift' %}` signature means what?",
  "options": [
    "The materialization only works with Redshift clusters, not Serverless",
    "This implementation is the Redshift-specific override — dbt uses it when the active adapter is redshift, falling back to the default adapter implementation otherwise",
    "The materialization ignores all other adapters completely",
    "It requires the Redshift adapter version to match exactly"
  ],
  "correct": 1,
  "explanation": "When adapter='redshift' is specified, dbt uses this implementation when the active adapter is dbt-redshift. For other adapters, dbt falls back to the adapter='default' implementation of the same materialization name."
}
```

```question
{
  "id": "dbt-rs-06-q4",
  "type": "multiple-choice",
  "question": "You want to UNLOAD a Redshift table to S3 as Parquet, partitioned by `order_date`. Which dbt mechanism is most appropriate?",
  "options": [
    "A post-hook on the model that calls a macro wrapping UNLOAD",
    "A custom materialization called parquet_export",
    "A dbt seed file pointing to S3",
    "An incremental model with dist=all"
  ],
  "correct": 0,
  "explanation": "A post-hook calling an UNLOAD macro is the idiomatic dbt pattern. It runs after the model is built, keeping the transformation separate from the export operation. This also makes it reusable across models."
}
```

```question
{
  "id": "dbt-rs-06-q5",
  "type": "multiple-choice",
  "question": "What guard is essential around `run_query()` calls in macros to prevent them from executing during dbt parse or compile phases?",
  "options": [
    "{% if target.name == 'prod' %}",
    "{% if execute %}",
    "{% if run_query is defined %}",
    "{% if not is_incremental() %}"
  ],
  "correct": 1,
  "explanation": "{% if execute %} is the standard guard. During dbt's parse and compile phases, execute is False, and run_query() should not fire. Without this guard, macros that call run_query() can break the parse phase."
}
```

```question
{
  "id": "dbt-rs-06-q6",
  "type": "multiple-choice",
  "question": "Where should custom materialization files be stored in a dbt project?",
  "options": [
    "models/materializations/",
    "macros/materializations/ (or any path under macro-paths)",
    "analyses/materializations/",
    "target/materializations/"
  ],
  "correct": 1,
  "explanation": "Custom materializations are Jinja2 macro blocks and must be stored under the macro-paths directory (default: macros/). The subfolder name (materializations/) is a convention, not a requirement."
}
```

---

[!SUCCESS]
### Key Takeaways

- Use `namespace()` for mutable state inside Jinja2 `{% for %}` loops — plain variable assignment does not escape loop scope.
- Always guard `run_query()` calls with `{% if execute %}` to prevent execution during parse/compile phases.
- `config.require()` raises a compilation error for missing configs; `config.get()` returns None or a default — use require() for mandatory materialization parameters.
- The `adapter='redshift'` signature in `{% materialization %}` creates a Redshift-specific implementation; other adapters fall back to the `default` implementation.
- UNLOAD to S3 is best implemented as a post-hook macro, keeping the transformation logic separate from the export step.
- Document macros in `macros/schema.yml` — they appear in `dbt docs` and can be tested via `dbt run-operation`.