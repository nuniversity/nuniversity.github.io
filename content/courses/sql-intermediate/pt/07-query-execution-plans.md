---
title: "Planos de Execução de Consultas"
description: "Leia planos EXPLAIN, entenda varreduras sequenciais vs de índice, algoritmos de junção (NLJ, HASH, MERGE) e interprete custos de consulta"
order: 7
duration: "55 minutos"
difficulty: "intermediário"
---

# Planos de Execução de Consultas

Um plano de execução de consulta mostra exatamente como o banco de dados executará seu SQL. Aprender a ler planos de execução é a habilidade mais importante para otimização de consultas.

## Lendo Saída EXPLAIN

EXPLAIN mostra uma árvore de nós do plano. Cada nó tem um custo, linhas estimadas e largura de linha.

```sql
EXPLAIN
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE e.salary > 80000;
```

```
                                 QUERY PLAN
---------------------------------------------------------------------------
 Hash Join  (cost=12.50..45.20 rows=150 width=58)
   Hash Cond: (e.department_id = d.department_id)
   ->  Seq Scan on employees e  (cost=0.00..30.40 rows=150 width=34)
         Filter: (salary > 80000)
   ->  Hash  (cost=10.00..10.00 rows=200 width=32)
         ->  Seq Scan on departments d  (cost=0.00..10.00 rows=200 width=32)
```

Leia planos de execução **de dentro para fora e de baixo para cima**:

1. Escanear employees (filtrar salary > 80000) → 150 linhas
2. Escanear departments → 200 linhas, construir tabela hash
3. Hash Join dos dois resultados em department_id → 150 linhas

> [!NOTE]
> Leia planos de execução de dentro para fora, de baixo para cima. O nó mais externo (primeira linha) é o passo final que produz o resultado da consulta.

## Terminologia de Custo

| Termo | Significado | Faixa Típica |
|------|---------|---------------|
| `cost=0.00..30.40` | Custo estimado (inicialização..total) | Unidades arbitrárias |
| `rows=150` | Contagem estimada de linhas | Depende do tamanho da tabela |
| `width=34` | Largura média da linha em bytes | Depende das colunas |
| `actual time=0.015..0.030` | Tempo real (ms) | De EXPLAIN ANALYZE |
| `loops=1` | Vezes que o nó foi executado | >1 para nested loop interno |

Custo é uma unidade arbitrária que combina:
- **Custo de I/O**: páginas de disco lidas
- **Custo de CPU**: processamento de linhas, formatação de tuplas
- **Custo de memória**: tabelas hash, buffers de ordenação

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE order_date >= '2024-01-01'
  AND order_date < '2024-02-01';
```

```
Index Scan using idx_orders_date on orders
  (cost=0.28..12.50 rows=50 width=40)
  (actual time=0.018..0.042 rows=45 loops=1)
  Index Cond: (order_date >= '2024-01-01'::date)
  Planning Time: 0.058 ms
  Execution Time: 0.064 ms
```

A estimativa diz 50 linhas; o real foi 45 — uma boa estimativa. Grandes discrepâncias sugerem estatísticas desatualizadas.

## Varreduras Sequenciais vs Varreduras de Índice

### Varredura Sequencial (Seq Scan)

```
Seq Scan on large_table  (cost=0.00..1000.00 rows=50000 width=100)
```

Lê a tabela inteira do disco sequencialmente. Melhor quando:
- Lendo uma grande porcentagem de linhas (> 10-20%)
- A tabela é muito pequena
- Nenhum índice adequado existe

### Varredura de Índice (Index Scan)

```
Index Scan using idx_last_name on employees  (cost=0.28..4.29 rows=1 width=36)
  Index Cond: (last_name = 'Smith')
```

Navega pela árvore B-tree, então busca linhas correspondentes do heap. Melhor quando:
- Lendo uma pequena porcentagem de linhas
- Alta seletividade na coluna de filtro

### Varredura de Índice Bitmap (Bitmap Index Scan)

```
Bitmap Heap Scan on orders  (cost=12.50..45.20 rows=500 width=40)
  Recheck Cond: (status = 'shipped')
  ->  Bitmap Index Scan on idx_orders_status  (cost=0.00..10.00 rows=500 width=0)
        Index Cond: (status = 'shipped')
```

Combina múltiplas varreduras de índice em um bitmap na memória, então busca linhas do heap em ordem física. Melhor quando:
- Filtrando em múltiplas colunas indexadas
- Obtendo 5-20% das linhas (meio-termo entre Index Scan e Seq Scan)

> [!SUCCESS]
| Tipo de Varredura | % Acesso a Linhas | Uso Típico |
|-----------|-------------|-------------|
| Index Scan | < 5% | Buscas pontuais, alta seletividade |
| Bitmap Scan | 5-20% | Múltiplos filtros, seletividade moderada |
| Seq Scan | > 20% | Grandes porções da tabela, sem índice |

## Algoritmos de Junção

### Nested Loop Join (NLJ)

```sql
EXPLAIN SELECT * FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'USA';
```

```
Nested Loop  (cost=0.28..15.50 rows=10 width=80)
   ->  Seq Scan on customers c  (cost=0.00..5.00 rows=2 width=50)
         Filter: (country = 'USA')
   ->  Index Scan using idx_orders_customer on orders o
         (cost=0.28..5.25 rows=5 width=40)
         Index Cond: (customer_id = c.customer_id)
```

Para cada linha na tabela externa, escaneie a tabela interna. Complexidade: **O(N × M)**.

Melhor quando:
- Um lado é muito pequeno
- O lado interno tem um índice
- Juntando um pequeno número de linhas

### Hash Join

```
Hash Join  (cost=10.50..35.20 rows=1000 width=80)
   Hash Cond: (c.customer_id = o.customer_id)
   ->  Seq Scan on orders o  (cost=0.00..18.00 rows=1000 width=40)
   ->  Hash  (cost=8.00..8.00 rows=200 width=50)
         ->  Seq Scan on customers c  (cost=0.00..8.00 rows=200 width=50)
```

Constrói uma tabela hash na tabela menor, então consulta com a tabela maior. Complexidade: **O(N + M)**.

| Fase | Operação | Memória |
|-------|-----------|--------|
| Construção | Hash da tabela menor na memória | O(tabela menor) |
| Consulta | Escaneia tabela maior, consulta hash | O(tabela maior) |

Melhor quando:
- Juntando tabelas grandes e não indexadas
- Apenas condições de igualdade
- Um lado cabe na memória

### Merge Join

```
Merge Join  (cost=15.50..45.30 rows=1000 width=80)
   Merge Cond: (c.customer_id = o.customer_id)
   ->  Index Scan using customers_pkey on customers c
   ->  Index Scan using idx_orders_customer on orders o
```

Ambas as entradas devem estar ordenadas pela chave de junção. Complexidade: **O(N + M)**.

Melhor quando:
- Ambas as entradas já estão ordenadas (ex.: de varreduras de índice)
- Juntando em condições de não igualdade (`<`, `>`, `<=`)
- Tabelas grandes onde a tabela hash não cabe na memória

| Algoritmo | Condição | Prefere Índices | Memória |
|-----------|-----------|-----------------|--------|
| Nested Loop | Qualquer | Sim (interno) | Baixa |
| Hash Join | Apenas igualdade | Não | Alta |
| Merge Join | Igualdade + intervalo | Sim (ordenado) | Baixa |

## Analisando Consultas Lentas

```sql
-- Passo 1: EXPLAIN ANALYZE a consulta
EXPLAIN ANALYZE
SELECT o.order_id, c.name, p.product_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '7 days';
```

Sinais de alerta em planos de execução:

| Sinal Vermelho | O Que Significa | Correção |
|----------|---------------|-----|
| `Seq Scan` em tabela grande | Índice faltando ou não usado | Criar índice apropriado |
| `Sort` em conjunto grande de resultados | Sem índice para ORDER BY | Adicionar índice nas colunas de ordenação |
| Nested Loop com `Seq Scan` interno | Tabela interna não indexada | Indexar a coluna de junção |
| `Rows Removed by Filter` >> linhas retornadas | Seletividade ruim | Melhor índice ou reescrita da consulta |
| Grande discrepância: `rows=` vs `actual` | Estatísticas desatualizadas | Executar `ANALYZE` / `VACUUM` |

## Exemplo Real: Sessão de Ajuste de Consulta

```sql
-- Consulta lenta: 5 segundos
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.name
ORDER BY order_count DESC;

-- EXPLAIN mostra: Seq Scan em orders (100K linhas), Hash Join
-- Correção: adicionar índice
CREATE INDEX idx_orders_customer_date
ON orders(customer_id, created_at);

-- Após o índice: 50ms — 100x mais rápido
```

```sql
-- Outro padrão: subconsulta repetida
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products)
  AND category_id IN (SELECT id FROM categories WHERE active = true);

-- Melhor: reescrever com JOIN
SELECT p.*
FROM products p
INNER JOIN categories c ON p.category_id = c.id
CROSS JOIN (SELECT AVG(price) AS avg_price FROM products) stats
WHERE p.price > stats.avg_price AND c.active = true;
```

## Usando pg_stat_statements (PostgreSQL)

```sql
-- Encontrar as consultas mais caras
SELECT
    queryid,
    calls,
    total_exec_time / calls AS avg_time_ms,
    rows / calls AS avg_rows,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

> [!SUCCESS]
| Prioridade de Otimização | Impacto | Esforço |
|----------------------|--------|--------|
| Seq → Index scan em tabelas grandes | Alto | Baixo |
| Remover ordenações desnecessárias | Médio | Médio |
| Nested Loop → Hash Join | Alto | Baixo (adicionar índice) |
| Reescrever subconsultas complexas | Médio | Médio |
| Adicionar índices de cobertura | Alto | Médio |

Comece com as consultas que sua aplicação executa com mais frequência e otimize-as. Uma consulta que executa uma vez por noite é menos importante que uma que executa 1000 vezes por segundo.

## Perguntas de Prática

1. Como você lê um plano EXPLAIN? Em que direção (cima para baixo ou baixo para cima)?
2. O que significa `cost=0.28..12.50` em uma saída EXPLAIN?
3. Quando o banco de dados escolhe uma varredura sequencial em vez de uma varredura de índice?
4. O que é uma Bitmap Index Scan? Quando é usada?
5. Descreva os três principais algoritmos de junção e quando cada um é preferido.
6. Quais são os sinais de alerta para procurar em um plano de execução?
7. Escreva uma consulta EXPLAIN ANALYZE e explique cada parte da saída.
8. O que significa `Rows Removed by Filter`? Por que um valor alto é problemático?
9. Como você identifica uma consulta que se beneficiaria de um novo índice usando EXPLAIN?
10. Qual é a diferença entre `planning time` e `execution time` no EXPLAIN ANALYZE?
