---
title: "Spark SQL Avanzado"
description: "Domina técnicas avanzadas de SQL: funciones ventana, subconsultas, hints de difusión, agregaciones complejas y optimización de consultas"
order: 9
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Spark SQL Avanzado

Spark SQL ofrece todo el poder de SQL ANSI con integración de optimizador. Esta lección cubre funciones ventana, subconsultas, hints de consulta y patrones avanzados para análisis de datos.

## Funciones Ventana

Las funciones ventana realizan cálculos a través de filas relacionadas con la fila actual sin colapsar el conjunto de resultados.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("AdvancedSparkSQL") \
    .master("local[*]") \
    .getOrCreate()

data = [
    ("Alice", "Engineering", "NY", 120000, "2024-01-15"),
    ("Bob", "Design", "SF", 90000, "2024-02-20"),
    ("Charlie", "Engineering", "NY", 150000, "2024-01-10"),
    ("Diana", "Marketing", "SF", 80000, "2024-03-05"),
    ("Eve", "Engineering", "NY", 135000, "2024-02-01"),
    ("Frank", "Design", "LA", 95000, "2024-01-20"),
    ("Grace", "Marketing", "NY", 110000, "2024-02-15"),
    ("Henry", "Engineering", "LA", 125000, "2024-03-01")
]

df = spark.createDataFrame(data, ["name", "dept", "city", "salary", "start_date"])
df.createOrReplaceTempView("employees")
```

### Funciones de Ranking

```python
# RANK, DENSE_RANK, ROW_NUMBER
ranking = spark.sql("""
    SELECT name, dept, salary,
           ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) as row_num,
           RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rank,
           DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as dense_rank,
           NTILE(4) OVER (PARTITION BY dept ORDER BY salary DESC) as quartile
    FROM employees
""")
ranking.show()
```

| Función | Comportamiento | Manejo de Duplicados |
|---|---|---|
| `ROW_NUMBER()` | Número secuencial, sin empates | Números diferentes para valores iguales |
| `RANK()` | Mismo rango para valores iguales, con saltos | 1, 2, 2, 4 |
| `DENSE_RANK()` | Mismo rango para valores iguales, sin saltos | 1, 2, 2, 3 |
| `NTILE(n)` | Divide en n buckets | Distribución uniforme |

> [!SUCCESS]
> `ROW_NUMBER()` es ideal para desduplicación (conservar la primera ocurrencia). `RANK()` y `DENSE_RANK()` son mejores para consultas tipo ranking donde los empates importan.

### Funciones Ventana de Agregación

```python
# Totales acumulados y medias móviles
aggregate_window = spark.sql("""
    SELECT name, dept, salary, start_date,
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date) as running_total,
           AVG(salary) OVER (PARTITION BY dept ORDER BY start_date 
                             ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) as moving_avg_2,
           MAX(salary) OVER (PARTITION BY dept) as dept_max,
           MIN(salary) OVER (PARTITION BY dept) as dept_min,
           salary - AVG(salary) OVER (PARTITION BY dept) as diff_from_avg
    FROM employees
    ORDER BY dept, start_date
""")
aggregate_window.show()
```

### Especificaciones de Marco de Ventana

```python
# Diferentes tipos de marco
frames = spark.sql("""
    SELECT name, dept, salary, start_date,
           -- Predeterminado: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date) as default_frame,
           -- ROWS: filas físicas
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date
                             ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) as sliding_window,
           SUM(salary) OVER (PARTITION BY dept ORDER BY start_date
                             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as whole_partition,
           -- RANGE: filas lógicas por valor
           SUM(salary) OVER (PARTITION BY dept ORDER BY salary
                             RANGE BETWEEN 10000 PRECEDING AND CURRENT ROW) as within_range
    FROM employees
    ORDER BY dept, start_date
""")
frames.show()
```

> [!NOTE]
> `ROWS` opera con desplazamientos físicos de filas. `RANGE` opera con rangos de valores. `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` incluye la fila actual más una antes y una después. `RANGE BETWEEN 1000 PRECEDING AND CURRENT ROW` incluye todas las filas cuyo valor está dentro de 1000 del valor de la fila actual.

## Subconsultas

### Subconsultas Correlacionadas

```python
# Empleados que ganan más que el promedio del departamento
correlated = spark.sql("""
    SELECT e1.name, e1.dept, e1.salary
    FROM employees e1
    WHERE e1.salary > (
        SELECT AVG(e2.salary)
        FROM employees e2
        WHERE e2.dept = e1.dept
    )
    ORDER BY salary DESC
""")
correlated.show()

# Subconsulta EXISTS
exists_query = spark.sql("""
    SELECT DISTINCT dept
    FROM employees e1
    WHERE EXISTS (
        SELECT 1 FROM employees e2
        WHERE e2.dept = e1.dept
        AND e2.salary > 120000
    )
""")
exists_query.show()

# NOT EXISTS (encontrar departamentos sin empleados de altos ingresos)
not_exists = spark.sql("""
    SELECT DISTINCT dept
    FROM employees e1
    WHERE NOT EXISTS (
        SELECT 1 FROM employees e2
        WHERE e2.dept = e1.dept AND e2.salary > 130000
    )
""")
not_exists.show()
```

### Subconsultas Escalares

```python
# Subconsulta en SELECT
scalar = spark.sql("""
    SELECT name, salary,
           salary / (SELECT AVG(salary) FROM employees) as ratio_to_overall,
           salary / (SELECT AVG(salary) FROM employees 
                     WHERE dept = e.dept) as ratio_to_dept
    FROM employees e
""")
scalar.show()

# Subconsulta en WHERE con IN
in_subquery = spark.sql("""
    SELECT name, dept, salary
    FROM employees
    WHERE dept IN (
        SELECT dept
        FROM employees
        GROUP BY dept
        HAVING AVG(salary) > 100000
    )
""")
in_subquery.show()
```

> [!WARNING]
> Las subconsultas correlacionadas pueden ser lentas en conjuntos de datos grandes porque pueden ejecutarse por fila. El optimizador de Spark a menudo las reescribe como joins. Verifica con `explain()`.

## Hints de Consulta

### Hints de Difusión

```python
# Forzar broadcast hash join
broadcast_hint = spark.sql("""
    SELECT /*+ BROADCAST(small) */
           l.*, s.description
    FROM large_table l
    JOIN small_table s ON l.key = s.key
""")

# Múltiples hints de difusión
broadcast_multi = spark.sql("""
    SELECT /*+ BROADCAST(s1, s2) */
           l.*, s1.desc1, s2.desc2
    FROM large l
    JOIN small1 s1 ON l.key1 = s1.key
    JOIN small2 s2 ON l.key2 = s2.key
""")
```

### Otros Hints de Consulta

```python
# Hint de repartición
repartition_hint = spark.sql("""
    SELECT /*+ REPARTITION(100) */
           *
    FROM large_table
""")

# Hint de coalescencia
coalesce_hint = spark.sql("""
    SELECT /*+ COALESCE(10) */
           *
    FROM large_table
""")

# Hint de shuffle hash join
shuffle_hint = spark.sql("""
    SELECT /*+ SHUFFLE_HASH(large) */
           l.*, s.*
    FROM large_table l
    JOIN small_table s ON l.key = s.key
""")

# Hint de merge join
merge_hint = spark.sql("""
    SELECT /*+ MERGE(large, big) */
           *
    FROM large_table l
    JOIN big_table b ON l.key = b.key
""")
```

> [!NOTE]
> Los hints son de asesoramiento, no obligatorios. El optimizador de Spark puede ignorarlos si determina un mejor plan. Usa `explain()` para verificar que el hint se aplicó.

## Patrones de Agregación Compleja

```python
# Agregaciones acumulativas con ventanas
cumulative = spark.sql("""
    SELECT dept,
           salary,
           SUM(salary) OVER (PARTITION BY dept ORDER BY salary
                             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total,
           salary - LAG(salary, 1, 0) OVER (PARTITION BY dept ORDER BY salary) as diff_from_prev,
           salary - LEAD(salary, 1, 0) OVER (PARTITION BY dept ORDER BY salary) as diff_to_next,
           FIRST_VALUE(salary) OVER (PARTITION BY dept ORDER BY salary) as first_in_dept,
           LAST_VALUE(salary) OVER (PARTITION BY dept ORDER BY salary
                                    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_in_dept
    FROM employees
    ORDER BY dept, salary
""")
cumulative.show()

# Agregación condicional con cláusula FILTER
conditional = spark.sql("""
    SELECT dept,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE salary > 120000) as high_earners,
           AVG(salary) FILTER (WHERE city = 'NY') as ny_avg_salary,
           AVG(salary) FILTER (WHERE city = 'SF') as sf_avg_salary
    FROM employees
    GROUP BY dept
""")
conditional.show()
```

## Gestión de Vistas y Tablas

```python
# Vista temporal
df.createOrReplaceTempView("employees")
spark.sql("SELECT * FROM employees").show()

# Vista temporal global (visible entre sesiones)
df.createGlobalTempView("global_employees")
spark.sql("SELECT * FROM global_temp.global_employees").show()

# Tabla Hive persistente (requiere soporte Hive)
spark.sql("""
    CREATE TABLE IF NOT EXISTS analytics.employees
    USING parquet
    PARTITIONED BY (dept)
    AS SELECT * FROM employees
""")

# Describir vista
spark.sql("DESCRIBE employees").show()
spark.sql("SHOW TABLES").show()
```

## Optimización de Rendimiento con SQL

```python
# Verificar plan de consulta
spark.sql("SELECT * FROM employees WHERE salary > 100000").explain(True)

# Cachear tablas populares
spark.sql("CACHE TABLE employees")
spark.sql("CACHE TABLE departments")

# Descachear cuando termines
spark.sql("UNCACHE TABLE employees")

# Establecer configuraciones de sesión
spark.sql("SET spark.sql.adaptive.enabled=true")
spark.sql("SET spark.sql.shuffle.partitions=50")
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `ROW_NUMBER()`, `RANK()` y `DENSE_RANK()`?
2. ¿Cómo calculas una media móvil de 7 días usando funciones ventana?
3. ¿Cuál es la diferencia entre `ROWS` y `RANGE` en un marco de ventana?
4. ¿En qué se diferencia una subconsulta correlacionada de una subconsulta regular?
5. ¿Qué hace el hint `/*+ BROADCAST(t) */`?
6. ¿Cómo encuentras los 3 empleados mejor pagados por departamento?
7. ¿Para qué se usa `NTILE(10)`?
8. ¿Cómo calculas un total acumulado con una función ventana?
9. ¿Cuándo usarías `LAST_VALUE()` con `UNBOUNDED FOLLOWING`?
10. ¿Cómo verificas si el optimizador aplicó tu hint?
