---
title: "Snapshots, Seeds e Sources Avançadas"
description: "Domine snapshots dbt para Dimensões de Mudança Lenta no Redshift usando a nova especificação YAML (dbt 1.9+), configure seeds para dados de referência e projete configurações de fonte de nível profissional com verificações de frescor e integração Redshift Spectrum."
order: 7
duration: "50 min"
difficulty: "advanced"
---

# Snapshots, Seeds e Sources Avançadas

Três tipos de recursos do dbt são frequentemente subutilizados em projetos avançados: snapshots para rastrear mudanças históricas, seeds para pequenos conjuntos de dados de referência e sources para declarações de dados brutos. No Redshift, cada um tem considerações específicas de performance e novos recursos introduzidos no dbt-core 1.9.

Entender esses três recursos é essencial porque:
- **Snapshots** resolvem o problema de rastrear mudanças em dados de referência ao longo do tempo
- **Seeds** fornecem uma maneira simples de gerenciar dados de referência pequenos e estáveis
- **Sources** formalizam a relação entre seus modelos e os dados brutos externos

---

## Snapshots: Rastreando Dimensões de Mudança Lenta

Snapshots implementam **Dimensões de Mudança Lenta Tipo 2 (SCD2)** — eles rastreiam como uma linha muda ao longo do tempo mantendo todas as versões históricas com timestamps de validade.

### A Nova Especificação YAML de Snapshot (dbt-core 1.9+)

Antes do dbt 1.9, snapshots só podiam ser definidos em arquivos `.sql` com um bloco `{% snapshot %}`. Agora podem ser declarados inteiramente em YAML:

```yaml
# snapshots/schema.yml (especificação YAML dbt 1.9+)
snapshots:
  - name: snap_customers
    description: "Snapshot SCD2 da dimensão de clientes"
    relation: source('crm', 'customers')    # fonte a ser snapshotada

    config:
      # Estratégia: check — detecta mudanças comparando hash das colunas especificadas
      strategy: check
      unique_key: customer_id
      check_cols:
        - email
        - phone
        - customer_segment
        - billing_address
        - shipping_address

      # Configurações de performance Redshift
      target_schema: snapshots
      target_database: analytics

      # Nomes customizados de colunas de metadados (dbt 1.9+)
      snapshot_meta_column_names:
        dbt_scd_id:     _scd_id
        dbt_updated_at: _updated_at
        dbt_valid_from: _valid_from
        dbt_valid_to:   _valid_to

      # Lidar com hard deletes — marcar registros como deletados quando desaparecem
      invalidate_hard_deletes: true

      # Específico Redshift
      dist: customer_id
      sort: [_valid_from, _valid_to]
      sort_type: compound
      backup: true
```

### Estratégia Baseada em Timestamp

```yaml
snapshots:
  - name: snap_orders
    relation: source('oms', 'orders')

    config:
      strategy: timestamp
      unique_key: order_id
      updated_at: updated_at           # coluna que rastreia a última modificação

      target_schema: snapshots

      snapshot_meta_column_names:
        dbt_scd_id:     _scd_id
        dbt_updated_at: _updated_at
        dbt_valid_from: _valid_from
        dbt_valid_to:   _valid_to

      # Indicador customizado para registros "atuais" (dbt 1.9+)
      # Padrão é NULL; defina uma data futura para compatibilidade com ferramentas BI
      dbt_valid_to_current: '9999-12-31'

      dist: order_id
      sort: [_valid_from]
      sort_type: compound
```

Com `dbt_valid_to_current: '9999-12-31'`, registros atuais mostram `_valid_to = '9999-12-31'` em vez de `NULL`, o que é muito mais amigável para ferramentas de BI como Tableau ou QuickSight em filtros de data.

### Snapshot Baseado em SQL (ainda suportado)

```sql
-- snapshots/snap_products.sql
{% snapshot snap_products %}

{{ config(
    target_schema='snapshots',
    strategy='check',
    unique_key='product_id',
    check_cols=['product_name', 'price', 'category', 'is_active'],
    invalidate_hard_deletes=true,
    snapshot_meta_column_names={
        'dbt_scd_id':     '_scd_id',
        'dbt_updated_at': '_updated_at',
        'dbt_valid_from': '_valid_from',
        'dbt_valid_to':   '_valid_to'
    },
    dbt_valid_to_current='9999-12-31',
    dist='product_id',
    sort=['_valid_from'],
    sort_type='compound'
) }}

select
    product_id,
    product_name,
    price,
    category,
    subcategory,
    is_active,
    supplier_id
from {{ source('catalog', 'products') }}

{% endsnapshot %}
```

### Executando Snapshots

```bash
# Executar todos os snapshots
dbt snapshot

# Executar um snapshot específico
dbt snapshot --select snap_customers

# Snapshot + modelos downstream em um comando
dbt build --select snap_customers+
```

### Consultando Snapshots

```sql
-- Estado atual apenas
select *
from analytics.snapshots.snap_customers
where _valid_to = '9999-12-31';

-- Estado histórico em um ponto no tempo
select *
from analytics.snapshots.snap_customers
where _valid_from <= '2024-06-01'
  and (_valid_to > '2024-06-01' or _valid_to = '9999-12-31');

-- Histórico completo de mudanças para um cliente
select *
from analytics.snapshots.snap_customers
where customer_id = 42
order by _valid_from;
```

---

## Seeds: Gerenciamento de Dados de Referência

Seeds são arquivos CSV armazenados em seu projeto dbt que são carregados no warehouse com `dbt seed`. São ideais para pequenas tabelas de referência que mudam lentamente.

### Configurando Seeds para Redshift

```yaml
# dbt_project.yml
seeds:
  my_analytics:
    # Configurações padrão para todos os seeds
    +schema: reference
    +backup: false

    # Configurações específicas de seed
    country_codes:
      +column_types:
        iso_code:    varchar(2)
        iso3_code:   varchar(3)
        country_name: varchar(100)
        region:       varchar(50)
      +dist: all          # tabela de consulta pequena — copiar para todos os nós
      +sort: iso_code

    status_mapping:
      +column_types:
        raw_status:     varchar(10)
        display_status: varchar(50)
        is_terminal:    boolean
      +dist: all
```

### Arquivos Seed

```
seeds/
├── country_codes.csv
├── status_mapping.csv
└── region_hierarchy.csv
```

```csv
# seeds/status_mapping.csv
raw_status,display_status,is_terminal
P,Pending,false
S,Shipped,false
D,Delivered,true
C,Cancelled,true
RJ,Rejected,true
RF,Refunded,true
```

### Carregando Seeds

```bash
# Carregar todos os seeds
dbt seed

# Carregar e mostrar contagens de linhas
dbt seed --show

# Carregar apenas seeds modificados (usa comparação de hash de arquivo)
dbt seed --select status_mapping

# Full refresh de um seed (truncate + reload)
dbt seed --full-refresh --select status_mapping
```

### Quando Usar Seeds vs. Tabelas Fonte

| Situação | Use |
| :--- | :--- |
| Tabela de consulta pequena (< 1.000 linhas), muda raramente | Seed |
| Dados de referência pertencentes a outra equipe | Source |
| Códigos de país, mapeamentos de status, calendários fiscais | Seed |
| Dados mestre de clientes do CRM | Source |
| Dados que mudam mais de uma vez por semana | Source com snapshot |

---

## Configuração Avançada de Sources

Sources declaram tabelas externas (dados brutos) sobre as quais os modelos dbt são construídos. A configuração avançada de sources adiciona verificações de frescor, quoting e suporte a Redshift Spectrum.

### Configuração de Source de Produção

```yaml
# models/staging/sources.yml
version: 2

sources:
  - name: raw_events
    description: "Eventos de clickstream brutos do Kinesis Firehose -> S3 -> Redshift COPY"
    database: analytics
    schema: raw

    # Frescor no nível da fonte: avisar se qualquer tabela nesta fonte estiver desatualizada
    freshness:
      warn_after: {count: 1, period: hour}
      error_after: {count: 6, period: hour}

    # Quoting de colunas (Redshift é case-insensitive mas pode precisar de quoting para palavras reservadas)
    quoting:
      database: false
      schema: false
      identifier: false

    tables:
      - name: events
        description: "Eventos brutos de page view e click"
        identifier: raw_events_partitioned    # nome real da tabela se diferente de 'events'

        # Override de frescor no nível da tabela
        freshness:
          warn_after: {count: 30, period: minute}
          error_after: {count: 2, period: hour}
          filter: "event_date >= current_date - 2"   # verificar apenas partições recentes

        # Qual coluna determina o frescor
        loaded_at_field: event_timestamp

        columns:
          - name: event_id
            description: "UUID do evento"
            data_tests:
              - not_null
              - unique:
                  config:
                    severity: warn    # duplicatas são esperadas na camada bruta

          - name: event_timestamp
            description: "Timestamp UTC do evento"
            data_tests:
              - not_null

      - name: users
        description: "Registros brutos de usuários do Firehose"
        loaded_at_field: _fivetran_synced
        freshness:
          warn_after: {count: 4, period: hour}
          error_after: {count: 24, period: hour}
```

### Verificando Frescor de Sources

```bash
# Verificar todas as sources
dbt source freshness

# Verificar source específica
dbt source freshness --select source:raw_events

# Incluir no pipeline CI
dbt source freshness && dbt run --select staging
```

### Sources Externas do Redshift Spectrum

Sources podem apontar para tabelas externas do Redshift Spectrum (dados no S3):

```yaml
sources:
  - name: spectrum_raw
    description: "Tabelas externas via Redshift Spectrum apontando para data lake no S3"
    database: analytics
    schema: spectrum_schema    # schema externo criado via CREATE EXTERNAL SCHEMA

    tables:
      - name: events_parquet
        description: "Eventos Parquet particionados por ano/mes/dia no S3"
        # Sem verificacoes de frescor -- tabelas Spectrum sao particionadas externamente

        columns:
          - name: event_id
          - name: event_timestamp
          - name: year
            description: "Coluna de particao"
          - name: month
            description: "Coluna de particao"
          - name: day
            description: "Coluna de particao"
```

Modelo staging sobre Spectrum:

```sql
-- models/staging/stg_spectrum_events.sql
{{ config(
    materialized='view',
    bind=false        -- OBRIGATORIO para sources Spectrum
) }}

select
    event_id,
    user_id,
    event_type,
    event_timestamp::timestamp as event_timestamp,
    properties::super          as properties
from {{ source('spectrum_raw', 'events_parquet') }}
where year  = date_part('year',  current_date)
  and month = date_part('month', current_date)
  and day   = date_part('day',   current_date)
```

[!IMPORTANT]
Views que referenciam tabelas externas do Redshift Spectrum **devem** usar `bind: false` (late-binding views). Views vinculadas padrao nao podem referenciar tabelas externas e falharao com um erro de compilacao.

---

## 6 Perguntas de Pratica

```question
{
  "id": "dbt-rs-07-q1",
  "type": "multiple-choice",
  "question": "O que `dbt_valid_to_current: '9999-12-31'` faz em uma configuracao de snapshot?",
  "options": [
    "Define a data de expiracao do snapshot",
    "Substitui NULL na coluna dbt_valid_to de registros atuais pela data especificada, melhorando compatibilidade com ferramentas BI",
    "Limita o snapshot a registros atualizados antes de 9999-12-31",
    "Define o periodo maximo de retencao para registros historicos de snapshot"
  ],
  "correct": 1,
  "explanation": "Por padrao, registros atuais de snapshot tem NULL em dbt_valid_to. Definir dbt_valid_to_current='9999-12-31' substitui NULL por essa data, o que e muito mais facil de usar em ferramentas BI que tem dificuldade com filtros de data NULL."
}
```

```question
{
  "id": "dbt-rs-07-q2",
  "type": "multiple-choice",
  "question": "Qual e o proposito de `snapshot_meta_column_names` na configuracao de snapshot do dbt 1.9+?",
  "options": [
    "Renomear a tabela de snapshot em si",
    "Customizar os nomes das colunas de metadados adicionadas automaticamente pelo dbt (dbt_valid_from, dbt_valid_to, etc.)",
    "Mapear nomes de colunas de origem para nomes de colunas de snapshot",
    "Definir os nomes de exibicao no dbt docs"
  ],
  "correct": 1,
  "explanation": "snapshot_meta_column_names permite renomear as colunas de metadados geradas automaticamente pelo dbt (dbt_scd_id, dbt_updated_at, dbt_valid_from, dbt_valid_to) para nomes personalizados que se alinham com as convencoes de nomenclatura da sua organizacao."
}
```

```question
{
  "id": "dbt-rs-07-q3",
  "type": "multiple-choice",
  "question": "Por que views sobre tabelas externas do Redshift Spectrum devem usar `bind: false`?",
  "options": [
    "Tabelas Spectrum sao read-only e bind: true tentaria uma escrita",
    "Views padrao (vinculadas) nao podem referenciar tabelas externas -- Redshift requer late-binding views para compatibilidade com Spectrum",
    "bind: false melhora a performance de consultas Spectrum",
    "Redshift Serverless requer bind: false para todas as views"
  ],
  "correct": 1,
  "explanation": "O Redshift nao suporta views vinculadas sobre tabelas externas do Spectrum. A definicao da view falharia no momento da criacao. Late-binding views (bind: false) desvinculam a definicao da view de suas dependencias, permitindo referencias ao Spectrum."
}
```

```question
{
  "id": "dbt-rs-07-q4",
  "type": "multiple-choice",
  "question": "Qual estrategia de snapshot voce deve usar quando a tabela fonte nao tem uma coluna `updated_at` mas voce quer detectar qualquer mudanca no valor da coluna?",
  "options": [
    "strategy: timestamp",
    "strategy: check com check_cols especificadas",
    "strategy: merge",
    "strategy: append"
  ],
  "correct": 1,
  "explanation": "A estrategia check computa um hash das colunas especificadas e sinaliza uma linha como alterada quando o hash difere do valor armazenado. Isso nao requer uma coluna updated_at."
}
```

```question
{
  "id": "dbt-rs-07-q5",
  "type": "multiple-choice",
  "question": "Uma tabela fonte tem uma configuracao `freshness.filter` definida como `"event_date >= current_date - 2"`. O que isso faz?",
  "options": [
    "Deleta dados mais antigos que 2 dias da fonte",
    "Limita a verificacao de frescor a linhas dos ultimos 2 dias, evitando varreduras completas em tabelas particionadas grandes",
    "Filtra dados fonte para todos os modelos staging que referenciam esta fonte",
    "Define o TTL da fonte como 2 dias"
  ],
  "correct": 1,
  "explanation": "O filtro na configuracao de freshness e adicionado como uma clausula WHERE na consulta de verificacao de frescor. Em tabelas particionadas grandes, isso evita uma varredura completa limitando a verificacao a particoes recentes."
}
```

```question
{
  "id": "dbt-rs-07-q6",
  "type": "multiple-choice",
  "question": "Você tem um arquivo seed com 800 linhas de codigos de paises que raramente mudam. Deve definir dist: all ou dist: even?",
  "options": [
    "dist: even -- distribuicao uniforme e sempre o padrao seguro",
    "dist: all -- copiar a tabela pequena completa para cada no de computacao para joins co-localizados",
    "dist: key -- sempre usar uma chave para tabelas de consulta",
    "Nenhuma config dist -- seeds usam distribuicao automatica automaticamente"
  ],
  "correct": 1,
  "explanation": "Tabelas de referencia pequenas como codigos de paises (800 linhas) se beneficiam de dist: all. Cada no recebe uma copia completa, permitindo joins co-localizados com qualquer tabela fato ou dimensao independentemente da chave de distribuicao dessa tabela."
}
```

---

[!SUCCESS]
### Principais Conclusoes

- dbt 1.9+ permite que snapshots sejam declarados inteiramente em YAML com `snapshot_meta_column_names` para nomenclatura personalizada de colunas e `dbt_valid_to_current` para indicadores de registro atual amigos de BI.
- Use `strategy: timestamp` quando uma coluna `updated_at` confiavel existe; use `strategy: check` quando voce precisa de deteccao de mudanca baseada em hash.
- Defina `invalidate_hard_deletes: true` para fechar registros historicos quando linhas desaparecem da fonte.
- Seeds sao ideais para dados de referencia pequenos e que mudam raramente (<1.000 linhas). Use `dist: all` para que todo join com o seed seja co-localizado.
- Filtros de frescor de source (`freshness.filter`) limitam consultas de verificacao de frescor a particoes recentes -- essencial para tabelas brutas grandes particionadas por tempo.
- Views sobre tabelas externas do Redshift Spectrum requerem `bind: false` -- views padrao nao podem referenciar tabelas externas.
