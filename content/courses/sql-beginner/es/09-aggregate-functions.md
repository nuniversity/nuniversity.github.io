---
title: "Funciones Agregadas Avanzadas"
description: "Profundiza en agregación con ROLLUP, GROUPING, manejo de NULL en agregados y vista previa de funciones ventana"
order: 9
duration: "20-30 minutos"
difficulty: "beginner"
---

# Funciones Agregadas Avanzadas

Ya conoces COUNT, SUM, AVG, MIN y MAX. Ahora es momento de ir más allá con subtotales, conjuntos de agrupamiento y entendiendo cómo se comporta NULL.

## Recapitulación: Funciones Agregadas Básicas

| Función | Descripción | Tipo de Retorno |
|---------|-------------|-----------------|
| `COUNT(*)` | Total de filas en el grupo | INTEGER |
| `COUNT(expr)` | Valores no-NULL de expr | INTEGER |
| `SUM(expr)` | Suma de valores | Mismo que expr |
| `AVG(expr)` | Media aritmética | Generalmente DECIMAL |
| `MIN(expr)` | Valor más pequeño | Mismo que expr |
| `MAX(expr)` | Valor más grande | Mismo que expr |

```sql
SELECT
    COUNT(*) AS total,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount
FROM payments;
```

## Comportamiento de NULL en Agregados

> [!NOTE]
> Las funciones agregadas ignoran valores NULL — excepto `COUNT(*)` que cuenta filas independientemente. Esto puede dar resultados engañosos si no lo tienes en cuenta.

```sql
SELECT
    COUNT(*) AS row_count,          -- 10
    COUNT(rating) AS rating_count,   -- 7 (3 NULLs ignorados)
    AVG(rating) AS avg_rating,       -- promedio correcto de 7 valores
    SUM(rating) / COUNT(*) AS wrong  -- incorrecto: divide por 10
FROM reviews;
```

### COALESCE — Reemplazar NULLs Antes de la Agregación

```sql
SELECT
    AVG(COALESCE(rating, 0)) AS avg_with_zeros,  -- trata NULL como 0
    AVG(rating) AS avg_nulls_ignored              -- NULLs excluidos
FROM reviews;
```

> [!WARNING]
> Elegir entre ignorar NULLs y tratarlos como 0 es una decisión de negocio. Si una reseña no tiene calificación, ¿debería reducir el promedio? Generalmente no — es mejor excluirla.

### NULLIF — Prevenir División por Cero

```sql
-- División que podría dividir por cero
SELECT
    department,
    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(*), 0) AS return_pct
FROM orders
GROUP BY department;
```

`NULLIF(a, b)` devuelve NULL si a = b, de lo contrario devuelve a. Esto previene errores de división por cero.

## Extensiones de GROUP BY

### GROUP BY ROLLUP

`ROLLUP` genera subtotales y totales generales para datos jerárquicos:

```sql
SELECT
    department,
    status,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY ROLLUP (department, status);
```

Resultado:

| department | status | count | avg_salary |
|------------|--------|-------|------------|
| Engineering | active | 10 | 92000 |
| Engineering | on_leave | 2 | 88000 |
| Engineering | NULL | 12 | 91500 |  ← subtotal para Engineering
| Marketing | active | 6 | 75000 |
| Marketing | NULL | 6 | 75000 |    ← subtotal para Marketing
| NULL | NULL | 18 | 86000 |      ← total general

> [!SUCCESS]
> `ROLLUP` es ideal para generación de informes. Una sola consulta reemplaza la necesidad de múltiples consultas UNION para obtener subtotales por grupo y un total general.

### GROUP BY CUBE (si está disponible)

`CUBE` genera subtotales para **todas las combinaciones** de las columnas listadas:

```sql
SELECT department, status, COUNT(*)
FROM employees
GROUP BY CUBE (department, status);
```

Esto produce 2^n filas de agrupamiento (incluyendo todas las combinaciones), no solo las jerárquicas.

### GROUPING — Identificar Subtotales

`GROUPING(columna)` devuelve 1 si la columna está agregada en la fila actual (usado en filas de subtotal/total general):

```sql
SELECT
    CASE
        WHEN GROUPING(department) = 1 AND GROUPING(status) = 1 THEN 'Grand Total'
        WHEN GROUPING(status) = 1 THEN 'Subtotal: ' || department
        ELSE department
    END AS department_group,
    status,
    COUNT(*) AS count
FROM employees
GROUP BY ROLLUP (department, status);
```

## Cláusula FILTER (PostgreSQL, SQLite 3.30+)

`FILTER` aplica una condición a un solo agregado sin afectar a otros:

```sql
SELECT
    department,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE salary > 80000) AS high_earners,
    AVG(salary) FILTER (WHERE age < 30) AS avg_salary_young,
    AVG(salary) FILTER (WHERE age >= 30) AS avg_salary_senior
FROM employees
GROUP BY department;
```

Sin `FILTER`, necesitarías expresiones CASE verbosas:

```sql
COUNT(CASE WHEN salary > 80000 THEN 1 ELSE NULL END) AS high_earners
```

## Vista Previa de Funciones Ventana

Las funciones ventana realizan cálculos en filas relacionadas con la fila actual **sin colapsarlas**:

```sql
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary,
    salary - AVG(salary) OVER (PARTITION BY department) AS diff_from_avg
FROM employees;
```

| name | department | salary | dept_avg_salary | diff_from_avg |
|------|------------|--------|-----------------|---------------|
| Alice | Engineering | 95000 | 91500 | 3500 |
| Bob | Marketing | 72000 | 75000 | -3000 |
| Carol | Engineering | 88000 | 91500 | -3500 |

> [!NOTE]
> A diferencia de GROUP BY, las funciones ventana mantienen filas individuales. El valor agregado se calcula sobre una "ventana" (PARTITION BY) y se adjunta a cada fila. Explorarás esto en profundidad en el curso intermedio.

## Caso de Uso Real: Informe de Ventas con Subtotales

```sql
SELECT
    CASE WHEN GROUPING(category) = 1 THEN 'All Categories'
         ELSE category
    END AS category,
    CASE WHEN GROUPING(product_name) = 1 THEN 'Subtotal'
         ELSE product_name
    END AS product,
    SUM(quantity) AS units_sold,
    SUM(revenue) AS total_revenue
FROM sales
WHERE sale_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY ROLLUP (category, product_name)
ORDER BY category, product;
```

## Caso de Uso Real: Estadísticas de Empleados

```sql
SELECT
    department,
    COUNT(*) AS total_employees,
    COUNT(*) FILTER (WHERE salary > 100000) AS executives,
    ROUND(AVG(salary), 2) AS avg_salary,
    ROUND(AVG(salary) FILTER (WHERE hire_date < '2020-01-01'), 2) AS avg_salary_veteran,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    ROUND(MAX(salary) - MIN(salary), 2) AS salary_spread
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
```

## Hoja de Referencia de Agregación

| Necesidad | Solución |
|-----------|----------|
| Contar filas | `COUNT(*)` |
| Contar valores no-NULL | `COUNT(columna)` |
| Contar valores únicos | `COUNT(DISTINCT columna)` |
| Sumar con condición | `SUM(CASE WHEN ... THEN val ELSE 0 END)` |
| Agregado condicional (limpio) | `COUNT(*) FILTER (WHERE ...)` |
| Evitar división por cero | `/ NULLIF(denominador, 0)` |
| Reemplazar NULL en agregado | `AVG(COALESCE(col, 0))` |
| Subtotales | `GROUP BY ROLLUP (a, b)` |
| Todas las combinaciones de subtotales | `GROUP BY CUBE (a, b)` |
| Detectar filas de subtotal | `GROUPING(col) = 1` |

> [!SUCCESS]
> El dominio de la agregación es lo que separa a los usuarios principiantes de los intermedios en SQL. Practica escribiendo consultas que combinen GROUP BY, HAVING, ROLLUP, FILTER y COALESCE.

## Preguntas de Práctica

Dada `sales(id, product, category, amount, sale_date)`:

1. Escribe una consulta que devuelva el monto total de ventas por categoría.
2. ¿Cuál es la diferencia entre `COUNT(*)` y `COUNT(amount)`?
3. Usa `COALESCE` para reemplazar valores NULL de amount con 0, luego calcula el promedio.
4. Escribe una consulta con `GROUP BY ROLLUP (category, product)` mostrando el total de ventas.
5. ¿Qué devuelve `GROUPING(category)` en una fila de total general?
6. Escribe una consulta usando `FILTER` para contar ventas de alto valor (amount > 100) por categoría.
7. ¿Cuál es la salida de `AVG(NULL, 10, 20)`?
8. Usa `NULLIF` para prevenir un error de división por cero en `SUM(amount) / COUNT(*)`.
9. Escribe una consulta que muestre las ventas de cada producto junto con el promedio de ventas para su categoría (usa una función ventana).
10. Crea un informe mostrando: categoría, conteo de productos, ingresos totales, ingresos promedio por producto y la venta única más alta por categoría.
