---
title: "GROUP BY y HAVING — Agrupando y Filtrando Agregados"
description: "Domina GROUP BY, funciones agregadas (COUNT, SUM, AVG, MIN, MAX) y entiende HAVING vs WHERE"
order: 8
duration: "20-30 minutos"
difficulty: "beginner"
---

# GROUP BY y HAVING — Agrupando y Filtrando Agregados

Los datos brutos son ruidosos. La agregación te permite resumir miles de filas en métricas significativas: totales, promedios, conteos y extremos.

## Funciones Agregadas

| Función | Propósito | Ejemplo |
|---------|-----------|---------|
| `COUNT()` | Número de filas | `COUNT(*)` o `COUNT(columna)` |
| `SUM()` | Total de columna numérica | `SUM(salary)` |
| `AVG()` | Media aritmética | `AVG(price)` |
| `MIN()` | Valor más pequeño | `MIN(age)` |
| `MAX()` | Valor más grande | `MAX(salary)` |

```sql
-- Agregados simples en toda la tabla
SELECT
    COUNT(*) AS total_employees,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS payroll_total
FROM employees;
```

> [!NOTE]
> Las funciones agregadas ignoran valores `NULL` (excepto `COUNT(*)` que cuenta filas, no valores). `AVG(NULL, 10, 20)` = 15, no 10.

## GROUP BY — Agrupando Filas

`GROUP BY` divide filas en grupos y aplica funciones agregadas a cada grupo:

```sql
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department;
```

Resultado de ejemplo:

| department | avg_salary |
|------------|------------|
| Engineering | 91500.00 |
| Marketing | 75000.00 |
| Sales | 65000.00 |

### GROUP BY con Múltiples Columnas

```sql
SELECT department, status, COUNT(*) AS count
FROM employees
GROUP BY department, status
ORDER BY department;
```

| department | status | count |
|------------|--------|-------|
| Engineering | active | 12 |
| Engineering | on_leave | 2 |
| Marketing | active | 8 |
| Sales | active | 5 |
| Sales | inactive | 1 |

> [!SUCCESS]
> Toda columna en la lista SELECT debe estar en el GROUP BY o envuelta en una función agregada. De lo contrario, SQL no sabe qué valor mostrar.

### GROUP BY con WHERE

`WHERE` filtra filas **antes** del agrupamiento:

```sql
-- Salario promedio solo para Engineering y Marketing
SELECT department, AVG(salary) AS avg_salary
FROM employees
WHERE department IN ('Engineering', 'Marketing')
GROUP BY department;
```

Orden de filtrado: `WHERE` → `GROUP BY` → funciones agregadas

## HAVING — Filtrando Grupos

`WHERE` no puede filtrar resultados agregados porque los agregados aún no existen cuando `WHERE` se ejecuta. Usa `HAVING`:

```sql
-- Departamentos con salario promedio superior a 80.000
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 80000;
```

| department | avg_salary |
|------------|------------|
| Engineering | 91500.00 |

### HAVING vs WHERE

| Cláusula | Filtra | Se Ejecuta | Puede Usar Agregados |
|----------|--------|------------|----------------------|
| `WHERE` | Filas individuales | Antes de GROUP BY | No |
| `HAVING` | Grupos | Después de GROUP BY | Sí |

```sql
-- Correcto: WHERE filtra filas, HAVING filtra grupos
SELECT department, COUNT(*) AS employee_count
FROM employees
WHERE salary > 50000             -- excluye a los de bajos ingresos primero
GROUP BY department
HAVING COUNT(*) > 5             -- solo departamentos con 5+ empleados bien pagados
ORDER BY employee_count DESC;
```

> [!WARNING]
> Usar `HAVING` donde `WHERE` funcionaría (ej.: `HAVING department = 'Engineering'`) es válido pero ineficiente. `WHERE` es más rápido porque elimina filas antes del agrupamiento.

## Agrupando con Expresiones

Puedes agrupar por expresiones calculadas:

```sql
-- Agrupar empleados por rango salarial
SELECT
    CASE
        WHEN salary < 50000 THEN 'Low'
        WHEN salary BETWEEN 50000 AND 90000 THEN 'Mid'
        ELSE 'High'
    END AS bracket,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY bracket
ORDER BY avg_salary DESC;
```

## COUNT(*) vs COUNT(columna) vs COUNT(DISTINCT columna)

```sql
SELECT
    COUNT(*) AS total_rows,
    COUNT(department) AS non_null_depts,
    COUNT(DISTINCT department) AS unique_depts
FROM employees;
```

| total_rows | non_null_depts | unique_depts |
|------------|----------------|--------------|
| 100 | 98 | 4 |

- `COUNT(*)` cuenta todas las filas
- `COUNT(col)` cuenta valores no-NULL en esa columna
- `COUNT(DISTINCT col)` cuenta valores no-NULL únicos

## Caso de Uso Real: Panel de Ventas

```sql
SELECT
    DATE_TRUNC('month', order_date) AS month,  -- PostgreSQL
    COUNT(DISTINCT customer_id) AS active_customers,
    COUNT(*) AS total_orders,
    SUM(total) AS revenue,
    AVG(total) AS avg_order_value,
    MAX(total) AS biggest_order
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY month
ORDER BY month;
```

## Caso de Uso Real: Identificando Anomalías

```sql
-- Encuentra productos con tasas de devolución inusualmente altas
SELECT
    product_id,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returns,
    ROUND(
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) AS return_rate_pct
FROM order_items
GROUP BY product_id
HAVING return_rate_pct > 15
ORDER BY return_rate_pct DESC;
```

## Orden Completa de Ejecución del SELECT

Entender el orden en que SQL procesa las cláusulas te ayuda a escribir consultas correctas:

1. `FROM` / `JOIN` — identificar tablas de origen
2. `WHERE` — filtrar filas individuales
3. `GROUP BY` — agrupar filas
4. `HAVING` — filtrar grupos
5. `SELECT` — calcular expresiones y alias
6. `ORDER BY` — ordenar resultados
7. `LIMIT` / `OFFSET` — paginar

Esto explica por qué `WHERE` no puede usar alias de SELECT, pero `ORDER BY` sí.

> [!NOTE]
> La mayoría de los compiladores SQL optimizan el orden lógico internamente, pero entender el orden conceptual ayuda a depurar problemas en las consultas.

## Preguntas de Práctica

Dada `orders(id, customer_id, total, status, order_date)`:

1. Cuenta el número total de pedidos.
2. Calcula los ingresos totales (suma de totales) de todos los pedidos.
3. Encuentra el valor promedio del pedido por cliente.
4. Lista los clientes que han realizado más de 5 pedidos.
5. ¿Cuál es la diferencia entre WHERE y HAVING?
6. Encuentra el total máximo y mínimo de pedidos.
7. Muestra el número de pedidos por mes en 2024, ordenado por mes.
8. ¿Por qué falla `SELECT name, COUNT(*) FROM employees GROUP BY department`? Corrígelo.
9. Encuentra estados que tengan menos de 10 pedidos.
10. Escribe una consulta que muestre el porcentaje de pedidos que están 'shipped' vs 'pending' vs 'cancelled'.
