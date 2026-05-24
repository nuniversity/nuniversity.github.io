---
title: "Procedimientos Almacenados y Triggers"
description: "Domina CREATE PROCEDURE, parámetros, variables, flujo de control, cursores y triggers (BEFORE/AFTER, INSERT/UPDATE/DELETE)"
order: 7
duration: "120 minutos"
difficulty: advanced
---

# Procedimientos Almacenados y Triggers

## Procedimientos Almacenados

Los procedimientos almacenados son rutinas reutilizables de base de datos que pueden contener lógica de negocio, flujo de control y gestión de transacciones.

```sql
CREATE OR REPLACE PROCEDURE transfer_funds(
    p_from_account INT,
    p_to_account INT,
    p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Iniciar transacción implícita
    UPDATE accounts SET balance = balance - p_amount
    WHERE id = p_from_account;

    UPDATE accounts SET balance = balance + p_amount
    WHERE id = p_to_account;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
$$;

-- Llamada
CALL transfer_funds(1001, 2005, 500.00);
```

## Procedimientos vs Funciones

| Aspecto | Procedimiento | Función |
|---|---|---|
| Valor de retorno | Ninguno (o parámetros OUT) | Debe retornar un valor |
| Control de transacción | Sí (COMMIT/ROLLBACK) | No |
| En SELECT | No | Sí |
| Parámetros de salida | Sí | Sí |
| Modificar datos | Sí | Sí (funciones volátiles) |

## Parámetros y Variables

```sql
CREATE OR REPLACE PROCEDURE process_order(
    p_customer_id INT,
    p_items JSONB,
    p_discount NUMERIC DEFAULT 0
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id BIGINT;
    v_total NUMERIC := 0;
    v_item JSONB;
    v_price NUMERIC;
    v_quantity INT;
BEGIN
    -- Crear el pedido
    INSERT INTO orders (customer_id, order_date, status)
    VALUES (p_customer_id, NOW(), 'pending')
    RETURNING id INTO v_order_id;

    -- Procesar artículos
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_price := (v_item->>'price')::NUMERIC;
        v_quantity := (v_item->>'quantity')::INT;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (v_order_id, (v_item->>'product_id')::INT, v_quantity, v_price);

        v_total := v_total + (v_price * v_quantity);
    END LOOP;

    -- Aplicar descuento
    v_total := v_total * (1 - p_discount / 100);

    UPDATE orders
    SET total = v_total, status = 'confirmed'
    WHERE id = v_order_id;

    RAISE NOTICE 'Pedido % creado: total %', v_order_id, v_total;
END;
$$;
```

[!NOTE]
Usa `RAISE NOTICE` para depurar procedimientos almacenados. En producción, considera registrar en una tabla para pistas de auditoría.

## Flujo de Control

```sql
CREATE OR REPLACE PROCEDURE apply_penalty()
LANGUAGE plpgsql
AS $$
DECLARE
    v_penalty NUMERIC := 25.00;
BEGIN
    -- IF/ELSIF/ELSE
    IF CURRENT_DATE >= '2024-12-25' THEN
        v_penalty := 0;  -- exención de vacaciones
    ELSIF CURRENT_DATE >= '2024-12-20' THEN
        v_penalty := v_penalty * 0.5;
    END IF;

    -- CASE simple
    CASE EXTRACT(DOW FROM CURRENT_DATE)
        WHEN 0 THEN v_penalty := v_penalty * 0;  -- Domingo: amnistía
        WHEN 6 THEN v_penalty := v_penalty * 0.5;  -- Sábado: mitad
        ELSE NULL;  -- multa completa en días laborables
    END CASE;

    -- Bucles
    <<process_loop>>
    LOOP
        -- lógica de procesamiento
        EXIT process_loop WHEN <condition>;
    END LOOP;

    -- Bucle WHILE
    WHILE v_counter > 0 LOOP
        -- lógica
        v_counter := v_counter - 1;
    END LOOP;

    -- Bucle FOR sobre consulta
    FOR rec IN SELECT * FROM overdue_accounts LOOP
        UPDATE accounts SET balance = balance - v_penalty
        WHERE id = rec.id;
    END LOOP;

    -- Bucle FOR sobre rango
    FOR i IN 1..10 LOOP
        RAISE NOTICE 'Iteración %', i;
    END LOOP;
END;
$$;
```

## Cursores

Para procesar grandes conjuntos de resultados fila por fila sin cargar todo en memoria.

```sql
CREATE OR REPLACE PROCEDURE generate_monthly_statements()
LANGUAGE plpgsql
AS $$
DECLARE
    cur CURSOR FOR
        SELECT id, customer_id, balance
        FROM accounts
        WHERE active = true;

    v_account RECORD;
    v_statement_id BIGINT;
BEGIN
    OPEN cur;

    LOOP
        FETCH cur INTO v_account;
        EXIT WHEN NOT FOUND;

        -- Crear estado de cuenta para esta cuenta
        INSERT INTO statements (account_id, month, created_at)
        VALUES (v_account.id, DATE_TRUNC('month', CURRENT_DATE), NOW())
        RETURNING id INTO v_statement_id;

        -- Insertar líneas del estado
        INSERT INTO statement_lines (statement_id, description, amount)
        SELECT v_statement_id, description, amount
        FROM transactions
        WHERE account_id = v_account.id
          AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND transaction_date < DATE_TRUNC('month', CURRENT_DATE);

        RAISE NOTICE 'Estado % creado para cuenta %', v_statement_id, v_account.id;
    END LOOP;

    CLOSE cur;
END;
$$;
```

[!WARNING]
Los cursores son lentos comparados con operaciones basadas en conjuntos. Úsalos solo cuando debas procesar filas secuencialmente (ej: llamadas a API externas, cálculos complejos por fila). Siempre que sea posible, reescribe como un único `INSERT ... SELECT`.

## Triggers

Los triggers se ejecutan automáticamente en respuesta a eventos DML.

### Tipos de Trigger

| Tipo | Momento | Por | Evento |
|---|---|---|---|
| `BEFORE INSERT` | Antes de insertar fila | Fila | INSERT |
| `AFTER INSERT` | Después de insertar fila | Fila/Comando | INSERT |
| `BEFORE UPDATE` | Antes de actualizar fila | Fila | UPDATE |
| `AFTER UPDATE` | Después de actualizar fila | Fila/Comando | UPDATE |
| `BEFORE DELETE` | Antes de eliminar fila | Fila | DELETE |
| `AFTER DELETE` | Después de eliminar fila | Fila/Comando | DELETE |
| `INSTEAD OF` | En vistas | Fila | Cualquiera |

### Trigger BEFORE INSERT (Validación)

```sql
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validar campos obligatorios
    IF NEW.customer_id IS NULL THEN
        RAISE EXCEPTION 'customer_id es obligatorio';
    END IF;

    IF NEW.total <= 0 THEN
        RAISE EXCEPTION 'total debe ser positivo, recibió %', NEW.total;
    END IF;

    -- Establecer valores predeterminados
    IF NEW.status IS NULL THEN
        NEW.status := 'pending';
    END IF;

    IF NEW.order_date IS NULL THEN
        NEW.order_date := NOW();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_before_insert_order
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order();
```

### Trigger AFTER INSERT (Registro de Auditoría)

```sql
CREATE OR REPLACE FUNCTION log_order_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_data, new_data, changed_by, changed_at)
    VALUES (
        'orders',
        'INSERT',
        NEW.id,
        NULL,
        row_to_json(NEW),
        CURRENT_USER,
        NOW()
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_after_insert_order
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_insert();
```

### Trigger BEFORE UPDATE (Prevenir Cambios)

```sql
CREATE OR REPLACE FUNCTION prevent_paid_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        RAISE EXCEPTION 'No se puede modificar un pedido pagado';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_before_update_order
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION prevent_paid_order_update();
```

### Trigger para Agregado Desnormalizado

```sql
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts SET balance = balance + NEW.amount
        WHERE id = NEW.account_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts SET balance = balance - OLD.amount
        WHERE id = OLD.account_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE accounts SET balance = balance - OLD.amount + NEW.amount
        WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transaction_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();
```

[!TIP]
`TG_OP` es una variable especial que contiene la operación: `'INSERT'`, `'UPDATE'`, `'DELETE'` o `'TRUNCATE'`. Úsala para crear triggers multi-operación.

## Mejores Prácticas para Triggers

| Práctica | Por qué |
|---|---|
| Mantén los triggers rápidos | Se ejecutan en la misma transacción — triggers lentos bloquean todo |
| Evita triggers recursivos | Trigger en A → inserta en B → trigger en B → inserta en A |
| Documenta efectos secundarios | Los triggers son invisibles para el código de la aplicación; documéntalos |
| Prueba minuciosamente | Los triggers pueden romper operaciones por lotes e importaciones |
| Usa `pg_trigger_depth()` | Prevenir recursión infinita |

```sql
-- Prevenir triggers recursivos
CREATE OR REPLACE FUNCTION safe_update_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;  -- llamado por otro trigger, saltar registro
    END IF;

    INSERT INTO audit_log (...) VALUES (...);
    RETURN NEW;
END;
$$;
```

## Ejemplos Prácticos

### Ejemplo 1: Trigger de Soft Delete

```sql
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.deleted_at := NOW();
    NEW.deleted_by := CURRENT_USER;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_soft_delete
    BEFORE DELETE ON sensitive_data
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete();
```

### Ejemplo 2: Trigger de Actualización de Vista Materializada

```sql
CREATE OR REPLACE FUNCTION refresh_sales_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_refresh_sales
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_sales_summary();
```

## Preguntas de Práctica

1. Escribe un procedimiento almacenado que transfiera inventario entre dos ubicaciones de almacén, incluyendo validación y manejo de errores.
2. ¿Cuál es la diferencia entre un trigger `BEFORE` y `AFTER`? Da un caso de uso para cada uno.
3. Crea un trigger que impida eliminar un cliente que tenga pedidos activos.
4. Escribe un procedimiento que acepte un parámetro JSONB conteniendo artículos de pedido, inserte el pedido y retorne el ID del pedido.
5. ¿Qué es `pg_trigger_depth()` y cuándo lo usarías?
6. Crea un trigger que registre todas las operaciones UPDATE en la tabla `employees`, grabando valores antiguos y nuevos de salario.
7. Escribe un procedimiento basado en cursor para procesar un lote de 10,000 notificaciones de correo pendientes y marcarlas como enviadas.
8. ¿Cuáles son los riesgos de usar triggers para lógica de negocio? ¿Cómo los mitigarías?
9. Crea un trigger `FOR EACH STATEMENT` vs `FOR EACH ROW`. ¿Cuándo elegirías uno sobre el otro?
10. Escribe un procedimiento almacenado con `COMMIT` dentro de un bucle para procesar en lote 1M filas sin agotar los registros de transacción.
