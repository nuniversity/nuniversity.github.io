---
title: "Domínio 4.3 — Cache do Snowflake"
description: "Domine o sistema de cache de três camadas do Snowflake: Query Result Cache (camada Cloud Services), Metadata Cache e Warehouse Cache (disco local). Entenda quando cada cache é usado e como aproveitá-los."
order: 15
difficulty: intermediate
duration: "45 min"
---

# Domínio 4.3 — Cache do Snowflake

## Peso no Exame

O **Domínio 4.0** representa **~21%** do exame. O cache é um tópico favorito do exame por causa de suas regras e comportamentos específicos.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 4.3**: *Utilizar o cache do Snowflake*, incluindo o cache de resultados de queries, o cache de metadados e o cache do warehouse.

---

## Visão Geral das Camadas de Cache do Snowflake

O Snowflake possui **três caches distintos** operando em diferentes camadas:

```
┌──────────────────────────────────────────────────────┐
│            CAMADA CLOUD SERVICES                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │         QUERY RESULT CACHE                      │ │
│  │  Armazena resultados completos por 24 horas     │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │         METADATA CACHE                          │ │
│  │  Estatísticas de tabelas, MIN/MAX, contagens    │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│             CAMADA COMPUTE (Virtual WH)              │
│  ┌─────────────────────────────────────────────────┐ │
│  │         WAREHOUSE (LOCAL DISK) CACHE            │ │
│  │  Cache SSD de micro-partições acessadas         │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Cache 1: Query Result Cache (Cache de Resultados de Queries)

O **Query Result Cache** armazena o **conjunto de resultados completo** de uma query e o retorna instantaneamente se a mesma query for submetida novamente — **sem executar a query** e **sem usar o virtual warehouse**.

### Como Funciona

1. Uma query é executada → resultado computado e armazenado no cache de resultados
2. A mesma query submetida por qualquer usuário dentro de 24 horas → resultado retornado instantaneamente
3. Nenhum crédito de warehouse é consumido para o resultado em cache

### Regras para Cache Hits (Acertos de Cache)

Uma query usa o cache de resultados **somente se TODAS as seguintes condições forem verdadeiras**:

| Condição | Requisito |
|---|---|
| **Texto SQL exatamente igual** | O texto da query deve ser idêntico byte a byte (incluindo espaços e capitalização) |
| **Mesma role** | A role executando a query deve ter os mesmos privilégios |
| **Sem alteração nos dados subjacentes** | As tabelas consultadas não devem ter sido modificadas |
| **Mesmos parâmetros de sessão** | Formato de data, fuso horário e outros parâmetros devem corresponder |
| **Dentro de 24 horas** | A entrada no cache deve ter menos de 24 horas |
| **`USE_CACHED_RESULT = TRUE`** | O parâmetro deve estar habilitado (padrão: TRUE) |

> [!WARNING]
> Mesmo um único espaço extra no texto SQL causará um cache miss (falha de cache). `SELECT count(*) FROM pedidos;` e `select count(*) from pedidos;` são queries diferentes (maiúsculas e minúsculas importam para a correspondência da chave de cache).

### Desabilitando o Cache de Resultados

```sql
-- Desabilitar o cache de resultados para uma sessão (útil para benchmarking)
ALTER SESSION SET USE_CACHED_RESULT = FALSE;

-- Reabilitar
ALTER SESSION SET USE_CACHED_RESULT = TRUE;

-- Verificar a configuração atual
SHOW PARAMETERS LIKE 'USE_CACHED_RESULT';
```

### Identificando Cache Hits no Histórico de Queries

```sql
-- Encontrar queries que usaram o cache de resultados
SELECT
    query_id,
    query_text,
    user_name,
    execution_status,
    total_elapsed_time,
    -- execution_time = 0 significa que o cache de resultados foi usado
    execution_time
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE execution_time = 0
    AND start_time > DATEADD('hour', -24, CURRENT_TIMESTAMP)
LIMIT 20;
```

No Snowsight Query History, queries em cache mostram o status `Query Result Reuse` (Reutilização de Resultado de Query).

### Implicações de Custo

| Cenário | Warehouse Usado | Créditos Consumidos |
|---|---|---|
| Primeira execução | Sim | Sim |
| Cache hit de resultado (em 24h, mesmo SQL, sem alteração de dados) | **Não** | **0 créditos** |

---

## Cache 2: Metadata Cache (Cache de Metadados)

O **Metadata Cache** armazena **estatísticas de tabelas e metadados de objetos** coletados pela camada Cloud Services do Snowflake. Esses metadados são usados para:

- Responder **queries somente de metadados** sem tocar no warehouse
- Habilitar o **partition pruning** (min/max por partição por coluna)
- Alimentar o **otimizador de queries** (contagens estimadas de linhas, cardinalidade)

### Queries Somente de Metadados (Sem Warehouse Necessário)

Essas queries são respondidas inteiramente pelo cache de metadados — sem virtual warehouse necessário:

```sql
-- Contagem de linhas (somente metadados)
SELECT COUNT(*) FROM pedidos;

-- MIN e MAX de uma coluna (metadados)
SELECT MIN(data_pedido), MAX(data_pedido) FROM pedidos;

-- Comandos SHOW (metadados)
SHOW TABLES IN DATABASE analytics;
SHOW COLUMNS IN TABLE pedidos;

-- Verificações de existência de objetos
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'PEDIDOS';
```

> [!NOTE]
> `COUNT(*)` em uma tabela sem cláusula WHERE é respondido pelo cache de metadados — **sem crédito de warehouse consumido**. Esta é uma pegadinha comum no exame: `COUNT(*)` = gratuito; `COUNT(nome_coluna)` com verificações de não-nulo pode requerer computação.

### Como o Metadata Cache Alimenta o Pruning

Para cada micro-partição e coluna, os metadados do Snowflake armazenam:
- Valor mínimo
- Valor máximo
- Número de valores distintos
- Contagem de NULLs

No momento da query, o otimizador usa esses metadados para **ignorar partições** que não podem conter linhas correspondentes:

```sql
-- O otimizador verifica os metadados: quais partições têm data_pedido em 2025-01?
SELECT sum(valor) FROM pedidos WHERE data_pedido BETWEEN '2025-01-01' AND '2025-01-31';
-- Apenas partições onde MAX(data_pedido) >= 2025-01-01 E MIN(data_pedido) <= 2025-01-31 são lidas
```

---

## Cache 3: Warehouse (Local Disk) Cache — Cache de Disco Local do Warehouse

O **Warehouse Cache** (também chamado de **cache de disco local** ou **cache de dados**) armazena **micro-partições acessadas recentemente** no **SSD dos nós do virtual warehouse**.

### Como Funciona

- Quando uma micro-partição é lida do armazenamento, ela é armazenada em cache no SSD local do warehouse
- Queries subsequentes que precisam da mesma micro-partição leem do **cache local** em vez do armazenamento em nuvem → muito mais rápido
- O cache vive no warehouse — **quando o warehouse é suspenso, o cache é perdido**

### Implicações

| Cenário | Fonte de Dados | Velocidade |
|---|---|---|
| Warehouse frio (primeira query após retomada) | Armazenamento em nuvem (S3/Blob/GCS) | Mais lento |
| Warehouse quente (queries repetidas, mesmos dados) | Cache SSD local | Mais rápido |
| Warehouse suspenso e retomado | Armazenamento em nuvem novamente | Mais lento (cache limpo) |

> [!WARNING]
> **Suspender um warehouse limpa o cache do warehouse**. Para workloads sensíveis a desempenho onde o calor do cache importa, considere usar **`INITIALLY_SUSPENDED = FALSE`** ou definir um `AUTO_SUSPEND` mais alto para manter o cache quente.

### Estratégias de Aquecimento do Cache

```sql
-- Opção 1: Executar a query mais comum após a retomada para aquecer o cache
-- (Às vezes feito em fluxos de trabalho ETL)
SELECT COUNT(*) FROM tabela_grande;  -- faz com que as micro-partições sejam armazenadas em cache

-- Opção 2: Aumentar o auto-suspend para reter o cache entre queries
ALTER WAREHOUSE WH_BI SET AUTO_SUSPEND = 600;  -- 10 minutos

-- Opção 3: Dedicar um warehouse a workloads repetidos (cache fica quente)
-- Não compartilhe o warehouse de BI com ETL que lê dados diferentes
```

### Multi-Cluster Warehouses e Cache

> [!NOTE]
> Cada cluster em um multi-cluster warehouse mantém seu **próprio cache separado**. Dados em cache no Cluster 1 não estão disponíveis para o Cluster 2. É por isso que o roteamento de queries em configurações multi-cluster é importante — rotear queries similares para o mesmo cluster maximiza os cache hits.

---

## Resumo da Hierarquia de Cache

Quando uma query é executada, o Snowflake verifica os caches nesta ordem:

```
1. Query Result Cache (Cloud Services)
   └── Acerto? Retorna o resultado instantaneamente, zero créditos
   └── Falha? Continua...

2. Warehouse Local Disk Cache (SSD)
   └── Acerto? Lê do SSD local, sem I/O remoto
   └── Falha? Continua...

3. Armazenamento Remoto (S3/Azure/GCS)
   └── Lê micro-partições, popula o cache do warehouse
```

---

## Questões de Prática

**Q1.** Uma query executada às 10h retorna resultados e o resultado é armazenado em cache. A mesma query exata é executada às 9h do dia seguinte. O que acontece?

- A) O resultado em cache é retornado instantaneamente ✅
- B) A query é reexecutada porque mais de 24 horas se passaram — 10h tem exatamente 23 horas de diferença às 9h do dia seguinte
- C) A query falha porque o cache expirou
- D) O cache de resultados funciona apenas dentro da mesma sessão

**Q2.** Qual ação limpa o cache do Warehouse (disco local)?

- A) Executar uma nova query que acessa tabelas diferentes
- B) Redimensionar o warehouse
- C) Suspender o warehouse ✅
- D) Trocar para uma role diferente

**Q3.** Um desenvolvedor quer fazer benchmark do tempo de execução real de uma query sem interferência do cache. Qual comando impede que o cache de resultados seja usado?

- A) `ALTER WAREHOUSE WH SET CACHE = FALSE`
- B) `ALTER SESSION SET USE_CACHED_RESULT = FALSE` ✅
- C) `ALTER TABLE minha_tabela DISABLE CACHE`
- D) `SET QUERY_CACHE = NONE`

**Q4.** Qual instrução SQL pode ser respondida sem um virtual warehouse usando o Metadata Cache?

- A) `SELECT * FROM pedidos WHERE valor > 100`
- B) `SELECT regiao, sum(valor) FROM pedidos GROUP BY regiao`
- C) `SELECT COUNT(*) FROM pedidos` ✅
- D) `SELECT DISTINCT id_cliente FROM pedidos`

**Q5.** O Usuário A executa `SELECT sum(valor) FROM pedidos WHERE regiao = 'SUDESTE'` às 14h. O Usuário B executa a mesma query às 15h com a mesma role e nenhum dado foi alterado. O que acontece?

- A) A query do Usuário B executa novamente (usuário diferente significa sem cache hit)
- B) A query do Usuário B acerta o cache de resultados e retorna instantaneamente ✅
- C) A query do Usuário B acerta o cache do warehouse, mas ainda usa o warehouse
- D) O cache se aplica apenas ao usuário que executou a query original

**Q6.** Em um multi-cluster warehouse com 3 clusters ativos, qual afirmação sobre cache é VERDADEIRA?

- A) Todos os três clusters compartilham um cache comum
- B) Cada cluster mantém seu próprio cache de disco local independente ✅
- C) O cache do warehouse é armazenado na camada Cloud Services
- D) Multi-cluster warehouses não suportam cache

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. **Result Cache**: janela de 24 horas, SQL exato idêntico, mesma role, sem alteração de dados → **zero créditos, sem warehouse**
> 2. **Metadata Cache**: responde `COUNT(*)`, `MIN()`, `MAX()` em tabelas completas → **sem warehouse necessário**
> 3. **Warehouse Cache**: SSD local, perdido quando o warehouse é **suspenso**, cada cluster tem o seu próprio
> 4. Ordem de verificação do cache: Resultado → Local do Warehouse → Armazenamento Remoto
> 5. `ALTER SESSION SET USE_CACHED_RESULT = FALSE` → ignora o cache de resultados
> 6. O cache de resultados é **compartilhado entre usuários** com a mesma role e o mesmo SQL
