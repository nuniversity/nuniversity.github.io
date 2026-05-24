---
title: "Transacciones y ACID"
description: "Domina BEGIN/COMMIT/ROLLBACK, propiedades ACID, niveles de aislamiento y manejo de deadlocks"
order: 9
duration: "50 minutos"
difficulty: "intermedio"
---

# Transacciones y ACID

Una transacción es una unidad de trabajo que debe tener éxito o fallar como un todo. Las transacciones garantizan la integridad de los datos cuando múltiples operaciones deben ocurrir atómicamente.

## BEGIN, COMMIT y ROLLBACK

```sql
-- Iniciar una transacción
BEGIN;
-- o: START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

-- Si ambas tienen éxito, persistir:
COMMIT;

-- Si algo falla, deshacer todo:
ROLLBACK;
```

> [!NOTE]
> La mayoría de las bases de datos operan en modo auto-commit por defecto — cada declaración es su propia transacción. Usa `BEGIN` para agrupar múltiples declaraciones en una transacción.

### Savepoints

Los savepoints permiten revertir parte de una transacción sin abortar todo.

```sql
BEGIN;

INSERT INTO orders (customer_id, total) VALUES (1, 250.00);
-- order_id = 101

SAVEPOINT order_created;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (101, 42, 2, 125.00);

-- Ups, producto equivocado. Revertir los items, mantener el pedido
ROLLBACK TO SAVEPOINT order_created;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (101, 15, 1, 250.00);

COMMIT;
```

| Comando | Efecto |
|---------|--------|
| `SAVEPOINT name` | Definir un punto de reversión parcial |
| `ROLLBACK TO SAVEPOINT name` | Deshacer cambios después del savepoint |
| `RELEASE SAVEPOINT name` | Mantener cambios, eliminar savepoint |

## Propiedades ACID

| Propiedad | Significado | Garantizado Por |
|----------|---------|------------|
| **A**tomicidad | Todo o nada | Registro de transacción + ROLLBACK |
| **C**onsistencia | Los datos obedecen todas las reglas | Restricciones, disparadores, código de aplicación |
| **I**slamiento | Transacciones concurrentes no interfieren | Bloqueo / MVCC |
| **D**urabilidad | Datos confirmados sobreviven a fallos | Write-ahead log (WAL) |

### Atomicidad

O todas las operaciones tienen éxito, o ninguna tiene efecto.

```sql
BEGIN;
UPDATE inventory SET quantity = quantity - 2 WHERE product_id = 1;
UPDATE orders SET status = 'shipped' WHERE order_id = 500;
-- Si el servidor se cae después del primer UPDATE pero antes de COMMIT,
-- el cambio en el inventario se revierte al reiniciar
COMMIT;
```

### Consistencia

Las restricciones, disparadores y claves foráneas imponen consistencia automáticamente.

```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    owner TEXT NOT NULL,
    balance NUMERIC NOT NULL CHECK (balance >= 0)
);

BEGIN;
UPDATE accounts SET balance = balance - 200 WHERE id = 1;
-- Si el saldo fuera negativo, la restricción CHECK lo impide
-- La transacción debe ser revertida con ROLLBACK
COMMIT;
```

### Aislamiento

El aislamiento evita que transacciones concurrentes vean cambios no confirmados entre sí.

```sql
-- Sesión 1
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- No COMMIT aún

-- Sesión 2
BEGIN;
SELECT balance FROM accounts WHERE id = 1;
-- Devuelve el saldo ANTERIOR (1000) porque la Sesión 1 no ha hecho COMMIT
-- Esto evita lecturas sucias (en el nivel READ COMMITTED)
COMMIT;
```

### Durabilidad

Una vez que COMMIT tiene éxito, los datos están seguros incluso si la energía falla inmediatamente después.

```
COMMIT → Escribir WAL → Liberar en disco → Confirmar → (fallo de energía OK)
                            ↑
                      Esto debe ocurrir antes de que COMMIT retorne
```

> [!NOTE]
> La durabilidad garantiza que las transacciones confirmadas sobrevivan a fallos. Las bases de datos usan write-ahead logging (WAL): los cambios se escriben en un registro antes de aplicarse a los archivos de datos.

## Niveles de Aislamiento

El estándar SQL define cuatro niveles de aislamiento, del más débil al más fuerte.

| Nivel | Lectura Sucia | Lectura No Repetible | Lectura Fantasma |
|-------|-----------|---------------------|--------------|
| READ UNCOMMITTED | Posible | Posible | Posible |
| READ COMMITTED | Prevenida | Posible | Posible |
| REPEATABLE READ | Prevenida | Prevenida | Posible |
| SERIALIZABLE | Prevenida | Prevenida | Prevenida |

### Lectura Sucia (Dirty Read)

Leer datos no confirmados de otra transacción.

```sql
-- Transacción A (READ UNCOMMITTED)
BEGIN;
UPDATE products SET price = 1000 WHERE id = 1;
-- Aún no confirmado

-- Transacción B (READ UNCOMMITTED)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT price FROM products WHERE id = 1;
-- Devuelve 1000 (lectura sucia — Transacción A puede hacer ROLLBACK)
```

### Lectura No Repetible (Non-Repeatable Read)

Leer valores diferentes en dos lecturas dentro de la misma transacción.

```sql
-- Transacción A (READ COMMITTED)
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Devuelve 1000

-- Transacción B
UPDATE accounts SET balance = 500 WHERE id = 1;
COMMIT;

-- Transacción A (misma transacción)
SELECT balance FROM accounts WHERE id = 1;  -- Devuelve 500 (diferente!)
-- Lectura no repetible
COMMIT;
```

### Lectura Fantasma (Phantom Read)

Una consulta devuelve conjuntos diferentes de filas en la misma transacción.

```sql
-- Transacción A (REPEATABLE READ)
BEGIN;
SELECT * FROM products WHERE price > 100;  -- Devuelve 5 filas

-- Transacción B
INSERT INTO products (name, price) VALUES ('Widget', 150);
COMMIT;

-- Transacción A (misma transacción)
SELECT * FROM products WHERE price > 100;  -- Devuelve 6 filas (fantasma!)
COMMIT;
```

### Configurando Niveles de Aislamiento

```sql
-- Nivel de sesión
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Por transacción
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- ... consultas ...
COMMIT;

-- Sintaxis PostgreSQL
BEGIN ISOLATION LEVEL SERIALIZABLE;
```

| Base de Datos | Aislamiento Predeterminado | Notas |
|----------|------------------|-------|
| PostgreSQL | READ COMMITTED | También soporta REPEATABLE READ, SERIALIZABLE |
| MySQL/InnoDB | REPEATABLE READ | Predeterminado es más fuerte que el estándar |
| SQL Server | READ COMMITTED | También soporta SNAPSHOT (variante MVCC) |
| Oracle | READ COMMITTED | SERIALIZABLE disponible |
| Snowflake | READ COMMITTED | Usa MVCC internamente |

## Deadlocks

Un deadlock ocurre cuando dos transacciones esperan una por la otra para liberar bloqueos.

```
Transacción A:                    Transacción B:
UPDATE accounts SET               UPDATE accounts SET
  balance = balance - 100           balance = balance - 200
WHERE id = 1;                     WHERE id = 2;
-- Mantiene bloqueo en id=1       -- Mantiene bloqueo en id=2

UPDATE accounts SET               UPDATE accounts SET
  balance = balance + 100           balance = balance + 200
WHERE id = 2;                     WHERE id = 1;
-- Espera bloqueo de B en id=2   -- Espera bloqueo de A en id=1
---- DEADLOCK! ----
```

```sql
-- La base de datos detecta deadlock y mata una transacción:
-- ERROR: deadlock detected
-- DETAIL: Process 12345 waits for ShareLock on transaction 67890;
--          blocked by process 67890.
-- HINT: See server log for query details.
```

### Evitando Deadlocks

```sql
-- 1. Acceder siempre a las tablas en el mismo orden
-- Bueno: ambas transacciones actualizan id=1 primero, luego id=2
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- 2. Usar transacciones cortas
BEGIN;
-- hacer solo lo necesario
COMMIT;  -- liberar bloqueos rápidamente

-- 3. Usar NOWAIT o SKIP LOCKED
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
-- Falla inmediatamente si el bloqueo está mantenido, en lugar de esperar

-- 4. Reintentar en caso de deadlock
-- (lado de la aplicación: capturar error de deadlock y reintentar)
```

> [!WARNING]
> Los deadlocks no son bugs — son una parte normal del acceso concurrente a bases de datos. La clave es minimizarlos (ordenación consistente, transacciones cortas) y manejarlos con gracia (lógica de reintento).

## Ejemplo Real: Procesamiento de Pedidos

```sql
BEGIN;

-- 1. Insertar el pedido
INSERT INTO orders (customer_id, order_date, status, total)
VALUES (42, CURRENT_TIMESTAMP, 'pending', 0);

-- 2. Obtener el ID del pedido
-- (usa RETURNING en PostgreSQL)
WITH new_order AS (
    INSERT INTO orders (customer_id, order_date, status, total)
    VALUES (42, CURRENT_TIMESTAMP, 'pending', 0)
    RETURNING order_id
)
-- 3. Añadir items y actualizar total
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT
    (SELECT order_id FROM new_order),
    p.product_id,
    2,
    p.price
FROM products p
WHERE p.product_id = 15;

-- 4. Actualizar inventario (FOR UPDATE bloquea la fila)
UPDATE inventory
SET quantity = quantity - 2
WHERE product_id = 15
  AND quantity >= 2;

-- 5. Cobrar al cliente
UPDATE customers
SET balance = balance - 250.00
WHERE customer_id = 42
  AND balance >= 250.00;

-- Verificar que el cobro fue exitoso
IF NOT FOUND THEN
    ROLLBACK;
    RAISE EXCEPTION 'Saldo insuficiente';
END IF;

-- 6. Finalizar
UPDATE orders SET total = 250.00, status = 'confirmed'
WHERE order_id = (SELECT order_id FROM new_order);

COMMIT;
```

> [!SUCCESS]
> Piensa en las transacciones como redes de seguridad para operaciones críticas. Toda transacción financiera, deducción de inventario o cambio de estado que abarque múltiples tablas debe ejecutarse dentro de una transacción explícita. Ante la duda, envuélvelo en BEGIN...COMMIT.

## Preguntas de Práctica

1. ¿Qué comandos SQL inician y terminan una transacción?
2. ¿Qué es un savepoint? Escribe una transacción que use SAVEPOINT y ROLLBACK TO.
3. ¿Qué significa ACID? Explica cada propiedad en una frase.
4. ¿En qué se diferencia Atomicidad de Durabilidad?
5. Enumera los cuatro niveles de aislamiento del más débil al más fuerte.
6. ¿Qué es una lectura sucia (dirty read)? ¿Qué niveles de aislamiento la previenen?
7. ¿Cuál es la diferencia entre una lectura no repetible y una lectura fantasma?
8. Escribe un escenario que cause un deadlock entre dos transacciones.
9. ¿Cómo puedes evitar deadlocks? Enumera al menos tres estrategias.
10. ¿Qué nivel de aislamiento usa tu base de datos por defecto? ¿Cómo cambiarlo para una sola transacción?
