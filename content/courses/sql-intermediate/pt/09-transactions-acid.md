---
title: "Transações e ACID"
description: "Domine BEGIN/COMMIT/ROLLBACK, propriedades ACID, níveis de isolamento e tratamento de deadlocks"
order: 9
duration: "50 minutos"
difficulty: "intermediário"
---

# Transações e ACID

Uma transação é uma unidade de trabalho que deve ser bem-sucedida ou falhar como um todo. Transações garantem a integridade dos dados quando múltiplas operações devem acontecer atomicamente.

## BEGIN, COMMIT e ROLLBACK

```sql
-- Iniciar uma transação
BEGIN;
-- ou: START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

-- Se ambas forem bem-sucedidas, persistir:
COMMIT;

-- Se algo falhar, desfazer tudo:
ROLLBACK;
```

> [!NOTE]
> A maioria dos bancos de dados opera em modo auto-commit por padrão — cada declaração é sua própria transação. Use `BEGIN` para agrupar múltiplas declarações em uma transação.

### Savepoints

Savepoints permitem reverter parte de uma transação sem abortar tudo.

```sql
BEGIN;

INSERT INTO orders (customer_id, total) VALUES (1, 250.00);
-- order_id = 101

SAVEPOINT order_created;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (101, 42, 2, 125.00);

-- Ops, produto errado. Reverter os itens, manter o pedido
ROLLBACK TO SAVEPOINT order_created;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (101, 15, 1, 250.00);

COMMIT;
```

| Comando | Efeito |
|---------|--------|
| `SAVEPOINT name` | Definir um ponto de reversão parcial |
| `ROLLBACK TO SAVEPOINT name` | Desfazer mudanças após o savepoint |
| `RELEASE SAVEPOINT name` | Manter mudanças, remover savepoint |

## Propriedades ACID

| Propriedade | Significado | Garantido Por |
|----------|---------|------------|
| **A**tomicidade | Tudo ou nada | Log de transação + ROLLBACK |
| **C**onsistência | Dados obedecem todas as regras | Restrições, gatilhos, código da aplicação |
| **I**solamento | Transações concorrentes não interferem | Bloqueio / MVCC |
| **D**urabilidade | Dados confirmados sobrevivem a falhas | Write-ahead log (WAL) |

### Atomicidade

Ou todas as operações são bem-sucedidas, ou nenhuma tem efeito.

```sql
BEGIN;
UPDATE inventory SET quantity = quantity - 2 WHERE product_id = 1;
UPDATE orders SET status = 'shipped' WHERE order_id = 500;
-- Se o servidor cair após o primeiro UPDATE mas antes do COMMIT,
-- a mudança no inventário é revertida na reinicialização
COMMIT;
```

### Consistência

Restrições, gatilhos e chaves estrangeiras impõem consistência automaticamente.

```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    owner TEXT NOT NULL,
    balance NUMERIC NOT NULL CHECK (balance >= 0)
);

BEGIN;
UPDATE accounts SET balance = balance - 200 WHERE id = 1;
-- Se o saldo fosse negativo, a restrição CHECK impede
-- A transação deve ser revertida com ROLLBACK
COMMIT;
```

### Isolamento

Isolamento previne que transações concorrentes vejam mudanças não confirmadas umas das outras.

```sql
-- Sessão 1
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- Não COMMIT ainda

-- Sessão 2
BEGIN;
SELECT balance FROM accounts WHERE id = 1;
-- Retorna o saldo ANTIGO (1000) porque a Sessão 1 não fez COMMIT
-- Isso previne leituras sujas (no nível READ COMMITTED)
COMMIT;
```

### Durabilidade

Uma vez que COMMIT é bem-sucedido, os dados estão seguros mesmo se a energia falhar imediatamente depois.

```
COMMIT → Escrever WAL → Liberar no disco → Confirmar → (falha de energia OK)
                            ↑
                      Isto deve acontecer antes do COMMIT retornar
```

> [!NOTE]
> Durabilidade garante que transações confirmadas sobrevivam a falhas. Bancos de dados usam write-ahead logging (WAL): mudanças são escritas em um log antes de serem aplicadas aos arquivos de dados.

## Níveis de Isolamento

O padrão SQL define quatro níveis de isolamento, do mais fraco ao mais forte.

| Nível | Leitura Suja | Leitura Não Repetível | Leitura Fantasma |
|-------|-----------|---------------------|--------------|
| READ UNCOMMITTED | Possível | Possível | Possível |
| READ COMMITTED | Prevenida | Possível | Possível |
| REPEATABLE READ | Prevenida | Prevenida | Possível |
| SERIALIZABLE | Prevenida | Prevenida | Prevenida |

### Leitura Suja (Dirty Read)

Ler dados não confirmados de outra transação.

```sql
-- Transação A (READ UNCOMMITTED)
BEGIN;
UPDATE products SET price = 1000 WHERE id = 1;
-- Ainda não confirmado

-- Transação B (READ UNCOMMITTED)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT price FROM products WHERE id = 1;
-- Retorna 1000 (leitura suja — Transação A pode fazer ROLLBACK)
```

### Leitura Não Repetível (Non-Repeatable Read)

Ler valores diferentes em duas leituras dentro da mesma transação.

```sql
-- Transação A (READ COMMITTED)
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Retorna 1000

-- Transação B
UPDATE accounts SET balance = 500 WHERE id = 1;
COMMIT;

-- Transação A (mesma transação)
SELECT balance FROM accounts WHERE id = 1;  -- Retorna 500 (diferente!)
-- Leitura não repetível
COMMIT;
```

### Leitura Fantasma (Phantom Read)

Uma consulta retorna conjuntos diferentes de linhas na mesma transação.

```sql
-- Transação A (REPEATABLE READ)
BEGIN;
SELECT * FROM products WHERE price > 100;  -- Retorna 5 linhas

-- Transação B
INSERT INTO products (name, price) VALUES ('Widget', 150);
COMMIT;

-- Transação A (mesma transação)
SELECT * FROM products WHERE price > 100;  -- Retorna 6 linhas (fantasma!)
COMMIT;
```

### Configurando Níveis de Isolamento

```sql
-- Nível da sessão
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Por transação
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- ... consultas ...
COMMIT;

-- Sintaxe PostgreSQL
BEGIN ISOLATION LEVEL SERIALIZABLE;
```

| Banco de Dados | Isolamento Padrão | Notas |
|----------|------------------|-------|
| PostgreSQL | READ COMMITTED | Também suporta REPEATABLE READ, SERIALIZABLE |
| MySQL/InnoDB | REPEATABLE READ | Padrão é mais forte que o padrão SQL |
| SQL Server | READ COMMITTED | Também suporta SNAPSHOT (variante MVCC) |
| Oracle | READ COMMITTED | SERIALIZABLE disponível |
| Snowflake | READ COMMITTED | Usa MVCC internamente |

## Deadlocks

Um deadlock ocorre quando duas transações esperam uma pela outra para liberar bloqueios.

```
Transação A:                    Transação B:
UPDATE accounts SET               UPDATE accounts SET
  balance = balance - 100           balance = balance - 200
WHERE id = 1;                     WHERE id = 2;
-- Mantém bloqueio em id=1       -- Mantém bloqueio em id=2

UPDATE accounts SET               UPDATE accounts SET
  balance = balance + 100           balance = balance + 200
WHERE id = 2;                     WHERE id = 1;
-- Espera bloqueio de B em id=2 -- Espera bloqueio de A em id=1
---- DEADLOCK! ----
```

```sql
-- Banco de dados detecta deadlock e mata uma transação:
-- ERROR: deadlock detected
-- DETAIL: Process 12345 waits for ShareLock on transaction 67890;
--          blocked by process 67890.
-- HINT: See server log for query details.
```

### Evitando Deadlocks

```sql
-- 1. Sempre acessar tabelas na mesma ordem
-- Bom: ambas as transações atualizam id=1 primeiro, depois id=2
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- 2. Usar transações curtas
BEGIN;
-- fazer apenas o necessário
COMMIT;  -- liberar bloqueios rapidamente

-- 3. Usar NOWAIT ou SKIP LOCKED
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
-- Falha imediatamente se o bloqueio estiver mantido, em vez de esperar

-- 4. Repetir em caso de deadlock
-- (lado da aplicação: capturar erro de deadlock e repetir)
```

> [!WARNING]
> Deadlocks não são bugs — são uma parte normal do acesso concorrente a banco de dados. A chave é minimizá-los (ordenação consistente, transações curtas) e tratá-los graciosamente (lógica de repetição).

## Exemplo Real: Processamento de Pedidos

```sql
BEGIN;

-- 1. Inserir o pedido
INSERT INTO orders (customer_id, order_date, status, total)
VALUES (42, CURRENT_TIMESTAMP, 'pending', 0);

-- 2. Obter o ID do pedido
-- (use RETURNING no PostgreSQL)
WITH new_order AS (
    INSERT INTO orders (customer_id, order_date, status, total)
    VALUES (42, CURRENT_TIMESTAMP, 'pending', 0)
    RETURNING order_id
)
-- 3. Adicionar itens e atualizar total
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT
    (SELECT order_id FROM new_order),
    p.product_id,
    2,
    p.price
FROM products p
WHERE p.product_id = 15;

-- 4. Atualizar inventário (FOR UPDATE bloqueia a linha)
UPDATE inventory
SET quantity = quantity - 2
WHERE product_id = 15
  AND quantity >= 2;

-- 5. Cobrar o cliente
UPDATE customers
SET balance = balance - 250.00
WHERE customer_id = 42
  AND balance >= 250.00;

-- Verificar se a cobrança foi bem-sucedida
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
> Pense em transações como redes de segurança para operações críticas. Toda transação financeira, dedução de inventário ou mudança de estado que abranja múltiplas tabelas deve executar dentro de uma transação explícita. Quando em dúvida, envolva em BEGIN...COMMIT.

## Perguntas de Prática

1. Quais comandos SQL iniciam e encerram uma transação?
2. O que é um savepoint? Escreva uma transação que use SAVEPOINT e ROLLBACK TO.
3. O que ACID significa? Explique cada propriedade em uma frase.
4. Como Atomicidade difere de Durabilidade?
5. Liste os quatro níveis de isolamento do mais fraco ao mais forte.
6. O que é uma leitura suja (dirty read)? Quais níveis de isolamento a previnem?
7. Qual é a diferença entre uma leitura não repetível e uma leitura fantasma?
8. Escreva um cenário que cause um deadlock entre duas transações.
9. Como você pode evitar deadlocks? Liste pelo menos três estratégias.
10. Qual nível de isolamento seu banco de dados usa como padrão? Como alterá-lo para uma única transação?
