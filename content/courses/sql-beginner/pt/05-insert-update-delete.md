---
title: "INSERT, UPDATE, DELETE — Manipulação de Dados"
description: "Aprenda INSERT INTO, UPDATE SET, DELETE FROM, TRUNCATE e uma introdução a transações"
order: 5
duration: "20-30 minutos"
difficulty: "beginner"
---

# INSERT, UPDATE, DELETE — Manipulação de Dados

Ler dados é útil, mas você também precisa criar, modificar e removê-los. Essas operações são chamadas de **linguagem de manipulação de dados (DML)** e formam a espinha dorsal de qualquer aplicação.

## INSERT INTO — Adicionando Novas Linhas

### Inserir uma Única Linha

```sql
INSERT INTO users (name, email, age)
VALUES ('Alice', 'alice@example.com', 30);
```

A lista de colunas é opcional, mas recomendada:

```sql
-- Sem lista de colunas (frágil, dependente de posição)
INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', 30);
```

> [!WARNING]
> Omitir a lista de colunas requer conhecer a ordem exata das colunas na tabela. Se o esquema mudar, seu INSERT quebra. Sempre especifique as colunas.

### Inserir Múltiplas Linhas

```sql
INSERT INTO users (name, email, age)
VALUES
    ('Bob', 'bob@example.com', 25),
    ('Carol', 'carol@example.com', 28),
    ('David', 'david@example.com', 35);
```

### Inserir a partir de uma Consulta

```sql
INSERT INTO archived_users (name, email, age)
SELECT name, email, age
FROM users
WHERE age > 60;
```

> [!SUCCESS]
> `INSERT INTO ... SELECT` é poderoso para copiar, arquivar e transformar dados entre tabelas. A quantidade e os tipos de colunas devem corresponder.

## UPDATE SET — Modificando Linhas Existentes

### Atualização Básica

```sql
UPDATE users
SET age = 31
WHERE name = 'Alice';
```

Sempre inclua uma cláusula `WHERE` a menos que pretenda atualizar todas as linhas:

```sql
-- Dê um aumento de 10% para todos
UPDATE employees
SET salary = salary * 1.10;
```

> [!WARNING]
> Um `WHERE` faltando em um UPDATE modifica **todas as linhas** da tabela. Sempre verifique sua cláusula WHERE antes de executar.

### Atualizar Múltiplas Colunas

```sql
UPDATE users
SET
    name = 'Alice Johnson',
    email = 'alice.johnson@example.com',
    age = 31
WHERE id = 1;
```

### Atualizar com Expressões

```sql
UPDATE products
SET
    price = price * 1.05,
    updated_at = CURRENT_TIMESTAMP
WHERE category = 'Electronics';
```

## DELETE FROM — Removendo Linhas

### Exclusão Básica

```sql
DELETE FROM users WHERE id = 5;
```

### Excluir com Condições

```sql
DELETE FROM orders
WHERE status = 'cancelled' AND order_date < '2023-01-01';
```

> [!WARNING]
> Um `WHERE` faltando em DELETE remove **todas as linhas**. A estrutura da tabela permanece, mas os dados desaparecem (a menos que você tenha uma transação).

### DELETE vs TRUNCATE

| Característica | DELETE | TRUNCATE |
|----------------|--------|----------|
| Pode usar WHERE | Sim | Não |
| Remove linhas | Sim | Sim |
| Reinicia auto-incremento | Não | Sim |
| Velocidade | Mais lento (linha por linha) | Rápido (desaloca páginas) |
| Pode desfazer | Sim (com transação) | Sim (com transação) |
| Dispara triggers | Sim | Não |

```sql
-- Remove todas as linhas, mantém a estrutura da tabela
TRUNCATE TABLE temp_logs;
```

> [!NOTE]
> `TRUNCATE` é DDL (não DML) em alguns bancos de dados. Não pode ser usado com cláusula WHERE e é geralmente mais rápido porque não varre linhas individualmente.

## Introdução a Transações

Uma **transação** agrupa múltiplas operações em uma única unidade que **comita** (todas bem-sucedidas) ou **reverte** (todas desfeitas).

### Por que Transações São Importantes

Imagine uma transferência bancária:

```sql
-- Sem transações, se o passo 2 falhar, o dinheiro desaparece
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- Crash!
```

### Usando Transações

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Se tudo estiver certo:
COMMIT;

-- Se algo deu errado:
ROLLBACK;
```

### Propriedades ACID

| Propriedade | Significado |
|-------------|-------------|
| **Atomicidade** | Tudo ou nada |
| **Consistência** | Banco de dados permanece válido |
| **Isolamento** | Transações concorrentes não interferem |
| **Durabilidade** | Dados comitados sobrevivem a falhas |

> [!SUCCESS]
> Toda instrução SQL individual é executada dentro de uma transação implícita (modo auto-commit). Transações explícitas se tornam essenciais quando você atualiza duas ou mais tabelas em uma única operação lógica.

## Caso de Uso Real: Registro de Usuário

```sql
BEGIN TRANSACTION;

-- 1. Criar a conta de usuário
INSERT INTO users (name, email, password_hash)
VALUES ('Jane', 'jane@example.com', 'hashed_pw_here');

-- 2. Criar um perfil padrão
INSERT INTO profiles (user_id, display_name, avatar_url)
VALUES (LAST_INSERT_ROWID(), 'Jane', '/avatars/default.png');

-- 3. Adicionar email de boas-vindas à fila
INSERT INTO email_queue (recipient, subject, body)
VALUES ('jane@example.com', 'Bem-vindo!', 'Obrigado por se juntar...');

COMMIT;
```

> [!WARNING]
> `LAST_INSERT_ROWID()` (MySQL/SQLite) ou `RETURNING id` (PostgreSQL) recupera o ID gerado automaticamente. Verifique a sintaxe do seu banco de dados.

## Caso de Uso Real: Limpeza de Dados Antigos

```sql
-- Arquive pedidos mais antigos que 1 ano, depois os exclua
BEGIN TRANSACTION;

INSERT INTO orders_archive (id, customer_id, total, order_date)
SELECT id, customer_id, total, order_date
FROM orders
WHERE order_date < DATE('now', '-1 year');

DELETE FROM orders
WHERE order_date < DATE('now', '-1 year');

COMMIT;
```

## Perguntas de Prática

Dada `employees(id, name, department, salary)`:

1. Escreva uma instrução INSERT para adicionar um novo funcionário chamado 'Eve' em 'Engineering' com salário 85000.
2. Escreva um UPDATE para dar a todos os funcionários em 'Sales' um aumento de 15%.
3. Qual é a diferença entre DELETE e TRUNCATE?
4. Escreva uma instrução DELETE para remover funcionários com salário menor que 30000.
5. O que acontece se você executar UPDATE sem uma cláusula WHERE?
6. Escreva uma única instrução INSERT que adicione três novos funcionários de uma vez.
7. O que `BEGIN TRANSACTION` faz? Por que é importante para uma transferência bancária?
8. Escreva um INSERT que copie todos os funcionários de 'employees' para 'employees_backup'.
9. Após excluir todas as linhas de uma tabela com DELETE, o contador auto-incremento é reiniciado? E com TRUNCATE?
10. Escreva uma transação que insira um novo departamento 'AI' e mova todos os funcionários de 'Engineering' para ele.
