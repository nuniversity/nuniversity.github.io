---
title: "Subconsultas"
description: "Domina subconsultas escalares, de fila, correlacionadas, EXISTS/NOT EXISTS y patrones IN/NOT IN"
order: 3
duration: "50 minutos"
difficulty: "intermedio"
---

# Subconsultas

Una subconsulta es una consulta anidada dentro de otra consulta. Las subconsultas aparecen en las cláusulas SELECT, FROM, WHERE y HAVING. Pueden devolver valores únicos, filas únicas o conjuntos de resultados completos.

## Subconsultas Escalares

Una subconsulta escalar devuelve exactamente un valor (una fila, una columna). Puede usarse en cualquier lugar donde se espere un valor único.

```sql
-- Encontrar empleados que ganan más que el salario promedio
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Incluir el promedio como columna
SELECT
    name,
    salary,
    (SELECT AVG(salary) FROM employees) AS avg_salary,
    salary - (SELECT AVG(salary) FROM employees) AS difference
FROM employees;
```

| name | salary | avg_salary | difference |
|------|--------|------------|------------|
| Alice | 95000 | 82000 | 13000 |
| Bob | 75000 | 82000 | -7000 |

> [!WARNING]
> Una subconsulta escalar debe devolver exactamente una fila. Si devuelve cero filas, el resultado se vuelve NULL. Si devuelve múltiples filas, la base de datos lanza un error.

```sql
-- Esto FALLARÁ si algún departamento tiene múltiples empleados con el salario máximo
SELECT name, department_id
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees GROUP BY department_id);
```

## Subconsultas de Fila

Una subconsulta de fila devuelve una única fila con múltiples columnas. Usa constructores de fila para comparar.

```sql
-- Encontrar empleados con el salario más alto en su departamento
SELECT name, salary, department_id
FROM employees
WHERE (department_id, salary) IN (
    SELECT department_id, MAX(salary)
    FROM employees
    GROUP BY department_id
);
```

```sql
-- Encontrar empleados cuyo departamento y cargo coinciden con un patrón existente
SELECT *
FROM employees
WHERE (department_id, job_id) = (
    SELECT department_id, job_id
    FROM employees
    WHERE employee_id = 100
);
```

## Subconsultas en la Cláusula FROM (Tablas Derivadas)

Una subconsulta en FROM actúa como una tabla temporal que la consulta externa puede referenciar.

```sql
SELECT dept_name, avg_salary
FROM (
    SELECT
        d.department_name AS dept_name,
        AVG(e.salary) AS avg_salary
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.department_id
    GROUP BY d.department_name
) dept_stats
WHERE avg_salary > 80000
ORDER BY avg_salary DESC;
```

```sql
-- Clasificar productos por ingresos dentro de cada categoría
SELECT category, product_name, revenue, rank
FROM (
    SELECT
        c.category_name AS category,
        p.product_name,
        SUM(oi.quantity * oi.unit_price) AS revenue,
        RANK() OVER (
            PARTITION BY c.category_id
            ORDER BY SUM(oi.quantity * oi.unit_price) DESC
        ) AS rank
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    INNER JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY c.category_id, c.category_name, p.product_name
) ranked
WHERE rank <= 3;
```

> [!NOTE]
> Las tablas derivadas deben tener un alias. Cada subconsulta en FROM necesita un nombre, incluso si no lo referencias en otro lugar.

## Subconsultas Correlacionadas

Una subconsulta correlacionada referencia columnas de la consulta externa. Se re-ejecuta para cada fila de la consulta externa.

```sql
-- Encontrar empleados que ganan más que el promedio en su propio departamento
SELECT e.name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department_id = e.department_id
);
```

| Tipo de Subconsulta | Ejecutada | Rendimiento |
|---------------|----------|-------------|
| No correlacionada | Una vez | Rápido |
| Correlacionada | Una vez por fila externa | Más lento — cuidado con tablas grandes |

```sql
-- Encontrar productos cuyo precio está por encima del promedio de su categoría
SELECT p.product_name, p.category_id, p.price
FROM products p
WHERE p.price > (
    SELECT AVG(price)
    FROM products
    WHERE category_id = p.category_id
);
```

### Ejecución Correlacionada vs No Correlacionada

No correlacionada (una ejecución):
```
1. Calcular AVG(salary) de todos los empleados → 82000
2. Encontrar empleados WHERE salary > 82000
   → escanear 1000 filas, comparar con constante
```

Correlacionada (N ejecuciones):
```
Para cada uno de los 1000 empleados:
  1. Calcular AVG(salary) del departamento de ese empleado
  2. Comparar salario del empleado con el promedio del departamento
```

## EXISTS y NOT EXISTS

EXISTS devuelve TRUE si la subconsulta produce alguna fila. No le importan los valores — solo la existencia de filas.

```sql
-- Encontrar departamentos que tienen al menos un empleado
SELECT d.department_name
FROM departments d
WHERE EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);

-- Encontrar departamentos sin empleados
SELECT d.department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);
```

> [!SUCCESS]
> Usa siempre `SELECT 1` (o `SELECT *`) en subconsultas EXISTS — las columnas reales no importan. La base de datos solo verifica la existencia de filas.

### EXISTS vs IN

| Aspecto | EXISTS | IN |
|--------|--------|----|
| Se detiene en la primera coincidencia | Sí | No (evalúa todas) |
| Maneja NULLs | Con seguridad | Problemático |
| Rendimiento (subconsulta grande) | Mejor | Peor |
| Rendimiento (subconsulta pequeña) | Comparable | Comparable |

```sql
-- EXISTS es a menudo más rápido cuando la subconsulta es grande
SELECT c.*
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
      AND o.order_date >= '2024-01-01'
);

-- IN es más claro para listas pequeñas y estáticas
SELECT *
FROM products
WHERE category_id IN (1, 3, 5);
```

## IN y NOT IN

```sql
-- Encontrar clientes de países específicos
SELECT name, country
FROM customers
WHERE country IN ('USA', 'Canada', 'Mexico');

-- Usando una subconsulta
SELECT name
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE total > 1000
);
```

> [!WARNING]
> NOT IN con una subconsulta que devuelve NULL produce cero filas. Usa NOT EXISTS o añade `WHERE col IS NOT NULL` a la subconsulta.

## ANY, ALL y SOME

```sql
-- Salario mayor que ANY empleado del departamento 10
SELECT name, salary
FROM employees
WHERE salary > ANY (
    SELECT salary
    FROM employees
    WHERE department_id = 10
);

-- Salario mayor que ALL empleados del departamento 10
SELECT name, salary
FROM employees
WHERE salary > ALL (
    SELECT salary
    FROM employees
    WHERE department_id = 10
);
```

| Operador | Significado |
|----------|---------|
| `> ANY(...)` | Mayor que al menos un valor |
| `> ALL(...)` | Mayor que todos los valores |
| `= ANY(...)` | Igual a al menos uno (igual que IN) |
| `<> ALL(...)` | Diferente de todos (igual que NOT IN) |

## Subconsultas Anidadas

Las subconsultas pueden anidarse múltiples niveles de profundidad, aunque esto a menudo señala una oportunidad de refactorización.

```sql
SELECT name
FROM employees
WHERE department_id IN (
    SELECT department_id
    FROM departments
    WHERE location_id IN (
        SELECT location_id
        FROM locations
        WHERE country = 'USA'
    )
);
```

```sql
-- Equivalente con JOINs (generalmente preferido)
SELECT e.name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
INNER JOIN locations l ON d.location_id = l.location_id
WHERE l.country = 'USA';
```

## Ejemplo Real: Informe de Clientes

```sql
SELECT
    c.name,
    c.email,
    (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS total_orders,
    (
        SELECT SUM(o.total_amount)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS lifetime_value,
    (
        SELECT MAX(o.order_date)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS last_order_date,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.customer_id = c.customer_id
              AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
        ) THEN 'Activo'
        ELSE 'Inactivo'
    END AS customer_status
FROM customers c
ORDER BY lifetime_value DESC NULLS LAST;
```

> [!SUCCESS]
> Las subconsultas son poderosas pero pueden perjudicar la legibilidad. Como regla general: usa subconsultas para agregaciones simples y verificaciones de existencia; usa JOINs para datos de múltiples tablas. Las CTEs (próxima lección) ofrecen un término medio.

## Preguntas de Práctica

1. ¿Qué es una subconsulta escalar? ¿Qué sucede si devuelve cero filas? ¿Y si devuelve múltiples filas?
2. Escribe una consulta que liste productos con precio por encima del precio promedio general.
3. ¿Cuál es la diferencia entre una subconsulta correlacionada y una no correlacionada?
4. Escribe una subconsulta correlacionada para encontrar empleados contratados antes de la fecha promedio de contratación de su departamento.
5. ¿Cuándo usarías EXISTS en lugar de IN? Da un ejemplo.
6. Reescribe `SELECT * FROM products WHERE category_id NOT IN (SELECT category_id FROM categories WHERE active = false)` de forma segura.
7. ¿Qué significan `> ANY()` y `> ALL()`? Proporciona consultas de ejemplo.
8. Escribe una consulta usando una tabla derivada (subconsulta en FROM) para encontrar los 2 empleados mejor pagados por departamento.
9. ¿Qué es una subconsulta de fila? Escribe una que use un constructor de fila en una cláusula WHERE.
10. ¿Por qué se usa comúnmente `SELECT 1` dentro de subconsultas EXISTS?
