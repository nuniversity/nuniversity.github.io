---
title: "Tipos de Dados e Restrições SQL"
description: "Aprofunde-se em tipos de dados SQL (INT, VARCHAR, TEXT, DATE, DECIMAL) e restrições (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT)"
order: 7
duration: "20-30 minutos"
difficulty: "beginner"
---

# Tipos de Dados e Restrições SQL

Escolher o tipo de dado correto e aplicar restrições apropriadas garante integridade dos dados, otimiza armazenamento e previne bugs em aplicações.

## Tipos de Dados SQL

### Tipos Numéricos

| Tipo | Armazenamento | Faixa / Precisão | Caso de Uso |
|------|---------------|-------------------|-------------|
| `INTEGER` / `INT` | 4 bytes | -2^31 a 2^31-1 | Contagens, IDs, idades |
| `SMALLINT` | 2 bytes | -32.768 a 32.767 | Faixas pequenas, códigos de status |
| `BIGINT` | 8 bytes | -2^63 a 2^63-1 | Contadores grandes, IDs grandes |
| `DECIMAL(p,s)` | Variável | Precisão exata | Dinheiro, medições científicas |
| `REAL` / `FLOAT` | 4-8 bytes | Aproximado | Percentagens, médias (não dinheiro!) |

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,  -- 10 dígitos, 2 após o decimal
    rating DECIMAL(3,2),            -- ex. 4.75
    stock SMALLINT DEFAULT 0
);
```

> [!WARNING]
> Nunca use `FLOAT` ou `REAL` para valores monetários. Erros de arredondamento de ponto flutuante (ex.: 0.1 + 0.2 = 0.30000000000000004) causarão discrepâncias contábeis. Sempre use `DECIMAL`.

### Tipos de Caractere/String

| Tipo | Descrição | Caso de Uso |
|------|-----------|-------------|
| `CHAR(n)` | Comprimento fixo, preenchido com espaços | Códigos, CEPs, hashes |
| `VARCHAR(n)` | Comprimento variável com máximo | Nomes, emails, endereços |
| `TEXT` | Comprimento ilimitado | Artigos, descrições, JSON |

```sql
CREATE TABLE articles (
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    body TEXT,
    excerpt VARCHAR(500)
);
```

> [!NOTE]
> `VARCHAR(255)` é um padrão comum porque 255 é o comprimento máximo que pode ser codificado com um prefixo de um byte. Use `TEXT` quando o conteúdo puder exceder algumas centenas de caracteres.

### Tipos de Data/Hora

| Tipo | Formato | Exemplo | Precisão |
|------|---------|---------|----------|
| `DATE` | YYYY-MM-DD | 2024-01-15 | Dia |
| `TIME` | HH:MM:SS | 14:30:00 | Segundo |
| `TIMESTAMP` | YYYY-MM-DD HH:MM:SS | 2024-01-15 14:30:00 | Segundo (ou sub-segundo) |
| `DATETIME` | YYYY-MM-DD HH:MM:SS | 2024-01-15 14:30:00 | Sem fuso horário (MySQL) |

```sql
CREATE TABLE events (
    event_name VARCHAR(200),
    event_date DATE,
    start_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Outros Tipos Úteis

| Tipo | Caso de Uso |
|------|-------------|
| `BOOLEAN` | Flags verdadeiro/falso |
| `BLOB` | Dados binários (imagens, arquivos) |
| `JSON` | Dados aninhados estruturados (PostgreSQL, MySQL) |
| `UUID` | Identificadores universalmente únicos |
| `ENUM` | Lista fixa de valores (MySQL) |

## Restrições

Restrições impõem regras sobre os dados em suas tabelas.

### NOT NULL

Garante que uma coluna não pode conter NULL:

```sql
CREATE TABLE users (
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL
);
```

```sql
-- Isto falhará
INSERT INTO users (name) VALUES ('Alice');  -- email é NULL, viola NOT NULL
```

### UNIQUE

Garante que todos os valores em uma coluna (ou combinação de colunas) são distintos:

```sql
CREATE TABLE users (
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE
);
```

```sql
-- Isto falhará
INSERT INTO users (email, username) VALUES ('a@x.com', 'alice');
INSERT INTO users (email, username) VALUES ('b@x.com', 'alice');  -- username duplicado
```

> [!SUCCESS]
> `UNIQUE` também cria um índice, tornando as buscas rápidas. Use-o para chaves naturais como email, nome de usuário ou SKU.

### PRIMARY KEY

Identifica exclusivamente cada linha. Combina `NOT NULL` + `UNIQUE`. Uma tabela pode ter apenas uma:

```sql
-- PK de coluna única
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL
);

-- PK composta (múltiplas colunas)
CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)
);
```

### FOREIGN KEY

Vincula linhas entre tabelas e mantém a **integridade referencial**:

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
```

#### Ações Relacionais

| Ação | On Delete | On Update |
|------|-----------|-----------|
| `CASCADE` | Excluir linhas filhas | Atualizar valores FK filhos |
| `SET NULL` | Definir FK filho como NULL | Definir FK filho como NULL |
| `RESTRICT` | Impedir exclusão do pai | Impedir atualização do pai |
| `NO ACTION` | Mesmo que RESTRICT (verificável adiado) |
| `SET DEFAULT` | Definir para valor padrão | Definir para valor padrão |

```sql
-- Se o usuário for excluído, seus pedidos também são excluídos
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Se o usuário for excluído, os pedidos mantêm user_id como NULL
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
```

> [!WARNING]
> `ON DELETE CASCADE` é poderoso, mas perigoso. Excluir acidentalmente uma linha pai pode eliminar milhares de linhas filhas silenciosamente. Use com cautela.

### CHECK

Valida que os valores atendem a uma condição:

```sql
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    salary DECIMAL(10,2) CHECK (salary > 0),
    age INTEGER CHECK (age >= 16 AND age <= 120),
    department VARCHAR(50) CHECK (department IN ('Engineering', 'Sales', 'HR'))
);
```

```sql
-- Isto falhará
INSERT INTO employees (salary, age, department)
VALUES (-500, 150, 'Gaming');  -- salário negativo, idade excessiva, departamento inválido
```

### DEFAULT

Define um valor quando nenhum é fornecido:

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    currency VARCHAR(3) DEFAULT 'USD'
);
```

```sql
INSERT INTO orders (id) VALUES (1);
-- status = 'pending', created_at = agora, currency = 'USD'
```

## Tudo Junto: Uma Tabela Bem Projetada

```sql
CREATE TABLE accounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin', 'moderator')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    balance     DECIMAL(12,2) NOT NULL DEFAULT 0.00
                    CHECK (balance >= 0),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP
);
```

## Caso de Uso Real: Prevenindo Dados Ruins

```sql
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (user_id, product_id)  -- uma avaliação por usuário por produto
);
```

Esta tabela garante:
- A avaliação está sempre entre 1 e 5
- Sem avaliações NULL
- Uma avaliação por usuário por produto
- Se um usuário/produto for excluído, as avaliações são limpas
- A avaliação tem um timestamp de criação

> [!SUCCESS]
> Restrições são sua primeira linha de defesa contra dados ruins. Defina-as no nível do banco de dados, não apenas no código da sua aplicação. As restrições do banco de dados se aplicam em todos os lugares — mesmo se alguém escrever um INSERT com bugs ou conectar-se de uma ferramenta diferente.

## Perguntas de Prática

1. Que tipo de dado você deve usar para uma coluna que armazena preços de produtos? Por quê?
2. Escreva uma instrução CREATE TABLE para `students` com: id (PK), email (único, não nulo), age (verificar 0-150), enrollment_date (padrão hoje).
3. Qual é a diferença entre `CHAR(10)` e `VARCHAR(10)`?
4. O que `ON DELETE CASCADE` faz? Dê um exemplo onde é apropriado.
5. Escreva uma restrição CHECK que garanta que uma coluna `discount` esteja entre 0 e 100 (inclusive).
6. Uma tabela pode ter múltiplas restrições PRIMARY KEY? Pode ter múltiplas restrições UNIQUE?
7. O que acontece com as linhas filhas quando uma linha pai é excluída com `ON DELETE SET NULL`?
8. Escreva uma tabela `enrollments` com uma chave primária composta em `(student_id, course_id)` e chaves estrangeiras para ambas as tabelas.
9. Por que você deve evitar `FLOAT` para colunas monetárias?
10. Qual é a diferença de armazenamento entre `INTEGER` e `SMALLINT`? Quando você escolheria um sobre o outro?
