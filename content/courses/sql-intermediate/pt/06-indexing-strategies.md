---
title: "Estratégias de Indexação"
description: "Domine CREATE INDEX, índices compostos, índices de cobertura, B-tree vs hash e fundamentos de EXPLAIN"
order: 6
duration: "50 minutos"
difficulty: "intermediário"
---

# Estratégias de Indexação

Índices são estruturas de dados que aceleram a recuperação de dados ao custo de escritas mais lentas e maior armazenamento. Entender indexação é essencial para construir aplicações de banco de dados performáticas.

## Como Índices Funcionam

Sem um índice, o banco de dados realiza uma varredura sequencial — lendo cada linha da tabela. Com um índice, o banco de dados navega em uma árvore (tipicamente B+Tree) para encontrar linhas em tempo logarítmico.

```
Varredura Completa:  [Linha 1] [Linha 2] [Linha 3] ... [Linha 1.000.000]
                     └── Ler todas as linhas ──┘

Busca por Índice:    Raiz ──> Ramo ──> Folha ──> Heap (dados da linha)
                     4 I/Os vs 1.000.000 I/Os
```

> [!NOTE]
> Um índice em uma tabela de 1M linhas tipicamente requer ~3-5 níveis de B+Tree, significando 3-5 leituras de disco para encontrar qualquer linha. Uma varredura completa leria 1M linhas.

## CREATE INDEX

```sql
-- Índice básico em uma única coluna
CREATE INDEX idx_employees_last_name
ON employees(last_name);

-- Índice único (impõe unicidade, atua como restrição)
CREATE UNIQUE INDEX idx_employees_email
ON employees(email);

-- Índice em uma expressão
CREATE INDEX idx_customers_lower_email
ON customers(LOWER(email));

-- Índice parcial (apenas indexa linhas relevantes)
CREATE INDEX idx_orders_active
ON orders(order_date)
WHERE status = 'active';
```

| Tipo de Índice | Caso de Uso |
|------------|----------|
| B-tree (padrão) | Consultas de igualdade e intervalo |
| Hash | Apenas igualdade (mais rápido para correspondência exata) |
| GiST | Busca de texto completo, dados geométricos |
| GIN | Arrays, JSONB, busca de texto completo |
| BRIN | Tabelas grandes fisicamente ordenadas |

> [!NOTE]
> A maioria dos bancos de dados usa B-tree como padrão, que é adequado para igualdade (`=`), intervalo (`>`, `<`, `BETWEEN`) e consultas `ORDER BY`.

## Índices Compostos

Um índice composto cobre múltiplas colunas. A ordem das colunas importa enormemente.

```sql
-- Índice composto em (country, city)
CREATE INDEX idx_customers_country_city
ON customers(country, city);
```

### Melhores Práticas de Ordem de Colunas

```sql
-- Consulta: Encontrar clientes nos EUA de Nova York
SELECT * FROM customers
WHERE country = 'USA' AND city = 'New York';
--  Funciona: ambas as colunas no índice, igualdade em ambas

-- Consulta: Encontrar todos os clientes nos EUA
SELECT * FROM customers
WHERE country = 'USA';
--  Funciona: a coluna mais à esquerda é filtrada

-- Consulta: Encontrar clientes chamados 'New York' em qualquer país
SELECT * FROM customers
WHERE city = 'New York';
--  Falha: a coluna mais à esquerda (country) não é filtrada
```

| Regra | Exemplo |
|------|---------|
| Coloque colunas de igualdade primeiro | `WHERE country = 'USA' AND city = 'NY'` → índice em `(country, city)` |
| Coloque colunas de intervalo por último | `WHERE country = 'USA' AND age > 21` → índice em `(country, age)` |
| Coluna mais seletiva primeiro | Coluna com mais valores distintos primeiro |

```sql
-- Bom: seletividade guia a ordem
CREATE INDEX idx_orders_customer_date
ON orders(customer_id, order_date);
--  customer_id tem 10K valores distintos, order_date tem 365

-- Ruim: ordem invertida
CREATE INDEX idx_orders_date_customer
ON orders(order_date, customer_id);
--  O intervalo em date não consegue restringir eficazmente antes de customer_id
```

## Índices de Cobertura

Um índice de cobertura contém todas as colunas necessárias para uma consulta, eliminando a necessidade de ler a tabela (heap) completamente.

```sql
-- Sem cobertura: ler índice + ler linha da tabela
EXPLAIN SELECT name, email FROM employees WHERE department_id = 5;
-- Index Scan on idx_emp_dept → Busca no Heap para name, email

-- Índice de cobertura: tudo no índice
CREATE INDEX idx_emp_dept_covering
ON employees(department_id) INCLUDE (name, email);

EXPLAIN SELECT name, email FROM employees WHERE department_id = 5;
-- Index Only Scan — sem acesso ao heap necessário
```

> [!SUCCESS]
| Cenário | Índice Regular | Índice de Cobertura |
|----------|--------------|----------------|
| `SELECT *` | Deve buscar heap | Deve buscar heap |
| `SELECT colunas_indexadas` | Busca heap | Index-only |
| Desempenho de escrita | Leve overhead | Mais overhead |
| Espaço em disco | Menos | Mais |

Use `INCLUDE` para colunas que são retornadas mas não usadas em condições de busca/filtro.

## Índices B-Tree vs Hash

```sql
-- B-tree (padrão para a maioria dos bancos de dados)
CREATE INDEX idx_btree ON products(price);
-- Suporta: =, >, <, >=, <=, BETWEEN, LIKE (prefixo sem caractere curinga)

-- Hash (apenas correspondência exata, mas mais rápido para isso)
CREATE INDEX idx_hash ON products(price) USING HASH;
-- Suporta: = apenas
```

| Característica | B-Tree | Hash |
|---------|--------|------|
| Igualdade | Rápido | Mais rápido |
| Consultas de intervalo | Suportadas | Não suportadas |
| ORDER BY | Pode retornar ordenado | Sem ordenação |
| LIKE 'prefixo%' | Suportado | Não suportado |
| Uso de disco | Moderado | Geralmente menor |
| Tempo de construção | Moderado | Mais rápido |

> [!WARNING]
> Índices Hash não eram seguros contra falhas em versões antigas do PostgreSQL. Agora eles têm WAL logging e são seguros. Sempre verifique a implementação específica do seu banco de dados antes de usar índices hash em produção.

## Fundamentos de EXPLAIN

EXPLAIN mostra como o banco de dados planeja executar uma consulta.

```sql
EXPLAIN SELECT * FROM employees WHERE department_id = 5;

-- Exemplo de saída:
-- Seq Scan on employees  (cost=0.00..1834.00 rows=1 width=36)
--   Filter: (department_id = 5)
```

Com um índice:

```sql
CREATE INDEX idx_emp_dept ON employees(department_id);

EXPLAIN SELECT * FROM employees WHERE department_id = 5;

-- Saída:
-- Index Scan using idx_emp_dept on employees  (cost=0.28..4.29 rows=1 width=36)
--   Index Cond: (department_id = 5)
```

### EXPLAIN ANALYZE

EXPLAIN ANALYZE realmente executa a consulta e mostra tempos reais.

```sql
EXPLAIN ANALYZE SELECT * FROM employees WHERE department_id = 5;

-- Saída:
-- Index Scan using idx_emp_dept on employees
--   (cost=0.28..4.29 rows=1 width=36)
--   (actual time=0.015..0.016 rows=1 loops=1)
--   Index Cond: (department_id = 5)
-- Planning Time: 0.068 ms
-- Execution Time: 0.030 ms
```

| Termo | Significado |
|------|---------|
| `cost=0.28..4.29` | Custo estimado (inicialização..total) |
| `rows=1` | Linhas estimadas retornadas |
| `width=36` | Largura estimada da linha em bytes |
| `actual time=0.015..0.016` | Tempo real de execução |
| `loops=1` | Vezes que o nó foi executado |

## Quando NÃO Indexar

| Cenário | Motivo |
|----------|--------|
| Tabelas pequenas (< 1000 linhas) | Varredura completa é mais rápida que overhead de índice |
| Colunas de baixa cardinalidade (gender, boolean) | Índice não filtra o suficiente |
| Colunas raramente usadas em WHERE/JOIN | Índice não é usado, desperdiça espaço |
| Tabelas com muitas escritas | Manutenção do índice reduz INSERT/UPDATE/DELETE |
| Consultas `LIKE '%texto%'` (prefixo curinga) | B-tree não pode ajudar |

```sql
-- Índice ruim: baixa cardinalidade
CREATE INDEX idx_employees_gender ON employees(gender);
-- Apenas 2 valores distintos — o banco de dados ainda vai escanear

-- Índice bom: alta cardinalidade
CREATE INDEX idx_employees_ssn ON employees(ssn);
-- Milhões de valores distintos — altamente seletivo
```

## Exemplo Real: Otimização de Consulta de E-Commerce

```sql
-- Consulta lenta (sem índice útil)
SELECT order_id, customer_id, total, order_date
FROM orders
WHERE status = 'pending'
  AND order_date >= '2024-01-01'
  AND order_date < '2024-02-01'
ORDER BY total DESC;

-- Varredura sequencial em orders (lenta)

-- Índice otimizado
CREATE INDEX idx_orders_status_date_total
ON orders(status, order_date DESC, total DESC)
INCLUDE (customer_id);

-- Agora: Index Only Scan, rápido
```

> [!SUCCESS]
> Índices são compensações. Cada índice acelera leituras mas retarda escritas. Comece com índices em chaves primárias e chaves estrangeiras usadas em JOINs, depois adicione índices baseado nas suas consultas mais lentas. Meça antes e depois.

## Perguntas de Prática

1. O que é um índice B-tree e quais operações ele suporta?
2. Escreva uma declaração CREATE INDEX para uma tabela `employees` na coluna `last_name`.
3. O que é um índice composto? Por que a ordem das colunas importa?
4. Dado `WHERE country = 'Canada' AND status = 'active' AND created_at > '2024-01-01'`, que índice composto você criaria?
5. O que é um índice de cobertura? Como ele difere de um índice regular?
6. Quando você usaria um índice hash em vez de um índice B-tree?
7. Qual é a diferença entre EXPLAIN e EXPLAIN ANALYZE?
8. O que significa `Index Only Scan` em uma saída de EXPLAIN?
9. Liste três situações onde você NÃO deve criar um índice.
10. Escreva um índice de cobertura para a consulta `SELECT first_name, last_name FROM employees WHERE department_id = 10`.
