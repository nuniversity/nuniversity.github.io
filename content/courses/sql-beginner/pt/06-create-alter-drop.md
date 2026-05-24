---
title: "CREATE, ALTER e DROP de Tabelas"
description: "Aprenda a definir esquemas de banco de dados com CREATE TABLE, modificá-los com ALTER TABLE e removê-los com DROP TABLE"
order: 6
duration: "20-30 minutos"
difficulty: "beginner"
---

# CREATE, ALTER e DROP de Tabelas

Estes comandos de **Linguagem de Definição de Dados (DDL)** definem e gerenciam a estrutura do seu banco de dados. Acertar o design do esquema é crítico — é muito mais fácil planejar com antecedência do que migrar depois.

## CREATE TABLE

### Sintaxe Básica

```sql
CREATE TABLE table_name (
    column1 datatype constraints,
    column2 datatype constraints,
    ...
);
```

### Exemplo

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    age INTEGER CHECK (age >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Criando uma Tabela com Chave Estrangeira

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

> [!NOTE]
> No MySQL, `AUTO_INCREMENT` substitui `AUTOINCREMENT`. PostgreSQL usa `SERIAL` ou `GENERATED AS IDENTITY`. Sempre verifique o dialeto do seu RDBMS.

### IF NOT EXISTS

Previne erros se a tabela já existir:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT
);
```

## ALTER TABLE — Alterando a Estrutura da Tabela

### ADD COLUMN

```sql
ALTER TABLE users
ADD COLUMN phone VARCHAR(20);

-- Com restrições
ALTER TABLE users
ADD COLUMN bio TEXT DEFAULT '';
```

> [!SUCCESS]
> Adicionar uma coluna com valor `DEFAULT` é geralmente rápido. Adicionar uma coluna `NOT NULL` sem um padrão em uma tabela grande pode ser muito lento.

### MODIFY COLUMN (Alterando Tipo de Dado / Restrições)

```sql
-- MySQL / SQLite
ALTER TABLE users
MODIFY COLUMN age SMALLINT NOT NULL;

-- PostgreSQL
ALTER TABLE users
ALTER COLUMN age TYPE SMALLINT;
ALTER TABLE users
ALTER COLUMN age SET NOT NULL;
```

### RENAME COLUMN

```sql
-- PostgreSQL, SQLite 3.25+
ALTER TABLE users
RENAME COLUMN phone TO phone_number;

-- MySQL
ALTER TABLE users
CHANGE phone phone_number VARCHAR(20);
```

### DROP COLUMN

```sql
ALTER TABLE users
DROP COLUMN phone;
```

> [!WARNING]
> Excluir uma coluna é destrutivo e irreversível (fora de um backup ou transação). Alguns bancos de dados (SQLite < 3.35.0) exigem recriar a tabela para excluir uma coluna.

### RENAME TABLE

```sql
ALTER TABLE users RENAME TO customers;
```

## DROP TABLE — Removendo Tabelas

```sql
-- Remove permanentemente a tabela e todos os seus dados
DROP TABLE users;

-- Remove apenas se existir (sem erro)
DROP TABLE IF EXISTS users;
```

> [!WARNING]
> `DROP TABLE` não pode ser desfeito na maioria dos bancos de dados, a menos que esteja dentro de uma transação. Não há prompt de confirmação. Tenha absoluta certeza antes de executar isso em produção.

### DROP vs TRUNCATE vs DELETE

| Comando | Remove Dados | Remove Estrutura | Pode Desfazer | Reinicia Índices | Velocidade |
|---------|-------------|-------------------|---------------|------------------|------------|
| `DELETE` | Sim | Não | Sim | Não | Lento |
| `TRUNCATE` | Sim | Não | Sim* | Sim | Rápido |
| `DROP` | Sim | Sim | Sim* | Sim | Mais rápido |

*Na maioria dos bancos de dados se dentro de uma transação.

## Juntando Tudo: Construindo um Esquema

```sql
-- Passo 1: Criar o banco de dados (MySQL/PostgreSQL)
CREATE DATABASE ecommerce;

USE ecommerce;  -- MySQL
-- \c ecommerce  -- PostgreSQL

-- Passo 2: Criar tabelas
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Passo 3: Alterar após a criação (se necessário)
ALTER TABLE products ADD COLUMN sku VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN active BOOLEAN DEFAULT TRUE;
```

## Caso de Uso Real: Migração de Esquema

Imagine que você herdou uma tabela `customers` com uma única coluna `full_name`, mas agora precisa de nomes e sobrenomes separados:

```sql
-- 1. Adicionar novas colunas
ALTER TABLE customers ADD COLUMN first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN last_name VARCHAR(100);

-- 2. Popular a partir dos dados existentes
UPDATE customers
SET
    first_name = SUBSTR(full_name, 1, INSTR(full_name, ' ') - 1),
    last_name = SUBSTR(full_name, INSTR(full_name, ' ') + 1);

-- 3. (Opcional) Excluir a coluna antiga
ALTER TABLE customers DROP COLUMN full_name;
```

> [!NOTE]
> Em produção, alterações de esquema como exclusão de colunas devem ser feitas durante janelas de manutenção e testadas em uma cópia primeiro. Use uma ferramenta de migração (Flyway, Alembic, Liquibase) para rastrear alterações.

## Caso de Uso Real: Adicionando Auditoria

```sql
-- Adicionar rastreamento de timestamp a uma tabela existente
ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Criar um trigger para auto-atualizar na modificação (PostgreSQL / SQLite)
CREATE TRIGGER update_products_timestamp
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

## Perguntas de Prática

1. Escreva uma instrução CREATE TABLE para uma tabela `books` com colunas: id, title, author_id, published_year, isbn e uma chave estrangeira para `authors`.
2. O que `ALTER TABLE students ADD COLUMN gpa DECIMAL(3,2) DEFAULT 0.00;` faz?
3. Qual é a diferença entre `DROP TABLE` e `TRUNCATE TABLE`?
4. Escreva uma instrução ALTER para renomear a tabela `students` para `enrollees`.
5. Como você adicionaria uma restrição `UNIQUE` a uma coluna existente chamada `email`?
6. O que `CREATE TABLE IF NOT EXISTS` faz e por que é útil?
7. Escreva uma sequência de instruções ALTER que: adicione uma coluna `middle_name`, remova a coluna `nickname` e renomeie `full_name` para `display_name`.
8. Por que adicionar uma coluna `NOT NULL` sem um valor padrão é potencialmente problemático em tabelas grandes?
9. Escreva um CREATE TABLE para uma tabela `reviews` com uma chave estrangeira composta referenciando `(product_id, user_id)`.
10. O que acontece com os dados em uma tabela quando você executa `DROP TABLE products`?
