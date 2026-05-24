---
title: "Procedimentos Armazenados e Triggers"
description: "Domine CREATE PROCEDURE, parâmetros, variáveis, fluxo de controle, cursores e triggers (BEFORE/AFTER, INSERT/UPDATE/DELETE)"
order: 7
duration: "120 minutos"
difficulty: advanced
---

# Procedimentos Armazenados e Triggers

## Procedimentos Armazenados

Procedimentos armazenados são rotinas reutilizáveis de banco de dados que podem conter lógica de negócio, fluxo de controle e gerenciamento de transações.

```sql
CREATE OR REPLACE PROCEDURE transfer_funds(
    p_from_account INT,
    p_to_account INT,
    p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Iniciar transação implícita
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

-- Chamada
CALL transfer_funds(1001, 2005, 500.00);
```

## Procedimentos vs Funções

| Aspecto | Procedimento | Função |
|---|---|---|
| Valor de retorno | Nenhum (ou parâmetros OUT) | Deve retornar um valor |
| Controle de transação | Sim (COMMIT/ROLLBACK) | Não |
| Em SELECT | Não | Sim |
| Parâmetros de saída | Sim | Sim |
| Modificar dados | Sim | Sim (funções voláteis) |

## Parâmetros e Variáveis

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
    -- Criar o pedido
    INSERT INTO orders (customer_id, order_date, status)
    VALUES (p_customer_id, NOW(), 'pending')
    RETURNING id INTO v_order_id;

    -- Processar itens
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_price := (v_item->>'price')::NUMERIC;
        v_quantity := (v_item->>'quantity')::INT;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (v_order_id, (v_item->>'product_id')::INT, v_quantity, v_price);

        v_total := v_total + (v_price * v_quantity);
    END LOOP;

    -- Aplicar desconto
    v_total := v_total * (1 - p_discount / 100);

    UPDATE orders
    SET total = v_total, status = 'confirmed'
    WHERE id = v_order_id;

    RAISE NOTICE 'Pedido % criado: total %', v_order_id, v_total;
END;
$$;
```

[!NOTE]
Use `RAISE NOTICE` para depurar procedimentos armazenados. Em produção, considere registrar em uma tabela para trilhas de auditoria.

## Fluxo de Controle

```sql
CREATE OR REPLACE PROCEDURE apply_penalty()
LANGUAGE plpgsql
AS $$
DECLARE
    v_penalty NUMERIC := 25.00;
BEGIN
    -- IF/ELSIF/ELSE
    IF CURRENT_DATE >= '2024-12-25' THEN
        v_penalty := 0;  -- isenção de feriado
    ELSIF CURRENT_DATE >= '2024-12-20' THEN
        v_penalty := v_penalty * 0.5;
    END IF;

    -- CASE simples
    CASE EXTRACT(DOW FROM CURRENT_DATE)
        WHEN 0 THEN v_penalty := v_penalty * 0;  -- Domingo: anistia
        WHEN 6 THEN v_penalty := v_penalty * 0.5;  -- Sábado: metade
        ELSE NULL;  -- multa completa em dias úteis
    END CASE;

    -- Loops
    <<process_loop>>
    LOOP
        -- lógica de processamento
        EXIT process_loop WHEN <condition>;
    END LOOP;

    -- Loop WHILE
    WHILE v_counter > 0 LOOP
        -- lógica
        v_counter := v_counter - 1;
    END LOOP;

    -- Loop FOR sobre consulta
    FOR rec IN SELECT * FROM overdue_accounts LOOP
        UPDATE accounts SET balance = balance - v_penalty
        WHERE id = rec.id;
    END LOOP;

    -- Loop FOR sobre intervalo
    FOR i IN 1..10 LOOP
        RAISE NOTICE 'Iteração %', i;
    END LOOP;
END;
$$;
```

## Cursores

Para processar grandes conjuntos de resultados linha por linha sem carregar tudo na memória.

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

        -- Criar extrato para esta conta
        INSERT INTO statements (account_id, month, created_at)
        VALUES (v_account.id, DATE_TRUNC('month', CURRENT_DATE), NOW())
        RETURNING id INTO v_statement_id;

        -- Inserir itens do extrato
        INSERT INTO statement_lines (statement_id, description, amount)
        SELECT v_statement_id, description, amount
        FROM transactions
        WHERE account_id = v_account.id
          AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND transaction_date < DATE_TRUNC('month', CURRENT_DATE);

        RAISE NOTICE 'Extrato % criado para conta %', v_statement_id, v_account.id;
    END LOOP;

    CLOSE cur;
END;
$$;
```

[!WARNING]
Cursores são lentos comparados a operações baseadas em conjunto. Use-os apenas quando precisar processar linhas sequencialmente (ex: chamadas de API externas, cálculos complexos por linha). Sempre que possível, reescreva como um único `INSERT ... SELECT`.

## Triggers

Triggers são executados automaticamente em resposta a eventos DML.

### Tipos de Trigger

| Tipo | Momento | Por | Evento |
|---|---|---|---|
| `BEFORE INSERT` | Antes de inserir linha | Linha | INSERT |
| `AFTER INSERT` | Após inserir linha | Linha/Comando | INSERT |
| `BEFORE UPDATE` | Antes de atualizar linha | Linha | UPDATE |
| `AFTER UPDATE` | Após atualizar linha | Linha/Comando | UPDATE |
| `BEFORE DELETE` | Antes de excluir linha | Linha | DELETE |
| `AFTER DELETE` | Após excluir linha | Linha/Comando | DELETE |
| `INSTEAD OF` | Em views | Linha | Qualquer |

### Trigger BEFORE INSERT (Validação)

```sql
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validar campos obrigatórios
    IF NEW.customer_id IS NULL THEN
        RAISE EXCEPTION 'customer_id é obrigatório';
    END IF;

    IF NEW.total <= 0 THEN
        RAISE EXCEPTION 'total deve ser positivo, recebeu %', NEW.total;
    END IF;

    -- Definir valores padrão
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

### Trigger AFTER INSERT (Log de Auditoria)

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

### Trigger BEFORE UPDATE (Prevenir Alterações)

```sql
CREATE OR REPLACE FUNCTION prevent_paid_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        RAISE EXCEPTION 'Não é possível modificar um pedido pago';
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
`TG_OP` é uma variável especial contendo a operação: `'INSERT'`, `'UPDATE'`, `'DELETE'` ou `'TRUNCATE'`. Use-a para criar triggers multi-operação.

## Melhores Práticas para Triggers

| Prática | Porquê |
|---|---|
| Mantenha triggers rápidos | Eles executam na mesma transação — triggers lentos bloqueiam tudo |
| Evite triggers recursivos | Trigger em A → insere em B → trigger em B → insere em A |
| Documente efeitos colaterais | Triggers são invisíveis para o código da aplicação; documente-os |
| Teste minuciosamente | Triggers podem quebrar operações em lote e importações |
| Use `pg_trigger_depth()` | Prevenir recursão infinita |

```sql
-- Prevenir triggers recursivos
CREATE OR REPLACE FUNCTION safe_update_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;  -- chamado por outro trigger, pular log
    END IF;

    INSERT INTO audit_log (...) VALUES (...);
    RETURN NEW;
END;
$$;
```

## Exemplos Práticos

### Exemplo 1: Trigger de Soft Delete

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

### Exemplo 2: Trigger de Atualização de View Materializada

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

## Perguntas de Prática

1. Escreva um procedimento armazenado que transfira inventário entre dois locais de armazém, incluindo validação e tratamento de erros.
2. Qual é a diferença entre um trigger `BEFORE` e `AFTER`? Dê um caso de uso para cada.
3. Crie um trigger que impeça a exclusão de um cliente que tenha pedidos ativos.
4. Escreva um procedimento que aceite um parâmetro JSONB contendo itens de pedido, insira o pedido e retorne o ID do pedido.
5. O que é `pg_trigger_depth()` e quando você o usaria?
6. Crie um trigger que registre todas as operações UPDATE na tabela `employees`, gravando valores antigos e novos de salário.
7. Escreva um procedimento baseado em cursor para processar um lote de 10.000 notificações de email pendentes e marcá-las como enviadas.
8. Quais são os riscos de usar triggers para lógica de negócio? Como você os mitigaria?
9. Crie um trigger `FOR EACH STATEMENT` vs `FOR EACH ROW`. Quando você escolheria um sobre o outro?
10. Escreva um procedimento armazenado com `COMMIT` dentro de um loop para processar em lote 1M linhas sem esgotar os logs de transação.
