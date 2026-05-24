---
title: "LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE(), NTH_VALUE()"
description: "Domina las funciones de valor de ventana: LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE y cláusulas de marco (ROWS, RANGE, GROUPS)"
order: 2
duration: "90 minutos"
difficulty: advanced
---

# LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE(), NTH_VALUE()

## Funciones de Valor en Contexto de Ventana

Las funciones de valor proporcionan acceso a otras filas dentro del mismo conjunto de resultados **sin un self-join**. Son la base para el análisis de series temporales, detección de cambios y clasificación.

| Función | Retorna |
|---|---|
| `LAG(expr, offset, default)` | Valor de una fila **antes** de la fila actual |
| `LEAD(expr, offset, default)` | Valor de una fila **después** de la fila actual |
| `FIRST_VALUE(expr)` | Valor de la **primera** fila en el marco de ventana |
| `LAST_VALUE(expr)` | Valor de la **última** fila en el marco de ventana |
| `NTH_VALUE(expr, n)` | Valor de la **enésima** fila en el marco de ventana |

## LAG() y LEAD()

```sql
-- Comparar el salario de cada empleado con el anterior contratado en el mismo departamento
SELECT
  employee_id,
  department_id,
  hire_date,
  salary,
  LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS prev_salary,
  salary - LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS diff
FROM employees;
```

### Offset y Valor Predeterminado

El segundo argumento es el **offset** (número de filas atrás/adelante). El tercero es el **valor predeterminado** cuando no existe fila (predeterminado es `NULL`).

```sql
-- Mirar 2 filas adelante, predeterminado 0
LEAD(amount, 2, 0) OVER (ORDER BY event_date)

-- Valor anterior, sin predeterminado (NULL si no hay fila anterior)
LAG(metric) OVER (ORDER BY ts)
```

### Casos de Uso Comunes

```sql
-- Cambio de ingresos día a día
SELECT
  order_date,
  revenue,
  LAG(revenue) OVER (ORDER BY order_date) AS prev_day_revenue,
  ROUND(
    (revenue - LAG(revenue) OVER (ORDER BY order_date))
    / NULLIF(LAG(revenue) OVER (ORDER BY order_date), 0) * 100, 2
  ) AS pct_change
FROM daily_revenue;

-- Comparación año a año
SELECT
  EXTRACT(YEAR FROM order_date) AS year,
  EXTRACT(MONTH FROM order_date) AS month,
  SUM(amount) AS monthly_total,
  LAG(SUM(amount), 12) OVER (ORDER BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)) AS same_month_last_year
FROM orders
GROUP BY year, month;
```

[!IMPORTANT]
`LAG`/`LEAD` con grandes offsets pueden ser costosos. En bases de datos con millones de filas, considera indexar las columnas del `ORDER BY`.

## FIRST_VALUE() y LAST_VALUE()

```sql
SELECT
  department_id,
  employee_id,
  salary,
  FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS highest_in_dept,
  LAST_VALUE(salary)  OVER (PARTITION BY department_id ORDER BY salary DESC) AS lowest_in_dept
FROM employees;
```

### La Trampa de LAST_VALUE

`LAST_VALUE` sin un marco explícito retorna la **fila actual**, no la última fila en la partición. Esto sucede porque el marco predeterminado con `ORDER BY` es `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

```sql
-- INCORRECTO: LAST_VALUE retorna la fila actual, no el máximo de la partición
SELECT
  department_id,
  salary,
  LAST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS wrong_min
FROM employees;

-- CORRECTO: Especificar el marco
SELECT
  department_id,
  salary,
  LAST_VALUE(salary) OVER (
    PARTITION BY department_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS correct_min
FROM employees;
```

## Cláusulas de Marco (Frame)

Los marcos definen qué filas son visibles para la función de ventana.

| Cláusula de marco | Significado |
|---|---|
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | Filas físicas desde el inicio hasta la actual |
| `ROWS BETWEEN 5 PRECEDING AND 2 FOLLOWING` | 5 antes, actual, 2 después |
| `RANGE BETWEEN 100 PRECEDING AND CURRENT ROW` | Filas donde el valor ORDER BY está a menos de 100 de la actual |
| `RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW` | Ventana basada en tiempo (PostgreSQL) |
| `GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING` | Grupos de pares (mismo valor ORDER BY) |

### ROWS vs RANGE vs GROUPS

| Tipo de marco | Base | Manejo de empates |
|---|---|---|
| `ROWS` | Conteo físico de filas | Ignora empates — cada fila es distinta |
| `RANGE` | Diferencia de valor de la fila actual | Incluye todos los empates |
| `GROUPS` | Grupos de valores iguales | Trata valores iguales como un grupo |

```sql
-- ROWS: desplazamiento físico estricto
SELECT
  value,
  event_date,
  SUM(value) OVER (ORDER BY event_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rows_3
FROM metrics;

-- RANGE: todas las filas dentro de 10 unidades de valor
SELECT
  score,
  AVG(score) OVER (ORDER BY score RANGE BETWEEN 5 PRECEDING AND 5 FOLLOWING) AS rang_avg
FROM exam_results;

-- GROUPS: grupos de pares
SELECT
  department_id,
  headcount,
  SUM(headcount) OVER (ORDER BY headcount GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS grps_sum
FROM dept_stats;
```

[!TIP]
Usa `RANGE` para ventanas de fecha/hora en datos financieros o IoT donde necesitas todos los puntos de datos dentro de un intervalo de tiempo independientemente de cuántas filas haya.

## NTH_VALUE()

Retorna el valor de la enésima fila en el marco de la ventana.

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

### NTH_VALUE con Control de Marco

```sql
-- Tercero más alto por departamento
SELECT DISTINCT department_id,
  NTH_VALUE(salary, 3) OVER (
    PARTITION BY department_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS third_highest
FROM employees;
```

## Ejemplos Prácticos

### Ejemplo 1: Duración de Sesión desde Logs Web

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

### Ejemplo 2: Indicador de Momentum de Precio

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

### Ejemplo 3: Flag Booleano para Cambios de Estado

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

### Ejemplo 4: Mediana Móvil (Ventana de Valor)

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

## Notas de Rendimiento

| Función | Costo del marco | Recomendación de índice |
|---|---|---|
| `LAG`/`LEAD` (offset=1) | O(n) | Índice en columna de ordenación |
| `LAG`/`LEAD` (gran offset) | O(n) | Índice compuesto |
| `FIRST_VALUE` | O(n) por partición | Índice partición + orden |
| `LAST_VALUE` con marco completo | O(n log n) | Considera subconsulta |
| `NTH_VALUE` | O(n) | Evitar con n grande |

[!WARNING]
`LAST_VALUE` y `NTH_VALUE` con marcos grandes pueden causar presión significativa de memoria. Para min/max simples, prefiere `MIN() OVER()` o `MAX() OVER()`.

## Preguntas de Práctica

1. Escribe una consulta para encontrar el cambio de temperatura diario usando `LAG` en una tabla `weather(date, temperature)`.
2. ¿Cuál es la diferencia entre `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` y `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`?
3. Dada `orders(id, customer_id, order_date, amount)`, usa `LAG` para calcular la diferencia en días entre pedidos consecutivos para el mismo cliente.
4. ¿Por qué `LAST_VALUE` a veces retorna la fila actual en lugar de la última fila en la partición? ¿Cómo se soluciona?
5. Escribe una consulta que retorne el precio de cada producto junto con los siguientes 2 precios para ese producto (ordenado por fecha).
6. Dada `sensor_readings(sensor_id, reading_time, value)`, calcula un promedio móvil de 5 minutos para cada sensor usando `RANGE BETWEEN`.
7. Usa `NTH_VALUE` para encontrar la tercera puntuación más alta por clase desde `exam_scores(student_id, class_id, score)`.
8. Escribe una consulta para marcar filas donde un `user_status` cambia de `'active'` a `'inactive'` en una tabla `user_log`.
9. Compara los tipos de marco `ROWS`, `RANGE` y `GROUPS`. Da un escenario donde cada uno es la opción más apropiada.
10. Escribe una consulta que calcule el crecimiento año a año para ingresos mensuales, rellenando meses faltantes con 0 usando `COALESCE` con `LAG`.
