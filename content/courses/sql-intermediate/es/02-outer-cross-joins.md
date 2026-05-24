---
title: "OUTER JOINs y CROSS JOINs"
description: "Domina LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, self-joins y patrones anti-join"
order: 2
duration: "50 minutos"
difficulty: "intermedio"
---

# OUTER JOINs y CROSS JOINs

Mientras que INNER JOIN mantiene solo las filas que coinciden, los OUTER JOINs preservan filas de uno o ambos lados incluso cuando no hay coincidencia. Los CROSS JOINs producen todas las combinaciones posibles de filas.

## LEFT JOIN

Un LEFT JOIN preserva todas las filas de la tabla izquierda. Cuando no hay coincidencia en la derecha, las columnas de la tabla derecha son NULL.

```sql
SELECT
    d.department_name,
    e.name AS employee
FROM departments d
LEFT JOIN employees e
    ON d.department_id = e.department_id;
```

| department_name | employee |
|----------------|----------|
| Engineering    | Alice    |
| Marketing      | Bob      |
| Finance        | Carol    |
| HR             | NULL     |

El departamento HR aparece aunque no tenga empleados.

> [!NOTE]
> Algunas bases de datos usan `LEFT OUTER JOIN`. La palabra `OUTER` es opcional — `LEFT JOIN` significa lo mismo.

## RIGHT JOIN

Un RIGHT JOIN es el espejo de LEFT JOIN: todas las filas de la tabla derecha se preservan.

```sql
SELECT
    e.name AS employee,
    d.department_name
FROM employees e
RIGHT JOIN departments d
    ON e.department_id = d.department_id;
```

Esto es funcionalmente idéntico al ejemplo de LEFT JOIN anterior — solo escrito desde la otra dirección.

> [!WARNING]
> Muchos desarrolladores encuentran RIGHT JOIN confuso. Cuando sea posible, reescríbelo como LEFT JOIN intercambiando el orden de las tablas. Virtualmente todo SQL de producción usa LEFT JOIN exclusivamente.

## FULL OUTER JOIN

Un FULL OUTER JOIN preserva filas de ambas tablas. Las filas no coincidentes de cualquier lado reciben NULL para las columnas de la tabla opuesta.

```sql
SELECT
    e.name AS employee,
    d.department_name
FROM employees e
FULL OUTER JOIN departments d
    ON e.department_id = d.department_id;
```

| employee | department_name |
|----------|----------------|
| Alice    | Engineering    |
| Bob      | Marketing      |
| Carol    | Finance        |
| Dave     | NULL           |
| NULL     | HR             |

Dave no tiene departamento; HR no tiene empleados. Ambos aparecen.

```sql
-- Encontrar huérfanos en ambos lados
SELECT
    COALESCE(e.name, 'SIN EMPLEADO') AS employee,
    COALESCE(d.department_name, 'SIN DEPARTAMENTO') AS department
FROM employees e
FULL OUTER JOIN departments d
    ON e.department_id = d.department_id
WHERE e.employee_id IS NULL
   OR d.department_id IS NULL;
```

> [!NOTE]
> FULL OUTER JOIN no es soportado en MySQL (aunque puedes simularlo con UNION de LEFT y RIGHT JOINs). PostgreSQL, SQL Server, Oracle y Snowflake lo soportan nativamente.

## CROSS JOIN

Un CROSS JOIN produce el producto cartesiano — cada fila de la tabla A emparejada con cada fila de la tabla B.

```sql
SELECT
    s.size,
    c.color
FROM sizes s
CROSS JOIN colors c;
```

| size | color |
|------|-------|
| S    | Red   |
| S    | Blue  |
| M    | Red   |
| M    | Blue  |
| L    | Red   |
| L    | Blue  |

Si sizes tiene 3 filas y colors tiene 2 filas: 6 filas en el resultado.

> [!WARNING]
| CROSS JOIN Implícito | CROSS JOIN Explícito |
|---------------------|---------------------|
| `SELECT * FROM a, b` | `SELECT * FROM a CROSS JOIN b` |
| Fácil de olvidar WHERE | Intencional y claro |

Prefiere siempre `CROSS JOIN` explícito para evitar productos cartesianos accidentales.

### Uso Real de CROSS JOIN

```sql
-- Generar todas las combinaciones fecha-tamaño para informe de inventario
SELECT
    d.date,
    s.size,
    COALESCE(SUM(inv.quantity), 0) AS total_inventory
FROM (
    SELECT generate_series(
        '2024-01-01'::date,
        '2024-12-31'::date,
        '1 day'::interval
    )::date AS date
) d
CROSS JOIN sizes s
LEFT JOIN inventory inv
    ON d.date = inv.date AND s.size = inv.size
GROUP BY d.date, s.size
ORDER BY d.date, s.size;
```

## Self-Joins con OUTER JOINs

Los self-joins funcionan con OUTER JOINs para encontrar filas que carecen de relaciones.

```sql
-- Encontrar empleados que no tienen subordinados directos (gerentes sin equipo)
SELECT
    m.name AS manager,
    e.name AS direct_report
FROM employees m
LEFT JOIN employees e
    ON m.employee_id = e.manager_id
WHERE e.employee_id IS NULL;

-- Encontrar todos los gerentes y sus subordinados (incluyendo los que no tienen)
SELECT
    m.name AS manager,
    e.name AS report
FROM employees m
LEFT JOIN employees e
    ON m.employee_id = e.manager_id;
```

## Patrón Anti-Join

Un anti-join encuentra filas en una tabla que no tienen correspondencia en otra. Generalmente se hace con LEFT JOIN + IS NULL o NOT EXISTS / NOT IN.

```sql
-- Clientes que nunca han realizado un pedido (anti-join)
SELECT c.*
FROM customers c
LEFT JOIN orders o
    ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;
```

| Cliente | Tiene Pedido | Incluido |
|----------|-----------|----------|
| Alice    | 1001      | No       |
| Bob      | 1002      | No       |
| Carol    | NULL      | Sí       |

```sql
-- Mismo resultado con NOT EXISTS
SELECT c.*
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.customer_id
);
```

> [!SUCCESS]
| Método Anti-Join | Rendimiento | Legibilidad |
|------------------|-------------|-------------|
| LEFT JOIN + IS NULL | Rápido con índices | Claro para veteranos SQL |
| NOT EXISTS | Más eficiente para subconsultas correlacionadas | Revela intención |
| NOT IN | Riesgoso con NULLs | Simple pero peligroso |

NOT IN es peligroso porque devuelve cero filas si la subconsulta contiene algún NULL:

```sql
-- RIESGOSO: no devuelve nada si algún pedido tiene customer_id NULL
SELECT * FROM customers
WHERE customer_id NOT IN (SELECT customer_id FROM orders);

-- SEGURO: maneja NULLs correctamente
SELECT * FROM customers
WHERE customer_id NOT IN (
    SELECT customer_id FROM orders WHERE customer_id IS NOT NULL
);
```

## Comparación Resumen de Joins

| Tipo de Join | Filas Izquierdas | Filas Derechas | Filas Resultantes |
|-----------|-----------|------------|-----------------|
| INNER JOIN | Solo coincidentes | Solo coincidentes | coincidentes |
| LEFT JOIN | Todas | Solo coincidentes | todas izq. + coincidentes der. |
| RIGHT JOIN | Solo coincidentes | Todas | coincidentes izq. + todas der. |
| FULL OUTER JOIN | Todas | Todas | todas filas ambos lados |
| CROSS JOIN | Todas | Todas | len(I) × len(D) |

## Ejemplo Real: Catálogo de Productos con Ventas

```sql
SELECT
    p.product_id,
    p.product_name,
    c.category_name,
    COALESCE(SUM(s.quantity), 0) AS units_sold,
    COALESCE(SUM(s.revenue), 0) AS total_revenue
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
LEFT JOIN sales s ON p.product_id = s.product_id
    AND s.sale_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.product_id, p.product_name, c.category_name
ORDER BY total_revenue DESC;
```

> [!SUCCESS]
> Elige tu join según las filas que quieras mantener. INNER JOIN descarta no coincidencias. LEFT JOIN mantiene filas izquierdas. FULL OUTER JOIN lo mantiene todo. CROSS JOIN combina cada fila con todas las demás.

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre LEFT JOIN e INNER JOIN?
2. Escribe una consulta que muestre todos los departamentos y sus empleados, incluyendo departamentos con cero empleados.
3. ¿Cuándo usarías RIGHT JOIN en lugar de LEFT JOIN? ¿Cómo puedes evitar necesitar RIGHT JOIN?
4. ¿Qué devuelve FULL OUTER JOIN? Da un escenario donde sea útil.
5. Escribe un CROSS JOIN entre las tablas `colors` y `sizes`. ¿Cuál es la cardinalidad si colors tiene 5 filas y sizes tiene 4?
6. ¿Qué es un anti-join? Escribe uno usando LEFT JOIN y uno usando NOT EXISTS.
7. ¿Por qué NOT IN es peligroso al unir tablas? ¿Cómo lo corriges?
8. Escribe un self-LEFT JOIN que encuentre todas las categorías y sus subcategorías, incluyendo categorías sin subcategorías.
9. Dadas `students`, `enrollments` y `courses`, escribe una consulta mostrando todos los estudiantes y los cursos en los que están matriculados, incluyendo estudiantes sin matrículas.
10. ¿Qué sucede con las columnas de la tabla no preservada en un OUTER JOIN cuando no hay coincidencia?
