---
title: "Domínio 2.3 — Monitoramento e Gerenciamento de Custos"
description: "Aprenda a monitorar e controlar custos do Snowflake usando Resource Monitors, views do ACCOUNT_USAGE, cálculo de créditos, monitoramento de warehouses e estratégias de atribuição de custos."
order: 9
difficulty: intermediate
duration: "55 min"
---

# Domínio 2.3 — Monitoramento e Gerenciamento de Custos

## Peso no Exame

O **Domínio 2.0** representa **~20%** do exame. O gerenciamento de custos é uma área prática e frequentemente testada.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 2.3**: *Explicar monitoramento e gerenciamento de custos*, incluindo Resource Monitors, cálculo de uso de créditos de virtual warehouses e o schema ACCOUNT_USAGE.

---

## Componentes de Custo do Snowflake

A cobrança do Snowflake tem três componentes principais:

| Componente | Cobrado Por | Como Controlar |
|---|---|---|
| **Computação** | Créditos consumidos por virtual warehouses | Auto-suspend, dimensionamento correto, Resource Monitors |
| **Armazenamento** | Por TB por mês (comprimido) | Remover dados não utilizados, reduzir Time Travel |
| **Cloud Services** | Créditos para Cloud Services > 10% da computação | Minimizar operações de metadados desnecessárias |
| **Recursos serverless** | Créditos (Automatic Clustering, Snowpipe, etc.) | Configurar adequadamente |

---

## Resource Monitors (Monitores de Recursos)

Um **Resource Monitor** impõe um **orçamento de créditos** em virtual warehouses no nível da conta ou do warehouse. Quando um limiar é atingido, ele pode **notificar** administradores ou **suspender** warehouses.

### Criando um Resource Monitor

```sql
CREATE RESOURCE MONITOR orcamento_trimestral
    CREDIT_QUOTA = 5000          -- limite de créditos para o período
    FREQUENCY = MONTHLY          -- MONTHLY, DAILY, WEEKLY, YEARLY, NEVER
    START_TIMESTAMP = '2025-01-01 00:00:00'
    TRIGGERS
        ON 75 PERCENT DO NOTIFY           -- enviar alerta por email em 75%
        ON 90 PERCENT DO NOTIFY           -- enviar outro alerta em 90%
        ON 100 PERCENT DO SUSPEND         -- suspender warehouse em 100%
        ON 110 PERCENT DO SUSPEND_IMMEDIATE; -- forçar suspensão matando todas as queries em 110%
```

### Ações de Gatilho (Trigger Actions)

| Ação | Comportamento |
|---|---|
| `NOTIFY` | Enviar email aos administradores da conta |
| `SUSPEND` | Enfileirar novas queries; deixar as queries em execução terminarem, depois suspender |
| `SUSPEND_IMMEDIATE` | Matar todas as queries em execução e suspender imediatamente |

### Atribuindo um Resource Monitor

```sql
-- Atribuir à conta (aplica a todos os warehouses)
ALTER ACCOUNT SET RESOURCE_MONITOR = orcamento_trimestral;

-- Atribuir a warehouses específicos
ALTER WAREHOUSE WH_ANALYTICS SET RESOURCE_MONITOR = orcamento_trimestral;
ALTER WAREHOUSE WH_INGEST SET RESOURCE_MONITOR = orcamento_trimestral;
```

> [!WARNING]
> Os Resource Monitors rastreiam **apenas créditos de computação de virtual warehouses**. Eles **não** rastreiam custos de armazenamento, créditos do Snowpipe ou créditos da Cloud Services separadamente. Além disso, os Resource Monitors operam **sem custo adicional de crédito**.

### Escopo dos Resource Monitors

| Nível | Escopo |
|---|---|
| **Nível de conta** | Rastreia todo o uso de créditos em todos os warehouses |
| **Nível de warehouse** | Rastreia o uso de warehouses específicos apenas |

> [!NOTE]
> Um warehouse pode ter **um Resource Monitor** atribuído a ele. Se um warehouse tiver um monitor no nível do warehouse E a conta tiver um monitor no nível da conta, **ambos** se aplicam de forma independente.

---

## Calculando o Uso de Créditos de Virtual Warehouses

Os créditos são consumidos **por segundo** enquanto um warehouse está em execução (com um mínimo de 60 segundos por inicialização):

```
Créditos Consumidos = Tamanho do Warehouse (créditos/hora) × Tempo em Execução (horas)

Exemplo:
  Warehouse Large (8 créditos/hora)
  Executa por 45 minutos = 0,75 horas
  
  Créditos = 8 × 0,75 = 6 créditos
  
Mas se iniciar, executar por 30 segundos e ser suspenso:
  Mínimo = 1 minuto = 8 × (1/60) = 0,133 créditos
```

### Uso de Créditos por Tamanho

| Tamanho | Créditos/Hora |
|---|---|
| X-Small | 1 |
| Small | 2 |
| Medium | 4 |
| Large | 8 |
| X-Large | 16 |
| 2X-Large | 32 |
| 3X-Large | 64 |
| 4X-Large | 128 |

Para **multi-cluster warehouses**:
```
Total de Créditos = Créditos/Hora por cluster × Número de clusters ativos × Tempo
```

---

## O Schema ACCOUNT_USAGE

`SNOWFLAKE.ACCOUNT_USAGE` é um schema dentro do banco de dados compartilhado `SNOWFLAKE` que fornece **metadados históricos e dados de uso no nível da conta**:

- Latência dos dados: até **45 minutos** (quase em tempo real)
- Retenção histórica: **1 ano** para a maioria das views
- Requer a role `ACCOUNTADMIN` (ou uma role com privilégios adequados concedidos pelo ACCOUNTADMIN)

### Principais Views do ACCOUNT_USAGE

| View | Finalidade |
|---|---|
| `QUERY_HISTORY` | Todas as queries executadas nos últimos 365 dias |
| `WAREHOUSE_METERING_HISTORY` | Consumo de créditos por warehouse por hora |
| `STORAGE_USAGE` | Uso diário de armazenamento (TB) por banco de dados |
| `TABLE_STORAGE_METRICS` | Armazenamento por tabela, incluindo Time Travel e Fail-Safe |
| `LOGIN_HISTORY` | Todas as tentativas de login (sucesso e falha) |
| `ACCESS_HISTORY` | Trilha de auditoria de acesso a dados (leitura/escrita por query) |
| `COPY_HISTORY` | Histórico de execuções do COPY INTO |
| `PIPE_USAGE_HISTORY` | Consumo de créditos do Snowpipe |
| `METERING_DAILY_HISTORY` | Resumo diário de créditos em todos os serviços |
| `RESOURCE_MONITORS` | Todas as definições de Resource Monitors |
| `OBJECT_DEPENDENCIES` | Linhagem de objetos (o que depende de quê) |

### Queries Comuns de Monitoramento

```sql
-- Top 10 queries mais caras nos últimos 7 dias
SELECT
    query_id,
    user_name,
    warehouse_name,
    total_elapsed_time / 1000 AS tempo_seg,
    credits_used_cloud_services,
    query_text
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
    AND execution_status = 'SUCCESS'
ORDER BY total_elapsed_time DESC
LIMIT 10;

-- Consumo de créditos por warehouse (últimos 30 dias)
SELECT
    warehouse_name,
    sum(credits_used) AS total_creditos,
    round(sum(credits_used) * 3.0, 2) AS custo_estimado_usd  -- exemplo $3/crédito
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE start_time > DATEADD('day', -30, CURRENT_TIMESTAMP)
GROUP BY 1
ORDER BY 2 DESC;

-- Tendência de uso de armazenamento
SELECT
    usage_date,
    round(average_database_bytes / POWER(1024, 3), 2) AS media_armazenamento_gb,
    round(average_stage_bytes / POWER(1024, 3), 2) AS media_stage_gb
FROM SNOWFLAKE.ACCOUNT_USAGE.STORAGE_USAGE
ORDER BY usage_date DESC
LIMIT 30;

-- Logins com falha nas últimas 24 horas
SELECT
    event_timestamp,
    user_name,
    client_ip,
    error_message
FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY
WHERE event_timestamp > DATEADD('hour', -24, CURRENT_TIMESTAMP)
    AND is_success = 'NO'
ORDER BY event_timestamp DESC;

-- Tabelas que consomem mais armazenamento de Time Travel
SELECT
    table_catalog,
    table_schema,
    table_name,
    round(time_travel_bytes / POWER(1024, 3), 2) AS time_travel_gb,
    round(failsafe_bytes / POWER(1024, 3), 2) AS failsafe_gb
FROM SNOWFLAKE.ACCOUNT_USAGE.TABLE_STORAGE_METRICS
WHERE time_travel_bytes > 0
ORDER BY time_travel_bytes DESC
LIMIT 20;
```

---

## INFORMATION_SCHEMA vs. ACCOUNT_USAGE

Ambos fornecem metadados, mas com escopos diferentes:

| Aspecto | INFORMATION_SCHEMA | ACCOUNT_USAGE |
|---|---|---|
| Escopo | Apenas o banco de dados atual | Conta inteira |
| Latência | Tempo real | Até 45 minutos |
| Retenção | Limitada (7–14 dias para histórico) | 1 ano |
| Acesso | Qualquer usuário com acesso ao BD | Requer ACCOUNTADMIN |
| Objetos descartados | Não incluídos | Incluídos |
| Caso de uso | Queries imediatas de estado atual | Análise histórica, auditoria |

```sql
-- INFORMATION_SCHEMA: banco de dados atual, tempo real
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'PUBLIC';

-- ACCOUNT_USAGE: histórico completo da conta
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.TABLES WHERE TABLE_CATALOG = 'ANALYTICS';
```

---

## Boas Práticas de Otimização de Custos

### Otimização de Computação

```sql
-- 1. Usar valores adequados de auto-suspend
ALTER WAREHOUSE WH_DEV SET AUTO_SUSPEND = 60;    -- dev: suspender rapidamente
ALTER WAREHOUSE WH_PROD SET AUTO_SUSPEND = 300;  -- prod: suspender após 5 min

-- 2. Dimensionar corretamente os warehouses (começar pequeno, aumentar se necessário)
-- Execute queries de teste em XS → S → M até o desempenho atender ao SLA

-- 3. Usar query tags para atribuição de custos
ALTER SESSION SET QUERY_TAG = 'projeto:atualizacao_crm equipe:eng-dados';

-- 4. Evitar queries descontroladas com timeout
ALTER WAREHOUSE WH_ADHOC SET STATEMENT_TIMEOUT_IN_SECONDS = 3600;
```

### Otimização de Armazenamento

```sql
-- Reduzir Time Travel em tabelas de staging (economiza custo de armazenamento)
ALTER TABLE staging.eventos_brutos SET DATA_RETENTION_TIME_IN_DAYS = 1;

-- Usar tabelas Transient para resultados intermediários (sem Fail-Safe)
CREATE TRANSIENT TABLE staging.tabela_trabalho AS SELECT ...;

-- Remover stages não utilizados
REMOVE @stage_antigo/;
DROP STAGE stage_antigo;
```

### Custos de Recursos Serverless

| Recurso Serverless | Como é Cobrado |
|---|---|
| Snowpipe | Por arquivo carregado (computação serverless) |
| Automatic Clustering | Créditos do serviço em segundo plano |
| Materialized Views | Créditos de atualização em segundo plano |
| Atualização de Dynamic Table | Créditos do serviço em segundo plano |
| Replicação | Créditos para transferência de dados e computação |
| Search Optimization | Armazenamento + créditos para construção |

---

## Questões de Prática

**Q1.** Um Resource Monitor é configurado com `ON 100 PERCENT DO SUSPEND`. O que acontece quando esse limiar é atingido?

- A) Todas as queries em execução são imediatamente canceladas
- B) Novas queries são enfileiradas; as queries em execução terminam, depois o warehouse é suspenso ✅
- C) Uma notificação por email é enviada e nada mais muda
- D) O warehouse é descartado

**Q2.** Qual é o tempo mínimo de cobrança cada vez que um virtual warehouse começa a executar?

- A) 30 segundos
- B) 60 segundos ✅
- C) 5 minutos
- D) 1 hora

**Q3.** Qual view do ACCOUNT_USAGE fornece informações sobre o consumo de créditos por warehouse por hora?

- A) QUERY_HISTORY
- B) STORAGE_USAGE
- C) WAREHOUSE_METERING_HISTORY ✅
- D) METERING_DAILY_HISTORY

**Q4.** Qual é a latência aproximada dos dados para as views do schema ACCOUNT_USAGE?

- A) Tempo real
- B) Até 45 minutos ✅
- C) Até 24 horas
- D) 7 dias

**Q5.** Um Resource Monitor é definido tanto no nível da conta quanto no nível do warehouse para `WH_ANALYTICS`. O que acontece?

- A) Apenas o monitor do nível do warehouse se aplica
- B) Apenas o monitor do nível da conta se aplica
- C) Ambos os monitores se aplicam de forma independente ✅
- D) O monitor mais restritivo tem precedência

**Q6.** Os Resource Monitors rastreiam qual tipo de consumo de créditos?

- A) Armazenamento + computação + Cloud Services
- B) Apenas créditos de computação de virtual warehouses ✅
- C) Créditos de Snowpipe e recursos serverless
- D) Todos os tipos de créditos do Snowflake igualmente

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. **Resource Monitor** = executor de orçamento de créditos para warehouses; opera **sem custo**
> 2. `SUSPEND` = deixar queries em execução terminarem | `SUSPEND_IMMEDIATE` = matar todas as queries agora
> 3. Cobrança: **por segundo, mínimo de 60 segundos** por inicialização de warehouse
> 4. **ACCOUNT_USAGE** = 1 ano de histórico, até 45 min de latência, toda a conta, requer ACCOUNTADMIN
> 5. **INFORMATION_SCHEMA** = tempo real, apenas banco de dados atual, retenção limitada
> 6. Monitores de Resource Monitor no nível de conta e de warehouse se aplicam **de forma independente**
