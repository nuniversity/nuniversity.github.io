---
title: "ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE()"
description: "Domina las funciones de ventana de clasificación: ROW_NUMBER, RANK, DENSE_RANK, NTILE y comportamiento de ORDER BY en marcos de ventana"
order: 1
duration: "90 minutos"
difficulty: advanced
---

# ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE()

## Visión General de Funciones de Ventana

Las funciones de ventana realizan cálculos en un conjunto de filas relacionadas con la fila actual. A diferencia de las funciones de agregación con `GROUP BY`, las funciones de ventana **no colapsan filas** — cada fila de entrada conserva su identidad.

```sql
-- Agregación: colapsa
SELECT department_id, AVG(salary)
FROM employees
GROUP BY department_id;

-- Ventana: preserva detalles
SELECT employee_id, department_id, salary,
       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
FROM employees;
```

[!NOTE]
La cláusula `OVER` define la ventana. Una ventana puede incluir `PARTITION BY` (grupos de filas), `ORDER BY` (ordenamiento dentro de grupos) y especificaciones de marco (límites de filas).

## ROW_NUMBER()

Asigna un número entero secuencial único a cada fila dentro de una partición, comenzando en 1.

```sql
SELECT
  employee_id,
  department_id,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
FROM employees;
```

### Casos de Uso Comunes

- **Deduplicación**: Conservar la primera ocurrencia y eliminar duplicados.
- **Paginación**: Numerar filas y filtrar por página.
- **Top-N por grupo**: Asignar números de fila y filtrar.

```sql
-- Deduplicar
WITH numbered AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS rn
  FROM users
)
DELETE FROM users WHERE (email, created_at) IN (
  SELECT email, created_at FROM numbered WHERE rn > 1
);

-- Paginación
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM products
) t WHERE rn BETWEEN 21 AND 40;
```

## RANK() y DENSE_RANK()

Ambos asignan rangos con empates manejados de manera diferente:

| Función | Empates | Siguiente rango tras empate | Ejemplo (valores: 100, 90, 90, 80) |
|---|---|---|---|
| `ROW_NUMBER()` | Arbitrario | N/A | 1, 2, 3, 4 |
| `RANK()` | Mismo rango | Salta | 1, 2, 2, 4 |
| `DENSE_RANK()` | Mismo rango | No salta | 1, 2, 2, 3 |

```sql
SELECT
  employee_id,
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
  RANK()       OVER (ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;
```

### Casos de Uso para RANK/DENSE_RANK

- **RANK**: "Dame los 5 salarios más altos" — si 3 personas empatan en el #1, el siguiente es #4.
- **DENSE_RANK**: "Dame los 5 niveles salariales más altos" — todos en los 5 valores distintos principales.

```sql
-- 5 niveles salariales distintos principales
SELECT *
FROM (
  SELECT *,
         DENSE_RANK() OVER (ORDER BY salary DESC) AS dr
  FROM employees
) t WHERE dr <= 5;
```

## NTILE()

Divide las filas en N grupos aproximadamente iguales y asigna un número de grupo (1 a N).

```sql
SELECT
  employee_id,
  salary,
  NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

### Estrategias NTILE

| Grupos | Nombre | Significado |
|---|---|---|
| 2 | División mediana | Mitad superior/inferior |
| 4 | Cuartiles | Q1–Q4 |
| 10 | Deciles | Top 10%, bottom 10% |
| 100 | Percentiles | Clasificación por percentil |

```sql
-- Decil superior de empleados
SELECT * FROM (
  SELECT *, NTILE(10) OVER (ORDER BY sales DESC) AS decile
  FROM sales_reps
) t WHERE decile = 1;
```

[!WARNING]
`NTILE` requiere un `ORDER BY`. Cuando el número de filas no es divisible por el conteo de grupos, los primeros grupos reciben una fila extra. Siempre verifica el comportamiento de desempate de tu base de datos.

## ORDER BY en Ventanas

El `ORDER BY` dentro de `OVER` define el orden lógico dentro de cada partición. Importantemente, interactúa con el **marco predeterminado**:

- Sin `ORDER BY`: el marco es **todas las filas en la partición**.
- Con `ORDER BY`: el marco predeterminado es `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

```sql
-- Total acumulado: marco predeterminado con ORDER BY
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Equivalente a
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders;
```

### ORDER BY con NULLS

```sql
-- Controlar posición de NULL
SELECT
  employee_id,
  commission,
  ROW_NUMBER() OVER (ORDER BY commission NULLS LAST) AS rn
FROM employees;
```

## Especificaciones de Marco

| Cláusula | Significado |
|---|---|
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Desplazamiento físico de filas |
| `RANGE BETWEEN 5 PRECEDING AND CURRENT ROW` | Desplazamiento lógico de valor (requiere ORDER BY) |
| `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | Todas las filas hasta la actual (predeterminado) |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | Actual + todas después |
| `ROWS BETWEEN 3 PRECEDING AND 1 FOLLOWING` | Ventana de 5 filas |

```sql
-- Media móvil de 3 días
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS moving_avg_3d
FROM orders;
```

## Ejemplos Prácticos

### Ejemplo 1: Sesiones en Logs Web

Asignar un ID de sesión a cada sesión de usuario basado en un intervalo de inactividad de 30 minutos.

```sql
WITH lagged AS (
  SELECT
    user_id,
    page,
    event_time,
    LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_time
  FROM web_events
),
sessions AS (
  SELECT *,
    SUM(CASE WHEN prev_time IS NULL
          OR EXTRACT(EPOCH FROM event_time - prev_time) > 1800
        THEN 1 ELSE 0 END
    ) OVER (PARTITION BY user_id ORDER BY event_time) AS session_id
  FROM lagged
)
SELECT user_id, session_id,
       COUNT(*) AS page_views,
       MIN(event_time) AS session_start,
       MAX(event_time) AS session_end
FROM sessions
GROUP BY user_id, session_id;
```

### Ejemplo 2: Salario Mediano por Departamento

```sql
SELECT DISTINCT department_id,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)
    OVER (PARTITION BY department_id) AS median_salary
FROM employees;
```

### Ejemplo 3: Brechas e Islas

```sql
-- Encontrar rangos de fechas consecutivos por producto
WITH numbered AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sale_date) AS rn,
    sale_date - INTERVAL '1 day' * ROW_NUMBER()
      OVER (PARTITION BY product_id ORDER BY sale_date) AS grp
  FROM sales
)
SELECT product_id,
  MIN(sale_date) AS range_start,
  MAX(sale_date) AS range_end,
  COUNT(*) AS days_in_range
FROM numbered
GROUP BY product_id, grp
ORDER BY product_id, range_start;
```

## Consideraciones de Rendimiento

| Función | Costo | Observaciones |
|---|---|---|
| `ROW_NUMBER()` | Bajo | Una ordenación por partición |
| `RANK()` | Bajo | Misma ordenación que ROW_NUMBER |
| `DENSE_RANK()` | Bajo | Misma ordenación que ROW_NUMBER |
| `NTILE()` | Medio | Requiere conteo de filas + distribución |
| Muchas particiones | Alto | Ordenación domina — indexar columnas de partición y orden |

[!TIP]
Crea un índice compuesto en `(columna_particion, columna_orden)` para que las ordenaciones de funciones de ventana usen un escaneo de índice en lugar de una ordenación completa.

```sql
CREATE INDEX idx_dept_salary ON employees (department_id, salary DESC);
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `RANK()` y `DENSE_RANK()`? Da un ejemplo con valores empatados.
2. Escribe una consulta que asigne a cada empleado un número de fila dentro de su departamento ordenado por fecha de contratación (más antiguo primero).
3. Tienes una tabla `orders(id, customer_id, order_date, total)`. Escribe una consulta para encontrar los 3 pedidos más recientes por cliente.
4. ¿Cómo se comporta `NTILE(4)` cuando hay 10 filas en la partición? ¿Cuántas filas en cada grupo?
5. Escribe una consulta para deduplicar filas de `users(id, email, signup_date)` conservando solo el registro más antiguo por email.
6. ¿Cuál es el marco de ventana predeterminado cuando se especifica `ORDER BY` dentro de `OVER`? ¿Cuándo está ausente `ORDER BY`?
7. Usa `NTILE` para segmentar empleados en 5 niveles de rendimiento por monto de ventas y cuenta cuántos hay en cada nivel.
8. Escribe un promedio móvil de precios de acciones en una ventana de 7 días (6 anteriores + actual).
9. Dada una tabla `logs(user_id, action, timestamp)`, escribe una consulta que asigne un número de sesión a cada usuario donde una nueva sesión comienza después de 30 minutos de inactividad.
10. Explica la diferencia entre `ROWS BETWEEN 3 PRECEDING AND CURRENT ROW` y `RANGE BETWEEN 3 PRECEDING AND CURRENT ROW` con un ejemplo.
