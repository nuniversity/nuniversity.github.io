---
title: "Pacotes dbt Essenciais para Projetos de Produção"
description: "Domine os pacotes dbt indispensáveis para todo projeto de produção: dbt-utils, dbt-expectations, dbt-audit-helper, dbt-codegen, elementary, dbt-project-evaluator e mais — todos configurados para um ambiente Amazon Redshift."
order: 10
duration: "55 min"
difficulty: "advanced"
---

# Pacotes dbt Essenciais para Projetos de Produção

O ecossistema de pacotes dbt significa que você nunca deve escrever uma função de surrogate key, uma macro pivot ou um date spine do zero. A comunidade já resolveu esses problemas, testou-os em escala e publicou-os no dbt Hub. Este módulo cobre os pacotes que pertencem a todo projeto dbt-Redshift de produção, por que eles existem e como usar seus recursos mais importantes.

Usar pacotes traz três vantagens principais:
1. **Produtividade**: você não precisa reinventar a roda para funcionalidades comuns
2. **Confiabilidade**: o código foi testado em escala pela comunidade
3. **Padronização**: macros e testes seguem convenções estabelecidas

---

## Fundamentos de Gerenciamento de Pacotes

Todos os pacotes são declarados em `packages.yml` e instalados com `dbt deps`.

```yaml
# packages.yml
packages:
  # Utilitários principais — instale em todo projeto
  - package: dbt-labs/dbt_utils
    version: 1.3.0

  # Testes de qualidade de dados estilo Great Expectations
  - package: calogica/dbt_expectations
    version: 0.10.4

  # Comparação de datasets para migrações e refatorações
  - package: dbt-labs/audit_helper
    version: 0.10.0

  # Geração de código a partir de fontes e introspecção do warehouse
  - package: dbt-labs/dbt_codegen
    version: 0.12.1

  # Observabilidade de dados e detecção de anomalias
  - package: elementary-data/elementary
    version: 0.16.1

  # Qualidade de DAG e aplicação de cobertura de documentação
  - package: dbt-labs/dbt_project_evaluator
    version: 0.13.0

  # Mart de artefatos dbt (metadados de execução em tabelas do warehouse)
  - package: brooklyn-data/dbt_artifacts
    version: 2.3.0
```

```bash
# Instalar todos os pacotes declarados
dbt deps

# Atualizar um pacote específico
dbt deps --upgrade
```

[!TIP]
Sempre fixe versões de pacotes exatamente em `packages.yml`. Versões flutuantes (`>=1.0.0`) causam builds não reproduzíveis quando pacotes lançam mudanças disruptivas. Atualize versões deliberadamente, após ler o changelog.

---

## 1. dbt-utils: O Pacote Fundamental

`dbt-labs/dbt_utils` é o pacote dbt mais importante — ele fornece macros e testes principais dos quais quase todos os outros pacotes dependem.

### Surrogate Keys

```sql
-- models/marts/dim_customers.sql
select
    -- Gerar uma surrogate key a partir de múltiplas chaves naturais
    {{ dbt_utils.generate_surrogate_key(['user_id', 'account_id']) }} as customer_key,
    user_id,
    account_id,
    email,
    customer_segment
from {{ ref('stg_customers') }}
```

`generate_surrogate_key` produz um hash MD5 consistente entre warehouses. No Redshift ele compila para `md5(cast(coalesce(cast(user_id as varchar), '_dbt_utils_surrogate_key_null_') || '-' || ...) as varchar)`.

### Star — Selecionar Todos Exceto

```sql
-- Selecionar todas as colunas exceto metadados internos de carga
select
    {{ dbt_utils.star(
        from=ref('stg_orders'),
        except=['_fivetran_synced', '_fivetran_deleted', 'loaded_at']
    ) }}
from {{ ref('stg_orders') }}
```

### Union Relations

```sql
-- models/marts/fct_all_events.sql
{{ config(materialized='incremental', incremental_strategy='append') }}

{{
    dbt_utils.union_relations(
        relations=[
            ref('stg_web_events'),
            ref('stg_mobile_events'),
            ref('stg_api_events')
        ],
        column_override={"event_timestamp": "timestamp"},
        include=["event_id", "user_id", "event_type", "event_timestamp", "properties"]
    )
}}
```

### Date Spine

```sql
-- models/marts/dim_date.sql
{{ config(materialized='table', dist='all', sort='date_day') }}

{{
    dbt_utils.date_spine(
        datepart="day",
        start_date="cast('2020-01-01' as date)",
        end_date="cast('2030-12-31' as date)"
    )
}}
```

### Testes Genéricos Úteis

```yaml
models:
  - name: fct_orders
    columns:
      - name: order_id
        data_tests:
          # Garantir que nenhum valor seja string vazia (não capturado por not_null)
          - dbt_utils.not_empty_string

      - name: total_amount
        data_tests:
          # Valor deve estar entre duas outras colunas na mesma linha
          - dbt_utils.expression_is_true:
              expression: ">= 0"

    data_tests:
      # Nível de tabela: garantir que pelo menos N linhas existem
      - dbt_utils.recency:
          datepart: hour
          field: order_date
          interval: 6      # falha se o pedido mais recente tiver > 6 horas

      # Contagem de linhas dentro do intervalo esperado
      - dbt_utils.equal_rowcount:
          compare_model: ref('stg_orders')

      # Proporção de não-nulos (útil para tabelas fonte brutas)
      - dbt_utils.not_null_proportion:
          at_least: 0.95
          column_name: customer_id
```

---

## 2. dbt-expectations: Great Expectations para dbt

`calogica/dbt_expectations` adiciona 50+ testes de qualidade de dados inspirados pela biblioteca Great Expectations — muito além dos testes genéricos integrados do dbt.

```yaml
# packages.yml já inclui calogica/dbt_expectations

models:
  - name: fct_orders
    data_tests:
      # Tabela deve ter exatamente estas colunas (captura mudanças acidentais de schema)
      - dbt_expectations.expect_table_columns_to_match_ordered_list:
          column_list:
            - order_id
            - customer_id
            - order_date
            - status
            - total_amount
            - customer_segment
            - region

      # Contagem de linhas deve estar dentro de 20% da contagem de ontem
      - dbt_expectations.expect_table_row_count_to_be_between:
          min_value: 1000
          max_value: 10000000

    columns:
      - name: order_date
        data_tests:
          # Data deve estar entre dois limites
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: "'2020-01-01'"
              max_value: "current_date"
              row_condition: "order_date is not null"

          # Sem lacunas na cobertura diária de data (crítico para fatos de série temporal)
          - dbt_expectations.expect_row_values_to_have_data_for_every_n_datepart:
              date_col: order_date
              date_part: day
              test_start_date: "'2024-01-01'"

      - name: total_amount
        data_tests:
          # Distribuição de valor: média deve estar entre $50 e $500
          - dbt_expectations.expect_column_mean_to_be_between:
              min_value: 50
              max_value: 500

          # Verificação de desvio padrão (detecta deriva na distribuição de dados)
          - dbt_expectations.expect_column_stdev_to_be_between:
              min_value: 10
              max_value: 1000

          # Sem outliers > 3 sigma da média
          - dbt_expectations.expect_column_values_to_be_within_n_stdevs:
              n: 3

      - name: email
        data_tests:
          # Validação de regex para formato de email
          - dbt_expectations.expect_column_values_to_match_regex:
              regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
              row_condition: "email is not null"
```

---

## 3. dbt-audit-helper: Refatoração e Migrações Seguras

`dbt-labs/audit_helper` é sua rede de segurança ao refatorar modelos ou migrar de um padrão SQL para outro. Ele compara duas relações linha por linha e coluna por coluna.

### Comparar Contagens de Linhas

```bash
# Como uma operação dbt
dbt run-operation audit_helper.compare_row_counts --args '{
    "a_relation": "analytics.marts.fct_orders",
    "b_relation": "analytics.marts_v2.fct_orders"
}'
```

### Comparar Valores de Colunas

```bash
# Comparação coluna-por-coluna entre modelo antigo e novo
dbt run-operation audit_helper.compare_column_values --args '{
    "a_relation": "analytics.marts.fct_orders",
    "b_relation": "analytics.marts_v2.fct_orders",
    "primary_key": "order_id",
    "columns_to_compare": ["total_amount", "status", "customer_segment"]
}'
```

Saída:

```
column_name     | match_count | a_only_count | b_only_count | mismatch_count
----------------|-------------|--------------|--------------|---------------
total_amount    | 99,847      | 0            | 0            | 153
status          | 100,000     | 0            | 0            | 0
customer_segment| 99,993      | 0            | 0            | 7
```

### Fluxo de Trabalho: Migração Segura

```bash
# Passo 1: Construir novo modelo ao lado do antigo
dbt run --select fct_orders_v2

# Passo 2: Comparar — zero discrepâncias exigido antes do corte
dbt run-operation audit_helper.compare_column_values --args '{...}'

# Passo 3: Comparar contagens de linhas
dbt run-operation audit_helper.compare_row_counts --args '{...}'

# Passo 4: Se limpo, renomear e trocar refs
```

---

## 4. dbt-codegen: Elimine Código Repetitivo

`dbt-labs/dbt_codegen` gera YAML e SQL a partir do schema do seu warehouse — eliminando o trabalho manual tedioso de escrever configurações de fonte e modelos base.

### Gerar YAML de Source a partir do Redshift

```bash
# Gerar sources.yml para um schema inteiro
dbt run-operation codegen.generate_source --args '{
    "schema_name": "raw",
    "database_name": "analytics",
    "generate_columns": true,
    "include_descriptions": true,
    "table_pattern": "orders%"    # apenas tabelas correspondentes a este padrão
}'
```

Saída (cole em `models/staging/sources.yml`):

```yaml
version: 2
sources:
  - name: raw
    database: analytics
    schema: raw
    tables:
      - name: orders
        description: ""
        columns:
          - name: order_id
            description: ""
          - name: customer_id
            description: ""
          # ... todas as colunas
```

### Gerar Modelos Base

```bash
# Gerar um SQL de modelo staging a partir de uma tabela fonte
dbt run-operation codegen.generate_base_model --args '{
    "source_name": "raw",
    "table_name": "orders",
    "leading_commas": false
}'
```

Saída (cole em `models/staging/stg_orders.sql`):

```sql
with source as (

    select * from {{ source('raw', 'orders') }}

),

renamed as (

    select
        order_id,
        customer_id,
        status,
        total_amount,
        created_at,
        updated_at

    from source

)

select * from renamed
```

### Gerar YAML de Modelo

```bash
# Gerar schema.yml para um modelo já materializado
dbt run-operation codegen.generate_model_yaml --args '{
    "model_names": ["fct_orders", "dim_customers"],
    "upstream_descriptions": true
}'
```

---

## 5. Elementary: Observabilidade de Dados

`elementary-data/elementary` adiciona detecção de anomalias como testes nativos do dbt — ele monitora seus dados quanto a anomalias de volume, frescor, schema e distribuição de valores sem ferramentas externas.

```yaml
# models/marts/facts/schema.yml
models:
  - name: fct_orders
    data_tests:
      # Alertar se a contagem de linhas cair/subir mais de 20% vs. média de 7 dias
      - elementary.volume_anomalies:
          timestamp_column: order_date
          sensitivity: 3         # desvios padrão
          days_back: 14          # janela de treinamento

      # Alertar se a linha mais recente for mais antiga que o esperado
      - elementary.freshness_anomalies:
          timestamp_column: order_date
          sensitivity: 3

    columns:
      - name: total_amount
        data_tests:
          # Alertar se a distribuição de valores mudar significativamente
          - elementary.column_anomalies:
              column_anomalies:
                - null_count
                - null_rate
                - average
                - standard_deviation
                - max_value
              timestamp_column: order_date
              sensitivity: 3

      - name: status
        data_tests:
          # Alertar se a distribuição de categorias mudar (ex.: pico súbito em Cancelled)
          - elementary.dimension_anomalies:
              timestamp_column: order_date
              sensitivity: 3
```

Elementary escreve resultados de teste em um mart de tabelas no seu warehouse. Configure o schema:

```yaml
# dbt_project.yml
vars:
  elementary:
    elementary_database: analytics
    elementary_schema: elementary    # schema dedicado para tabelas de observabilidade
    days_back: 30                    # quantos dias de histórico manter
```

```bash
# Instalar elementary e executar seus modelos
dbt deps
dbt run --select elementary

# Gerar o relatório Elementary (dashboard HTML de observabilidade)
pip install elementary-data
edr report
```

---

## 6. dbt-project-evaluator: Qualidade de DAG

`dbt-labs/dbt_project_evaluator` analisa a estrutura do seu projeto dbt e sinaliza anti-padrões.

```bash
# Executar todas as verificações do evaluator
dbt build --select package:dbt_project_evaluator
```

Principais verificações que executa:

| Modelo Evaluator | O que captura |
| :--- | :--- |
| `fct_undocumented_models` | Modelos sem descrição |
| `fct_missing_primary_key_tests` | Modelos sem testes unique + not_null |
| `fct_model_fanout` | Modelos com muitos pais diretos (DAG espaguete) |
| `fct_rejoining_of_upstream_concepts` | Modelos que juntam dois ramos compartilhando um ancestral comum |
| `fct_direct_join_to_source` | Modelos mart que juntam diretamente a fontes brutas |
| `fct_hard_coded_references` | Modelos usando nomes de schema hardcoded em vez de `ref()` |
| `fct_unused_sources` | Fontes declaradas mas nunca referenciadas |

Configure limites no seu `dbt_project.yml`:

```yaml
# dbt_project.yml
vars:
  dbt_project_evaluator:
    documentation_coverage_target: 80       # % de modelos que devem ser documentados
    test_coverage_target: 80                # % de modelos que devem ter testes
    max_fanout_models: 5                    # max pais diretos por modelo
    primary_key_test_macros:               # o que conta como teste PK
      - dbt_utils.unique_combination_of_columns
      - unique
```

---

## 7. dbt-artifacts: Metadados de Execução no Warehouse

`brooklyn-data/dbt_artifacts` carrega metadados de execução do dbt (tempos de modelo, resultados de teste, frescor de fonte) em tabelas do warehouse — permitindo dashboards sobre a saúde do pipeline.

```yaml
# packages.yml
packages:
  - package: brooklyn-data/dbt_artifacts
    version: 2.3.0
```

```yaml
# dbt_project.yml
vars:
  dbt_artifacts:
    dbt_artifacts_database: analytics
    dbt_artifacts_schema: dbt_artifacts
```

Use hooks on-run-end para capturar metadados após cada execução:

```yaml
# dbt_project.yml
on-run-end:
  - "{{ dbt_artifacts.upload_results(results) }}"
```

Consulte a saúde do pipeline diretamente do Redshift:

```sql
-- Quais modelos são mais lentos em produção?
select
    model_execution_time_ms,
    name,
    schema_name,
    materialization,
    run_started_at
from analytics.dbt_artifacts.fct_dbt__model_executions
where run_started_at > current_date - 7
order by model_execution_time_ms desc
limit 20;

-- Taxa de aprovação de teste ao longo do tempo
select
    date_trunc('day', run_started_at)::date as run_date,
    count_if(status = 'pass') as passed,
    count_if(status = 'fail') as failed,
    count(*) as total,
    round(count_if(status = 'pass') * 100.0 / count(*), 1) as pass_rate_pct
from analytics.dbt_artifacts.fct_dbt__test_executions
where run_started_at > current_date - 30
group by 1
order by 1;
```

---

## Template `packages.yml` Recomendado

```yaml
# packages.yml — template pronto para produção para dbt + Redshift
packages:
  # Core — obrigatório
  - package: dbt-labs/dbt_utils
    version: 1.3.0

  # Testes
  - package: calogica/dbt_expectations
    version: 0.10.4

  # Segurança para refatoração e migração
  - package: dbt-labs/audit_helper
    version: 0.10.0

  # Geração de código
  - package: dbt-labs/dbt_codegen
    version: 0.12.1

  # Observabilidade e detecção de anomalias
  - package: elementary-data/elementary
    version: 0.16.1

  # Qualidade de DAG
  - package: dbt-labs/dbt_project_evaluator
    version: 0.13.0

  # Metadados de execução no warehouse
  - package: brooklyn-data/dbt_artifacts
    version: 2.3.0
```

---

## 6 Perguntas de Prática

```question
{
  "id": "dbt-rs-10-q1",
  "type": "multiple-choice",
  "question": "Por que as versões de pacotes devem sempre ser fixadas exatamente em packages.yml em vez de usar um intervalo como `>=1.0.0`?",
  "options": [
    "dbt deps não suporta intervalos de versão",
    "Versões flutuantes causam builds não reproduzíveis — um lançamento de pacote com mudanças disruptivas quebra silenciosamente seu projeto",
    "Versões fixadas executam mais rápido que versões flutuantes",
    "AWS Redshift exige fixação exata de versão para conformidade"
  ],
  "correct": 1,
  "explanation": "Restrições de versão flutuantes significam que `dbt deps` pode instalar uma versão mais nova do pacote que contém mudanças disruptivas, tornando builds não reproduzíveis entre ambientes. Fixação exata garante que todo ambiente instale versões idênticas de pacotes."
}
```

```question
{
  "id": "dbt-rs-10-q2",
  "type": "multiple-choice",
  "question": "O que `dbt_utils.star(from=ref('stg_orders'), except=['loaded_at'])` faz?",
  "options": [
    "Conta todas as linhas em stg_orders excluindo linhas onde loaded_at é nulo",
    "Gera um SELECT * que lista explicitamente todas as colunas de stg_orders exceto loaded_at",
    "Cria uma surrogate key excluindo a coluna loaded_at",
    "Faz union de stg_orders com todas as outras tabelas staging exceto loaded_at"
  ],
  "correct": 1,
  "explanation": "dbt_utils.star() inspeciona as colunas da relação e gera uma lista SELECT explícita de todas as colunas menos aquelas na lista except. Isso evita SELECT * enquanto ainda se adapta automaticamente quando novas colunas são adicionadas upstream."
}
```

```question
{
  "id": "dbt-rs-10-q3",
  "type": "multiple-choice",
  "question": "Quando você usaria a operação `compare_column_values` do dbt-audit-helper?",
  "options": [
    "Para gerar arquivos YAML de schema a partir de metadados de coluna do warehouse",
    "Para validar com segurança que um modelo refatorado produz saída idêntica ao original antes de fazer o corte",
    "Para detectar anomalias em distribuições de valores de coluna ao longo do tempo",
    "Para comparar nomes de colunas entre dois schemas para deriva de documentação"
  ],
  "correct": 1,
  "explanation": "compare_column_values compara valores de dados reais entre duas relações (ex.: modelo antigo vs. novo) coluna por coluna. É a ferramenta principal para validar refatorações e migrações antes de trocar referências downstream."
}
```

```question
{
  "id": "dbt-rs-10-q4",
  "type": "multiple-choice",
  "question": "O que `elementary.volume_anomalies` detecta que um teste `dbt_utils.recency` padrão não pode?",
  "options": [
    "Linhas faltantes baseadas em relacionamentos de chave estrangeira",
    "Quedas ou picos súbitos no volume de linhas comparados a uma linha de base histórica, não apenas desatualização",
    "Chaves primárias duplicadas no modelo",
    "Mudanças de schema como colunas removidas ou renomeadas"
  ],
  "correct": 1,
  "explanation": "dbt_utils.recency apenas verifica se o timestamp mais recente está dentro de um intervalo fixo. elementary.volume_anomalies detecta padrões incomuns relativos a uma linha de base histórica — por exemplo, uma queda de 50% no volume diário de pedidos que a recency sozinha perderia."
}
```

```question
{
  "id": "dbt-rs-10-q5",
  "type": "multiple-choice",
  "question": "A verificação `fct_direct_join_to_source` do evaluator sinaliza qual anti-padrão?",
  "options": [
    "Modelos staging que referenciam mais de uma fonte",
    "Modelos mart ou intermediate que bypassam a camada staging e juntam diretamente a tabelas fonte brutas",
    "Snapshots que usam a estratégia check em vez de timestamp",
    "Seeds que são maiores que 1.000 linhas"
  ],
  "correct": 1,
  "explanation": "Juntar tabelas fonte brutas diretamente em modelos mart viola a arquitetura em camadas (staging → intermediate → mart). Torna o mart frágil a mudanças de schema na fonte e impede o reuso de transformações da camada staging."
}
```

```question
{
  "id": "dbt-rs-10-q6",
  "type": "multiple-choice",
  "question": "O que o hook `on-run-end` com `dbt_artifacts.upload_results(results)` permite?",
  "options": [
    "Deploy automático de dbt docs após toda execução",
    "Carregamento de metadados de execução do dbt (tempos de modelo, resultados de teste) em tabelas do warehouse para dashboards de saúde do pipeline",
    "Upload de artefatos dbt para S3 para Slim CI",
    "Notificar Slack quando modelos falham"
  ],
  "correct": 1,
  "explanation": "dbt_artifacts captura o objeto de resultados da execução (passado pelo dbt ao final da execução) e escreve tempos de execução de modelo, contagens de teste passou/falhou e dados de frescor de fonte em tabelas do warehouse. Isso permite dashboards baseados em SQL sobre a saúde do pipeline."
}
```

---

[!SUCCESS]
### Principais Conclusões

- Sempre fixe versões de pacotes exatamente em `packages.yml` — versões flutuantes causam quebras silenciosas e não reproduzíveis.
- `dbt-utils` é obrigatório: surrogate keys, `star()`, `date_spine`, `union_relations` e testes genéricos avançados pertencem a todo projeto.
- `dbt-expectations` adiciona 50+ testes de dados estatísticos e estruturais que vão muito além do conjunto integrado do dbt.
- `dbt-audit-helper` é sua rede de segurança durante refatoração — compare valores de coluna e contagens de linha entre modelos antigos e novos antes de fazer o corte.
- `dbt-codegen` elimina código repetitivo: gere `sources.yml`, modelos staging base e YAML de schema a partir do catálogo do warehouse em segundos.
- `elementary` adiciona detecção estatística de anomalias como testes nativos do dbt — picos de volume, mudanças de distribuição e anomalias de frescor são capturados sem ferramentas externas.
- `dbt-project-evaluator` aplica padrões de qualidade de DAG e cobertura de documentação no CI, prevenindo o acúmulo de dívida arquitetural.
- `dbt-artifacts` carrega metadados de execução em tabelas do warehouse, permitindo dashboards de saúde do pipeline baseados em SQL diretamente no Redshift.
