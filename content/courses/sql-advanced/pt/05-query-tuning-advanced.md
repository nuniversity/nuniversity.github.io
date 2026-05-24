---
title: "Ajuste Avançado de Consultas"
description: "Domine análise avançada de EXPLAIN, dicas de índice, técnicas de reescrita de consultas, gerenciamento de estatísticas e diagnóstico sistemático de consultas lentas"
order: 5
duration: "120 minutos"
difficulty: advanced
---

# Ajuste Avançado de Consultas

## EXPLAIN Aprofundado

O plano de execução do otimizador de consultas revela cada passo que seu banco de dados executa.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT e.*, d.name
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE e.salary > 100000;
```

### Principais Nós do Plano

| Nó | Significado | Bandeiras Vermelhas |
|---|---|---|
| `Seq Scan` | Varredura completa da tabela | Tabelas grandes sem filtro |
| `Index Scan` | Busca por índice por valor | `rows=...` alto vs real |
| `Index Only Scan` | Todos os dados no índice | Raramente, inchaço do índice |
| `Bitmap Heap Scan` | Varredura de índice bitmap + busca no heap | Blocos `lossy` altos |
| `Nested Loop` | Para cada linha externa, sonda a interna | Ruim quando externo é grande |
| `Hash Join` | Construir tabela hash de um lado | Derramamento de memória para disco |
| `Merge Join` | Ordenar ambos os lados + mesclar | Ordenar grandes conjuntos |
| `Sort` | Ordenação explícita | Memória: `external merge Disk` |

### Lendo a Saída EXPLAIN

```text
Sort  (cost=184.32..189.45 rows=2050 width=36)
  Sort Key: e.salary DESC
  ->  Hash Join  (cost=45.12..78.23 rows=2050 width=36)
        Hash Cond: (e.department_id = d.id)
        ->  Seq Scan on employees e
              Filter: (salary > 100000)
        ->  Hash  (cost=30.10..30.10 rows=1200 width=18)
              ->  Seq Scan on departments d
```

- **cost**: Primeiro número = custo de inicialização, segundo = custo total (unidades arbitrárias).
- **rows**: Número estimado de linhas (compare com `actual rows` no `ANALYZE`).
- **width**: Largura média da linha em bytes.

[!WARNING]
Sempre use `ANALYZE` para obter linhas reais vs estimadas. Uma grande discrepância indica estatísticas desatualizadas ou uma estimativa de cardinalidade pobre.

## Gerenciamento de Estatísticas

```sql
-- Atualizar estatísticas
ANALYZE employees;

-- Atualizar estatísticas para uma coluna específica
ANALYZE employees (salary);

-- Definir alvo de estatísticas da coluna (maior = histograma mais detalhado)
ALTER TABLE employees ALTER COLUMN salary SET STATISTICS 1000;

-- Visualizar estatísticas
SELECT tablename, attname, n_distinct, most_common_vals, histogram_bounds
FROM pg_stats
WHERE tablename = 'employees';
```

### Quando as Estatísticas Ficam Desatualizadas

```sql
-- Verificar última vez analisada
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'orders';

-- Forçar análise em uma tabela movimentada
ANALYZE orders;
```

## Estratégias de Índice

### Ordem das Colunas em Índice Composto

Coloque a coluna mais seletiva primeiro, depois a coluna de ordenação.

```sql
-- Bom para: WHERE department_id = ? ORDER BY salary DESC
CREATE INDEX idx_dept_salary ON employees (department_id, salary DESC);

-- Ruim: coluna de ordenação primeiro — não pode usar índice para igualdade + ordenação
CREATE INDEX idx_salary_dept ON employees (salary, department_id);
```

### Índices Parciais

```sql
-- Indexar apenas pedidos ativos
CREATE INDEX idx_active_orders ON orders (order_date)
WHERE status = 'active';

-- Consulta que o utiliza
SELECT * FROM orders
WHERE status = 'active' AND order_date > '2024-01-01';
```

### Índices de Cobertura (Colunas Include)

```sql
-- Índice cobre a consulta sem tocar na tabela
CREATE INDEX idx_covering ON employees (department_id, salary)
INCLUDE (first_name, last_name);

-- Agora esta consulta pode usar Index Only Scan:
SELECT first_name, last_name, salary
FROM employees
WHERE department_id = 10;
```

### Índices de Expressão

```sql
-- Acelerar consultas em colunas transformadas
CREATE INDEX idx_lower_email ON users (LOWER(email));

-- Consulta
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';
```

## Técnicas de Reescrita de Consultas

### 1. Converter Subconsultas para JOINs

```sql
-- Lento
SELECT * FROM products
WHERE category_id IN (
    SELECT id FROM categories WHERE active = true
);

-- Rápido (mesma semântica)
SELECT p.*
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.active = true;
```

[!NOTE]
`IN (subconsulta)` pode ser mais lento que `JOIN` porque a subconsulta é materializada. No entanto, `IN` lida com NULLs de forma diferente — teste para equivalência semântica.

### 2. Use EXISTS em Vez de COUNT(*)

```sql
-- Lento
SELECT * FROM customers c
WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) > 0;

-- Rápido
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

### 3. Evite Funções em Cláusulas WHERE

```sql
-- Ruim: DATE() em cada linha impede uso de índice
SELECT * FROM orders
WHERE DATE(order_date) = '2024-01-15';

-- Bom: consulta de intervalo usa índice
SELECT * FROM orders
WHERE order_date >= '2024-01-15' AND order_date < '2024-01-16';
```

### 4. Use UNION ALL em Vez de OR

```sql
-- OR nem sempre pode usar índices eficientemente
SELECT * FROM employees
WHERE department_id = 5 OR status = 'active';

-- UNION ALL com índices separados
SELECT * FROM employees WHERE department_id = 5
UNION ALL
SELECT * FROM employees WHERE status = 'active' AND department_id <> 5;
```

## Identificando Consultas Lentas

```sql
-- PostgreSQL: consultas em execução no momento
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Consultas de execução mais longa (acumuladas)
SELECT queryid, query, calls, mean_exec_time, rows,
       shared_blks_hit, shared_blks_read, shared_blks_dirtied
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Gargalos Comuns

| Sintoma | Causa Provável | Correção |
|---|---|---|
| `Seq Scan` em tabela grande | Índice ausente | Adicionar índice na coluna de filtro |
| `Sort` com `external merge Disk` | Memória de ordenação excedida | Aumentar `work_mem` |
| `Nested Loop` com muitas iterações | Ordem de junção errada | Aumentar alvo de estatísticas, reescrever consulta |
| `Hash Join` derramando para disco | `work_mem` insuficiente | Aumentar `work_mem` ou ajustar hash_mem_multiplier |
| `Bitmap Heap Scan` com muitas páginas `lossy` | `work_mem` muito baixo para bitmap | Aumentar `work_mem` |

## Estudos de Caso Práticos

### Caso 1: Paginação com OFFSET

```sql
-- Lento para offsets altos (OFFSET 100000)
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;

-- Paginação por chave (rápida)
SELECT * FROM orders
WHERE id > 100000
ORDER BY id
FETCH FIRST 20 ROWS ONLY;
```

### Caso 2: Otimização de COUNT

```sql
-- Muito lento em tabelas grandes
SELECT COUNT(*) FROM orders;

-- Usar contagens estimadas para painéis
-- PostgreSQL: contagem aproximada via estatísticas
SELECT reltuples::BIGINT AS estimated_count
FROM pg_class WHERE relname = 'orders';
```

### Caso 3: UPDATE com JOIN

```sql
-- Lento: subconsulta correlacionada
UPDATE products p
SET last_sale_date = (
    SELECT MAX(sale_date)
    FROM sales s
    WHERE s.product_id = p.id
);

-- Rápido: usar cláusula FROM
UPDATE products p
SET last_sale_date = t.max_date
FROM (
    SELECT product_id, MAX(sale_date) AS max_date
    FROM sales
    GROUP BY product_id
) t
WHERE t.product_id = p.id;
```

## Ajuste de Configuração

```sql
-- Memória de trabalho para ordenações
SET work_mem = '64MB';

-- Tamanho efetivo do cache (para estimativas do planejador)
SET effective_cache_size = '4GB';

-- Workers de consulta paralela
SET max_parallel_workers_per_gather = 4;

-- Limiar do otimizador genético de consultas (GEQO)
SET geqo_threshold = 12;
```

[!TIP]
Configurações como `work_mem` aplicam-se por operação, por consulta. Uma consulta com 10 operações de ordenação usa 10× `work_mem`. Monitore a pressão de memória.

## Perguntas de Prática

1. O que `EXPLAIN (ANALYZE, BUFFERS)` mostra que o `EXPLAIN` simples não mostra?
2. Dada uma saída `EXPLAIN ANALYZE` com `rows=1000` mas `actual rows=10`, qual é o provável problema?
3. Escreva uma consulta para encontrar as 10 consultas mais lentas em um banco PostgreSQL usando `pg_stat_statements`.
4. Qual é a diferença entre um índice parcial e um índice de cobertura? Dê um exemplo de cada.
5. Reescreva esta consulta lenta para melhor performance: `SELECT * FROM orders WHERE DATE(created_at) = CURRENT_DATE`.
6. Como você identificaria e corrigiria uma consulta que usa Seq Scan em uma tabela com 10M linhas filtrando por `status = 'active'`?
7. Explique os trade-offs da ordenação de colunas em índices compostos. Dê um exemplo de ordem boa e ruim.
8. Converta esta consulta lenta usando COUNT para EXISTS: `SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE user_id = users.id) > 5`.
9. O que é paginação por chave e por que é mais rápida que paginação baseada em OFFSET?
10. Você vê `Sort Method: external merge Disk: 2048kB` no EXPLAIN ANALYZE. O que significa e como corrigir?
