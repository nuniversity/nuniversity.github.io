---
title: "JSON and JSONB Operations"
description: "Master JSON functions, JSON path queries, indexing JSON, JSON vs normalized tables trade-offs, and JSON aggregations"
order: 8
duration: "90 minutes"
difficulty: advanced
---

# JSON and JSONB Operations

## JSON vs JSONB

| Aspect | JSON | JSONB |
|---|---|---|
| Storage | Exact text copy | Decomposed binary |
| Insert speed | Fast | Slightly slower (parsing overhead) |
| Query speed | Slow (re-parse on each access) | Fast (no re-parsing) |
| Indexing | No | Yes (GIN, BTREE) |
| Key ordering | Preserved | Not preserved |
| Duplicate keys | Kept | Last value wins |
| Whitespace | Preserved | Removed |

[!IMPORTANT]
In PostgreSQL, always prefer `JSONB` over `JSON` unless you need to preserve exact formatting or duplicate keys. JSONB supports indexing and is significantly faster for queries.

## Creating JSON Data

```sql
-- From a string
INSERT INTO events (data) VALUES ('{"user_id": 42, "action": "login"}');

-- From row data using functions
SELECT jsonb_build_object(
    'order_id', o.id,
    'customer', jsonb_build_object('name', c.name, 'email', c.email),
    'items', (SELECT jsonb_agg(jsonb_build_object('product', p.name, 'qty', oi.quantity))
              FROM order_items oi
              JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = o.id),
    'total', o.total
)
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

## Querying JSONB

### Basic Operators

| Operator | Description | Example |
|---|---|---|
| `->` | Get JSON field (returns JSON) | `data->'name'` |
| `->>` | Get JSON field as text | `data->>'name'` |
| `#>` | Get path (returns JSON) | `data#>'{a,b}'` |
| `#>>` | Get path as text | `data#>>'{a,b}'` |
| `@>` | Contains (JSONB in JSONB) | `data @> '{"status": "active"}'` |
| `<@` | Is contained by | `'{"status": "active"}' <@ data` |
| `?` | Key exists | `data ? 'email'` |
| `?|` | Any of keys exist | `data ?| ARRAY['email', 'phone']` |
| `?&` | All keys exist | `data ?& ARRAY['email', 'phone']` |

```sql
-- Create table
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data
INSERT INTO events (event_type, payload) VALUES
    ('user_signup', '{"user_id": 1, "email": "alice@example.com", "plan": "premium", "tags": ["new", "vip"]}'),
    ('purchase', '{"user_id": 1, "items": [{"sku": "A1", "price": 29.99}, {"sku": "B2", "price": 49.99}], "total": 79.98}'),
    ('user_signup', '{"user_id": 2, "email": "bob@example.com", "plan": "free"}');

-- Basic queries
SELECT payload->>'email' AS email FROM events WHERE payload ? 'email';
SELECT * FROM events WHERE payload @> '{"plan": "premium"}';
SELECT * FROM events WHERE payload->'tags' ? 'vip';
```

## JSON Path Queries (SQL/JSON Path)

PostgreSQL 12+ supports the SQL/JSON path language.

```sql
-- Find all events where any item price > 30
SELECT * FROM events
WHERE payload @@ '$.items[*].price > 30';

-- Extract all item SKUs
SELECT jsonb_path_query(payload, '$.items[*].sku') AS sku
FROM events
WHERE event_type = 'purchase';

-- Complex path: find premium users with purchases over $50
SELECT jsonb_path_query(payload, '$.user_id')
FROM events
WHERE payload @@ 'exists($.plan ? (@ == "premium"))'
  AND payload @@ '$.total > 50';
```

### JSON Path Methods

| Method | Purpose |
|---|---|
| `jsonb_path_exists(data, path)` | Check if path exists |
| `jsonb_path_match(data, path)` | Check path predicate |
| `jsonb_path_query(data, path)` | Return matching elements |
| `jsonb_path_query_array(data, path)` | Return array of matches |
| `jsonb_path_query_first(data, path)` | Return first match |

```sql
-- Check if payload has a purchase with total > 100
SELECT id,
       jsonb_path_exists(payload, '$.total ? (@ > 100)') AS high_value
FROM events;

-- Extract all email addresses from nested structures
SELECT jsonb_path_query_array(payload, '$.**.email') AS emails
FROM events;
```

## Indexing JSONB

### GIN Index (Default)

```sql
-- General-purpose GIN index
CREATE INDEX idx_events_payload ON events USING GIN (payload);

-- Supports: @>, ?, ?|, ?&, @@ (jsonpath)
```

### GIN with `jsonb_path_ops`

```sql
-- Smaller and faster for @> queries, but doesn't support ?, ?|, ?&
CREATE INDEX idx_events_payload_ops ON events USING GIN (payload jsonb_path_ops);
```

| Index type | Size | @> speed | ? / ?| / ?& | jsonpath |
|---|---|---|---|---|
| `GIN` (default) | Larger | Fast | Yes | Yes |
| `GIN jsonb_path_ops` | Smaller | Faster | No | No |
| `BTREE` (on expression) | Smallest | Equality only | No | No |

### BTREE Index on JSON Fields

```sql
-- Index a specific JSON field
CREATE INDEX idx_events_user_id ON events (((payload->>'user_id')::INT));

-- Query using the index
SELECT * FROM events
WHERE (payload->>'user_id')::INT = 42;
```

[!TIP]
For queries that filter on a specific JSON key (e.g., `payload->>'email'`), a BTREE index on the expression is smaller and faster than a GIN index.

### Partial Index on JSON

```sql
-- Only index premium users
CREATE INDEX idx_premium_users ON events ((payload->>'user_id'))
WHERE payload @> '{"plan": "premium"}';
```

## JSON Aggregations

```sql
-- Aggregate rows into a JSON array
SELECT jsonb_agg(jsonb_build_object('id', id, 'type', event_type, 'ts', created_at))
FROM events
WHERE created_at > NOW() - INTERVAL '1 day';

-- Aggregate into a JSON object keyed by user_id
SELECT jsonb_object_agg(
    payload->>'user_id',
    jsonb_build_object('last_event', event_type, 'time', created_at)
)
FROM events
GROUP BY payload->>'user_id';

-- Nested aggregation
SELECT
    event_type,
    jsonb_agg(payload ORDER BY created_at DESC) AS latest_first
FROM events
GROUP BY event_type;
```

## JSON vs Normalized Tables

| Scenario | JSONB | Normalized |
|---|---|---|
| Fixed schema | Worse (no type enforcement) | Better |
| Highly variable attributes | Better | Worse (EAV pattern) |
| Complex queries on inner fields | Worse | Better |
| Indexing flexibility | Worse | Better |
| Schema evolution without migration | Better | Worse |
| Join performance | Worse | Better |
| Storage with sparse columns | Better | Worse |

### When to Use JSONB

- **Event sourcing**: Each event has different fields
- **User-defined fields**: Users can create custom fields
- **Configuration storage**: Key-value with varied structure
- **Rapid prototyping**: Schema evolves quickly

### When to Use Normalized Tables

- **Relational integrity**: Foreign keys required
- **Frequent queries on specific fields**: Type safety + indexing
- **Reporting/BI tools**: Tools expect fixed columns
- **High write throughput**: JSONB parsing adds overhead

## Practical Examples

### Example 1: E-commerce Product Variants

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    base_price NUMERIC NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query products by attribute
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);

-- Find red products in size M
SELECT * FROM products
WHERE attributes @> '{"color": "red", "size": "M"}';

-- Products with any color attribute
SELECT * FROM products WHERE attributes ? 'color';
```

### Example 2: Dynamic Form Submissions

```sql
CREATE TABLE form_submissions (
    id BIGSERIAL PRIMARY KEY,
    form_id INT NOT NULL,
    respondent_id INT,
    answers JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Average satisfaction score across all submissions
SELECT
    AVG((answers->>'satisfaction')::INT) AS avg_satisfaction,
    COUNT(*) FILTER (WHERE answers @> '{"satisfaction": "5"}') AS five_star_count
FROM form_submissions
WHERE form_id = 42;
```

### Example 3: Activity Feed

```sql
-- Store heterogeneous activities in one table
INSERT INTO activities (actor_id, verb, object) VALUES
    (1, 'post', jsonb_build_object('type', 'article', 'id', 100, 'title', 'Hello World')),
    (2, 'comment', jsonb_build_object('type', 'comment', 'id', 50, 'body', 'Great post!', 'parent_id', 100)),
    (1, 'like', jsonb_build_object('type', 'comment', 'id', 50));

-- Query: find all activities related to article 100
SELECT *
FROM activities
WHERE object @> '{"id": 100}'
   OR object @> '{"parent_id": 100}';
```

## Practice Questions

1. What is the difference between `->` and `->>` operators in PostgreSQL JSONB? Give an example.
2. Write a query that finds all rows in a `users` table where the `preferences` JSONB column has `"theme": "dark"`.
3. Create a GIN index on a JSONB column and explain what operators it accelerates.
4. Given `events(data JSONB)`, write a JSON path query to find events where `data.items[0].price > 50`.
5. When would you choose a `BTREE` index on a JSONB expression over a `GIN` index?
6. Write a query that aggregates rows from `orders` into a JSON array of objects with `id`, `total`, and `item_count` keys.
7. Compare the trade-offs of using JSONB vs a normalized schema for storing product attributes in e-commerce.
8. Use `jsonb_set()` to update a nested field: change `{"user": {"name": "Alice"}}` to `{"user": {"name": "Alice", "verified": true}}`.
9. Write a query using `jsonb_path_query` to extract all unique SKU values from purchase event payloads.
10. Given `config(key TEXT, value JSONB)`, write a query that returns a single row with all config keys as columns.
