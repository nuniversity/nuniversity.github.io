---
title: "SELECT y WHERE: Consultando Datos"
description: "Domina SELECT, FROM, WHERE con operadores de comparación, AND/OR/NOT, LIKE, IN y BETWEEN"
order: 3
duration: "20-30 minutos"
difficulty: "beginner"
---

# SELECT y WHERE: Consultando Datos

La instrucción `SELECT` es el comando SQL más utilizado. Combinada con `WHERE`, se convierte en un filtro potente que extrae exactamente los datos que necesitas.

## SELECT Básico

```sql
SELECT column1, column2 FROM table_name;
```

```sql
-- Seleccionar columnas específicas
SELECT name, email FROM users;

-- Seleccionar todas las columnas
SELECT * FROM users;
```

> [!WARNING]
> Evita `SELECT *` en código de producción. Devuelve más datos de los necesarios, se rompe si el esquema cambia e impide que la base de datos use escaneos solo de índice.

## La Cláusula WHERE

`WHERE` filtra filas antes de que sean devueltas:

```sql
SELECT name, age FROM users WHERE age >= 18;
```

| name | age |
|------|-----|
| Alice | 30 |
| Bob | 25 |

## Operadores de Comparación

| Operador | Significado | Ejemplo |
|----------|-------------|---------|
| `=` | Igual | `WHERE name = 'Alice'` |
| `<>` o `!=` | Distinto | `WHERE status <> 'inactive'` |
| `>` | Mayor que | `WHERE price > 10` |
| `<` | Menor que | `WHERE age < 18` |
| `>=` | Mayor o igual | `WHERE quantity >= 0` |
| `<=` | Menor o igual | `WHERE rating <= 5` |

```sql
SELECT title, price FROM products WHERE price <= 19.99;
```

## AND, OR, NOT

Combina condiciones con operadores lógicos:

```sql
-- AND: todas las condiciones deben ser verdaderas
SELECT * FROM employees
WHERE department = 'Engineering' AND salary > 80000;

-- OR: al menos una condición debe ser verdadera
SELECT * FROM products
WHERE category = 'Electronics' OR category = 'Books';

-- NOT: niega una condición
SELECT * FROM users
WHERE NOT status = 'banned';

-- Mezclando AND/OR (usa paréntesis para claridad)
SELECT * FROM orders
WHERE (status = 'pending' OR status = 'shipped')
  AND total > 100;
```

> [!NOTE]
> `AND` se evalúa antes que `OR`. Usa siempre paréntesis para hacer tu intención clara y evitar errores sutiles.

## LIKE — Coincidencia de Patrones

`LIKE` compara strings usando dos comodines:
- `%` — coincide con cualquier secuencia de caracteres
- `_` — coincide exactamente con un carácter

```sql
-- Empieza con "A"
SELECT name FROM users WHERE name LIKE 'A%';

-- Contiene "smith" en cualquier parte
SELECT name FROM users WHERE name LIKE '%smith%';

-- Exactamente 5 caracteres
SELECT code FROM products WHERE code LIKE '_____';

-- Empieza con J, termina con n
SELECT name FROM users WHERE name LIKE 'J%n';
```

### Datos de Ejemplo: Empleados

| id | name | department | salary |
|----|------|-----------|--------|
| 1 | Alice Johnson | Engineering | 95000 |
| 2 | Bob Smith | Marketing | 72000 |
| 3 | Carol Chen | Engineering | 88000 |
| 4 | David Brown | Sales | 65000 |
| 5 | Eve Martinez | Marketing | 78000 |

```sql
-- Encuentra empleados de Engineering con salario superior a 85.000
SELECT name, salary FROM employees
WHERE department = 'Engineering' AND salary > 85000;
-- Devuelve: Alice Johnson (95000), Carol Chen (88000)
```

## IN — Coincidir con una Lista

`IN` es una abreviatura para múltiples condiciones `OR`:

```sql
-- Sin IN
SELECT * FROM products
WHERE category = 'Electronics'
   OR category = 'Books'
   OR category = 'Music';

-- Con IN (más limpio)
SELECT * FROM products
WHERE category IN ('Electronics', 'Books', 'Music');
```

También puedes usar `NOT IN`:

```sql
SELECT name FROM users
WHERE status NOT IN ('banned', 'suspended');
```

## BETWEEN — Coincidencia de Rango

`BETWEEN` es inclusivo en ambos extremos:

```sql
SELECT name, salary FROM employees
WHERE salary BETWEEN 70000 AND 90000;
-- Devuelve: Bob Smith (72000), Carol Chen (88000), Eve Martinez (78000)

-- Equivalente a:
SELECT name, salary FROM employees
WHERE salary >= 70000 AND salary <= 90000;
```

Funciona también con fechas:

```sql
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31';
```

> [!SUCCESS]
> `BETWEEN` es más limpio que `>= AND <=` para rangos inclusivos. Para rangos de fechas, recuerda que `BETWEEN` incluye la medianoche de la fecha final — usa `>= 'inicio' AND < 'fin + 1 día'` para límites exactos.

## Uniendo Todo

```sql
SELECT name, email, age
FROM users
WHERE age BETWEEN 25 AND 40
  AND email LIKE '%@gmail.com'
  AND name NOT LIKE 'Admin%';
```

## Caso de Uso Real: Consulta de Inventario de Productos

```sql
-- Encuentra productos con stock bajo, en categorías específicas,
-- y que cuesten menos de $50
SELECT product_name, category, stock, price
FROM inventory
WHERE stock < 10
  AND category IN ('Electronics', 'Accessories')
  AND price < 50
ORDER BY stock ASC;
```

> [!WARNING]
> `LIKE` con un comodín al inicio (`'%patrón'`) no puede usar índices y será lento en tablas grandes. Evítalo en millones de filas.

## Manejo de NULL

`NULL` significa **desconocido** — no es cero, ni string vacío.

```sql
-- Las comparaciones NULL requieren IS NULL, no = NULL
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM users WHERE email IS NOT NULL;

-- Esto siempre es falso:
SELECT * FROM users WHERE email = NULL;
```

> [!NOTE]
> `NULL` se propaga a través de expresiones. `NULL > 5` devuelve `NULL` (no `TRUE` o `FALSE`). `WHERE` solo mantiene filas donde la condición es `TRUE`, no `NULL`.

## Preguntas de Práctica

Dada una tabla `employees(id, name, department, salary, hire_date)`:

1. Escribe una consulta para seleccionar todos los empleados del departamento 'Sales'.
2. Encuentra empleados con salarios mayores a 60000 pero menores o iguales a 100000.
3. Encuentra empleados cuyo nombre empieza con 'M'.
4. Encuentra empleados contratados en 2023 (usa `BETWEEN`).
5. Encuentra empleados en los departamentos 'Engineering' o 'Product' con un salario de al menos 90000.
6. ¿Cuál es la diferencia entre `WHERE` y `HAVING`? (Solo predice por ahora.)
7. Encuentra empleados cuyo departamento NO es 'Marketing'.
8. Escribe una consulta usando `IN` que devuelva empleados en 'HR', 'Finance' o 'Legal'.
9. ¿Qué devuelve `SELECT * FROM products WHERE price = NULL`? ¿Por qué está mal?
10. Encuentra empleados cuyo nombre contiene exactamente 5 letras y termina con 'n'.
