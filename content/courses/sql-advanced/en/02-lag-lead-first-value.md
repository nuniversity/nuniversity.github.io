---
title: "LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE(), NTH_VALUE()"
description: "Master window value functions: LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE, and window frame clauses (ROWS, RANGE, GROUPS)"
order: 2
duration: "90 minutes"
difficulty: advanced
---

# LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE(), NTH_VALUE()

## Value Functions in Window Context

Value functions give access to other rows within the same result set **without a self-join**. They are the foundation for time-series analysis, change detection, and ranking.

| Function | Returns |
|---|---|
| `LAG(expr, offset, default)` | Value from a row **before** the current row |
| `LEAD(expr, offset, default)` | Value from a row **after** the current row |
| `FIRST_VALUE(expr)` | Value from the **first** row in the window frame |
| `LAST_VALUE(expr)` | Value from the **last** row in the window frame |
| `NTH_VALUE(expr, n)` | Value from the **nth** row in the window frame |

## LAG() and LEAD()

```sql
-- Compare each employee's salary to the previous hire in the same department
SELECT
  employee_id,
  department_id,
  hire_date,
  salary,
  LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS prev_salary,
  salary - LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS diff
FROM employees;
```

### Offset and Default

The second argument is the **offset** (number of rows back/forward). The third is the **default** when no row exists (defaults to `NULL`).

```sql
-- Look 2 rows ahead, default 0
LEAD(amount, 2, 0) OVER (ORDER BY event_date)

-- Previous value, no default (NULL if no previous row)
LAG(metric) OVER (ORDER BY ts)
```

### Common Use Cases

```sql
-- Day-over-day revenue change
SELECT
  order_date,
  revenue,
  LAG(revenue) OVER (ORDER BY order_date) AS prev_day_revenue,
  ROUND(
    (revenue - LAG(revenue) OVER (ORDER BY order_date))
    / NULLIF(LAG(revenue) OVER (ORDER BY order_date), 0) * 100, 2
  ) AS pct_change
FROM daily_revenue;

-- Year-over-year comparison
SELECT
  EXTRACT(YEAR FROM order_date) AS year,
  EXTRACT(MONTH FROM order_date) AS month,
  SUM(amount) AS monthly_total,
  LAG(SUM(amount), 12) OVER (ORDER BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)) AS same_month_last_year
FROM orders
GROUP BY year, month;
```

[!IMPORTANT]
`LAG`/`LEAD` with large offsets can be expensive. On databases with millions of rows, consider indexing the `ORDER BY` columns.

## FIRST_VALUE() and LAST_VALUE()

```sql
SELECT
  department_id,
  employee_id,
  salary,
  FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS highest_in_dept,
  LAST_VALUE(salary)  OVER (PARTITION BY department_id ORDER BY salary DESC) AS lowest_in_dept
FROM employees;
```

### The LAST_VALUE Pitfall

`LAST_VALUE` without an explicit frame returns the **current row**, not the last row in the partition. This is because the default frame with `ORDER BY` is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

```sql
-- WRONG: LAST_VALUE returns current row, not partition max
SELECT
  department_id,
  salary,
  LAST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS wrong_min
FROM employees;

-- CORRECT: Specify the frame
SELECT
  department_id,
  salary,
  LAST_VALUE(salary) OVER (
    PARTITION BY department_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS correct_min
FROM employees;
```

## Window Frame Clauses

Frames define which rows are visible to the window function.

| Frame clause | Meaning |
|---|---|
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | Physical rows from start to current |
| `ROWS BETWEEN 5 PRECEDING AND 2 FOLLOWING` | 5 before, current, 2 after |
| `RANGE BETWEEN 100 PRECEDING AND CURRENT ROW` | Rows where ORDER BY value is within 100 of current |
| `RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW` | Time-based window (PostgreSQL) |
| `GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING` | Groups of peers (same ORDER BY value) |

### ROWS vs RANGE vs GROUPS

| Frame type | Basis | Tie handling |
|---|---|---|
| `ROWS` | Physical row count | Ignores ties — each row is distinct |
| `RANGE` | Value difference from current row | Includes all ties |
| `GROUPS` | Groups of equal values | Treats equal values as one group |

```sql
-- ROWS: strict physical offset
SELECT
  value,
  event_date,
  SUM(value) OVER (ORDER BY event_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rows_3
FROM metrics;

-- RANGE: all rows within 10 units of value
SELECT
  score,
  AVG(score) OVER (ORDER BY score RANGE BETWEEN 5 PRECEDING AND 5 FOLLOWING) AS rang_avg
FROM exam_results;

-- GROUPS: peer groups
SELECT
  department_id,
  headcount,
  SUM(headcount) OVER (ORDER BY headcount GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS grps_sum
FROM dept_stats;
```

[!TIP]
Use `RANGE` for datetime windows in financial or IoT data where you need all data points within a time interval regardless of how many rows there are.

## NTH_VALUE()

Returns the value from the nth row in the window frame.

```sql
SELECT
  department_id,
  salary,
  NTH_VALUE(salary, 2) OVER (
    PARTITION BY department_id
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS second_highest
FROM employees;
```

### Nth Value with Frame Control

```sql
-- Third highest per department
SELECT DISTINCT department_id,
  NTH_VALUE(salary, 3) OVER (
    PARTITION BY department_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS third_highest
FROM employees;
```

## Practical Examples

### Example 1: Session Duration from Web Logs

```sql
WITH ordered AS (
  SELECT
    session_id,
    event_time,
    page,
    LEAD(event_time) OVER (PARTITION BY session_id ORDER BY event_time) AS next_event_time
  FROM web_logs
)
SELECT
  session_id,
  MIN(event_time) AS session_start,
  MAX(next_event_time) AS session_end,
  SUM(EXTRACT(EPOCH FROM next_event_time - event_time)) AS total_active_seconds
FROM ordered
WHERE next_event_time IS NOT NULL
GROUP BY session_id;
```

### Example 2: Price Momentum Indicator

```sql
SELECT
  ticker,
  trade_date,
  close_price,
  LAG(close_price, 20) OVER (PARTITION BY ticker ORDER BY trade_date) AS price_20d_ago,
  ROUND(
    (close_price - LAG(close_price, 20) OVER (PARTITION BY ticker ORDER BY trade_date))
    / NULLIF(LAG(close_price, 20) OVER (PARTITION BY ticker ORDER BY trade_date), 0) * 100, 2
  ) AS momentum_20d
FROM stock_prices;
```

### Example 3: Boolean Flag for State Changes

```sql
SELECT
  device_id,
  status,
  event_time,
  CASE
    WHEN status <> LAG(status) OVER (PARTITION BY device_id ORDER BY event_time)
    THEN 1 ELSE 0
  END AS status_changed
FROM device_events;
```

### Example 4: Rolling Median (Value Window)

```sql
SELECT
  reading_time,
  sensor_value,
  AVG(sensor_value) OVER (
    ORDER BY reading_time
    ROWS BETWEEN 6 PRECEDING AND 6 FOLLOWING
  ) AS rolling_avg_13
FROM sensor_readings;
```

## Performance Notes

| Function | Frame cost | Index recommendation |
|---|---|---|
| `LAG`/`LEAD` (offset=1) | O(n) | Sort column index |
| `LAG`/`LEAD` (large offset) | O(n) | Composite index |
| `FIRST_VALUE` | O(n) per partition | Partition + order index |
| `LAST_VALUE` with full frame | O(n log n) | Consider subquery instead |
| `NTH_VALUE` | O(n) | Avoid with large n |

[!WARNING]
`LAST_VALUE` and `NTH_VALUE` with large frames can cause significant memory pressure. For simple min/max, prefer `MIN() OVER()` or `MAX() OVER()`.

## Practice Questions

1. Write a query to find the daily temperature change using `LAG` on a table `weather(date, temperature)`.
2. What is the difference between `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` and `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`?
3. Given `orders(id, customer_id, order_date, amount)`, use `LAG` to compute the difference in days between consecutive orders for the same customer.
4. Why does `LAST_VALUE` sometimes return the current row instead of the last row in the partition? How do you fix it?
5. Write a query that returns each product's price along with the next 2 prices for that product (ordered by date).
6. Given `sensor_readings(sensor_id, reading_time, value)`, compute a 5-minute rolling average for each sensor using `RANGE BETWEEN`.
7. Use `NTH_VALUE` to find the third-highest score per class from `exam_scores(student_id, class_id, score)`.
8. Write a query to flag rows where a `user_status` changes from `'active'` to `'inactive'` in a `user_log` table.
9. Compare `ROWS`, `RANGE`, and `GROUPS` frame types. Give a scenario where each is the most appropriate choice.
10. Write a query that computes year-over-year growth for monthly revenue, filling missing months with 0 using `COALESCE` with `LAG`.
