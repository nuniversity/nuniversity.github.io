---
title: "Macros Avançadas em Jinja2 e Materializações Customizadas"
description: "Escreva macros Jinja2 de nível profissional para padrões SQL DRY, construa bibliotecas de macros reutilizáveis e crie materializações customizadas para padrões específicos do Redshift como logs de eventos append-only e refresh de tabelas externas."
order: 6
duration: "70 min"
difficulty: "advanced"
---

# Macros Avançadas em Jinja2 e Materializações Customizadas

Jinja2 é o motor de templates do dbt — ele transforma SQL de uma linguagem de consulta estática em uma linguagem dinâmica e composável. Dominar Jinja2 é a diferença entre um projeto que escala para 500 modelos com uma equipe pequena e um que se torna insustentável. Este módulo cobre padrões de macro de nível profissional e materializações customizadas para casos de uso específicos do Redshift.

O Jinja2 permite que você escreva SQL parametrizado, com loops, condicionais e reutilização de código. Sem ele, você teria que copiar e colar SQL repetitivo centenas de vezes, tornando a manutenção um pesadelo.

---

## Jinja2 no dbt: O que Está Disponível

O dbt estende o Jinja2 com suas próprias funções e objetos. As três camadas são:

```
┌─────────────────────────────────────┐
│  Funções específicas do dbt          │
│  ref(), source(), config(), this     │
│  run_query(), log(), execute        │
├─────────────────────────────────────┤
│  Jinja2 padrão                       │
│  {% if %}, {% for %}, {% set %}      │
│  filters, tests, controle de whitespace │
├─────────────────────────────────────┤
│  Built-ins Python expostos pelo Jinja2│
│  range(), namespace(), loop.*        │
└─────────────────────────────────────┘
```

---

## Fundamentos de Macro: Além do Básico

### Escopo de Variáveis com namespace()

Variáveis de loop do Jinja2 não atualizam o escopo externo sem `namespace()`:

```sql
-- macros/utils/string_utils.sql

-- ERRADO: result é sempre string vazia após o loop
{% macro join_columns_wrong(columns) %}
    {% set result = '' %}
    {% for col in columns %}
        {% set result = result ~ col %}  {# Isto NÃO atualiza result externo #}
    {% endfor %}
    {{ result }}
{% endmacro %}

-- CORRETO: use namespace() para estado mutável dentro de loops
{% macro join_columns(columns, separator=', ') %}
    {% set ns = namespace(parts=[]) %}
    {% for col in columns %}
        {% set ns.parts = ns.parts + [col] %}
    {% endfor %}
    {{ ns.parts | join(separator) }}
{% endmacro %}
```

### Retornando Valores de Macros

```sql
-- macros/utils/get_column_names.sql
{% macro get_column_names(relation) %}
    {% set query %}
        select column_name
        from information_schema.columns
        where table_schema = '{{ relation.schema }}'
          and table_name   = '{{ relation.name }}'
        order by ordinal_position
    {% endset %}

    {% set results = run_query(query) %}

    {% if execute %}
        {% set columns = results.columns[0].values() %}
        {{ return(columns) }}
    {% else %}
        {{ return([]) }}
    {% endif %}
{% endmacro %}
```

Usando o valor retornado:

```sql
-- models/marts/facts/fct_orders.sql
{% set cols = get_column_names(ref('stg_orders')) %}
select
    {% for col in cols %}
        {{ col }}{% if not loop.last %},{% endif %}
    {% endfor %}
from {{ ref('stg_orders') }}
```

---

## Biblioteca de Macros de Produção para Redshift

### 1. Union Dinâmico de Múltiplas Fontes

```sql
-- macros/redshift/union_relations.sql
{% macro union_relations(relations, col_names=none) %}
    {%- for relation in relations -%}
        select
            {%- if col_names is not none -%}
                {%- for col in col_names %}
            {{ col }}{% if not loop.last %},{% endif %}
                {%- endfor %}
            {%- else -%}
            *
            {%- endif %}
        from {{ relation }}
        {% if not loop.last %}union all{% endif %}
    {%- endfor -%}
{% endmacro %}
```

Uso:

```sql
-- models/marts/fct_all_events.sql
{{ union_relations([
    ref('fct_web_events'),
    ref('fct_mobile_events'),
    ref('fct_api_events')
]) }}
```

### 2. Macro Pivot (Seguro para Redshift)

O Redshift não tem um PIVOT nativo. Esta macro gera o padrão CASE/SUM:

```sql
-- macros/redshift/pivot.sql
{% macro pivot(
    column,
    values,
    alias=true,
    agg='sum',
    then_value=1,
    else_value=0,
    quote_identifiers=false,
    distinct=false
) %}
    {%- for value in values %}
    {{ agg }}(
        {%- if distinct %} distinct {% endif -%}
        case
            when {{ column }} = '{{ value }}'
            then {{ then_value }}
            else {{ else_value }}
        end
    )
    {%- if alias %} as {% if quote_identifiers %}"{{ value }}"{% else %}{{ value | replace(' ', '_') | lower }}{% endif %}{% endif %}
    {%- if not loop.last %},{%- endif %}
    {%- endfor %}
{% endmacro %}
```

```sql
-- models/marts/fct_order_status_pivot.sql
select
    report_date,
    {{ pivot(
        column='status',
        values=['Pending', 'Shipped', 'Cancelled', 'Rejected'],
        agg='count'
    ) }}
from {{ ref('fct_orders') }}
group by 1
```

### 3. Gerar Date Spine

```sql
-- macros/redshift/date_spine.sql
{% macro date_spine(start_date, end_date, datepart='day') %}
    with date_series as (
        select
            (
                '{{ start_date }}'::date
                + generate_series(
                    0,
                    datediff(
                        '{{ datepart }}',
                        '{{ start_date }}'::date,
                        '{{ end_date }}'::date
                    )
                ) * interval '1 {{ datepart }}'
            )::date as date_day
    )
    select date_day from date_series
{% endmacro %}
```

```sql
-- models/marts/dim_date.sql
{{ config(materialized='table', dist='all', sort='date_day') }}

{{ date_spine(
    start_date='2020-01-01',
    end_date='2030-12-31',
    datepart='day'
) }}
```

### 4. Macro UNLOAD do Redshift para S3

```sql
-- macros/redshift/unload_to_s3.sql
{% macro unload_to_s3(
    relation,
    s3_path,
    iam_role,
    format='PARQUET',
    partition_by=none,
    max_file_size='6.2 GB',
    parallel=true
) %}
    {% set query %}
        unload (
            'select * from {{ relation }}'
        )
        to '{{ s3_path }}'
        iam_role '{{ iam_role }}'
        format {{ format }}
        {% if partition_by %}
        partition by ({{ partition_by | join(', ') }})
        {% endif %}
        allowoverwrite
        maxfilesize '{{ max_file_size }}'
        {% if parallel %}parallel on{% else %}parallel off{% endif %};
    {% endset %}

    {% if execute %}
        {% do run_query(query) %}
        {{ log("Unloaded " ~ relation ~ " to " ~ s3_path, info=true) }}
    {% endif %}
{% endmacro %}
```

Uso como operação:

```bash
dbt run-operation unload_to_s3 --args "{
    relation: 'analytics.marts.fct_orders',
    s3_path: 's3://my-data-lake/exports/fct_orders/',
    iam_role: 'arn:aws:iam::123456789012:role/RedshiftS3Role',
    format: 'PARQUET',
    partition_by: ['order_date']
}"
```

### 5. Macro de Recomendação de Sort Keys Adaptativa

```sql
-- macros/redshift/recommend_sort_keys.sql
{% macro recommend_sort_keys(schema, table, limit=10) %}
    {% set query %}
        select
            schemaname,
            tablename,
            "column"    as column_name,
            usename     as query_count,
            plannode
        from svl_qlog
        join pg_user using (usesysid)
        where schemaname = '{{ schema }}'
          and tablename  = '{{ table }}'
        order by query_count desc
        limit {{ limit }}
    {% endset %}

    {% if execute %}
        {% set results = run_query(query) %}
        {% for row in results.rows %}
            {{ log(row, info=true) }}
        {% endfor %}
    {% endif %}
{% endmacro %}
```

---

## Materializações Customizadas

Materializações customizadas permitem definir novos padrões de persistência além dos integrados do dbt. São blocos Jinja2 armazenados em `macros/materializations/`.

### Anatomia de uma Materialização Customizada

```sql
-- macros/materializations/append_only_table.sql
{% materialization append_only_table, adapter='redshift' %}

    {# Configuração obrigatória #}
    {%- set target_relation = this.incorporate(type='table') -%}

    {# Obter o adapter de execução #}
    {%- set existing_relation = load_cached_relation(this) -%}

    {# Executar pre-hooks #}
    {{ run_hooks(pre_hooks) }}

    {# Criar tabela na primeira execução #}
    {% if existing_relation is none %}
        {% call statement('main') %}
            {{ create_table_as(false, target_relation, sql) }}
        {% endcall %}

    {# Append nas execuções subsequentes #}
    {% else %}
        {% call statement('main') %}
            insert into {{ target_relation }}
            ({{ sql }})
        {% endcall %}
    {% endif %}

    {# Executar post-hooks #}
    {{ run_hooks(post_hooks) }}

    {# Atualizar o cache de relations #}
    {{ return({'relations': [target_relation]}) }}

{% endmaterialization %}
```

Usando a materialização customizada:

```sql
-- models/raw/raw_click_stream.sql
{{ config(
    materialized='append_only_table',
    dist='session_id',
    sort=['event_timestamp'],
    sort_type='compound',
    backup=false
) }}

select
    session_id,
    user_id,
    event_timestamp,
    page_url,
    referrer
from {{ source('raw', 'click_stream') }}
where loaded_at > (
    select coalesce(
        max(event_timestamp)::timestamp,
        '1970-01-01'::timestamp
    )
    from {{ this }}
)
```

### Materialização Customizada: Refresh de Tabela Externa Redshift Spectrum

Para tabelas externas do Redshift Spectrum que precisam de refresh periódico de metadados:

```sql
-- macros/materializations/spectrum_external_table.sql
{% materialization spectrum_external_table, adapter='redshift' %}

    {%- set external_schema = config.require('external_schema') -%}
    {%- set s3_location     = config.require('s3_location') -%}
    {%- set file_format     = config.get('file_format', 'parquet') -%}
    {%- set partition_cols  = config.get('partition_cols', []) -%}
    {%- set table_properties = config.get('table_properties', {}) -%}

    {%- set target_relation = this.incorporate(type='table') -%}

    {{ run_hooks(pre_hooks) }}

    -- Drop e recria a definição da tabela externa
    {% call statement('main') %}
        {% if load_cached_relation(this) is not none %}
            drop table if exists {{ external_schema }}.{{ this.identifier }};
        {% endif %}

        create external table {{ external_schema }}.{{ this.identifier }}
        ({{ sql }})
        {% if partition_cols %}
        partitioned by ({{ partition_cols | join(', ') }})
        {% endif %}
        stored as {{ file_format }}
        location '{{ s3_location }}';

        {% if partition_cols %}
        -- Auto-descobrir partições
        msck repair table {{ external_schema }}.{{ this.identifier }};
        {% endif %}
    {% endcall %}

    {{ run_hooks(post_hooks) }}

    {{ return({'relations': [target_relation]}) }}

{% endmaterialization %}
```

---

## Teste e Documentação de Macros

### Documentando Macros

```yaml
# macros/schema.yml
macros:
  - name: pivot
    description: >
      Gera uma tabela pivot usando expressões CASE/SUM. Compatível com Redshift.
      Use em vez do PIVOT nativo que o Redshift não suporta.
    arguments:
      - name: column
        type: string
        description: "A coluna para pivotear"
      - name: values
        type: list
        description: "Valores distintos para transformar em colunas"
      - name: agg
        type: string
        description: "Função de agregação (padrão: sum)"
      - name: alias
        type: boolean
        description: "Se deve aliasear colunas geradas (padrão: true)"

  - name: unload_to_s3
    description: "UNLOAD de uma relation para S3 em formato Parquet ou CSV"
    arguments:
      - name: relation
        type: relation
        description: "A relação dbt para exportar"
      - name: s3_path
        type: string
        description: "Caminho de destino S3 (deve terminar com /)"
      - name: iam_role
        type: string
        description: "ARN da IAM Role com permissões de escrita S3 e UNLOAD Redshift"
```

### Testando Macros via `dbt run-operation`

```bash
# Testar a saída da macro date_spine
dbt run-operation date_spine --args "{'start_date': '2024-01-01', 'end_date': '2024-01-07'}"

# Testar macro UNLOAD em modo dry-run (verificar compilação SQL)
dbt compile --select fct_orders  # garantir que o modelo compila primeiro
```

---

## 6 Perguntas de Prática

```question
{
  "id": "dbt-rs-06-q1",
  "type": "multiple-choice",
  "question": "Por que `namespace()` é necessário ao atualizar uma variável dentro de um loop `{% for %}` no Jinja2?",
  "options": [
    "Para performance — namespace() cacheia resultados do loop",
    "Blocos de loop no Jinja2 têm seu próprio escopo; variáveis definidas dentro de um loop não atualizam o escopo externo sem namespace()",
    "Redshift requer namespace() para consultas parametrizadas",
    "namespace() é necessário apenas para macros recursivas"
  ],
  "correct": 1,
  "explanation": "Jinja2 aplica escopo de tal forma que atribuições de variáveis dentro de um bloco de loop não se propagam para o escopo externo. namespace() cria um objeto mutável cujos atributos podem ser atualizados e lidos através de limites de escopo."
}
```

```question
{
  "id": "dbt-rs-06-q2",
  "type": "multiple-choice",
  "question": "Em uma materialização customizada, o que `config.require('my_param')` faz de diferente de `config.get('my_param')`?",
  "options": [
    "require() busca o valor no warehouse; get() lê do profiles.yml",
    "require() levanta um erro se a config estiver faltando; get() retorna None ou um valor padrão",
    "require() aplica um tipo de dado; get() aceita qualquer tipo",
    "Não há diferença — são aliases"
  ],
  "correct": 1,
  "explanation": "config.require() levanta um erro de compilação dbt se a config especificada não estiver definida no bloco config do modelo. config.get() retorna None ou um valor padrão opcional se a config estiver faltando."
}
```

```question
{
  "id": "dbt-rs-06-q3",
  "type": "multiple-choice",
  "question": "A assinatura `{% materialization my_mat, adapter='redshift' %}` significa o quê?",
  "options": [
    "A materialização só funciona com clusters Redshift, não Serverless",
    "Esta implementação é o override específico para Redshift — dbt a usa quando o adapter ativo é redshift, caindo de volta para a implementação padrão caso contrário",
    "A materialização ignora todos os outros adapters completamente",
    "Requer que a versão do adapter Redshift corresponda exatamente"
  ],
  "correct": 1,
  "explanation": "Quando adapter='redshift' é especificado, o dbt usa esta implementação quando o adapter ativo é dbt-redshift. Para outros adapters, o dbt cai de volta para a implementação adapter='default' do mesmo nome de materialização."
}
```

```question
{
  "id": "dbt-rs-06-q4",
  "type": "multiple-choice",
  "question": "Você quer exportar (UNLOAD) uma tabela Redshift para S3 como Parquet, particionada por `order_date`. Qual mecanismo dbt é mais apropriado?",
  "options": [
    "Um post-hook no modelo que chama uma macro envolvendo UNLOAD",
    "Uma materialização customizada chamada parquet_export",
    "Um arquivo seed apontando para S3",
    "Um modelo incremental com dist=all"
  ],
  "correct": 0,
  "explanation": "Um post-hook chamando uma macro UNLOAD é o padrão dbt idiomático. Ele executa após o modelo ser construído, mantendo a transformação separada da operação de exportação. Isso também o torna reutilizável entre modelos."
}
```

```question
{
  "id": "dbt-rs-06-q5",
  "type": "multiple-choice",
  "question": "Qual proteção é essencial em torno de chamadas `run_query()` em macros para evitar execução durante as fases de parse ou compilação do dbt?",
  "options": [
    "{% if target.name == 'prod' %}",
    "{% if execute %}",
    "{% if run_query is defined %}",
    "{% if not is_incremental() %}"
  ],
  "correct": 1,
  "explanation": "{% if execute %} é a proteção padrão. Durante as fases de parse e compilação do dbt, execute é False, e run_query() não deve disparar. Sem esta proteção, macros que chamam run_query() podem quebrar a fase de parse."
}
```

```question
{
  "id": "dbt-rs-06-q6",
  "type": "multiple-choice",
  "question": "Onde os arquivos de materialização customizada devem ser armazenados em um projeto dbt?",
  "options": [
    "models/materializations/",
    "macros/materializations/ (ou qualquer caminho sob macro-paths)",
    "analyses/materializations/",
    "target/materializations/"
  ],
  "correct": 1,
  "explanation": "Materializações customizadas são blocos de macro Jinja2 e devem ser armazenadas sob o diretório macro-paths (padrão: macros/). O nome da subpasta (materializations/) é uma convenção, não um requisito."
}
```

---

[!SUCCESS]
### Principais Conclusões

- Use `namespace()` para estado mutável dentro de loops `{% for %}` no Jinja2 — atribuição simples de variável não escapa do escopo do loop.
- Sempre proteja chamadas `run_query()` com `{% if execute %}` para prevenir execução durante fases de parse/compilação.
- `config.require()` levanta erro de compilação para configs ausentes; `config.get()` retorna None ou um padrão — use require() para parâmetros obrigatórios de materialização.
- A assinatura `adapter='redshift'` em `{% materialization %}` cria uma implementação específica para Redshift; outros adapters usam a implementação `default`.
- UNLOAD para S3 é melhor implementado como uma macro post-hook, mantendo a lógica de transformação separada da etapa de exportação.
- Documente macros em `macros/schema.yml` — elas aparecem em `dbt docs` e podem ser testadas via `dbt run-operation`.
