---
title: "INSERT, UPDATE, DELETE — Manipulación de Datos"
description: "Aprende INSERT INTO, UPDATE SET, DELETE FROM, TRUNCATE y una introducción a transacciones"
order: 5
duration: "20-30 minutos"
difficulty: "beginner"
---

# INSERT, UPDATE, DELETE — Manipulación de Datos

Leer datos es útil, pero también necesitas crear, modificar y eliminarlos. Estas operaciones se llaman **lenguaje de manipulación de datos (DML)** y forman la columna vertebral de cualquier aplicación.

## INSERT INTO — Añadiendo Nuevas Filas

### Insertar una Sola Fila

```sql
INSERT INTO users (name, email, age)
VALUES ('Alice', 'alice@example.com', 30);
```

La lista de columnas es opcional pero recomendada:

```sql
-- Sin lista de columnas (frágil, dependiente de posición)
INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', 30);
```

> [!WARNING]
> Omitir la lista de columnas requiere conocer el orden exacto de las columnas en la tabla. Si el esquema cambia, tu INSERT se rompe. Siempre especifica las columnas.

### Insertar Múltiples Filas

```sql
INSERT INTO users (name, email, age)
VALUES
    ('Bob', 'bob@example.com', 25),
    ('Carol', 'carol@example.com', 28),
    ('David', 'david@example.com', 35);
```

### Insertar desde una Consulta

```sql
INSERT INTO archived_users (name, email, age)
SELECT name, email, age
FROM users
WHERE age > 60;
```

> [!SUCCESS]
> `INSERT INTO ... SELECT` es poderoso para copiar, archivar y transformar datos entre tablas. La cantidad y los tipos de columnas deben coincidir.

## UPDATE SET — Modificando Filas Existentes

### Actualización Básica

```sql
UPDATE users
SET age = 31
WHERE name = 'Alice';
```

Incluye siempre una cláusula `WHERE` a menos que pretendas actualizar todas las filas:

```sql
-- Dale a todos un aumento del 10%
UPDATE employees
SET salary = salary * 1.10;
```

> [!WARNING]
> Un `WHERE` faltante en un UPDATE modifica **todas las filas** de la tabla. Siempre verifica tu cláusula WHERE antes de ejecutar.

### Actualizar Múltiples Columnas

```sql
UPDATE users
SET
    name = 'Alice Johnson',
    email = 'alice.johnson@example.com',
    age = 31
WHERE id = 1;
```

### Actualizar con Expresiones

```sql
UPDATE products
SET
    price = price * 1.05,
    updated_at = CURRENT_TIMESTAMP
WHERE category = 'Electronics';
```

## DELETE FROM — Eliminando Filas

### Eliminación Básica

```sql
DELETE FROM users WHERE id = 5;
```

### Eliminar con Condiciones

```sql
DELETE FROM orders
WHERE status = 'cancelled' AND order_date < '2023-01-01';
```

> [!WARNING]
> Un `WHERE` faltante en DELETE elimina **todas las filas**. La estructura de la tabla permanece, pero los datos desaparecen (a menos que tengas una transacción).

### DELETE vs TRUNCATE

| Característica | DELETE | TRUNCATE |
|----------------|--------|----------|
| Puede usar WHERE | Sí | No |
| Elimina filas | Sí | Sí |
| Reinicia auto-incremento | No | Sí |
| Velocidad | Más lento (fila por fila) | Rápido (desasigna páginas) |
| Puede deshacer | Sí (con transacción) | Sí (con transacción) |
| Dispara triggers | Sí | No |

```sql
-- Elimina todas las filas, mantiene la estructura de la tabla
TRUNCATE TABLE temp_logs;
```

> [!NOTE]
> `TRUNCATE` es DDL (no DML) en algunas bases de datos. No se puede usar con cláusula WHERE y generalmente es más rápido porque no escanea filas individualmente.

## Introducción a Transacciones

Una **transacción** agrupa múltiples operaciones en una sola unidad que **confirma** (todas exitosas) o **revierte** (todas deshechas).

### Por qué las Transacciones son Importantes

Imagina una transferencia bancaria:

```sql
-- Sin transacciones, si el paso 2 falla, el dinero desaparece
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- ¡Crash!
```

### Usando Transacciones

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Si todo está bien:
COMMIT;

-- Si algo salió mal:
ROLLBACK;
```

### Propiedades ACID

| Propiedad | Significado |
|-----------|-------------|
| **Atomicidad** | Todo o nada |
| **Consistencia** | Base de datos se mantiene válida |
| **Aislamiento** | Transacciones concurrentes no interfieren |
| **Durabilidad** | Datos confirmados sobreviven a fallos |

> [!SUCCESS]
> Toda instrucción SQL individual se ejecuta dentro de una transacción implícita (modo auto-commit). Las transacciones explícitas se vuelven esenciales cuando actualizas dos o más tablas en una sola operación lógica.

## Caso de Uso Real: Registro de Usuario

```sql
BEGIN TRANSACTION;

-- 1. Crear la cuenta de usuario
INSERT INTO users (name, email, password_hash)
VALUES ('Jane', 'jane@example.com', 'hashed_pw_here');

-- 2. Crear un perfil predeterminado
INSERT INTO profiles (user_id, display_name, avatar_url)
VALUES (LAST_INSERT_ROWID(), 'Jane', '/avatars/default.png');

-- 3. Añadir email de bienvenida a la cola
INSERT INTO email_queue (recipient, subject, body)
VALUES ('jane@example.com', '¡Bienvenido!', 'Gracias por unirte...');

COMMIT;
```

> [!WARNING]
> `LAST_INSERT_ROWID()` (MySQL/SQLite) o `RETURNING id` (PostgreSQL) recupera el ID generado automáticamente. Verifica la sintaxis de tu base de datos.

## Caso de Uso Real: Limpieza de Datos Antiguos

```sql
-- Archiva pedidos mayores de 1 año, luego elimínalos
BEGIN TRANSACTION;

INSERT INTO orders_archive (id, customer_id, total, order_date)
SELECT id, customer_id, total, order_date
FROM orders
WHERE order_date < DATE('now', '-1 year');

DELETE FROM orders
WHERE order_date < DATE('now', '-1 year');

COMMIT;
```

## Preguntas de Práctica

Dada `employees(id, name, department, salary)`:

1. Escribe una instrucción INSERT para añadir un nuevo empleado llamado 'Eve' en 'Engineering' con salario 85000.
2. Escribe un UPDATE para dar a todos los empleados en 'Sales' un aumento del 15%.
3. ¿Cuál es la diferencia entre DELETE y TRUNCATE?
4. Escribe una instrucción DELETE para eliminar empleados con salario menor a 30000.
5. ¿Qué sucede si ejecutas UPDATE sin una cláusula WHERE?
6. Escribe una sola instrucción INSERT que añada tres nuevos empleados a la vez.
7. ¿Qué hace `BEGIN TRANSACTION`? ¿Por qué es importante para una transferencia bancaria?
8. Escribe un INSERT que copie todos los empleados de 'employees' a 'employees_backup'.
9. Después de eliminar todas las filas de una tabla con DELETE, ¿se reinicia el contador auto-incremento? ¿Y con TRUNCATE?
10. Escribe una transacción que inserte un nuevo departamento 'AI' y mueva todos los empleados de 'Engineering' a él.
