---
title: "Table Partitioning and Sharding"
description: "Master table partitioning (RANGE, LIST, HASH), partition pruning, sharding strategies, and data distribution methods at scale"
order: 6
duration: "120 minutes"
difficulty: advanced
---

# Table Partitioning and Sharding

## Partitioning vs Sharding

| Aspect | Partitioning | Sharding |
|---|---|---|
| Scope | Single database | Multiple databases/nodes |
| Transparency | Transparent to application | App may need awareness |
| Complexity | Low (database managed) | High (routing, resharding) |
| Scaling | Limited by single server | Horizontal (add more nodes) |
| Cross-partition queries | Supported | Complex (distributed joins) |

## Table Partitioning

Divides a large table into smaller physical pieces while exposing a single logical table.

### When to Partition

| Criteria | Threshold |
|---|---|
| Table size | > 100 GB or > 100M rows |
| Maintenance window | Cannot complete in available time |
| Old data purging | Regular `DELETE` of historical data |
| Query pattern | Filters on a partition key |

## RANGE Partitioning

Data is divided into ranges based on a column value.

```sql
CREATE TABLE orders (
    order_id BIGSERIAL,
    order_date DATE NOT NULL,
    customer_id INT,
    total NUMERIC(10,2)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2023_q1 PARTITION OF orders
    FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');

CREATE TABLE orders_2023_q2 PARTITION OF orders
    FOR VALUES FROM ('2023-04-01') TO ('2023-07-01');

CREATE TABLE orders_2023_q3 PARTITION OF orders
    FOR VALUES FROM ('2023-07-01') TO ('2023-10-01');

CREATE TABLE orders_2023_q4 PARTITION OF orders
    FOR VALUES FROM ('2023-10-01') TO ('2024-01-01');

CREATE TABLE orders_future PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('9999-01-01');
```

### Partition by Date (Monthly)

```sql
CREATE TABLE logs (
    log_id BIGSERIAL,
    created_at TIMESTAMPTZ NOT NULL,
    message TEXT
) PARTITION BY RANGE (created_at);

-- Generate partitions monthly (use a script or pg_partman)
SELECT create_range_partition('logs', '2024-01-01', '2024-02-01');
```

## LIST Partitioning

Data is divided by discrete values.

```sql
CREATE TABLE sales (
    sale_id BIGSERIAL,
    region TEXT NOT NULL,
    amount NUMERIC
) PARTITION BY LIST (region);

CREATE TABLE sales_na PARTITION OF sales
    FOR VALUES IN ('US', 'CA', 'MX');

CREATE TABLE sales_eu PARTITION OF sales
    FOR VALUES IN ('UK', 'DE', 'FR', 'IT', 'ES');

CREATE TABLE sales_apac PARTITION OF sales
    FOR VALUES IN ('JP', 'CN', 'KR', 'AU', 'IN');

CREATE TABLE sales_other PARTITION OF sales
    DEFAULT;
```

## HASH Partitioning

Distributes rows evenly across partitions using a hash function.

```sql
CREATE TABLE user_sessions (
    session_id UUID NOT NULL,
    user_id BIGINT,
    payload JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE user_sessions_p0 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE user_sessions_p1 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE user_sessions_p2 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE user_sessions_p3 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

[!NOTE]
HASH partitioning is ideal for evenly distributing write load across storage. It's poor for range queries — a query filtering `user_id BETWEEN 1000 AND 2000` will scan all partitions.

## Subpartitioning

Partitions within partitions.

```sql
CREATE TABLE measurements (
    sensor_id INT,
    recorded_at DATE,
    value NUMERIC
) PARTITION BY RANGE (recorded_at);

-- First level: quarterly
CREATE TABLE measurements_2024_q1 PARTITION OF measurements
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01')
    PARTITION BY LIST (sensor_id);

-- Second level: by sensor group
CREATE TABLE measurements_2024_q1_sensors_1_100 PARTITION OF measurements_2024_q1
    FOR VALUES IN (1, 2, 3, /* ... */ 100);

CREATE TABLE measurements_2024_q1_sensors_101_200 PARTITION OF measurements_2024_q1
    FOR VALUES IN (101, 102, /* ... */ 200);
```

## Partition Pruning

The query planner skips irrelevant partitions automatically.

```sql
-- Only scans orders_2023_q4 and orders_future
EXPLAIN SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-02-01';
```

```text
Append
  Subplans Removed: 4
  ->  Seq Scan on orders_future
        Filter: ((order_date >= '2024-01-01') AND (order_date <= '2024-02-01'))
```

### When Pruning Fails

```sql
-- NO pruning: function on partition key
EXPLAIN SELECT * FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024;

-- Prune: direct comparison
EXPLAIN SELECT * FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';
```

## Partition Management

### Adding Partitions

```sql
-- Add new partition for upcoming data
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### Detaching and Archiving

```sql
-- Detach old partition (no data loss)
ALTER TABLE orders DETACH PARTITION orders_2023_q1;

-- Attach to a different table or archive
CREATE TABLE orders_archive (LIKE orders INCLUDING DEFAULTS);
ALTER TABLE orders_archive ATTACH PARTITION orders_2023_q1
    FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');
```

### Dropping Partitions

```sql
-- Much faster than DELETE
DROP TABLE orders_2023_q1;
```

### Splitting a Partition

```sql
-- PostgreSQL: split via DETACH + new partitions
ALTER TABLE orders DETACH PARTITION orders_2023_q2;

CREATE TABLE orders_2023_apr PARTITION OF orders
    FOR VALUES FROM ('2023-04-01') TO ('2023-05-01');
CREATE TABLE orders_2023_may PARTITION OF orders
    FOR VALUES FROM ('2023-05-01') TO ('2023-06-01');
CREATE TABLE orders_2023_jun PARTITION OF orders
    FOR VALUES FROM ('2023-06-01') TO ('2023-07-01');

INSERT INTO orders_2023_apr SELECT * FROM orders_2023_q2
    WHERE order_date >= '2023-04-01' AND order_date < '2023-05-01';
-- ... repeat for may, jun
DROP TABLE orders_2023_q2;
```

## Sharding Strategies

### Vertical Sharding

Split tables by domain across databases.

```sql
-- Database 1: user_db
CREATE TABLE users (user_id SERIAL, name TEXT, email TEXT);
CREATE TABLE profiles (user_id INT, bio TEXT);

-- Database 2: order_db
CREATE TABLE orders (order_id SERIAL, user_id INT, total NUMERIC);
```

### Horizontal Sharding

Split rows of the same table across databases.

### Application-Level Sharding

```python
def get_shard(user_id):
    shard_id = user_id % SHARD_COUNT
    return connections[shard_id]

# Usage
conn = get_shard(user_id)
conn.execute("SELECT * FROM orders WHERE user_id = ?", (user_id,))
```

### Proxy-Based Sharding (e.g., Vitess, Citus)

```sql
-- Citus: distribute table across worker nodes
SELECT create_distributed_table('orders', 'user_id');

-- Queries are transparently routed
SELECT * FROM orders WHERE user_id = 42;  -- hits one shard
```

## Distribution Methods

| Method | Algorithm | Pros | Cons |
|---|---|---|---|
| Modulus | `id % N` | Simple, uniform if N is power of 2 | Resharding moves all data |
| Consistent Hashing | Ring-based | Minimal data movement on reshard | Complex implementation |
| Range-based | Value ranges | Natural for time-series | Hot spots possible |
| Directory-based | Lookup table | Flexible, easy reshard | Single point of failure |

## Practical Examples

### Example 1: Time-Based Archive System

```sql
-- Monthly partitions with auto-creation via pg_partman
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
    p_parent_table := 'public.logs',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := '1 month',
    p_start_partition := '2024-01-01'
);

-- Automatically creates partitions:
-- logs_202401, logs_202402, logs_202403, ...
```

### Example 2: Multi-Tenant Sharding

```sql
-- Per-tenant databases
-- tenant_1.orders, tenant_2.orders, etc.

-- Or: sharded by tenant_id
CREATE TABLE orders (
    order_id BIGSERIAL,
    tenant_id INT NOT NULL,
    data JSONB
) PARTITION BY LIST (tenant_id);

-- Each tenant gets a dedicated partition
CREATE TABLE orders_tenant_42 PARTITION OF orders FOR VALUES IN (42);
```

## Partitioning vs Indexing

| Feature | Partitioning | Indexing |
|---|---|---|
| Row grouping | Physical | Logical |
| Query speedup | Via pruning | Via index scan |
| Maintenance overhead | Medium | Low |
| Bulk DELETE | Trivially fast | Slow (VACUUM) |
| Cross-partition queries | Supported | N/A |

[!TIP]
Use partitioning with indexes. Each partition gets its own indexes, and partition pruning + index scan gives the best performance.

## Practice Questions

1. What is the difference between partitioning and sharding? When would you use each?
2. Create a table partitioned by RANGE on `sale_date` with quarterly partitions for 2024.
3. Write a query that verifies partition pruning is working by checking the `EXPLAIN` plan.
4. Given `users` with 100M rows, how would you partition by `region` (NA, EU, APAC)?
5. What happens when a query uses a function on the partition key (e.g., `YEAR(order_date)`) — does pruning still work?
6. How do you add a new partition for next month's data in a monthly-partitioned table?
7. Explain consistent hashing and why it's better than simple modulus for sharding.
8. Write a query to detach and archive a partition containing 2023 data.
9. What are the trade-offs of HASH vs RANGE partitioning for a time-series table?
10. Design a sharding strategy for a multi-tenant SaaS application with 500 tenants, each having up to 10M rows.
