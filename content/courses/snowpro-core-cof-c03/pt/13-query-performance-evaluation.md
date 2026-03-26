---
title: "Domínio 4.1 — Avaliação de Desempenho de Queries"
description: "Aprenda a diagnosticar problemas de desempenho de queries no Snowflake usando Query Profile, Query History, views do ACCOUNT_USAGE e entenda os principais gargalos: data spilling, pruning ineficiente, exploding joins e queuing."
order: 13
difficulty: intermediate
duration: "65 min"
---

# Domínio 4.1 — Avaliação de Desempenho de Queries

## Peso no Exame

O **Domínio 4.0 — Otimização de Desempenho, Consultas e Transformação** representa **~21%** do exame — o segundo maior domínio.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 4.1**: *Avaliar o desempenho de queries*, incluindo Query Profile, Query Insights, views do ACCOUNT_USAGE e boas práticas de gerenciamento de workload.

---

## O Fluxo de Avaliação de Desempenho de Queries

Quando uma query está lenta, siga esta sequência de diagnóstico:

```
1. Encontrar a query lenta → QUERY_HISTORY ou Snowsight Query History
2. Abrir o Query Profile → identificar o gargalo
3. Ler as estatísticas dos operadores → bytes derramados, linhas processadas, pruning
4. Corrigir o gargalo → redimensionar, clusterizar, reescrever, usar cache
```

---

## Query History (Histórico de Queries)

### Via Snowsight

No Snowsight: **Activity → Query History** (Atividade → Histórico de Queries)

Filtre por: usuário, warehouse, intervalo de tempo, duração, status, tipo de query.

Clique em qualquer query para abrir seu **Query Profile**.

### Via SQL

```sql
-- Queries lentas recentes (> 60 segundos) nas últimas 24 horas
SELECT
    query_id,
    query_text,
    user_name,
    warehouse_name,
    total_elapsed_time / 1000 AS tempo_seg,
    bytes_spilled_to_local_storage,
    bytes_spilled_to_remote_storage,
    partitions_scanned,
    partitions_total,
    ROUND(partitions_scanned / NULLIF(partitions_total, 0) * 100, 1) AS pct_particoes_escaneadas
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('hour', -24, CURRENT_TIMESTAMP)
    AND total_elapsed_time > 60000  -- > 60 segundos
    AND execution_status = 'SUCCESS'
ORDER BY total_elapsed_time DESC
LIMIT 20;
```

---

## Query Profile (Perfil de Query)

O **Query Profile** é a principal ferramenta para diagnosticar o desempenho de queries. Acesse-o no Snowsight clicando em qualquer query no Histórico de Queries.

### O que o Query Profile Mostra

O Query Profile renderiza o **plano de execução da query** como uma árvore de nós operadores. Cada nó operador exibe:

- **Linhas processadas** — contagens de linhas de entrada e saída
- **Tempo** — quanto tempo o operador levou
- **Bytes** — dados lidos/processados/escritos
- **Estatísticas por etapa** — consumo de recursos por nó

### Principais Nós Operadores

| Tipo de Nó | Descrição |
|---|---|
| **TableScan** | Lê micro-partições; exibe estatísticas de pruning |
| **Filter** | Aplica condições WHERE |
| **Join** | Combina dois conjuntos de dados |
| **Aggregate** | Computações de GROUP BY |
| **Sort** | Operações de ORDER BY |
| **ResultSet** | Saída final enviada ao cliente |
| **ExchangeDistribute** | Movimento de dados entre nós do warehouse |

---

## Gargalos Comuns de Desempenho

### 1. Data Spilling (Derramamento de Dados para Armazenamento)

**O que é:** Quando os dados da query excedem a memória e o disco local do warehouse, eles transbordam (derramam) para o armazenamento remoto — aumentando massivamente o I/O e a latência.

**Como detectar:**
- No Query Profile: `Bytes spilled to local storage` ou `Bytes spilled to remote storage` > 0
- No QUERY_HISTORY: `BYTES_SPILLED_TO_LOCAL_STORAGE` ou `BYTES_SPILLED_TO_REMOTE_STORAGE`

**Severidade do spilling:**

| Tipo de Derramamento | Severidade | Causa |
|---|---|---|
| Derramamento para disco local | Moderada | A query excede a memória do nó |
| Derramamento para armazenamento remoto | Severa | A query excede a memória + disco local do nó |

```sql
-- Encontrar queries com spilling significativo
SELECT
    query_id,
    query_text,
    warehouse_name,
    bytes_spilled_to_local_storage / POWER(1024,3) AS gb_derramado_local,
    bytes_spilled_to_remote_storage / POWER(1024,3) AS gb_derramado_remoto,
    total_elapsed_time / 1000 AS tempo_seg
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE bytes_spilled_to_remote_storage > 0
    AND start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
ORDER BY bytes_spilled_to_remote_storage DESC;
```

**Solução:** **Aumentar o tamanho** do warehouse (tamanho maior = mais memória por nó).

---

### 2. Pruning Ineficiente (Poda Ineficiente de Partições)

**O que é:** O Snowflake não consegue ignorar micro-partições porque os valores da coluna de filtro estão distribuídos por muitas partições — a query lê mais dados do que o necessário.

**Como detectar no Query Profile:**
- O nó `TableScan` mostra `Partitions scanned` próximo de `Partitions total`
- A proporção `Partitions scanned / Partitions total` é alta (> 80% é ruim)

```sql
-- Exemplo de poda ruim: sem clustering em 'status'
SELECT sum(valor) FROM pedidos WHERE status = 'CONCLUIDO';
-- Escaneia 9.800 de 10.000 partições

-- Após clusterizar em 'status':
-- Escaneia 1.200 de 10.000 partições
```

**Soluções:**
- Adicionar uma **Cluster Key** na coluna filtrada
- Garantir que as queries incluam colunas de filtro de alta cardinalidade que correspondam à ordem de carga natural
- Usar o **Search Optimization Service** para buscas pontuais de alta seletividade

---

### 3. Exploding Joins (Joins Explosivos)

**O que é:** Um JOIN que produz **muito mais linhas do que o esperado** — geralmente porque as chaves de join não são únicas (join muitos-para-muitos criando um produto cartesiano).

**Como detectar no Query Profile:**
- Um nó `Join` mostra linhas de saída >> linhas de entrada
- O resultado do join é muito maior do que qualquer entrada

```sql
-- Exemplo: join explosivo (chave não única)
SELECT o.*, c.nome
FROM pedidos o
JOIN clientes c ON o.segmento_cliente = c.segmento;
-- Se pedidos tem 10M linhas e clientes tem 1000 linhas com valores de segmento não únicos
-- → Pode produzir bilhões de linhas intermediárias!

-- Correção: garantir que as chaves de join sejam únicas, ou agregar primeiro
SELECT o.*, c.nome
FROM pedidos o
JOIN (SELECT DISTINCT segmento, nome FROM clientes) c
ON o.segmento_cliente = c.segmento;
```

**Soluções:**
- Verificar a unicidade das chaves de join antes de escrever a query
- Pré-agregar antes de fazer o join
- Usar `DISTINCT` ou desduplicar o lado menor

---

### 4. Queuing (Filas de Espera)

**O que é:** As queries aguardam em uma fila porque todos os slots de computação do warehouse estão ocupados por outras queries em execução.

**Como detectar:**
- No Query Profile: a query mostra longo tempo no estado `Queued` (Em fila) antes de executar
- No QUERY_HISTORY: `QUEUED_OVERLOAD_TIME` é alto

```sql
-- Encontrar queries que ficaram muito tempo em fila
SELECT
    query_id,
    query_text,
    warehouse_name,
    queued_overload_time / 1000 AS tempo_fila_seg,
    total_elapsed_time / 1000 AS tempo_total_seg
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE queued_overload_time > 10000  -- em fila por mais de 10 segundos
    AND start_time > DATEADD('day', -1, CURRENT_TIMESTAMP)
ORDER BY queued_overload_time DESC;
```

**Soluções:**
- Habilitar **multi-cluster warehouse** (escalar horizontalmente) para workloads concorrentes
- Criar **warehouses separados** por equipe/workload
- Priorizar queries usando warehouses separados para SLAs diferentes

---

## Views do ACCOUNT_USAGE para Análise de Desempenho

### Principais Views de Desempenho

```sql
-- Atribuição de queries: quais usuários/roles consomem mais recursos
SELECT
    user_name,
    role_name,
    count(*) AS qtd_queries,
    sum(total_elapsed_time) / 1000 / 3600 AS total_horas,
    avg(total_elapsed_time) / 1000 AS media_tempo_seg,
    sum(credits_used_cloud_services) AS creditos_cloud_services
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('month', -1, CURRENT_TIMESTAMP)
GROUP BY 1, 2
ORDER BY total_horas DESC;

-- Utilização do warehouse (profundidade média da fila)
SELECT
    start_time::DATE AS data_uso,
    warehouse_name,
    avg(avg_running) AS media_queries_concorrentes,
    avg(avg_queued_load) AS media_queries_em_fila,
    avg(avg_blocked) AS media_queries_bloqueadas
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_LOAD_HISTORY
WHERE start_time > DATEADD('week', -4, CURRENT_TIMESTAMP)
GROUP BY 1, 2
ORDER BY media_queries_em_fila DESC;

-- Tabelas mais escaneadas (candidatas a clustering)
SELECT
    table_name,
    count(*) AS qtd_escaneamentos,
    avg(partitions_scanned) AS media_particoes_escaneadas,
    avg(partitions_total) AS media_particoes_total,
    round(avg(partitions_scanned) / NULLIF(avg(partitions_total), 0) * 100, 1) AS pct_medio_escaneamento
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE partitions_total > 0
    AND start_time > DATEADD('day', -30, CURRENT_TIMESTAMP)
GROUP BY 1
HAVING pct_medio_escaneamento > 50  -- pruning ruim
ORDER BY qtd_escaneamentos DESC;
```

---

## Boas Práticas de Gerenciamento de Workload

### Agrupar Workloads Similares

Isole workloads por tipo para evitar interferência mútua:

```sql
-- Warehouses dedicados por tipo de workload
CREATE WAREHOUSE WH_ETL      WAREHOUSE_SIZE = LARGE;   -- ingestão em lote
CREATE WAREHOUSE WH_BI       WAREHOUSE_SIZE = SMALL     -- dashboards de BI
                             MAX_CLUSTER_COUNT = 5;     -- lidar com concorrência
CREATE WAREHOUSE WH_DS       WAREHOUSE_SIZE = MEDIUM;   -- ciência de dados
CREATE WAREHOUSE WH_ADHOC    WAREHOUSE_SIZE = MEDIUM;   -- queries ad-hoc de analistas
```

### Query Tagging para Atribuição de Custos

```sql
-- Marcar queries para atribuição de custos
ALTER SESSION SET QUERY_TAG = 'equipe:analytics projeto:relatorio-q4';

-- Consultar por tag no ACCOUNT_USAGE
SELECT query_tag, count(*), sum(total_elapsed_time)
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE query_tag LIKE '%analytics%'
GROUP BY 1;
```

---

## Guia Rápido de Solução de Problemas de Desempenho

| Sintoma | Causa Raiz | Solução |
|---|---|---|
| Query lenta, muito spilling | Memória/disco insuficientes | Aumentar tamanho do warehouse |
| Query escaneia muitas partições | Clustering de dados ruim | Adicionar Cluster Key |
| Join produz resultado enorme | Chaves de join não únicas (cartesiano) | Desduplicar, verificar chaves |
| Queries aguardam antes de iniciar | Warehouse com concorrência máxima | Multi-cluster ou WH separado |
| Query rápida mas lenta ao longo do tempo | Tabela cresceu, clustering degradou | Habilitar Automatic Clustering |
| Um warehouse rouba recursos | Mistura de workloads | Criar warehouses dedicados |

---

## Questões de Prática

**Q1.** Um Query Profile mostra `Bytes spilled to remote storage = 45 GB`. Qual é a MELHOR solução?

- A) Adicionar uma cluster key na coluna de filtro
- B) Aumentar o tamanho do warehouse ✅
- C) Habilitar multi-cluster warehouse
- D) Usar o cache de resultados de queries

**Q2.** Uma query escaneia 9.500 de 10.000 micro-partições na tabela `pedidos`. Qual métrica no Query Profile revela isso?

- A) Bytes derramados para o armazenamento local
- B) Linhas produzidas pelo join
- C) Partitions scanned vs Partitions total ✅
- D) Queued overload time

**Q3.** Uma query inesperadamente faz um join e produz 10 bilhões de linhas a partir de duas tabelas de 1 milhão de linhas. Qual é a causa mais provável?

- A) Dados estão sendo derramados para o armazenamento remoto
- B) A condição de join cria um join muitos-para-muitos (cartesiano) ✅
- C) O warehouse é muito pequeno
- D) O cache de resultados está desabilitado

**Q4.** Qual view do ACCOUNT_USAGE fornece informações sobre a carga de queries concorrentes e filas nos warehouses?

- A) QUERY_HISTORY
- B) WAREHOUSE_METERING_HISTORY
- C) WAREHOUSE_LOAD_HISTORY ✅
- D) TABLE_STORAGE_METRICS

**Q5.** As queries ad-hoc de uma equipe estão lentas porque as queries de dashboard de BI estão consumindo todos os slots do warehouse. Qual é a MELHOR solução?

- A) Aumentar o tamanho do warehouse para 4X-Large
- B) Criar warehouses separados para BI e workloads ad-hoc ✅
- C) Habilitar o cache de resultados de queries
- D) Adicionar uma cluster key em todas as tabelas

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. **Query Profile** = ferramenta diagnóstica principal — acesse em Snowsight Activity → Query History
> 2. **Spilling** = warehouse muito pequeno → aumentar tamanho | **Queuing** = muitas queries concorrentes → escalar horizontalmente
> 3. **Pruning ineficiente** = alta proporção `partitions_scanned / partitions_total` → adicionar cluster key
> 4. **Exploding join** = saída do nó join >> entrada → verificar chaves não únicas
> 5. `WAREHOUSE_LOAD_HISTORY` = métricas de fila e concorrência
> 6. Use `QUERY_TAG` para atribuição de workload e rastreamento de custos
