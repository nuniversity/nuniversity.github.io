---
title: "Operações JSON e JSONB"
description: "Domine funções JSON, consultas JSON path, indexação de JSON, trade-offs JSON vs tabelas normalizadas e agregações JSON"
order: 8
duration: "90 minutos"
difficulty: advanced
---

# Operações JSON e JSONB

## JSON vs JSONB

| Aspecto | JSON | JSONB |
|---|---|---|
| Armazenamento | Cópia textual exata | Binário decomposto |
| Velocidade de inserção | Rápida | Ligeiramente mais lenta (overhead de parsing) |
| Velocidade de consulta | Lenta (re-analisa em cada acesso) | Rápida (sem re-análise) |
| Indexação | Não | Sim (GIN, BTREE) |
| Ordem das chaves | Preservada | Não preservada |
| Chaves duplicadas | Mantidas | Último valor vence |
| Espaço em branco | Preservado | Removido |

[!IMPORTANT]
No PostgreSQL, sempre prefira `JSONB` sobre `JSON` a menos que você precise preservar formatação exata ou chaves duplicadas. JSONB suporta indexação e é significativamente mais rápido para consultas.

## Criando Dados JSON

```sql
-- A partir de uma string
INSERT INTO events (data) VALUES ('{"user_id": 42, "action": "login"}');

-- A partir de dados de linha usando funções
SELECT jsonb_build_object(
    'order_id', o.id,
    'customer', jsonb_build_object('name', c.name, 'email', c.email),
    'items', (SELECT jsonb_agg(jsonb_build_object('product', p.name, 'qty', oi.quantity))
              FROM order_items oi
              JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = o.id),
    'total', o.total
)
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

## Consultando JSONB

### Operadores Básicos

| Operador | Descrição | Exemplo |
|---|---|---|
| `->` | Obter campo JSON (retorna JSON) | `data->'name'` |
| `->>` | Obter campo JSON como texto | `data->>'name'` |
| `#>` | Obter caminho (retorna JSON) | `data#>'{a,b}'` |
| `#>>` | Obter caminho como texto | `data#>>'{a,b}'` |
| `@>` | Contém (JSONB em JSONB) | `data @> '{"status": "active"}'` |
| `<@` | Está contido em | `'{"status": "active"}' <@ data` |
| `?` | Chave existe | `data ? 'email'` |
| `?|` | Alguma das chaves existe | `data ?| ARRAY['email', 'phone']` |
| `?&` | Todas as chaves existem | `data ?& ARRAY['email', 'phone']` |

```sql
-- Criar tabela
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir dados de exemplo
INSERT INTO events (event_type, payload) VALUES
    ('user_signup', '{"user_id": 1, "email": "alice@example.com", "plan": "premium", "tags": ["new", "vip"]}'),
    ('purchase', '{"user_id": 1, "items": [{"sku": "A1", "price": 29.99}, {"sku": "B2", "price": 49.99}], "total": 79.98}'),
    ('user_signup', '{"user_id": 2, "email": "bob@example.com", "plan": "free"}');

-- Consultas básicas
SELECT payload->>'email' AS email FROM events WHERE payload ? 'email';
SELECT * FROM events WHERE payload @> '{"plan": "premium"}';
SELECT * FROM events WHERE payload->'tags' ? 'vip';
```

## Consultas JSON Path (SQL/JSON Path)

PostgreSQL 12+ suporta a linguagem SQL/JSON path.

```sql
-- Encontrar todos os eventos onde qualquer item tem preço > 30
SELECT * FROM events
WHERE payload @@ '$.items[*].price > 30';

-- Extrair todos os SKUs de itens
SELECT jsonb_path_query(payload, '$.items[*].sku') AS sku
FROM events
WHERE event_type = 'purchase';

-- Caminho complexo: encontrar usuários premium com compras acima de $50
SELECT jsonb_path_query(payload, '$.user_id')
FROM events
WHERE payload @@ 'exists($.plan ? (@ == "premium"))'
  AND payload @@ '$.total > 50';
```

### Métodos JSON Path

| Método | Propósito |
|---|---|
| `jsonb_path_exists(data, path)` | Verificar se o caminho existe |
| `jsonb_path_match(data, path)` | Verificar predicado do caminho |
| `jsonb_path_query(data, path)` | Retornar elementos correspondentes |
| `jsonb_path_query_array(data, path)` | Retornar array de correspondências |
| `jsonb_path_query_first(data, path)` | Retornar primeira correspondência |

```sql
-- Verificar se o payload tem uma compra com total > 100
SELECT id,
       jsonb_path_exists(payload, '$.total ? (@ > 100)') AS high_value
FROM events;

-- Extrair todos os endereços de email de estruturas aninhadas
SELECT jsonb_path_query_array(payload, '$.**.email') AS emails
FROM events;
```

## Indexando JSONB

### Índice GIN (Padrão)

```sql
-- Índice GIN de propósito geral
CREATE INDEX idx_events_payload ON events USING GIN (payload);

-- Suporta: @>, ?, ?|, ?&, @@ (jsonpath)
```

### GIN com `jsonb_path_ops`

```sql
-- Menor e mais rápido para consultas @>, mas não suporta ?, ?|, ?&
CREATE INDEX idx_events_payload_ops ON events USING GIN (payload jsonb_path_ops);
```

| Tipo de índice | Tamanho | Velocidade @> | ? / ?| / ?& | jsonpath |
|---|---|---|---|---|
| `GIN` (padrão) | Maior | Rápida | Sim | Sim |
| `GIN jsonb_path_ops` | Menor | Mais rápida | Não | Não |
| `BTREE` (em expressão) | Menor | Apenas igualdade | Não | Não |

### Índice BTREE em Campos JSON

```sql
-- Indexar um campo JSON específico
CREATE INDEX idx_events_user_id ON events (((payload->>'user_id')::INT));

-- Consulta usando o índice
SELECT * FROM events
WHERE (payload->>'user_id')::INT = 42;
```

[!TIP]
Para consultas que filtram em uma chave JSON específica (ex: `payload->>'email'`), um índice BTREE na expressão é menor e mais rápido que um índice GIN.

### Índice Parcial em JSON

```sql
-- Indexar apenas usuários premium
CREATE INDEX idx_premium_users ON events ((payload->>'user_id'))
WHERE payload @> '{"plan": "premium"}';
```

## Agregações JSON

```sql
-- Agregar linhas em um array JSON
SELECT jsonb_agg(jsonb_build_object('id', id, 'type', event_type, 'ts', created_at))
FROM events
WHERE created_at > NOW() - INTERVAL '1 day';

-- Agregar em um objeto JSON indexado por user_id
SELECT jsonb_object_agg(
    payload->>'user_id',
    jsonb_build_object('last_event', event_type, 'time', created_at)
)
FROM events
GROUP BY payload->>'user_id';

-- Agregação aninhada
SELECT
    event_type,
    jsonb_agg(payload ORDER BY created_at DESC) AS latest_first
FROM events
GROUP BY event_type;
```

## JSON vs Tabelas Normalizadas

| Cenário | JSONB | Normalizado |
|---|---|---|
| Esquema fixo | Pior (sem validação de tipo) | Melhor |
| Atributos altamente variáveis | Melhor | Pior (padrão EAV) |
| Consultas complexas em campos internos | Pior | Melhor |
| Flexibilidade de indexação | Pior | Melhor |
| Evolução de esquema sem migração | Melhor | Pior |
| Performance de JOINs | Pior | Melhor |
| Armazenamento com colunas esparsas | Melhor | Pior |

### Quando Usar JSONB

- **Event sourcing**: Cada evento tem campos diferentes
- **Campos definidos pelo usuário**: Usuários podem criar campos personalizados
- **Armazenamento de configuração**: Chave-valor com estrutura variada
- **Prototipagem rápida**: Esquema evolui rapidamente

### Quando Usar Tabelas Normalizadas

- **Integridade relacional**: Chaves estrangeiras necessárias
- **Consultas frequentes em campos específicos**: Segurança de tipo + indexação
- **Ferramentas de relatórios/BI**: Ferramentas esperam colunas fixas
- **Alto throughput de escrita**: Parsing JSONB adiciona overhead

## Exemplos Práticos

### Exemplo 1: Variantes de Produto em E-commerce

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    base_price NUMERIC NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultar produtos por atributo
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);

-- Encontrar produtos vermelhos no tamanho M
SELECT * FROM products
WHERE attributes @> '{"color": "red", "size": "M"}';

-- Produtos com qualquer atributo de cor
SELECT * FROM products WHERE attributes ? 'color';
```

### Exemplo 2: Envios de Formulários Dinâmicos

```sql
CREATE TABLE form_submissions (
    id BIGSERIAL PRIMARY KEY,
    form_id INT NOT NULL,
    respondent_id INT,
    answers JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pontuação média de satisfação em todos os envios
SELECT
    AVG((answers->>'satisfaction')::INT) AS avg_satisfaction,
    COUNT(*) FILTER (WHERE answers @> '{"satisfaction": "5"}') AS five_star_count
FROM form_submissions
WHERE form_id = 42;
```

### Exemplo 3: Feed de Atividades

```sql
-- Armazenar atividades heterogêneas em uma tabela
INSERT INTO activities (actor_id, verb, object) VALUES
    (1, 'post', jsonb_build_object('type', 'article', 'id', 100, 'title', 'Hello World')),
    (2, 'comment', jsonb_build_object('type', 'comment', 'id', 50, 'body', 'Great post!', 'parent_id', 100)),
    (1, 'like', jsonb_build_object('type', 'comment', 'id', 50));

-- Consulta: encontrar todas as atividades relacionadas ao artigo 100
SELECT *
FROM activities
WHERE object @> '{"id": 100}'
   OR object @> '{"parent_id": 100}';
```

## Perguntas de Prática

1. Qual é a diferença entre os operadores `->` e `->>` no PostgreSQL JSONB? Dê um exemplo.
2. Escreva uma consulta que encontre todas as linhas em uma tabela `users` onde a coluna JSONB `preferences` tenha `"theme": "dark"`.
3. Crie um índice GIN em uma coluna JSONB e explique quais operadores ele acelera.
4. Dada `events(data JSONB)`, escreva uma consulta JSON path para encontrar eventos onde `data.items[0].price > 50`.
5. Quando você escolheria um índice `BTREE` em uma expressão JSONB em vez de um índice `GIN`?
6. Escreva uma consulta que agregue linhas de `orders` em um array JSON de objetos com as chaves `id`, `total` e `item_count`.
7. Compare os trade-offs de usar JSONB vs um esquema normalizado para armazenar atributos de produtos em e-commerce.
8. Use `jsonb_set()` para atualizar um campo aninhado: altere `{"user": {"name": "Alice"}}` para `{"user": {"name": "Alice", "verified": true}}`.
9. Escreva uma consulta usando `jsonb_path_query` para extrair todos os valores únicos de SKU dos payloads de eventos de compra.
10. Dada `config(key TEXT, value JSONB)`, escreva uma consulta que retorne uma única linha com todas as chaves de configuração como colunas.
