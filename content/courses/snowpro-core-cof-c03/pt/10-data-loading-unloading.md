---
title: "Domínio 3.1 — Carregamento e Exportação de Dados"
description: "Domine o carregamento e exportação de dados em massa no Snowflake: formatos de arquivo, stages (internos e externos), o comando COPY INTO, opções de tratamento de erros e boas práticas para ingestão de alto throughput."
order: 10
difficulty: intermediate
duration: "75 min"
---

# Domínio 3.1 — Carregamento e Exportação de Dados

## Peso no Exame

O **Domínio 3.0 — Carregamento, Exportação e Conectividade de Dados** representa **~18%** do exame.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 3.1**: *Realizar carregamento e exportação de dados*, incluindo formatos de arquivo, stages, o comando COPY INTO e opções de tratamento de erros.

---

## O Processo de Carregamento de Dados

O processo de carregamento em massa do Snowflake segue este fluxo:

```
Arquivos de Origem (CSV, JSON, Parquet, etc.)
           │
           ▼
      Stage (Interno ou Externo)
           │
           ▼
    COPY INTO <tabela>
           │
           ▼
      Tabela Snowflake (micro-partições)
```

---

## Formatos de Arquivo (File Formats)

Um **File Format** define como o Snowflake analisa arquivos durante o carregamento e exportação. Tipos suportados:

| Formato | Tipo | Notas |
|---|---|---|
| **CSV** | Estruturado | Mais comum; delimitador, aspas e codificação altamente configuráveis |
| **JSON** | Semiestruturado | Carregado em colunas VARIANT |
| **Avro** | Semiestruturado | Schema embutido no arquivo |
| **ORC** | Semiestruturado | Colunar, frequentemente do Hadoop |
| **Parquet** | Semiestruturado | Colunar, altamente comprimido |
| **XML** | Semiestruturado | Formato de documento hierárquico |

```sql
-- Formato de arquivo CSV
CREATE FILE FORMAT formato_csv
    TYPE = CSV
    FIELD_DELIMITER = ','
    RECORD_DELIMITER = '\n'
    SKIP_HEADER = 1
    FIELD_OPTIONALLY_ENCLOSED_BY = '"'
    NULL_IF = ('NULL', 'null', 'N/A', '')
    EMPTY_FIELD_AS_NULL = TRUE
    ENCODING = 'UTF-8'
    TRIM_SPACE = TRUE;

-- Formato de arquivo JSON
CREATE FILE FORMAT formato_json
    TYPE = JSON
    STRIP_OUTER_ARRAY = TRUE    -- remover o wrapper externo []
    STRIP_NULL_VALUES = FALSE
    IGNORE_UTF8_ERRORS = FALSE;

-- Formato de arquivo Parquet
CREATE FILE FORMAT formato_parquet
    TYPE = PARQUET
    SNAPPY_COMPRESSION = TRUE;

-- Formato inline (sem necessidade de criar um formato nomeado)
COPY INTO minha_tabela
FROM @meu_stage
FILE_FORMAT = (TYPE = CSV FIELD_DELIMITER = '|' SKIP_HEADER = 1);
```

---

## Stages

Um **stage** é a zona intermediária de aterrissagem onde os arquivos são colocados antes de serem carregados nas tabelas do Snowflake.

### Stages Internos

O Snowflake gerencia o armazenamento subjacente:

| Tipo de Stage | Sintaxe | Escopo |
|---|---|---|
| **Stage de usuário** | `@~` | Por usuário; privado, não compartilhável |
| **Stage de tabela** | `@%nome_tabela` | Por tabela; vinculado a uma tabela específica |
| **Stage interno nomeado** | `@nome_stage` | Compartilhado dentro da conta, mais flexível |

```sql
-- Fazer upload de um arquivo para um stage interno nomeado usando SnowSQL / CLI
PUT file:///caminho/local/pedidos.csv @meu_stage AUTO_COMPRESS = TRUE;

-- Ou via Snowflake CLI
snow stage copy ./pedidos.csv @meu_stage/

-- Listar arquivos em um stage
LIST @meu_stage;
LIST @meu_stage/pedidos/;

-- Remover arquivos de um stage
REMOVE @meu_stage/arquivos_antigos/;
```

### Stages Externos

Os dados permanecem no **armazenamento em nuvem do cliente**:

```sql
-- Stage externo no Amazon S3
CREATE STAGE stage_pedidos_s3
    URL = 's3://meu-bucket/pedidos/'
    STORAGE_INTEGRATION = minha_integracao_s3
    FILE_FORMAT = (FORMAT_NAME = formato_csv)
    DIRECTORY = (ENABLE = TRUE);  -- habilitar directory table

-- Stage externo no Azure Blob Storage
CREATE STAGE stage_azure
    URL = 'azure://minhaconta.blob.core.windows.net/meucontainer/dados/'
    STORAGE_INTEGRATION = minha_integracao_azure
    FILE_FORMAT = (FORMAT_NAME = formato_json);

-- Stage externo no Google Cloud Storage
CREATE STAGE stage_gcs
    URL = 'gcs://meu-bucket/dados/'
    STORAGE_INTEGRATION = minha_integracao_gcs;
```

### Storage Integrations (Integrações de Armazenamento)

Uma **storage integration** conecta o Snowflake ao armazenamento em nuvem de forma segura usando um **IAM role / service principal** — sem credenciais armazenadas no Snowflake:

```sql
CREATE STORAGE INTEGRATION minha_integracao_s3
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = S3
    ENABLED = TRUE
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/snowflake-role'
    STORAGE_ALLOWED_LOCATIONS = ('s3://meu-bucket/pedidos/', 's3://meu-bucket/produtos/');

-- Obter os valores IAM para configurar na AWS
DESC INTEGRATION minha_integracao_s3;
```

### Directory Tables (Tabelas de Diretório)

Habilitam a **listagem de arquivos** em stages externos como uma tabela consultável:

```sql
ALTER STAGE stage_pedidos_s3 SET DIRECTORY = (ENABLE = TRUE);

-- Atualizar os metadados da directory table
ALTER STAGE stage_pedidos_s3 REFRESH;

-- Consultar a directory table
SELECT * FROM DIRECTORY(@stage_pedidos_s3);
```

---

## COPY INTO — Carregando Dados

`COPY INTO <tabela>` é o comando principal de carregamento em massa:

```sql
-- Carregamento básico
COPY INTO pedidos
FROM @meu_stage/pedidos/
FILE_FORMAT = (FORMAT_NAME = formato_csv);

-- Carregar arquivos específicos
COPY INTO pedidos
FROM @meu_stage/pedidos/
FILES = ('pedidos_2025_01.csv', 'pedidos_2025_02.csv')
FILE_FORMAT = (FORMAT_NAME = formato_csv);

-- Carregar usando correspondência de padrão
COPY INTO pedidos
FROM @meu_stage/pedidos/
PATTERN = '.*pedidos_2025_.*\\.csv'
FILE_FORMAT = (FORMAT_NAME = formato_csv);

-- Transformar durante o carregamento (SELECT do stage)
COPY INTO pedidos (id, valor, ts_carga)
FROM (
    SELECT $1::NUMBER, $2::DECIMAL(10,2), CURRENT_TIMESTAMP
    FROM @meu_stage/pedidos/
)
FILE_FORMAT = (FORMAT_NAME = formato_csv);
```

### Rastreamento do Status de Carga

O COPY INTO rastreia automaticamente quais arquivos foram carregados para evitar duplicatas:

```sql
-- Ver histórico de carga de uma tabela (últimos 64 dias)
SELECT *
FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
    TABLE_NAME => 'PEDIDOS',
    START_TIME => DATEADD('day', -7, CURRENT_TIMESTAMP)
));

-- Histórico em toda a conta
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.COPY_HISTORY
WHERE TABLE_NAME = 'PEDIDOS'
AND LAST_LOAD_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

> [!NOTE]
> O Snowflake rastreia o **histórico de carga de 64 dias** por stage. Arquivos carregados nos últimos 64 dias são rastreados e **não serão recarregados** por padrão. Para forçar um recarregamento, use `FORCE = TRUE`.

---

## Opções de Tratamento de Erros

O parâmetro `ON_ERROR` controla como o COPY INTO lida com erros:

| Opção | Comportamento | Caso de Uso |
|---|---|---|
| `CONTINUE` | Ignorar linhas ruins, carregar linhas boas | Carregamento tolerante |
| `SKIP_FILE` | Ignorar o arquivo inteiro com erros | Controle de qualidade no nível de arquivo |
| `SKIP_FILE_<n>` | Ignorar arquivo se mais de n erros ocorrerem | Limiar baseado em contagem |
| `SKIP_FILE_<n>%` | Ignorar arquivo se a taxa de erro exceder n% | Limiar baseado em percentual |
| `ABORT_STATEMENT` | Abortar todo o COPY no primeiro erro (padrão) | Validação estrita |

```sql
-- Continuar carregando, ignorar linhas ruins
COPY INTO pedidos
FROM @meu_stage
FILE_FORMAT = (FORMAT_NAME = formato_csv)
ON_ERROR = 'CONTINUE';

-- Ignorar arquivo se mais de 5 erros
COPY INTO pedidos
FROM @meu_stage
FILE_FORMAT = (FORMAT_NAME = formato_csv)
ON_ERROR = 'SKIP_FILE_5';

-- Ignorar arquivo se mais de 10% de erros
COPY INTO pedidos
FROM @meu_stage
FILE_FORMAT = (FORMAT_NAME = formato_csv)
ON_ERROR = 'SKIP_FILE_10%';

-- Verificar o que foi rejeitado
SELECT *
FROM TABLE(VALIDATE(pedidos, JOB_ID => '<id_job_copy>'));
```

### Validando Antes de Carregar

```sql
-- Validar sem carregar de fato (execução de teste / dry-run)
COPY INTO pedidos
FROM @meu_stage
FILE_FORMAT = (FORMAT_NAME = formato_csv)
VALIDATION_MODE = 'RETURN_ERRORS';  -- retorna apenas as linhas com erro

-- Ou validar todas as linhas
COPY INTO pedidos
FROM @meu_stage
VALIDATION_MODE = 'RETURN_ALL_ERRORS';
```

---

## Carregamento de Dados Semiestruturados

### Carregando JSON

```sql
-- Carregar JSON em uma coluna VARIANT
CREATE TABLE eventos_brutos (v VARIANT);

COPY INTO eventos_brutos
FROM @stage_json
FILE_FORMAT = (TYPE = JSON STRIP_OUTER_ARRAY = TRUE);

-- Consultar JSON aninhado
SELECT
    v:tipo_evento::STRING AS tipo_evento,
    v:usuario.id::NUMBER AS id_usuario,
    v:usuario.nome::STRING AS nome_usuario,
    v:propriedades:url_pagina::STRING AS url_pagina
FROM eventos_brutos;

-- Achatar arrays (FLATTEN)
SELECT
    v:id_pedido::NUMBER AS id_pedido,
    item.value:id_produto::NUMBER AS id_produto,
    item.value:quantidade::NUMBER AS qtd
FROM eventos_brutos,
LATERAL FLATTEN(INPUT => v:itens) item;
```

---

## Exportação de Dados com COPY INTO Location

`COPY INTO @stage` exporta dados do Snowflake para arquivos:

```sql
-- Exportar para stage interno
COPY INTO @meu_stage/exportacoes/exportacao_pedidos
FROM pedidos
FILE_FORMAT = (TYPE = CSV HEADER = TRUE)
SINGLE = FALSE         -- múltiplos arquivos (exportação paralela)
MAX_FILE_SIZE = 500000000;  -- 500 MB por arquivo

-- Exportar para stage S3 externo
COPY INTO @stage_exportacao_s3/pedidos/
FROM (SELECT * FROM pedidos WHERE data_pedido = CURRENT_DATE)
FILE_FORMAT = (TYPE = PARQUET)
HEADER = TRUE;

-- Exportar como CSV comprimido com gzip
COPY INTO @meu_stage/exportacao_comprimida
FROM pedidos
FILE_FORMAT = (TYPE = CSV COMPRESSION = GZIP HEADER = TRUE);
```

### Boas Práticas de Exportação

| Configuração | Recomendação |
|---|---|
| `SINGLE = FALSE` | Usar múltiplos arquivos para exportações grandes (paralelo) |
| `MAX_FILE_SIZE` | Manter arquivos em 100–500 MB para compatibilidade downstream |
| Compressão | Usar GZIP ou SNAPPY para reduzir custos de transferência |
| Nomenclatura de arquivos | Usar `INCLUDE_QUERY_ID = TRUE` para nomes de arquivo únicos |

---

## Questões de Prática

**Q1.** Um comando COPY INTO é executado e algumas linhas têm tipos de dados inválidos. Qual opção `ON_ERROR` carrega todas as linhas válidas enquanto ignora apenas as linhas ruins?

- A) `ABORT_STATEMENT`
- B) `SKIP_FILE`
- C) `CONTINUE` ✅
- D) `RETURN_ERRORS`

**Q2.** O Snowflake rastreia o histórico de cargas do COPY INTO por quantos dias por stage para evitar carregamento duplicado?

- A) 7 dias
- B) 30 dias
- C) 64 dias ✅
- D) 90 dias

**Q3.** Qual parâmetro do COPY INTO permite validar o conteúdo dos arquivos sem carregar nenhum dado de fato?

- A) `ON_ERROR = CONTINUE`
- B) `VALIDATION_MODE = 'RETURN_ERRORS'` ✅
- C) `FORCE = TRUE`
- D) `PURGE = TRUE`

**Q4.** Um stage externo usa uma `STORAGE_INTEGRATION` em vez de credenciais. Qual é o principal benefício de segurança?

- A) Os dados são criptografados automaticamente
- B) Nenhuma credencial de nuvem é armazenada no Snowflake ✅
- C) O stage só pode ser usado pelo SYSADMIN
- D) Os arquivos são automaticamente excluídos após o carregamento

**Q5.** Qual sintaxe especial de stage se refere ao stage autoprovisionado de uma tabela?

- A) `@~`
- B) `@nome_stage`
- C) `@%nome_tabela` ✅
- D) `@$nome_tabela`

**Q6.** Ao exportar com `SINGLE = FALSE` (padrão), qual vantagem isso oferece?

- A) Os arquivos são criptografados automaticamente
- B) A exportação é executada em paralelo entre os nós do warehouse ✅
- C) Os arquivos são comprimidos automaticamente
- D) Apenas um formato de arquivo pode ser usado

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. Fluxo de carga: **Arquivos → Stage → COPY INTO → Tabela**
> 2. Stages internos: `@~` (usuário), `@%tabela` (tabela), `@nome` (nomeado)
> 3. `ON_ERROR = CONTINUE` = ignorar linhas ruins | `ABORT_STATEMENT` = falhar no primeiro erro (padrão)
> 4. Histórico de COPY rastreado por **64 dias** por stage (evita cargas duplicadas)
> 5. `VALIDATION_MODE` = execução de teste para verificar erros sem carregar
> 6. Storage Integrations = autenticação via IAM role; **sem credenciais no Snowflake**
