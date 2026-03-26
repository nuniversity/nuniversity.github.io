---
title: "Domínio 4.2 — Otimização de Desempenho de Queries"
description: "Conheça as ferramentas de otimização de desempenho do Snowflake: Query Acceleration Service, Search Optimization Service, clustering keys e Materialized Views. Saiba quando e como usar cada uma."
order: 14
difficulty: intermediate
duration: "60 min"
---

# Domínio 4.2 — Otimização de Desempenho de Queries

## Peso no Exame

O **Domínio 4.0** representa **~21%** do exame.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 4.2**: *Otimizar o desempenho de queries*, incluindo o Query Acceleration Service, Search Optimization Service, clustering keys e Materialized Views.

---

## Visão Geral das Ferramentas de Otimização de Desempenho

| Ferramenta | O que Resolve | Modelo de Custo | Edição Necessária |
|---|---|---|---|
| **Clustering Keys** | Pruning de partições ruim | Créditos de Automatic Clustering | Qualquer |
| **Search Optimization Service** | Buscas pontuais de alta seletividade | Taxa de serviço por tabela | Enterprise+ |
| **Query Acceleration Service** | Queries outlier lentas em WH compartilhado | Créditos adicionais por query | Enterprise+ |
| **Materialized Views** | Agregações caras e repetidas | Créditos de atualização em segundo plano | Enterprise+ |

---

## Clustering Keys (Chaves de Agrupamento)

### Quando Usar Clustering Keys

O clustering é benéfico quando:
- A tabela é **grande** (centenas de GBs ou múltiplos TBs)
- Queries **filtram frequentemente** em colunas específicas
- A **ordem de carga natural** não corresponde às colunas de filtro das queries

```sql
-- Verificar a qualidade atual do clustering antes de adicionar uma chave
SELECT SYSTEM$CLUSTERING_INFORMATION(
    'pedidos',
    '(data_pedido)'
);
-- Retorna: average_depth (menor é melhor), average_overlaps, etc.

-- Adicionar uma clustering key
ALTER TABLE pedidos CLUSTER BY (data_pedido);

-- Clustering key com múltiplas colunas
ALTER TABLE eventos CLUSTER BY (regiao, tipo_evento);

-- Clustering baseado em expressão (clusterizar por data truncada ao mês)
ALTER TABLE pedidos CLUSTER BY (DATE_TRUNC('MONTH', data_pedido));

-- Verificar se o Automatic Clustering está em execução
SHOW TABLES LIKE 'pedidos';
-- Observe as colunas: cluster_by, automatic_clustering
```

### Escolhendo Boas Cluster Keys

**Bons candidatos:**
- Colunas de alta cardinalidade usadas em cláusulas WHERE (datas, regiões, categorias)
- Colunas usadas em queries executadas com frequência
- Colunas de join para tabelas grandes

**Maus candidatos:**
- Cardinalidade muito baixa (ex.: colunas booleanas — apenas 2 valores)
- Cardinalidade muito alta com distribuição aleatória (ex.: chaves primárias UUID — pruning ruim)
- Colunas raramente usadas em filtros

> [!WARNING]
> As clustering keys acionam o **Automatic Clustering** — um serviço em segundo plano que consome créditos continuamente. Clusterize apenas tabelas onde o ganho de desempenho de queries supera o custo.

### Custo do Reclustering

```sql
-- Monitorar o consumo de créditos do Automatic Clustering
SELECT
    start_time,
    end_time,
    table_name,
    credits_used
FROM SNOWFLAKE.ACCOUNT_USAGE.AUTOMATIC_CLUSTERING_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
ORDER BY credits_used DESC;

-- Suspender o Automatic Clustering se necessário
ALTER TABLE pedidos SUSPEND RECLUSTER;

-- Retomar
ALTER TABLE pedidos RESUME RECLUSTER;
```

---

## Search Optimization Service (SOS — Serviço de Otimização de Busca)

O **Search Optimization Service (SOS)** acelera **buscas pontuais de alta seletividade** e buscas por igualdade que, de outra forma, escaneariam muitas partições:

### Quando Usar o SOS

| Caso de Uso | Adequado para SOS | Usar Cluster Key em vez disso |
|---|---|---|
| `WHERE email = 'usuario@exemplo.com'` | ✅ Sim | Não |
| `WHERE id_pedido = 12345` | ✅ Sim | Não |
| `WHERE regiao = 'SUDESTE'` (query de intervalo, resultado grande) | Não | ✅ Sim |
| `WHERE data_pedido BETWEEN ... AND ...` | Não | ✅ Sim |
| `WHERE v:usuario.id = 123` (semiestruturado) | ✅ Sim | Não |
| `CONTAINS(descricao, 'snowflake')` (busca por substring) | ✅ Sim | Não |

```sql
-- Habilitar Search Optimization em uma tabela
ALTER TABLE clientes ADD SEARCH OPTIMIZATION;

-- Habilitar apenas para colunas específicas (mais direcionado, menor custo)
ALTER TABLE clientes ADD SEARCH OPTIMIZATION ON EQUALITY(email, telefone);

-- Habilitar para caminhos JSON semiestruturados
ALTER TABLE eventos ADD SEARCH OPTIMIZATION ON EQUALITY(v:usuario.id);

-- Habilitar para busca por substring (LIKE, ILIKE, CONTAINS)
ALTER TABLE produtos ADD SEARCH OPTIMIZATION ON SUBSTRING(descricao);

-- Verificar o status do SOS
SHOW TABLES LIKE 'clientes';
-- Observe a coluna: search_optimization_progress

-- Monitorar o custo de construção e manutenção do SOS
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.SEARCH_OPTIMIZATION_HISTORY;
```

> [!NOTE]
> O SOS constrói um **índice de caminho de acesso** oculto, otimizado para buscas por igualdade. Tem um custo inicial de construção e custo contínuo de manutenção. É mais eficaz quando as queries têm como alvo uma pequena fração das linhas (alta seletividade).

### SOS vs. Cluster Keys: Comparação Lado a Lado

| Aspecto | Cluster Key | Search Optimization |
|---|---|---|
| Melhor para | Varreduras de intervalo, filtros de data, GROUP BY | Buscas pontuais, igualdade exata |
| Como funciona | Reorganiza a ordem das micro-partições | Constrói um índice de busca separado |
| Padrão de query | `BETWEEN`, `>`, `<`, filtros de intervalo | `= valor`, `IN (...)` |
| Modelo de custo | Créditos de reclustering (em segundo plano) | Taxa de serviço + créditos de manutenção |
| Semiestruturado | Limitado | Excelente (`v:campo = valor`) |

---

## Query Acceleration Service (QAS — Serviço de Aceleração de Queries)

O **Query Acceleration Service (QAS)** descarrega partes de **queries outlier lentas** para a computação serverless do Snowflake — útil quando um pequeno número de queries leva desproporcionalmente mais tempo em um warehouse compartilhado:

### Quando Usar o QAS

- O warehouse executa muitas queries, a maioria é rápida, mas algumas são muito lentas (outliers)
- As queries outlier são lentas porque processam grandes quantidades de dados
- Você não quer aumentar o tamanho do warehouse inteiro por causa de algumas queries lentas

```sql
-- Habilitar QAS em um warehouse
ALTER WAREHOUSE WH_ANALYTICS SET ENABLE_QUERY_ACCELERATION = TRUE;

-- Definir o fator de escala (limita quanta computação serverless pode ser usada)
-- Fator de escala 5 = QAS pode usar até 5x os créditos do warehouse
ALTER WAREHOUSE WH_ANALYTICS
    SET ENABLE_QUERY_ACCELERATION = TRUE
    QUERY_ACCELERATION_MAX_SCALE_FACTOR = 5;

-- Verificar se uma query é elegível para QAS
SELECT SYSTEM$ESTIMATE_QUERY_ACCELERATION('<id_query>');

-- Monitorar o uso do QAS
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_ACCELERATION_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

### Cobrança do QAS

- Quando o QAS está habilitado, queries elegíveis usam automaticamente a computação serverless
- Cobrado a **taxas de crédito serverless** (similar ao Snowpipe) para a parte acelerada
- Se o QAS não melhorar uma query, ele não será usado (sem desperdício de créditos)

---

## Materialized Views (Views Materializadas)

Uma **Materialized View** pré-computa e armazena o resultado de uma query SELECT. Queries contra a MV leem o resultado pré-computado em vez de reexecutar a query completa contra a tabela base:

```sql
-- Criar uma materialized view
CREATE MATERIALIZED VIEW mv_receita_diaria AS
SELECT
    date_trunc('day', horario_pedido) AS dia_pedido,
    regiao,
    sum(valor) AS receita_diaria,
    count(*) AS qtd_pedidos
FROM pedidos
WHERE status = 'CONCLUIDO'
GROUP BY 1, 2;

-- Consultar a MV (lê dados pré-computados)
SELECT * FROM mv_receita_diaria
WHERE dia_pedido >= DATEADD('month', -3, CURRENT_DATE)
ORDER BY receita_diaria DESC;
```

### Como as Materialized Views Funcionam

- **Atualização automática**: o serviço em segundo plano do Snowflake mantém a MV atualizada conforme os dados da tabela base mudam
- **Sem warehouse necessário**: a atualização é serverless
- **Reescrita transparente**: o Snowflake pode rotear automaticamente uma query para a MV mesmo que a query referencie a tabela base

```sql
-- O Snowflake reescreve automaticamente esta query para usar a MV:
SELECT date_trunc('day', horario_pedido), regiao, sum(valor)
FROM pedidos
WHERE status = 'CONCLUIDO'
GROUP BY 1, 2;
-- → O Snowflake detecta que mv_receita_diaria pode satisfazer isso e a usa
```

### Limitações das Materialized Views

| Limitação | Notas |
|---|---|
| Não pode referenciar outras MVs | Deve consultar tabelas base |
| Sem funções não-determinísticas | `CURRENT_TIMESTAMP()`, `RANDOM()` não são permitidos |
| Sem joins na definição da MV | Apenas agregações simples |
| Requer edição Enterprise | Não disponível na Standard |
| Apenas uma tabela base | Não pode agregar entre múltiplas tabelas |

```sql
-- Monitorar o custo e o status de atualização da MV
SELECT
    table_name AS nome_mv,
    last_altered AS ultima_atualizacao,
    credits_used
FROM SNOWFLAKE.ACCOUNT_USAGE.MATERIALIZED_VIEW_REFRESH_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

---

## Escolhendo a Ferramenta de Otimização Certa

Use este framework de decisão no exame:

```
A query está lenta porque...

→ Muitas micro-partições escaneadas (filtro de intervalo, data, região)?
    → CLUSTER KEY

→ Buscas por igualdade exata em valores específicos (email, ID, UUID)?
    → SEARCH OPTIMIZATION SERVICE

→ O warehouse tem queries outlier ocasionais muito lentas?
    → QUERY ACCELERATION SERVICE

→ A mesma agregação cara é executada repetidamente?
    → MATERIALIZED VIEW

→ A query executa bem, mas o resultado demora toda vez?
    → QUERY RESULT CACHE (próxima lição)
```

---

## Questões de Prática

**Q1.** Uma tabela tem 500 milhões de linhas. Analistas frequentemente executam queries como `WHERE email_cliente = 'usuario@exemplo.com'`. Qual otimização é MAIS apropriada?

- A) Cluster Key em `email_cliente`
- B) Search Optimization Service ✅
- C) Query Acceleration Service
- D) Materialized View

**Q2.** Um warehouse executa 1.000 queries por dia. 980 completam em menos de 5 segundos, mas 20 levam mais de 10 minutos. Qual otimização resolve as queries outlier lentas sem aumentar o tamanho do warehouse inteiro?

- A) Cluster Key na coluna de filtro
- B) Multi-cluster warehouse
- C) Query Acceleration Service ✅
- D) Search Optimization em todas as tabelas

**Q3.** Uma Materialized View é definida em uma tabela. Quando os dados da MV são atualizados?

- A) Apenas quando acionado manualmente com ALTER MATERIALIZED VIEW REFRESH
- B) Automaticamente pelo serviço em segundo plano do Snowflake conforme os dados base mudam ✅
- C) Toda vez que uma query é executada contra a MV
- D) Em um cronograma fixo definido no momento da criação

**Q4.** Qual candidato a clustering key forneceria o PIOR pruning para uma tabela de 1 bilhão de linhas de pedidos?

- A) `(data_pedido)` — data do pedido
- B) `(regiao)` — região geográfica (20 valores)
- C) `(uuid_pedido)` — chave primária UUID gerada aleatoriamente ✅
- D) `(categoria_produto)` — 50 categorias

**Q5.** Qual recurso do Snowflake requer edição Enterprise para todas estas capacidades: Materialized Views, Search Optimization e Query Acceleration?

- A) A edição Standard suporta todos os três
- B) Esses recursos requerem a edição Business Critical
- C) Todos esses recursos requerem edição Enterprise ou superior ✅
- D) Cada recurso requer um nível de edição diferente

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. **Cluster Key** = corrigir pruning ruim em colunas de intervalo/filtro (BETWEEN, >, <)
> 2. **Search Optimization** = corrigir buscas lentas por igualdade (`= valor`, caminhos semiestruturados)
> 3. **Query Acceleration Service** = corrigir queries outlier lentas em um warehouse compartilhado
> 4. **Materialized View** = pré-computar agregações caras repetidas
> 5. Todos os quatro requerem **edição Enterprise ou superior** para Search Optimization, QAS e MVs
> 6. Cluster Key em coluna UUID/aleatória = pruning ruim (evitar!)
