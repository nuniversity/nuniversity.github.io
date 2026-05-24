---
title: "Particionamento de Tabelas e Sharding"
description: "Domine particionamento de tabelas (RANGE, LIST, HASH), poda de partições, estratégias de sharding e métodos de distribuição de dados em escala"
order: 6
duration: "120 minutos"
difficulty: advanced
---

# Particionamento de Tabelas e Sharding

## Particionamento vs Sharding

| Aspecto | Particionamento | Sharding |
|---|---|---|
| Escopo | Banco de dados único | Múltiplos bancos/nós |
| Transparência | Transparente para a aplicação | App pode precisar de conhecimento |
| Complexidade | Baixa (gerenciado pelo banco) | Alta (roteamento, re-sharding) |
| Escalonamento | Limitado por um servidor | Horizontal (adicionar mais nós) |
| Consultas entre partições | Suportadas | Complexas (joins distribuídos) |

## Particionamento de Tabelas

Divide uma tabela grande em partes físicas menores enquanto expõe uma única tabela lógica.

### Quando Particionar

| Critério | Limiar |
|---|---|
| Tamanho da tabela | > 100 GB ou > 100M linhas |
| Janela de manutenção | Não pode ser concluída no tempo disponível |
| Limpeza de dados antigos | `DELETE` regular de dados históricos |
| Padrão de consulta | Filtros em uma chave de partição |

## Particionamento RANGE

Os dados são divididos em faixas com base em um valor de coluna.

```sql
CREATE TABLE orders (
    order_id BIGSERIAL,
    order_date DATE NOT NULL,
    customer_id INT,
    total NUMERIC(10,2)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2023_q1 PARTITION OF orders
    FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');

CREATE TABLE orders_2023_q2 PARTITION OF orders
    FOR VALUES FROM ('2023-04-01') TO ('2023-07-01');

CREATE TABLE orders_2023_q3 PARTITION OF orders
    FOR VALUES FROM ('2023-07-01') TO ('2023-10-01');

CREATE TABLE orders_2023_q4 PARTITION OF orders
    FOR VALUES FROM ('2023-10-01') TO ('2024-01-01');

CREATE TABLE orders_future PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('9999-01-01');
```

### Partição por Data (Mensal)

```sql
CREATE TABLE logs (
    log_id BIGSERIAL,
    created_at TIMESTAMPTZ NOT NULL,
    message TEXT
) PARTITION BY RANGE (created_at);

-- Gerar partições mensalmente (use um script ou pg_partman)
SELECT create_range_partition('logs', '2024-01-01', '2024-02-01');
```

## Particionamento LIST

Os dados são divididos por valores discretos.

```sql
CREATE TABLE sales (
    sale_id BIGSERIAL,
    region TEXT NOT NULL,
    amount NUMERIC
) PARTITION BY LIST (region);

CREATE TABLE sales_na PARTITION OF sales
    FOR VALUES IN ('US', 'CA', 'MX');

CREATE TABLE sales_eu PARTITION OF sales
    FOR VALUES IN ('UK', 'DE', 'FR', 'IT', 'ES');

CREATE TABLE sales_apac PARTITION OF sales
    FOR VALUES IN ('JP', 'CN', 'KR', 'AU', 'IN');

CREATE TABLE sales_other PARTITION OF sales
    DEFAULT;
```

## Particionamento HASH

Distribui linhas uniformemente entre as partições usando uma função hash.

```sql
CREATE TABLE user_sessions (
    session_id UUID NOT NULL,
    user_id BIGINT,
    payload JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE user_sessions_p0 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE user_sessions_p1 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE user_sessions_p2 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE user_sessions_p3 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

[!NOTE]
O particionamento HASH é ideal para distribuir uniformemente a carga de escrita no armazenamento. É ruim para consultas de intervalo — uma consulta filtrando `user_id BETWEEN 1000 AND 2000` examinará todas as partições.

## Subparticionamento

Partições dentro de partições.

```sql
CREATE TABLE measurements (
    sensor_id INT,
    recorded_at DATE,
    value NUMERIC
) PARTITION BY RANGE (recorded_at);

-- Primeiro nível: trimestral
CREATE TABLE measurements_2024_q1 PARTITION OF measurements
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01')
    PARTITION BY LIST (sensor_id);

-- Segundo nível: por grupo de sensor
CREATE TABLE measurements_2024_q1_sensors_1_100 PARTITION OF measurements_2024_q1
    FOR VALUES IN (1, 2, 3, /* ... */ 100);

CREATE TABLE measurements_2024_q1_sensors_101_200 PARTITION OF measurements_2024_q1
    FOR VALUES IN (101, 102, /* ... */ 200);
```

## Poda de Partições

O planejador de consultas ignora partições irrelevantes automaticamente.

```sql
-- Examina apenas orders_2023_q4 e orders_future
EXPLAIN SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-02-01';
```

```text
Append
  Subplans Removed: 4
  ->  Seq Scan on orders_future
        Filter: ((order_date >= '2024-01-01') AND (order_date <= '2024-02-01'))
```

### Quando a Poda Falha

```sql
-- SEM poda: função na chave de partição
EXPLAIN SELECT * FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024;

-- Com poda: comparação direta
EXPLAIN SELECT * FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';
```

## Gerenciamento de Partições

### Adicionando Partições

```sql
-- Adicionar nova partição para dados futuros
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### Desanexando e Arquivando

```sql
-- Desanexar partição antiga (sem perda de dados)
ALTER TABLE orders DETACH PARTITION orders_2023_q1;

-- Anexar a uma tabela diferente ou arquivar
CREATE TABLE orders_archive (LIKE orders INCLUDING DEFAULTS);
ALTER TABLE orders_archive ATTACH PARTITION orders_2023_q1
    FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');
```

### Removendo Partições

```sql
-- Muito mais rápido que DELETE
DROP TABLE orders_2023_q1;
```

### Dividindo uma Partição

```sql
-- PostgreSQL: dividir via DETACH + novas partições
ALTER TABLE orders DETACH PARTITION orders_2023_q2;

CREATE TABLE orders_2023_apr PARTITION OF orders
    FOR VALUES FROM ('2023-04-01') TO ('2023-05-01');
CREATE TABLE orders_2023_may PARTITION OF orders
    FOR VALUES FROM ('2023-05-01') TO ('2023-06-01');
CREATE TABLE orders_2023_jun PARTITION OF orders
    FOR VALUES FROM ('2023-06-01') TO ('2023-07-01');

INSERT INTO orders_2023_apr SELECT * FROM orders_2023_q2
    WHERE order_date >= '2023-04-01' AND order_date < '2023-05-01';
-- ... repetir para may, jun
DROP TABLE orders_2023_q2;
```

## Estratégias de Sharding

### Sharding Vertical

Dividir tabelas por domínio entre bancos de dados.

```sql
-- Banco 1: user_db
CREATE TABLE users (user_id SERIAL, name TEXT, email TEXT);
CREATE TABLE profiles (user_id INT, bio TEXT);

-- Banco 2: order_db
CREATE TABLE orders (order_id SERIAL, user_id INT, total NUMERIC);
```

### Sharding Horizontal

Dividir linhas da mesma tabela entre bancos de dados.

### Sharding a Nível de Aplicação

```python
def get_shard(user_id):
    shard_id = user_id % SHARD_COUNT
    return connections[shard_id]

# Uso
conn = get_shard(user_id)
conn.execute("SELECT * FROM orders WHERE user_id = ?", (user_id,))
```

### Sharding Baseado em Proxy (ex: Vitess, Citus)

```sql
-- Citus: distribuir tabela entre nós workers
SELECT create_distributed_table('orders', 'user_id');

-- Consultas são roteadas transparentemente
SELECT * FROM orders WHERE user_id = 42;  -- atinge um shard
```

## Métodos de Distribuição

| Método | Algoritmo | Prós | Contras |
|---|---|---|---|
| Módulo | `id % N` | Simples, uniforme se N é potência de 2 | Re-sharding move todos os dados |
| Hashing Consistente | Baseado em anel | Movimento mínimo de dados no re-shard | Implementação complexa |
| Baseado em faixa | Faixas de valor | Natural para séries temporais | Pontos quentes possíveis |
| Baseado em diretório | Tabela de consulta | Flexível, re-shard fácil | Ponto único de falha |

## Exemplos Práticos

### Exemplo 1: Sistema de Arquivo Baseado em Tempo

```sql
-- Partições mensais com criação automática via pg_partman
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
    p_parent_table := 'public.logs',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := '1 month',
    p_start_partition := '2024-01-01'
);

-- Cria automaticamente partições:
-- logs_202401, logs_202402, logs_202403, ...
```

### Exemplo 2: Sharding Multi-Tenant

```sql
-- Bancos por inquilino
-- tenant_1.orders, tenant_2.orders, etc.

-- Ou: sharding por tenant_id
CREATE TABLE orders (
    order_id BIGSERIAL,
    tenant_id INT NOT NULL,
    data JSONB
) PARTITION BY LIST (tenant_id);

-- Cada inquilino recebe uma partição dedicada
CREATE TABLE orders_tenant_42 PARTITION OF orders FOR VALUES IN (42);
```

## Particionamento vs Indexação

| Característica | Particionamento | Indexação |
|---|---|---|
| Agrupamento de linhas | Físico | Lógico |
| Aceleração de consultas | Via poda | Via varredura de índice |
| Sobrecarga de manutenção | Média | Baixa |
| DELETE em massa | Trivialmente rápido | Lento (VACUUM) |
| Consultas entre partições | Suportadas | N/A |

[!TIP]
Use particionamento com índices. Cada partição recebe seus próprios índices, e a poda de partições + varredura de índice oferece a melhor performance.

## Perguntas de Prática

1. Qual é a diferença entre particionamento e sharding? Quando você usaria cada um?
2. Crie uma tabela particionada por RANGE em `sale_date` com partições trimestrais para 2024.
3. Escreva uma consulta que verifique se a poda de partições está funcionando verificando o plano `EXPLAIN`.
4. Dado `users` com 100M linhas, como você particionaria por `region` (NA, EU, APAC)?
5. O que acontece quando uma consulta usa uma função na chave de partição (ex: `YEAR(order_date)`) — a poda ainda funciona?
6. Como adicionar uma nova partição para os dados do próximo mês em uma tabela particionada mensalmente?
7. Explique hashing consistente e por que é melhor que módulo simples para sharding.
8. Escreva uma consulta para desanexar e arquivar uma partição contendo dados de 2023.
9. Quais são os trade-offs do particionamento HASH vs RANGE para uma tabela de séries temporais?
10. Projete uma estratégia de sharding para uma aplicação SaaS multi-inquilino com 500 inquilinos, cada um com até 10M linhas.
