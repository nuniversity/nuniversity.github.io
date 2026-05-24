---
title: "Stored Procedures and Triggers"
description: "Master CREATE PROCEDURE, parameters, variables, control flow, cursors, and triggers (BEFORE/AFTER, INSERT/UPDATE/DELETE)"
order: 7
duration: "120 minutes"
difficulty: advanced
---

# Stored Procedures and Triggers

## Stored Procedures

Stored procedures are reusable database routines that can contain business logic, control flow, and transaction management.

```sql
CREATE OR REPLACE PROCEDURE transfer_funds(
    p_from_account INT,
    p_to_account INT,
    p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Start implicit transaction
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

-- Call
CALL transfer_funds(1001, 2005, 500.00);
```

## Procedures vs Functions

| Aspect | Procedure | Function |
|---|---|---|
| Return value | None (or OUT params) | Must return a value |
| Transaction control | Yes (COMMIT/ROLLBACK) | No |
| In SELECT | No | Yes |
| Output parameters | Yes | Yes |
| Mutate data | Yes | Yes (volatile functions) |

## Parameters and Variables

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
    -- Create the order
    INSERT INTO orders (customer_id, order_date, status)
    VALUES (p_customer_id, NOW(), 'pending')
    RETURNING id INTO v_order_id;

    -- Process line items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_price := (v_item->>'price')::NUMERIC;
        v_quantity := (v_item->>'quantity')::INT;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (v_order_id, (v_item->>'product_id')::INT, v_quantity, v_price);

        v_total := v_total + (v_price * v_quantity);
    END LOOP;

    -- Apply discount
    v_total := v_total * (1 - p_discount / 100);

    UPDATE orders
    SET total = v_total, status = 'confirmed'
    WHERE id = v_order_id;

    RAISE NOTICE 'Order % created: total %', v_order_id, v_total;
END;
$$;
```

[!NOTE]
Use `RAISE NOTICE` for debugging stored procedures. In production, consider logging to a table for audit trails.

## Control Flow

```sql
CREATE OR REPLACE PROCEDURE apply_penalty()
LANGUAGE plpgsql
AS $$
DECLARE
    v_penalty NUMERIC := 25.00;
BEGIN
    -- IF/ELSIF/ELSE
    IF CURRENT_DATE >= '2024-12-25' THEN
        v_penalty := 0;  -- holiday waiver
    ELSIF CURRENT_DATE >= '2024-12-20' THEN
        v_penalty := v_penalty * 0.5;
    END IF;

    -- Simple CASE
    CASE EXTRACT(DOW FROM CURRENT_DATE)
        WHEN 0 THEN v_penalty := v_penalty * 0;  -- Sunday amnesty
        WHEN 6 THEN v_penalty := v_penalty * 0.5;  -- Saturday half
        ELSE NULL;  -- full penalty on weekdays
    END CASE;

    -- Loops
    <<process_loop>>
    LOOP
        -- process logic
        EXIT process_loop WHEN <condition>;
    END LOOP;

    -- WHILE loop
    WHILE v_counter > 0 LOOP
        -- logic
        v_counter := v_counter - 1;
    END LOOP;

    -- FOR loop over query
    FOR rec IN SELECT * FROM overdue_accounts LOOP
        UPDATE accounts SET balance = balance - v_penalty
        WHERE id = rec.id;
    END LOOP;

    -- FOR loop over range
    FOR i IN 1..10 LOOP
        RAISE NOTICE 'Iteration %', i;
    END LOOP;
END;
$$;
```

## Cursors

For processing large result sets row-by-row without loading everything into memory.

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

        -- Create statement for this account
        INSERT INTO statements (account_id, month, created_at)
        VALUES (v_account.id, DATE_TRUNC('month', CURRENT_DATE), NOW())
        RETURNING id INTO v_statement_id;

        -- Insert line items
        INSERT INTO statement_lines (statement_id, description, amount)
        SELECT v_statement_id, description, amount
        FROM transactions
        WHERE account_id = v_account.id
          AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND transaction_date < DATE_TRUNC('month', CURRENT_DATE);

        RAISE NOTICE 'Statement % created for account %', v_statement_id, v_account.id;
    END LOOP;

    CLOSE cur;
END;
$$;
```

[!WARNING]
Cursors are slow compared to set-based operations. Use them only when you must process rows sequentially (e.g., external API calls, complex row-level calculations). Whenever possible, rewrite as a single `INSERT ... SELECT`.

## Triggers

Triggers execute automatically in response to DML events.

### Trigger Types

| Type | Timing | Per | Event |
|---|---|---|---|
| `BEFORE INSERT` | Before row insert | Row | INSERT |
| `AFTER INSERT` | After row insert | Row/Statement | INSERT |
| `BEFORE UPDATE` | Before row update | Row | UPDATE |
| `AFTER UPDATE` | After row update | Row/Statement | UPDATE |
| `BEFORE DELETE` | Before row delete | Row | DELETE |
| `AFTER DELETE` | After row delete | Row/Statement | DELETE |
| `INSTEAD OF` | On views | Row | Any |

### BEFORE INSERT Trigger (Validation)

```sql
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate required fields
    IF NEW.customer_id IS NULL THEN
        RAISE EXCEPTION 'customer_id is required';
    END IF;

    IF NEW.total <= 0 THEN
        RAISE EXCEPTION 'total must be positive, got %', NEW.total;
    END IF;

    -- Set defaults
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

### AFTER INSERT Trigger (Audit Log)

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

### BEFORE UPDATE Trigger (Prevent Changes)

```sql
CREATE OR REPLACE FUNCTION prevent_paid_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        RAISE EXCEPTION 'Cannot modify a paid order';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_before_update_order
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION prevent_paid_order_update();
```

### Trigger for Denormalized Aggregate

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
`TG_OP` is a special variable containing the operation: `'INSERT'`, `'UPDATE'`, `'DELETE'`, or `'TRUNCATE'`. Use it to create multi-operation triggers.

## Trigger Best Practices

| Practice | Why |
|---|---|
| Keep triggers fast | They run in the same transaction — slow triggers block everything |
| Avoid recursive triggers | Trigger on A → inserts into B → trigger on B → inserts into A |
| Document side effects | Triggers are invisible to application code; document them |
| Test thoroughly | Triggers can break bulk operations and imports |
| Use `pg_trigger_depth()` | Prevent infinite recursion |

```sql
-- Prevent recursive triggers
CREATE OR REPLACE FUNCTION safe_update_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;  -- called by another trigger, skip logging
    END IF;

    INSERT INTO audit_log (...) VALUES (...);
    RETURN NEW;
END;
$$;
```

## Practical Examples

### Example 1: Soft Delete Trigger

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

### Example 2: Materialized View Refresh Trigger

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

## Practice Questions

1. Write a stored procedure that transfers inventory between two warehouse locations, including validation and error handling.
2. What is the difference between a `BEFORE` and `AFTER` trigger? Give a use case for each.
3. Create a trigger that prevents deleting a customer who has active orders.
4. Write a procedure that accepts a JSONB parameter containing order items, inserts the order, and returns the order ID.
5. What is `pg_trigger_depth()` and when would you use it?
6. Create a trigger that logs all UPDATE operations on the `employees` table, recording old and new salary values.
7. Write a cursor-based procedure to process a batch of 10,000 pending email notifications and mark them as sent.
8. What are the risks of using triggers for business logic? How would you mitigate them?
9. Create a `FOR EACH STATEMENT` trigger vs a `FOR EACH ROW` trigger. When would you choose one over the other?
10. Write a stored procedure with `COMMIT` inside a loop to batch-process 1M rows without exhausting transaction logs.
