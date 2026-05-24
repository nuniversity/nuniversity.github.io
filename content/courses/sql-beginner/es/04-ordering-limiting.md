---
title: "Ordenando, Limitando y Renombrando Resultados"
description: "Domina ORDER BY, LIMIT, OFFSET, DISTINCT y alias AS para controlar la presentación de los resultados"
order: 4
duration: "20-30 minutos"
difficulty: "beginner"
---

# Ordenando, Limitando y Renombrando Resultados

Los resultados brutos de consultas rara vez están en el orden que necesitas. Esta lección te enseña cómo ordenar, paginar, deduplicar y renombrar columnas para una salida limpia.

## ORDER BY — Ordenando Resultados

`ORDER BY` ordena el conjunto de resultados por una o más columnas.

```sql
SELECT name, salary FROM employees
ORDER BY salary ASC;   -- ascendente (predeterminado)
```

```sql
SELECT name, salary FROM employees
ORDER BY salary DESC;  -- descendente
```

| name | salary |
|------|--------|
| Bob Smith | 72000 |
| Eve Martinez | 78000 |
| Carol Chen | 88000 |
| Alice Johnson | 95000 |

### Ordenando por Múltiples Columnas

```sql
SELECT department, name, salary
FROM employees
ORDER BY department ASC, salary DESC;
```

Esto ordena alfabéticamente por departamento, luego por el salario más alto dentro de cada departamento.

> [!NOTE]
> `ASC` es el predeterminado. Solo necesitas escribir `DESC` para orden descendente.

### Ordenando por Posición de Columna

Puedes referenciar columnas por su posición en la lista SELECT (no recomendado para producción):

```sql
SELECT name, salary FROM employees ORDER BY 2 DESC;
-- Ordena por la 2ª columna (salary)
```

> [!WARNING]
> Ordenar por posición ordinal (2, 3, etc.) es frágil. Si la lista SELECT cambia, el orden de clasificación cambia silenciosamente. Usa siempre nombres de columnas.

### Ordenando con Expresiones

```sql
SELECT name, salary, salary * 1.1 AS projected_raise
FROM employees
ORDER BY projected_raise DESC;
```

## LIMIT y OFFSET — Paginación

`LIMIT` restringe cuántas filas se devuelven. `OFFSET` salta un número de filas antes de devolver los resultados.

```sql
-- Top 5 empleados con mayores salarios
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5;
```

```sql
-- 5 empleados después de saltar los primeros 5 (página 2)
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5 OFFSET 5;
```

> [!SUCCESS]
> Juntos, `LIMIT` y `OFFSET` implementan paginación. Página 1 es `LIMIT 10 OFFSET 0`, página 2 es `LIMIT 10 OFFSET 10`, etc.

### Variaciones de Sintaxis LIMIT

Diferentes bases de datos tienen sintaxis ligeramente diferentes:

| RDBMS | Sintaxis |
|-------|----------|
| PostgreSQL, SQLite | `LIMIT 10 OFFSET 5` |
| MySQL | `LIMIT 5, 10` (offset, count) |
| SQL Server | `OFFSET 5 ROWS FETCH NEXT 10 ROWS ONLY` |
| Oracle | `OFFSET 5 ROWS FETCH NEXT 10 ROWS ONLY` |

```sql
-- Estilo MySQL (offset, count)
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5, 10;  -- Salta 5, devuelve 10
```

## DISTINCT — Eliminar Duplicados

`DISTINCT` devuelve solo valores únicos para las columnas seleccionadas.

```sql
-- Lista todos los departamentos únicos
SELECT DISTINCT department FROM employees;
```

| department |
|------------|
| Engineering |
| Marketing |
| Sales |

```sql
-- Combinaciones únicas de departamento y estado
SELECT DISTINCT department, status FROM employees;
```

> [!NOTE]
> `DISTINCT` se aplica a todas las columnas seleccionadas, no solo a la primera. `SELECT DISTINCT a, b` devuelve pares únicos, no valores únicos de `a`.

### COUNT(DISTINCT ...)

```sql
SELECT COUNT(DISTINCT department) AS unique_departments
FROM employees;
```

## Alias AS

Los alias renombran columnas o tablas en el conjunto de resultados. **No** cambian el esquema subyacente.

### Alias de Columna

```sql
SELECT name AS employee_name,
       salary * 12 AS annual_salary
FROM employees;
```

| employee_name | annual_salary |
|---------------|---------------|
| Alice Johnson | 1140000 |
| Bob Smith | 864000 |

### Alias de Tabla

Los alias de tabla hacen las consultas más cortas y legibles, especialmente con uniones:

```sql
SELECT e.name, d.name AS department_name
FROM employees AS e
JOIN departments AS d ON e.department_id = d.id;
```

> [!SUCCESS]
> La palabra clave `AS` es opcional. `SELECT name employee_name` funciona, pero `AS` hace la intención explícita. Úsala.

### Alias con Espacios

Si un alias contiene espacios, escríbelo entre comillas dobles (o comillas invertidas en MySQL):

```sql
SELECT name AS "Employee Name", salary AS "Annual Salary"
FROM employees;
```

## Uniendo Todo

```sql
-- Página 3 de departamentos únicos, ordenados alfabéticamente
SELECT DISTINCT department AS dept
FROM employees
ORDER BY dept
LIMIT 5 OFFSET 10;
```

## Caso de Uso Real: Tabla de Clasificación

```sql
-- Top 10 jugadores con las puntuaciones más altas, paginado
SELECT
    username AS player,
    score,
    RANK() OVER (ORDER BY score DESC) AS rank
FROM leaderboard
ORDER BY score DESC
LIMIT 10 OFFSET 0;
```

## Caso de Uso Real: Pedidos Recientes con Paginación

```sql
-- Muestra la página 2 de los pedidos más recientes (5 por página)
SELECT
    id AS order_id,
    customer_name,
    total AS order_total,
    order_date
FROM orders
ORDER BY order_date DESC, id DESC
LIMIT 5 OFFSET 5;
```

> [!WARNING]
> `OFFSET` se vuelve lento en grandes conjuntos de datos porque la base de datos aún debe escanear y descartar filas saltadas. Para paginación profunda (página 1000+), usa paginación por clave (`WHERE id > último_id_visto LIMIT 10`).

## DISTINCT vs GROUP BY

`DISTINCT` y `GROUP BY` pueden ambos deduplicar, pero sirven para propósitos diferentes:

| Característica | DISTINCT | GROUP BY |
|----------------|----------|----------|
| Propósito | Eliminar duplicados | Agrupar filas para agregación |
| Puede usar agregados | No | Sí |
| Rendimiento | Similar (mismo plan de ejecución a menudo) | Similar |
| Legibilidad | Más limpio para dedup simple | Necesario para agregados |

```sql
-- Mismo resultado, intención diferente
SELECT DISTINCT department FROM employees;
SELECT department FROM employees GROUP BY department;
```

## Preguntas de Práctica

Dada `employees(id, name, department, salary, hire_date)`:

1. Escribe una consulta para listar todos los empleados ordenados por fecha de contratación, del más reciente primero.
2. Devuelve los 3 empleados contratados más recientemente.
3. Lista todos los departamentos únicos en orden alfabético.
4. ¿Cuál es la diferencia entre `LIMIT 5 OFFSET 5` y `LIMIT 5, 5`?
5. Escribe una consulta que devuelva nombres de empleados con alias "full_name" y sus salarios con alias "monthly_pay".
6. Muestra empleados ordenados por departamento (A-Z), luego por salario (más alto primero dentro de cada departamento).
7. Devuelve la 4ª página de empleados (10 por página).
8. ¿Cómo contarías cuántos departamentos distintos existen en la tabla employees?
9. ¿Por qué está desaconsejado ordenar por posición de columna (`ORDER BY 2`)?
10. Escribe una consulta que devuelva los 5 empleados con menores salarios.
