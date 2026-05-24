---
title: "CTEs Recursivas"
description: "Domina las Common Table Expressions recursivas: miembro ancla y recursivo, recorrido de jerarquías, recorrido de grafos, generación de fechas y detección de ciclos"
order: 4
duration: "90 minutos"
difficulty: advanced
---

# CTEs Recursivas

## ¿Qué es una CTE Recursiva?

Una CTE recursiva se referencia a sí misma. Consta de dos partes unidas por `UNION ALL`:

1. **Miembro ancla**: El conjunto de resultados base (no recursivo).
2. **Miembro recursivo**: Referencia la CTE por nombre, alimentando filas de vuelta a la siguiente iteración.

```sql
WITH RECURSIVE cte_name AS (
    -- Miembro ancla
    SELECT ...
    UNION ALL
    -- Miembro recursivo
    SELECT ...
    FROM cte_name
    WHERE ...
)
SELECT * FROM cte_name;
```

[!WARNING]
Sin una condición de terminación en la cláusula `WHERE`, las CTEs recursivas entran en bucle infinito. La mayoría de las bases de datos tienen una configuración `max_recursion_depth` o `max_recursive_iterations` (ej: `max_recursive_CTE_iterations` de PostgreSQL).

## Ejemplo Simple: Serie Numérica

```sql
WITH RECURSIVE numbers AS (
    SELECT 1 AS n                     -- ancla
    UNION ALL
    SELECT n + 1                      -- recursivo
    FROM numbers
    WHERE n < 100                     -- terminación
)
SELECT n FROM numbers;
```

Esto produce los enteros del 1 al 100.

## Flujo de Ejecución

```
Iteración 0: ancla → {1}
Iteración 1: recursivo en {1} → {2}
Iteración 2: recursivo en {2} → {3}
...
Iteración 99: recursivo en {99} → {100}
Iteración 100: WHERE n < 100 falla → para
Resultado: UNION ALL de todas iteraciones → {1, 2, ..., 100}
```

[!NOTE]
Cada iteración solo ve las filas producidas por la iteración **anterior**. El conjunto de resultados acumulados crece con cada pasada.

## Recorrido de Jerarquía: Organigrama

```sql
WITH RECURSIVE org_tree AS (
    -- Ancla: gerentes de nivel superior (sin gerente)
    SELECT
        employee_id,
        employee_name,
        manager_id,
        0 AS level,
        employee_name::TEXT AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursivo: subordinados directos
    SELECT
        e.employee_id,
        e.employee_name,
        e.manager_id,
        ot.level + 1,
        ot.path || ' → ' || e.employee_name
    FROM employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT * FROM org_tree
ORDER BY level, employee_name;
```

| level | employee_name | path |
|---|---|---|
| 0 | CEO | CEO |
| 1 | CTO | CEO → CTO |
| 1 | CFO | CEO → CFO |
| 2 | Eng Director | CEO → CTO → Eng Director |
| 3 | Sr Engineer | CEO → CTO → Eng Director → Sr Engineer |

## Recorrido de Jerarquía: Árbol de Categorías

```sql
WITH RECURSIVE category_tree AS (
    SELECT
        category_id,
        category_name,
        parent_id,
        category_name::TEXT AS full_path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT
        c.category_id,
        c.category_name,
        c.parent_id,
        ct.full_path || ' > ' || c.category_name
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.category_id
)
SELECT * FROM category_tree
ORDER BY full_path;
```

### Encontrar Todos los Descendientes

```sql
WITH RECURSIVE descendants AS (
    SELECT category_id, category_name, parent_id
    FROM categories
    WHERE parent_id = 5  -- comenzar desde categoría 5

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_id
    FROM categories c
    INNER JOIN descendants d ON c.parent_id = d.category_id
)
SELECT * FROM descendants;
```

### Encontrar Todos los Ancestros

```sql
WITH RECURSIVE ancestors AS (
    SELECT category_id, category_name, parent_id, 0 AS depth
    FROM categories
    WHERE category_id = 42  -- comenzar desde la hoja

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_id, a.depth + 1
    FROM categories c
    INNER JOIN ancestors a ON c.category_id = a.parent_id
)
SELECT * FROM ancestors ORDER BY depth;
```

## Recorrido de Grafos

### Amigo-de-un-Amigo (Grafo Social)

```sql
WITH RECURSIVE friend_network AS (
    SELECT
        user_id,
        0 AS degree,
        ARRAY[user_id] AS visited
    FROM users
    WHERE user_id = 1

    UNION ALL

    SELECT
        f.friend_id,
        fn.degree + 1,
        fn.visited || f.friend_id
    FROM friendships f
    INNER JOIN friend_network fn ON f.user_id = fn.user_id
    WHERE NOT f.friend_id = ANY(fn.visited)
    AND fn.degree < 3
)
SELECT DISTINCT user_id, degree
FROM friend_network
ORDER BY degree, user_id;
```

### Detección de Ciclos

```sql
WITH RECURSIVE graph_traversal AS (
    SELECT
        node_id,
        ARRAY[node_id] AS path,
        FALSE AS is_cycle
    FROM graph_nodes
    WHERE node_id = 'A'

    UNION ALL

    SELECT
        e.to_node,
        gt.path || e.to_node,
        e.to_node = ANY(gt.path)
    FROM graph_edges e
    INNER JOIN graph_traversal gt ON e.from_node = gt.node_id
    WHERE NOT gt.is_cycle
)
SELECT * FROM graph_traversal;
```

[!IMPORTANT]
Siempre rastrea nodos visitados en recorridos de grafos para evitar bucles infinitos. Usa una columna de array y `= ANY()` para verificar el estado de visita.

## Generación de Series de Fechas

```sql
-- Generar todas las fechas de un año
WITH RECURSIVE dates AS (
    SELECT '2024-01-01'::DATE AS dt
    UNION ALL
    SELECT dt + 1
    FROM dates
    WHERE dt < '2024-12-31'
)
SELECT dt FROM dates;

-- Generar solo días hábiles
WITH RECURSIVE business_days AS (
    SELECT '2024-01-01'::DATE AS dt
    UNION ALL
    SELECT dt + 1
    FROM business_days
    WHERE dt < '2024-12-31'
      AND EXTRACT(DOW FROM dt + 1) NOT IN (0, 6)  -- saltar Dom/Sáb
)
SELECT dt FROM business_days;
```

### Rellenar Fechas Faltantes (Relleno de Fechas Dispersas)

```sql
WITH RECURSIVE date_range AS (
    SELECT MIN(order_date) AS dt FROM orders
    UNION ALL
    SELECT dt + 1 FROM date_range
    WHERE dt < (SELECT MAX(order_date) FROM orders)
)
SELECT
    dr.dt,
    COALESCE(SUM(o.amount), 0) AS daily_revenue
FROM date_range dr
LEFT JOIN orders o ON o.order_date = dr.dt
GROUP BY dr.dt
ORDER BY dr.dt;
```

## Avanzado: Lista de Materiales (BOM)

```sql
WITH RECURSIVE bom AS (
    SELECT
        part_id,
        part_name,
        1 AS quantity,
        0 AS level
    FROM parts
    WHERE part_id = 'A'  -- ensamblaje de nivel superior

    UNION ALL

    SELECT
        p.part_id,
        p.part_name,
        b.quantity * bp.quantity,
        b.level + 1
    FROM bom b
    INNER JOIN bom_parts bp ON b.part_id = bp.assembly_id
    INNER JOIN parts p ON bp.component_id = p.part_id
)
SELECT * FROM bom ORDER BY level, part_name;
```

## Avanzado: Enumeración de Caminos

```sql
-- Encontrar todas las rutas posibles entre dos ciudades
WITH RECURSIVE routes AS (
    SELECT
        origin,
        destination,
        ARRAY[origin, destination] AS path,
        distance
    FROM flights
    WHERE origin = 'JFK'

    UNION ALL

    SELECT
        r.origin,
        f.destination,
        r.path || f.destination,
        r.distance + f.distance
    FROM routes r
    INNER JOIN flights f ON r.destination = f.origin
    WHERE NOT f.destination = ANY(r.path)
      AND r.distance < 5000  -- podar rutas largas
)
SELECT * FROM routes
WHERE destination = 'LAX'
ORDER BY distance;
```

## Consideraciones de Rendimiento

| Factor | Impacto | Mitigación |
|---|---|---|
| Profundidad de iteración | Crecimiento lineal | Definir `max_recursive_iterations` |
| Conjuntos intermedios grandes | Presión de memoria | Empujar filtros dentro de la recursión |
| Detección de ciclos | Sobrecarga de comparación de arrays | Usar conjuntos visitados basados en hash cuando esté disponible |
| Índice en columnas de unión | Crítico para rendimiento | Indexar columnas FK usadas en uniones recursivas |

[!TIP]
Para jerarquías profundas (50+ niveles), considera usar conjuntos anidados o rutas materializadas para cargas de trabajo con muchas lecturas en lugar de CTEs recursivas.

## Preguntas de Práctica

1. Escribe una CTE recursiva que genere todos los enteros del 1 al 1000.
2. Dada `employees(id, name, manager_id)`, escribe una consulta para mostrar la cadena de reporte completa desde el CEO hasta cada empleado.
3. ¿Cómo termina una CTE recursiva? ¿Qué sucede si omites la cláusula `WHERE` en el miembro recursivo?
4. Escribe una CTE recursiva para generar una lista de todas las fechas de febrero de 2024.
5. Dada `categories(id, name, parent_id)`, escribe una consulta para encontrar todos los ancestros de la categoría con id 50.
6. ¿Cuál es la diferencia entre `UNION ALL` y `UNION` en una CTE recursiva? ¿Se puede usar `UNION`?
7. Escribe una CTE recursiva para recorrer un grafo social hasta 4 grados de separación desde el usuario 1, evitando ciclos.
8. Dada `parts(id, name)` y `bom(assembly_id, component_id, quantity)`, escribe una consulta para calcular la cantidad total de cada materia prima necesaria para construir una unidad del producto 'X'.
9. Escribe una consulta que rellene fechas faltantes para una tabla con huecos: `sales(date, amount)` debe tener una fila para cada fecha en el rango.
10. Explica cómo detectarías y prevenirías bucles infinitos en una CTE recursiva que recorre un grafo dirigido con ciclos.
