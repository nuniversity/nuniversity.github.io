---
title: "PIVOT, UNPIVOT y Consultas Crosstab"
description: "Domina la transformación fila-a-columna: PIVOT basado en CASE, PIVOT/UNPIVOT nativo, consultas crosstab y técnicas de pivote dinámico"
order: 3
duration: "90 minutos"
difficulty: advanced
---

# PIVOT, UNPIVOT y Consultas Crosstab

## Transformación Fila-a-Columna

Pivotar transforma valores únicos de filas en encabezados de columnas. Esto es esencial para informes, paneles y desnormalización de datos.

```sql
-- Entrada: formato largo
-- department | year | revenue
-- Sales      | 2023 | 100000
-- Sales      | 2024 | 120000
-- Eng        | 2023 | 200000

-- Salida: formato ancho
-- department | 2023    | 2024
-- Sales      | 100000  | 120000
-- Eng        | 200000  | NULL
```

## PIVOT Basado en CASE (Portátil)

Funciona en **todas** las bases de datos SQL.

```sql
SELECT
  department,
  MAX(CASE WHEN year = 2023 THEN revenue END) AS "2023",
  MAX(CASE WHEN year = 2024 THEN revenue END) AS "2024",
  MAX(CASE WHEN year = 2025 THEN revenue END) AS "2025"
FROM department_revenue
GROUP BY department;
```

### ¿Por qué MAX()?

Sin una agregación, cada combinación de `department` y `year` produce una fila. `MAX()` la colapsa eligiendo el valor no-NULL. Si puede haber múltiples valores, usa `SUM()`.

```sql
-- Múltiples valores por celda (sumarlos)
SELECT
  product_id,
  SUM(CASE WHEN month = 1 THEN amount END) AS jan,
  SUM(CASE WHEN month = 2 THEN amount END) AS feb,
  SUM(CASE WHEN month = 3 THEN amount END) AS mar
FROM monthly_sales
GROUP BY product_id;
```

## PIVOT Nativo (PostgreSQL, SQL Server, Oracle)

PostgreSQL 16+ y bases de datos dedicadas soportan sintaxis `PIVOT` nativa.

```sql
-- PostgreSQL (vía extensión tablefunc) / SQL Server
SELECT *
FROM (
  SELECT department, year, revenue
  FROM department_revenue
) AS src
PIVOT (
  MAX(revenue)
  FOR year IN (2023, 2024, 2025)
) AS pvt;
```

[!NOTE]
PostgreSQL no tiene una palabra clave `PIVOT` nativa (pre-16). Usa la función `crosstab()` de la extensión `tablefunc` o el enfoque basado en CASE. SQL Server y Oracle tienen `PIVOT` nativo.

## UNPIVOT (Columnas a Filas)

```sql
-- Entrada: ancho
-- product | q1 | q2 | q3 | q4
-- Widget  | 10 | 20 | 15 | 25

-- Salida: largo
-- product | quarter | sales
-- Widget  | q1      | 10
-- Widget  | q2      | 20
```

### UNPIVOT Basado en CASE

```sql
SELECT product_id, 'q1' AS quarter, q1 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q2' AS quarter, q2 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q3' AS quarter, q3 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q4' AS quarter, q4 AS sales FROM quarterly_sales
ORDER BY product_id, quarter;
```

### UNPIVOT Nativo (SQL Server, Oracle)

```sql
SELECT product_id, quarter, sales
FROM quarterly_sales
UNPIVOT (
  sales FOR quarter IN (q1, q2, q3, q4)
) AS unpvt;
```

## Crosstab con tablefunc (PostgreSQL)

```sql
-- Requiere: CREATE EXTENSION IF NOT EXISTS tablefunc;

SELECT *
FROM crosstab(
  'SELECT department, year, revenue
   FROM department_revenue
   ORDER BY 1, 2',
  'SELECT DISTINCT year FROM department_revenue ORDER BY 1'
) AS ct (
  department TEXT,
  "2023" NUMERIC,
  "2024" NUMERIC,
  "2025" NUMERIC
);
```

[!WARNING]
`crosstab()` espera exactamente 3 columnas: `row_name`, `category`, `value`. La segunda consulta define los valores de las columnas. Las discrepancias causan errores en tiempo de ejecución.

### Crosstab con Múltiples Columnas de Valor

```sql
SELECT *
FROM crosstab(
  'SELECT department, year, revenue, expenses
   FROM department_finances
   ORDER BY 1, 2',
  'SELECT DISTINCT year FROM department_finances ORDER BY 1'
) AS ct (
  department TEXT,
  rev2023 NUMERIC, exp2023 NUMERIC,
  rev2024 NUMERIC, exp2024 NUMERIC,
  rev2025 NUMERIC, exp2025 NUMERIC
);
```

## Pivoteo Dinámico

Cuando los valores de las columnas de pivote son desconocidos al momento de escribir la consulta, usa SQL dinámico.

### Pivot Dinámico en PostgreSQL

```sql
DO $$
DECLARE
  year_list TEXT;
  query TEXT;
BEGIN
  SELECT string_agg(DISTINCT
    FORMAT('MAX(CASE WHEN year = %s THEN revenue END) AS "%s"', year, year), ', ')
  INTO year_list
  FROM department_revenue;

  query := FORMAT(
    'SELECT department, %s FROM department_revenue GROUP BY department ORDER BY department',
    year_list
  );

  EXECUTE query;
END $$;
```

### Pivot Dinámico en SQL Server

```sql
DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);

SELECT @columns = STRING_AGG(QUOTENAME(year), ',')
FROM (SELECT DISTINCT year FROM department_revenue) AS years;

SET @sql = N'
  SELECT department, ' + @columns + N'
  FROM (
    SELECT department, year, revenue
    FROM department_revenue
  ) AS src
  PIVOT (
    MAX(revenue) FOR year IN (' + @columns + N')
  ) AS pvt
  ORDER BY department;
';

EXEC sp_executesql @sql;
```

[!TIP]
El pivoteo dinámico es poderoso pero introduce riesgo de inyección SQL. Siempre sanitiza los nombres de las columnas, o usa `QUOTENAME()` (SQL Server) o `format('%I', col)` (PostgreSQL).

## Ejemplos Prácticos

### Ejemplo 1: Matriz de Asistencia

```sql
-- Largo: student, date, status (present/absent/late)
-- Pivot a: student | 2024-01-01 | 2024-01-02 | ...

SELECT *
FROM crosstab(
  'SELECT student, date, status
   FROM attendance
   ORDER BY 1, 2',
  'SELECT DISTINCT date FROM attendance ORDER BY 1'
) AS ct (
  student TEXT,
  "2024-01-01" TEXT,
  "2024-01-02" TEXT,
  "2024-01-03" TEXT
);
```

### Ejemplo 2: Matriz de Respuestas de Encuesta

```sql
-- Cada fila = encuestado, cada columna = pregunta
SELECT
  respondent_id,
  MAX(CASE WHEN question_id = 1 THEN answer END) AS q1_rating,
  MAX(CASE WHEN question_id = 2 THEN answer END) AS q2_rating,
  MAX(CASE WHEN question_id = 3 THEN answer END) AS q3_rating
FROM survey_responses
GROUP BY respondent_id;
```

### Ejemplo 3: Ingresos Mensuales por Categoría de Producto

```sql
WITH monthly AS (
  SELECT
    category,
    TO_CHAR(order_date, 'YYYY-MM') AS month,
    SUM(amount) AS revenue
  FROM orders
  GROUP BY category, TO_CHAR(order_date, 'YYYY-MM')
)
SELECT *
FROM crosstab(
  'SELECT category, month, revenue
   FROM monthly
   ORDER BY 1, 2',
  'SELECT DISTINCT month FROM monthly ORDER BY 1'
) AS ct (
  category TEXT,
  "2024-01" NUMERIC,
  "2024-02" NUMERIC,
  "2024-03" NUMERIC,
  "2024-04" NUMERIC,
  "2024-05" NUMERIC,
  "2024-06" NUMERIC
);
```

## Comparación de Rendimiento

| Método | Portabilidad | Dinámico | Velocidad | Complejidad |
|---|---|---|---|---|
| CASE + agregado | Todas las bases | Manual | Rápida | Baja |
| PIVOT nativo | SQL Server, Oracle, PG 16+ | Vía SQL dinámico | Rápida | Baja |
| crosstab() | PostgreSQL (tablefunc) | Vía SQL dinámico | Más rápida | Media |
| UNION ALL UNPIVOT | Todas las bases | N/A | Lenta en tablas anchas | Baja |

## Preguntas de Práctica

1. Convierte `students(id, subject, score)` de formato largo a ancho (una columna por materia) usando CASE.
2. ¿Cuáles son las tres columnas requeridas por `crosstab()`? ¿Por qué la entrada debe estar ordenada?
3. Escribe una consulta para unpivot `sales(product_id, jan, feb, mar, apr, may, jun)` en `(product_id, month, amount)`.
4. ¿Cómo implementarías un pivote cuando los valores de las columnas no se conocen de antemano?
5. Dada `employees(id, department, salary)`, haz un pivote para mostrar el salario promedio por departamento como columnas.
6. ¿Cuál es la diferencia entre `PIVOT` nativo y `crosstab()` en PostgreSQL?
7. Escribe una consulta de pivote dinámico para PostgreSQL que pivote por año sin codificar nombres de columnas.
8. Dada `orders(order_id, product, quantity, unit_price)`, escribe un pivote mostrando el ingreso total por producto como columnas.
9. Explica por qué `MAX()` se usa comúnmente en pivotes basados en CASE. ¿Qué sucede si omites la agregación?
10. Convierte una tabla ancha `sensor_log(sensor_id, temp_1h, temp_2h, ..., temp_24h)` a formato largo con `(sensor_id, hour, temperature)`.
