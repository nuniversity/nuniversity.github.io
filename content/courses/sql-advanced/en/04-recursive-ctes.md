---
title: "Recursive CTEs"
description: "Master recursive Common Table Expressions: anchor and recursive members, hierarchy traversal, graph traversal, date generation, and cycle detection"
order: 4
duration: "90 minutes"
difficulty: advanced
---

# Recursive CTEs

## What is a Recursive CTE?

A recursive CTE references itself. It consists of two parts joined by `UNION ALL`:

1. **Anchor member**: The base result set (non-recursive).
2. **Recursive member**: References the CTE by name, feeding rows back into the next iteration.

```sql
WITH RECURSIVE cte_name AS (
    -- Anchor member
    SELECT ...
    UNION ALL
    -- Recursive member
    SELECT ...
    FROM cte_name
    WHERE ...
)
SELECT * FROM cte_name;
```

[!WARNING]
Without a termination condition in the `WHERE` clause, recursive CTEs loop infinitely. Most databases have a `max_recursion_depth` or `max_recursive_iterations` setting (e.g., PostgreSQL's `max_recursive_CTE_iterations`).

## Simple Example: Number Series

```sql
WITH RECURSIVE numbers AS (
    SELECT 1 AS n                     -- anchor
    UNION ALL
    SELECT n + 1                      -- recursive
    FROM numbers
    WHERE n < 100                     -- termination
)
SELECT n FROM numbers;
```

This produces integers 1 through 100.

## Execution Flow

```
Iteration 0: anchor → {1}
Iteration 1: recursive on {1} → {2}
Iteration 2: recursive on {2} → {3}
...
Iteration 99: recursive on {99} → {100}
Iteration 100: WHERE n < 100 fails → stop
Result: UNION ALL of all iterations → {1, 2, ..., 100}
```

[!NOTE]
Each iteration only sees the rows produced by the **previous** iteration. The accumulated result set grows with each pass.

## Hierarchy Traversal: Org Chart

```sql
WITH RECURSIVE org_tree AS (
    -- Anchor: top-level managers (no manager)
    SELECT
        employee_id,
        employee_name,
        manager_id,
        0 AS level,
        employee_name::TEXT AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive: direct reports
    SELECT
        e.employee_id,
        e.employee_name,
        e.manager_id,
        ot.level + 1,
        ot.path || ' → ' || e.employee_name
    FROM employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT * FROM org_tree
ORDER BY level, employee_name;
```

| level | employee_name | path |
|---|---|---|
| 0 | CEO | CEO |
| 1 | CTO | CEO → CTO |
| 1 | CFO | CEO → CFO |
| 2 | Eng Director | CEO → CTO → Eng Director |
| 3 | Sr Engineer | CEO → CTO → Eng Director → Sr Engineer |

## Hierarchy Traversal: Category Tree

```sql
WITH RECURSIVE category_tree AS (
    SELECT
        category_id,
        category_name,
        parent_id,
        category_name::TEXT AS full_path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT
        c.category_id,
        c.category_name,
        c.parent_id,
        ct.full_path || ' > ' || c.category_name
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.category_id
)
SELECT * FROM category_tree
ORDER BY full_path;
```

### Find All Descendants

```sql
WITH RECURSIVE descendants AS (
    SELECT category_id, category_name, parent_id
    FROM categories
    WHERE parent_id = 5  -- start from category 5

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_id
    FROM categories c
    INNER JOIN descendants d ON c.parent_id = d.category_id
)
SELECT * FROM descendants;
```

### Find All Ancestors

```sql
WITH RECURSIVE ancestors AS (
    SELECT category_id, category_name, parent_id, 0 AS depth
    FROM categories
    WHERE category_id = 42  -- start from leaf

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_id, a.depth + 1
    FROM categories c
    INNER JOIN ancestors a ON c.category_id = a.parent_id
)
SELECT * FROM ancestors ORDER BY depth;
```

## Graph Traversal

### Friend-of-a-Friend (Social Graph)

```sql
WITH RECURSIVE friend_network AS (
    SELECT
        user_id,
        0 AS degree,
        ARRAY[user_id] AS visited
    FROM users
    WHERE user_id = 1

    UNION ALL

    SELECT
        f.friend_id,
        fn.degree + 1,
        fn.visited || f.friend_id
    FROM friendships f
    INNER JOIN friend_network fn ON f.user_id = fn.user_id
    WHERE NOT f.friend_id = ANY(fn.visited)
    AND fn.degree < 3
)
SELECT DISTINCT user_id, degree
FROM friend_network
ORDER BY degree, user_id;
```

### Cycle Detection

```sql
WITH RECURSIVE graph_traversal AS (
    SELECT
        node_id,
        ARRAY[node_id] AS path,
        FALSE AS is_cycle
    FROM graph_nodes
    WHERE node_id = 'A'

    UNION ALL

    SELECT
        e.to_node,
        gt.path || e.to_node,
        e.to_node = ANY(gt.path)
    FROM graph_edges e
    INNER JOIN graph_traversal gt ON e.from_node = gt.node_id
    WHERE NOT gt.is_cycle
)
SELECT * FROM graph_traversal;
```

[!IMPORTANT]
Always track visited nodes in graph traversals to avoid infinite loops. Use an array column and `= ANY()` to check visited status.

## Date Series Generation

```sql
-- Generate all dates in a year
WITH RECURSIVE dates AS (
    SELECT '2024-01-01'::DATE AS dt
    UNION ALL
    SELECT dt + 1
    FROM dates
    WHERE dt < '2024-12-31'
)
SELECT dt FROM dates;

-- Generate business days only
WITH RECURSIVE business_days AS (
    SELECT '2024-01-01'::DATE AS dt
    UNION ALL
    SELECT dt + 1
    FROM business_days
    WHERE dt < '2024-12-31'
      AND EXTRACT(DOW FROM dt + 1) NOT IN (0, 6)  -- skip Sun/Sat
)
SELECT dt FROM business_days;
```

### Fill Missing Dates (Date Sparse Fill)

```sql
WITH RECURSIVE date_range AS (
    SELECT MIN(order_date) AS dt FROM orders
    UNION ALL
    SELECT dt + 1 FROM date_range
    WHERE dt < (SELECT MAX(order_date) FROM orders)
)
SELECT
    dr.dt,
    COALESCE(SUM(o.amount), 0) AS daily_revenue
FROM date_range dr
LEFT JOIN orders o ON o.order_date = dr.dt
GROUP BY dr.dt
ORDER BY dr.dt;
```

## Advanced: Bill of Materials (BOM)

```sql
WITH RECURSIVE bom AS (
    SELECT
        part_id,
        part_name,
        1 AS quantity,
        0 AS level
    FROM parts
    WHERE part_id = 'A'  -- top-level assembly

    UNION ALL

    SELECT
        p.part_id,
        p.part_name,
        b.quantity * bp.quantity,
        b.level + 1
    FROM bom b
    INNER JOIN bom_parts bp ON b.part_id = bp.assembly_id
    INNER JOIN parts p ON bp.component_id = p.part_id
)
SELECT * FROM bom ORDER BY level, part_name;
```

## Advanced: Path Enumeration

```sql
-- Find all possible routes between two cities
WITH RECURSIVE routes AS (
    SELECT
        origin,
        destination,
        ARRAY[origin, destination] AS path,
        distance
    FROM flights
    WHERE origin = 'JFK'

    UNION ALL

    SELECT
        r.origin,
        f.destination,
        r.path || f.destination,
        r.distance + f.distance
    FROM routes r
    INNER JOIN flights f ON r.destination = f.origin
    WHERE NOT f.destination = ANY(r.path)
      AND r.distance < 5000  -- prune long paths
)
SELECT * FROM routes
WHERE destination = 'LAX'
ORDER BY distance;
```

## Performance Considerations

| Factor | Impact | Mitigation |
|---|---|---|
| Iteration depth | Linear growth | Set `max_recursive_iterations` |
| Large intermediate sets | Memory pressure | Push filters deep into recursion |
| Cycle detection | Array comparison overhead | Use hash-based visited sets where available |
| Index on join columns | Critical for performance | Index FK columns used in recursive joins |

[!TIP]
For deep hierarchies (50+ levels), consider using nested sets or materialized paths for read-heavy workloads instead of recursive CTEs.

## Practice Questions

1. Write a recursive CTE that generates all integers from 1 to 1000.
2. Given `employees(id, name, manager_id)`, write a query to show the full reporting chain from the CEO to every employee.
3. How does a recursive CTE terminate? What happens if you omit the `WHERE` clause in the recursive member?
4. Write a recursive CTE to generate a list of all dates in February 2024.
5. Given `categories(id, name, parent_id)`, write a query to find all ancestors of category with id 50.
6. What is the difference between `UNION ALL` and `UNION` in a recursive CTE? Can you use `UNION`?
7. Write a recursive CTE to traverse a social graph up to 4 degrees of separation from user 1, avoiding cycles.
8. Given `parts(id, name)` and `bom(assembly_id, component_id, quantity)`, write a query to compute the total quantity of each raw material needed to build one unit of product 'X'.
9. Write a query that fills in missing dates for a table with gaps: `sales(date, amount)` should have a row for every date in the range.
10. Explain how you would detect and prevent infinite loops in a recursive CTE that traverses a directed graph with cycles.
