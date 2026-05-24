---
title: "Common Table Expressions (CTEs)"
description: "Domina la sintaxis WITH/CTE, CTEs múltiples, CTEs recursivas y cuándo usar CTEs vs subconsultas"
order: 4
duration: "50 minutos"
difficulty: "intermedio"
---

# Common Table Expressions (CTEs)

Una Common Table Expression (CTE) es un conjunto de resultados temporal nombrado que existe dentro del alcance de una sola consulta. Las CTEs hacen que las consultas complejas sean más legibles, reutilizables y mantenibles.

## Sintaxis Básica de CTE

Una CTE usa la palabra clave `WITH` seguida de un nombre, columnas opcionales y una definición de consulta.

```sql
WITH regional_sales AS (
    SELECT
        region_id,
        SUM(amount) AS total_sales
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY region_id
)
SELECT
    r.name AS region,
    rs.total_sales
FROM regions r
INNER JOIN regional_sales rs ON r.region_id = rs.region_id
ORDER BY rs.total_sales DESC;
```

La CTE `regional_sales` se comporta como una vista temporal durante la ejecución de esta consulta.

> [!NOTE]
> Las CTEs a veces se llaman "consultas WITH". La cláusula `WITH` debe aparecer al principio de la declaración — solo `WITH` puede precederla.

## CTEs Múltiples

Puedes definir múltiples CTEs separadas por comas. Cada una puede referenciar CTEs anteriores.

```sql
WITH
avg_salary AS (
    SELECT department_id, AVG(salary) AS avg_dept_salary
    FROM employees
    GROUP BY department_id
),
above_avg AS (
    SELECT
        e.name,
        e.salary,
        e.department_id,
        a.avg_dept_salary
    FROM employees e
    INNER JOIN avg_salary a ON e.department_id = a.department_id
    WHERE e.salary > a.avg_dept_salary
),
dept_summary AS (
    SELECT
        department_id,
        COUNT(*) AS above_avg_count,
        AVG(salary) AS above_avg_avg_salary
    FROM above_avg
    GROUP BY department_id
)
SELECT
    d.department_name,
    ds.above_avg_count,
    ds.above_avg_avg_salary
FROM dept_summary ds
INNER JOIN departments d ON ds.department_id = d.department_id
ORDER BY ds.above_avg_count DESC;
```

```sql
WITH
products_2023 AS (
    SELECT * FROM products WHERE launch_year = 2023
),
products_2024 AS (
    SELECT * FROM products WHERE launch_year = 2024
),
sales_2023 AS (
    SELECT p.product_id, SUM(s.quantity) AS total_qty
    FROM products_2023 p
    INNER JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.product_id
),
sales_2024 AS (
    SELECT p.product_id, SUM(s.quantity) AS total_qty
    FROM products_2024 p
    INNER JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.product_id
)
SELECT
    COALESCE(a.product_id, b.product_id) AS product_id,
    COALESCE(a.total_qty, 0) AS qty_2023,
    COALESCE(b.total_qty, 0) AS qty_2024,
    COALESCE(b.total_qty, 0) - COALESCE(a.total_qty, 0) AS growth
FROM sales_2023 a
FULL OUTER JOIN sales_2024 b ON a.product_id = b.product_id;
```

> [!NOTE]
> Cada CTE se separa con una coma — sin coma después de la última CTE antes de la consulta principal. Este es un error de sintaxis común.

## CTEs vs Subconsultas

| Aspecto | CTE | Subconsulta (Tabla Derivada) |
|--------|-----|------------------------------|
| Legibilidad | Excelente — nombrada | Mala — anidada |
| Reutilización | Referenciada múltiples veces | Debe repetirse |
| Recursión | Soportada | No soportada |
| Optimización | Inlineable — sin materialización | Inlineable |
| Alcance | Consulta única | Expresión única |

```sql
-- Subconsulta anidada (difícil de leer)
SELECT name, salary, dept_name
FROM (
    SELECT e.*, d.name AS dept_name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
    WHERE e.salary > (SELECT AVG(salary) FROM employees)
) high_earners
WHERE dept_name LIKE '%Eng%';
```

```sql
-- Misma consulta con CTE (más fácil de seguir)
WITH employee_with_dept AS (
    SELECT e.*, d.name AS dept_name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
),
dept_avg AS (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT e.name, e.salary, e.dept_name
FROM employee_with_dept e
INNER JOIN dept_avg a ON e.department_id = a.department_id
WHERE e.salary > a.avg_salary
  AND e.dept_name LIKE '%Eng%';
```

> [!SUCCESS]
> Usa CTEs cuando la legibilidad sea importante o cuando necesites referenciar la misma subconsulta múltiples veces. Usa subconsultas inline para casos muy simples donde una CTE sería excesiva.

## CTEs Recursivas

Las CTEs recursivas se referencian a sí mismas. Son esenciales para recorrer datos jerárquicos o en estructura de árbol.

```sql
WITH RECURSIVE org_chart AS (
    -- Ancla: el CEO (sin gerente)
    SELECT
        employee_id,
        name,
        manager_id,
        0 AS level,
        name AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursiva: subordinados directos
    SELECT
        e.employee_id,
        e.name,
        e.manager_id,
        oc.level + 1,
        oc.path || ' -> ' || e.name
    FROM employees e
    INNER JOIN org_chart oc ON e.manager_id = oc.employee_id
)
SELECT *
FROM org_chart
ORDER BY level, name;
```

| employee_id | name | manager_id | level | path |
|------------|------|------------|-------|------|
| 1 | Sarah | NULL | 0 | Sarah |
| 2 | Tom | 1 | 1 | Sarah -> Tom |
| 5 | Uma | 1 | 1 | Sarah -> Uma |
| 3 | Jerry | 2 | 2 | Sarah -> Tom -> Jerry |

### Anatomía de una CTE Recursiva

```
WITH RECURSIVE name AS (
    -- Miembro ancla (no recursivo, conjunto inicial)
    SELECT ...
    WHERE base_condition

    UNION ALL

    -- Miembro recursivo (referencia name)
    SELECT ...
    FROM name
    JOIN ... ON recursion_condition
)
SELECT * FROM name;
```

1. **Ancla**: Se ejecuta primero, produce filas iniciales.
2. **Recursiva**: Se ejecuta repetidamente, cada vez trabajando en las nuevas filas de la iteración anterior.
3. **Terminación**: Se detiene cuando el paso recursivo devuelve cero filas.

### Ejemplos de CTE Recursiva

```sql
-- Árbol de categorías (profundidad ilimitada)
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 1 AS depth
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.name, c.parent_id, ct.depth + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree;

-- Generar una serie de fechas
WITH RECURSIVE dates AS (
    SELECT '2024-01-01'::date AS dt
    UNION ALL
    SELECT dt + 1
    FROM dates
    WHERE dt < '2024-12-31'
)
SELECT * FROM dates;
```

> [!WARNING]
> Las CTEs recursivas pueden ejecutarse infinitamente si la condición de recursión nunca termina. Asegúrate siempre de que tu paso recursivo eventualmente devuelva cero filas. Establece `max_recursion_depth` (o equivalente) en producción para evitar consultas descontroladas.

## Materialización vs Inline de CTE

Diferentes bases de datos manejan las CTEs de manera diferente:

| Base de Datos | Comportamiento Predeterminado | Pista para Control |
|----------|-----------------|------------------|
| PostgreSQL | Inline (a menos que se referencie múltiples veces) | `MATERIALIZED` / `NOT MATERIALIZED` |
| SQL Server | Igual que PostgreSQL | `OPTION (RECOMPILE)` |
| Snowflake | Inline | Sin control necesario |
| DuckDB | Materializado | Sin control necesario |

```sql
-- PostgreSQL: forzar materialización
WITH high_value AS MATERIALIZED (
    SELECT * FROM orders WHERE total > 10000
)
SELECT * FROM high_value h
INNER JOIN customers c ON h.customer_id = c.id;
```

## Ejemplo Real: Análisis de Sesión

```sql
WITH
user_sessions AS (
    SELECT
        user_id,
        session_start,
        session_end,
        EXTRACT(EPOCH FROM (session_end - session_start)) / 60 AS duration_minutes
    FROM sessions
    WHERE session_start >= '2024-01-01'
),
session_stats AS (
    SELECT
        user_id,
        COUNT(*) AS total_sessions,
        AVG(duration_minutes) AS avg_duration,
        SUM(duration_minutes) AS total_minutes,
        MAX(session_start) AS last_session
    FROM user_sessions
    GROUP BY user_id
),
active_users AS (
    SELECT *
    FROM session_stats
    WHERE total_sessions >= 5
      AND last_session >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
    u.name,
    au.total_sessions,
    ROUND(au.avg_duration, 2) AS avg_session_minutes,
    ROUND(au.total_minutes, 2) AS total_minutes
FROM active_users au
INNER JOIN users u ON au.user_id = u.user_id
ORDER BY total_minutes DESC;
```

> [!SUCCESS]
> Piensa en las CTEs como bloques de construcción nombrados para tu consulta. Cada CTE resuelve un problema. Juntas, componen análisis complejos que son fáciles de leer, depurar y modificar.

## Preguntas de Práctica

1. ¿Qué es una CTE y qué palabra clave la inicia?
2. Escribe una CTE llamada `high_value_customers` que seleccione clientes con total de pedidos superior a $10,000. Luego únela con una tabla de regiones.
3. ¿Cómo defines múltiples CTEs en una sola consulta? ¿Hay coma entre ellas?
4. Escribe una consulta con dos CTEs donde la segunda CTE referencie a la primera.
5. ¿Cuál es la diferencia entre una CTE y una tabla derivada (subconsulta en FROM)?
6. Escribe una CTE recursiva que genere todos los números del 1 al 100.
7. ¿Cómo termina una CTE recursiva? ¿Qué sucede si el paso recursivo nunca devuelve cero filas?
8. Escribe una CTE recursiva para recorrer una tabla `employees` donde cada empleado tiene un `manager_id`. Muestra nombre, nivel y ruta de subordinación.
9. ¿Cuándo preferirías una CTE sobre una subconsulta? Da dos razones.
10. ¿Qué hace la palabra clave `MATERIALIZED` en las CTEs de PostgreSQL?
