---
title: "INNER JOINs y Equi-Joins"
description: "Domina INNER JOIN, equi-joins, unión de 3+ tablas, alias de tabla y natural joins en SQL"
order: 1
duration: "45 minutos"
difficulty: "intermedio"
---

# INNER JOINs y Equi-Joins

Las bases de datos relacionales almacenan datos en múltiples tablas. Los JOINs te permiten reunir esos datos. El INNER JOIN es el tipo de unión más común y fundamental.

## Fundamentos de INNER JOIN

Un INNER JOIN devuelve filas donde la condición de unión coincide — las filas que no coinciden se descartan de ambos lados.

```sql
SELECT *
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id;
```

| employees |   | departments |
|-----------|-------|-------------|
| 1 | Alice | 10 |  | 10 | Engineering |
| 2 | Bob   | 20 |  | 20 | Marketing   |
| 3 | Carol | 30 |  | 30 | Finance     |
| 4 | Dave  | 40 |  |  |  |

Resultado: filas 1-3 coinciden; Dave (dept 40) y Finance (sin empleados) se excluyen.

> [!NOTE]
> `INNER JOIN` y `JOIN` son sinónimos en SQL. Usa el que prefieras, pero `INNER JOIN` es más explícito.

## Equi-Joins

Un equi-join usa igualdad (`=`) en la cláusula ON. Este es el patrón de unión más común.

```sql
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id;
```

Los equi-joins mapean claves foráneas a claves primarias. Los nombres de las columnas no necesitan coincidir — solo los valores.

```sql
-- Diferentes nombres de columna, mismos valores
SELECT o.order_id, c.name
FROM orders o
INNER JOIN customers c
    ON o.customer_id = c.id;
```

## Alias de Tabla

Los alias de tabla acortan consultas y desambiguan referencias a columnas.

```sql
SELECT e.name AS employee_name,
       d.name AS department_name,
       l.city
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id
INNER JOIN locations l ON d.location_id = l.id;
```

| Alias | Tabla Completa |
|-------|----------------|
| `e` | employees |
| `d` | departments |
| `l` | locations |

> [!WARNING]
> Usa siempre alias significativos (`e`, `d`, `l`) en lugar de `a`, `b`, `c`. Tu yo del futuro te lo agradecerá.

## Uniendo 3+ Tablas

No hay límite en el número de JOINs en una consulta, pero cada unión adicional reduce el rendimiento.

```sql
SELECT
    e.first_name,
    e.last_name,
    d.department_name,
    p.project_name,
    t.task_description
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id
INNER JOIN projects p ON d.dept_id = p.dept_id
INNER JOIN tasks t ON p.project_id = t.project_id
WHERE e.hire_date >= '2023-01-01';
```

Esta consulta comienza con employees, filtra por fecha de contratación y luego une hacia afuera — el filtro WHERE ocurre conceptualmente antes de la proyección final, pero el optimizador de la base de datos reordena estos pasos.

> [!NOTE]
> El orden de los JOINs en tu consulta no garantiza el orden de ejecución. Los optimizadores modernos reorganizan las uniones basándose en estadísticas, recuentos de filas e índices disponibles.

## Uniendo una Tabla a Sí Misma (Self-Join mediante INNER JOIN)

Un self-join une una tabla a sí misma. *Debes* usar alias.

```sql
-- Encontrar pares empleado-gerente
SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
INNER JOIN employees m
    ON e.manager_id = m.employee_id;
```

Los self-joins son útiles para datos jerárquicos (organigramas, categorías, comentarios enhebrados) y para encontrar filas relacionadas en la misma tabla.

## Natural Joins

Un NATURAL JOIN automáticamente une columnas con el mismo nombre en ambas tablas.

```sql
-- Ambas tablas tienen 'department_id'
SELECT *
FROM employees
NATURAL JOIN departments;
```

| Pros | Contras |
|------|---------|
| Menos escritura | Implícito — puede romperse cuando el esquema cambia |
| Limpio para esquemas bien nombrados | Difícil de depurar coincidencias no intencionadas |

> [!WARNING]
> Muchas guías de estilo SQL prohíben NATURAL JOIN porque oculta la condición de unión. Prefiere `INNER JOIN ... ON` explícito en código de producción.

## Non-Equi Joins

Aunque raro, INNER JOIN funciona con cualquier condición, no solo igualdad.

```sql
-- Encontrar empleados cuyo salario está dentro del rango presupuestario del departamento
SELECT e.name, e.salary, d.department_name
FROM employees e
INNER JOIN departments d
    ON e.dept_id = d.dept_id
    AND e.salary BETWEEN d.budget_min AND d.budget_max;
```

```sql
-- Encontrar pedidos realizados dentro de un período promocional
SELECT o.order_id, o.order_date, p.promo_name
FROM orders o
INNER JOIN promotions p
    ON o.order_date BETWEEN p.start_date AND p.end_date;
```

## Consideraciones de Rendimiento de Join

| Factor | Impacto |
|--------|---------|
| Columnas de unión indexadas | Dramáticamente más rápido |
| Menos filas unidas | Menor memoria y CPU |
| Cláusulas WHERE selectivas | Reduce filas antes de la unión |
| Índices compuestos | Ayudan uniones de múltiples columnas |

```sql
-- Creando índices para acelerar uniones
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_dept_id ON departments(department_id);
```

## Ejemplo Real: Consulta de Dashboard de Ventas

```sql
SELECT
    c.name AS customer,
    p.product_name,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price AS line_total,
    o.order_date,
    s.full_name AS sales_rep
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
INNER JOIN employees s ON o.sales_rep_id = s.employee_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY o.order_date DESC, c.name;
```

> [!SUCCESS]
> Piensa en INNER JOIN como un filtro en ambas tablas — solo sobreviven las filas que coinciden. Cada fila en el resultado tiene garantizado tener una pareja en ambos lados.

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `INNER JOIN` y `JOIN` en SQL?
2. Escribe un INNER JOIN que devuelva nombres de empleados y sus nombres de departamento desde `employees` (dept_id) y `departments` (id, name).
3. ¿Qué es un equi-join? ¿Se puede usar INNER JOIN con condiciones de no igualdad?
4. Escribe una consulta que una 4 tablas: `customers`, `orders`, `order_items` y `products`. Devuelve nombre del cliente, fecha del pedido, nombre del producto y cantidad.
5. ¿Por qué necesitas alias de tabla al unir una tabla consigo misma?
6. ¿Qué es un NATURAL JOIN y cuáles son sus desventajas?
7. Escribe un self-join que encuentre pares de empleados que trabajan en el mismo departamento (pista: usa `a.department_id = b.department_id` y `a.id < b.id`).
8. ¿Cómo unirías dos tablas donde la relación está basada en fechas (ej.: una transacción ocurrió durante un período de campaña)?
9. Explica qué sucede con las filas que no coinciden en un INNER JOIN.
10. Escribe una consulta que una `students`, `enrollments` y `courses` para mostrar los nombres de los cursos en los que cada estudiante está matriculado. Usa alias de tabla.
