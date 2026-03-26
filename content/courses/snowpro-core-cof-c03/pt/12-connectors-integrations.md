---
title: "Domínio 3.3 — Conectores e Integrações do Snowflake"
description: "Entenda o ecossistema de drivers, conectores e integrações do Snowflake: JDBC, ODBC, Python connector, Kafka connector, storage integrations, API integrations e integração com Git."
order: 12
difficulty: intermediate
duration: "50 min"
---

# Domínio 3.3 — Conectores e Integrações do Snowflake

## Peso no Exame

O **Domínio 3.0** representa **~18%** do exame.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 3.3**: *Identificar os diferentes conectores e integrações do Snowflake*, incluindo drivers, conectores, storage integrations, API integrations e integração com Git.

---

## Drivers do Snowflake

Os **Drivers** fornecem conectividade SQL direta ao Snowflake a partir de aplicações e ferramentas. Eles implementam protocolos padrão (JDBC, ODBC) para que ferramentas existentes funcionem sem modificação.

### Driver JDBC

Usado por aplicações Java, ferramentas de BI (Tableau, Looker, DBeaver) e plataformas de integração de dados:

```java
// Conexão JDBC em Java
Properties props = new Properties();
props.put("user", "meuusuario");
props.put("password", "minhasenha");
props.put("db", "MEU_BD");
props.put("schema", "PUBLIC");
props.put("warehouse", "WH_ANALYTICS");
props.put("role", "ANALYST");

Connection conn = DriverManager.getConnection(
    "jdbc:snowflake://minhaconta.snowflakecomputing.com/",
    props
);
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM pedidos LIMIT 10");
```

### Driver ODBC

Usado por Excel, Power BI, MicroStrategy e outras ferramentas compatíveis com ODBC:
- Disponível para Windows, macOS, Linux
- Configurado via Administrador de Fonte de Dados ODBC (Windows) ou `odbc.ini` (Linux/macOS)

### Python Connector

O conector oficial do Snowflake para Python:

```python
import snowflake.connector

# Conexão padrão
conn = snowflake.connector.connect(
    account='minhaconta.us-east-1',
    user='meuusuario',
    password='minhasenha',
    warehouse='WH_ANALYTICS',
    database='MEU_BD',
    schema='PUBLIC',
    role='ANALYST'
)

cursor = conn.cursor()
cursor.execute("SELECT count(*) FROM pedidos")
resultado = cursor.fetchone()
print(f"Quantidade de pedidos: {resultado[0]}")

# Executar com parâmetros (evita injeção de SQL)
cursor.execute(
    "SELECT * FROM pedidos WHERE id_cliente = %s AND status = %s",
    (id_cliente, 'ATIVO')
)

# Usando DictCursor para resultados em formato de dicionário
cursor_dict = conn.cursor(snowflake.connector.DictCursor)
cursor_dict.execute("SELECT id_pedido, valor FROM pedidos LIMIT 5")
for linha in cursor_dict:
    print(linha['ID_PEDIDO'], linha['VALOR'])
```

### Outros Drivers Oficiais

| Driver | Caso de Uso |
|---|---|
| **Node.js** | Aplicações JavaScript/TypeScript |
| **.NET** | Aplicações C# |
| **Go** | Aplicações Go |
| **PHP PDO** | Aplicações web PHP |
| **Spark Connector** | Integração com Apache Spark |
| **Kafka Connector** | Streaming Apache Kafka → Snowflake |

---

## Conectores do Snowflake

Os **Conectores** são integrações de nível mais alto construídas sobre os drivers — eles lidam com padrões específicos de fonte de dados.

### Snowflake Connector para Apache Kafka

O **Kafka Connector** habilita o streaming de mensagens em tempo real de tópicos Kafka para tabelas do Snowflake:

```json
// Configuração do Kafka Connector (connector.json)
{
  "name": "snowflake-sink",
  "config": {
    "connector.class": "com.snowflake.kafka.connector.SnowflakeSinkConnector",
    "tasks.max": "8",
    "topics": "pedidos,eventos,usuarios",
    "snowflake.url.name": "minhaconta.snowflakecomputing.com:443",
    "snowflake.user.name": "usuario_kafka",
    "snowflake.private.key": "<CHAVE_PRIVADA_RSA>",
    "snowflake.database.name": "BD_RAW",
    "snowflake.schema.name": "KAFKA",
    "snowflake.ingestion.method": "SNOWPIPE_STREAMING",
    "buffer.flush.time": "10",
    "buffer.count.records": "10000"
  }
}
```

| Método de Ingestão | Descrição |
|---|---|
| **Snowpipe (v1)** | Ingestão baseada em arquivo via stages |
| **Snowpipe Streaming (v2+)** | Ingestão direta em nível de linha (menor latência) |

### Snowflake Connector para Python (Snowpark)

O conector Python do Snowpark fornece uma API DataFrame:

```python
from snowflake.snowpark import Session

session = Session.builder.configs({
    "account": "minhaconta",
    "user": "meuusuario",
    "authenticator": "externalbrowser",  # SSO
    "warehouse": "WH_DS",
    "database": "ANALYTICS",
    "schema": "PUBLIC"
}).create()

# Operações de DataFrame
df = session.table("pedidos")
df.filter(df["valor"] > 100).group_by("regiao").count().show()
```

### Snowflake Connector para Spark

Conecte workloads Apache Spark ao Snowflake:

```scala
// Scala/Spark com conector Snowflake
val df = spark.read
  .format("snowflake")
  .options(opcoesSnowflake)
  .option("dbtable", "MEU_BD.PUBLIC.PEDIDOS")
  .load()

df.write
  .format("snowflake")
  .options(opcoesSnowflake)
  .option("dbtable", "MEU_BD.PUBLIC.PEDIDOS_SAIDA")
  .mode(SaveMode.Overwrite)
  .save()
```

---

## Storage Integrations (Integrações de Armazenamento)

Uma **storage integration** cria um relacionamento de confiança entre o Snowflake e seu armazenamento em nuvem **sem armazenar credenciais no Snowflake**. Usa IAM (*Identity and Access Management*) da nuvem para autenticação.

### Integração com AWS S3

```sql
-- Passo 1: Criar a integração
CREATE STORAGE INTEGRATION integracao_s3
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = S3
    ENABLED = TRUE
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789012:role/RoleSnowflake'
    STORAGE_ALLOWED_LOCATIONS = ('s3://meu-bucket-dados/snowflake/');

-- Passo 2: Obter a identidade AWS do Snowflake para a política de confiança
DESC INTEGRATION integracao_s3;
-- Nota: STORAGE_AWS_IAM_USER_ARN e STORAGE_AWS_EXTERNAL_ID

-- Passo 3: Atualizar a política de confiança IAM na AWS com esses valores
-- Passo 4: Criar um stage usando a integração
CREATE STAGE meu_stage_s3
    URL = 's3://meu-bucket-dados/snowflake/'
    STORAGE_INTEGRATION = integracao_s3
    FILE_FORMAT = (TYPE = PARQUET);
```

### Integração com Azure Blob Storage

```sql
CREATE STORAGE INTEGRATION integracao_azure
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = AZURE
    ENABLED = TRUE
    AZURE_TENANT_ID = '<seu-tenant-id>'
    STORAGE_ALLOWED_LOCATIONS = ('azure://minhaconta.blob.core.windows.net/meucontainer/');

-- Obter os detalhes do service principal para atribuição de role no Azure
DESC INTEGRATION integracao_azure;
```

### Integração com GCS

```sql
CREATE STORAGE INTEGRATION integracao_gcs
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = GCS
    ENABLED = TRUE
    STORAGE_ALLOWED_LOCATIONS = ('gcs://meu-bucket/snowflake/');

-- Obter a conta de serviço para atribuição de role IAM no GCS
DESC INTEGRATION integracao_gcs;
```

---

## API Integrations (Integrações de API)

Uma **API integration** permite que o Snowflake chame **endpoints REST externos** — usada para External Functions e integrações de notificação.

### External Functions (Funções Externas)

As external functions chamam APIs externas ao Snowflake via um API Gateway:

```sql
-- Criar uma API integration (apontando para AWS API Gateway / Azure App Service)
CREATE API INTEGRATION minha_integracao_api
    API_PROVIDER = AWS_API_GATEWAY
    API_AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/RoleAPISnowflake'
    API_ALLOWED_PREFIXES = ('https://abc123.execute-api.us-east-1.amazonaws.com/prod/')
    ENABLED = TRUE;

-- Criar a external function
CREATE EXTERNAL FUNCTION chamar_api_sentimento(texto STRING)
RETURNS VARIANT
API_INTEGRATION = minha_integracao_api
AS 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/sentimento';

-- Usar em SQL
SELECT chamar_api_sentimento(texto_avaliacao) AS sentimento
FROM avaliacoes_produtos;
```

### Notification Integrations (Integrações de Notificação)

Usadas para notificações de eventos do Snowpipe e sistemas de alerta:

```sql
-- Integração de notificação AWS SNS
CREATE NOTIFICATION INTEGRATION integracao_sns_aws
    ENABLED = TRUE
    TYPE = QUEUE
    NOTIFICATION_PROVIDER = AWS_SNS
    DIRECTION = OUTBOUND
    AWS_SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789:meu-topico'
    AWS_SNS_ROLE_ARN = 'arn:aws:iam::123456789:role/RoleSNS';

-- Auto-ingest (Snowpipe) usando SQS
CREATE NOTIFICATION INTEGRATION sqs_ingest
    ENABLED = TRUE
    TYPE = QUEUE
    NOTIFICATION_PROVIDER = AWS_SQS
    AWS_SQS_ARN = 'arn:aws:sqs:us-east-1:123456789:fila-snowpipe';
```

---

## Git Integration (Integração com Git)

A **Git Integration** permite que o Snowflake se conecte a um repositório Git (GitHub, GitLab, Bitbucket) e execute arquivos SQL, código Snowpark ou outros scripts diretamente do repositório:

```sql
-- Criar uma API integration para o provedor Git
CREATE API INTEGRATION integracao_github
    API_PROVIDER = GIT_HTTPS_API
    API_ALLOWED_PREFIXES = ('https://github.com/minhaorg/')
    ENABLED = TRUE;

-- Criar um objeto de repositório Git no Snowflake
CREATE GIT REPOSITORY meu_repo
    API_INTEGRATION = integracao_github
    GIT_CREDENTIALS = minhas_credenciais_github  -- armazenadas como Secret
    ORIGIN = 'https://github.com/minhaorg/pipelines-snowflake.git';

-- Buscar as últimas atualizações do repositório remoto
ALTER GIT REPOSITORY meu_repo FETCH;

-- Listar arquivos no repositório
SHOW GIT FILES IN @meu_repo/branches/main;

-- Executar um arquivo SQL diretamente do Git
EXECUTE IMMEDIATE FROM @meu_repo/branches/main/migrations/001_criar_tabelas.sql;

-- Referenciar código Python Snowpark do Git em um procedure
CREATE PROCEDURE meu_proc()
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
IMPORTS = ('@meu_repo/branches/main/src/utils.py')
HANDLER = 'utils.run'
AS $$
# Código no Git
$$;
```

---

## Resumo de Conectores e Integrações

| Tipo de Integração | Finalidade | Exemplos |
|---|---|---|
| **Driver JDBC** | Conectividade SQL de apps Java / ferramentas BI | Tableau, DBeaver, apps Java personalizados |
| **Driver ODBC** | Conectividade SQL de clientes ODBC | Excel, Power BI |
| **Python Connector** | Conectividade de apps Python | Scripts ETL, ciência de dados |
| **Kafka Connector** | Streaming em tempo real do Kafka | Streaming de eventos, CDC |
| **Spark Connector** | Troca de dados Spark ↔ Snowflake | Processamento de big data |
| **Storage Integration** | Acesso seguro ao armazenamento em nuvem | S3, Azure Blob, GCS |
| **API Integration** | Chamadas a REST APIs externas | External functions, alertas |
| **Notification Integration** | Notificações push | SNS, SQS, Event Grid, Pub/Sub |
| **Git Integration** | Execução de código com controle de versão | CI/CD, versionamento de pipelines |

---

## Questões de Prática

**Q1.** Uma empresa quer conectar o Power BI ao Snowflake sem escrever nenhum código. Qual opção de conectividade é mais adequada?

- A) Python Connector
- B) Driver JDBC
- C) Driver ODBC ✅
- D) Kafka Connector

**Q2.** Uma storage integration usa qual mecanismo para autenticar com o armazenamento em nuvem em vez de armazenar credenciais?

- A) Nome de usuário e senha armazenados em um Secret do Snowflake
- B) IAM roles da nuvem (relacionamento de confiança) ✅
- C) Chaves de API armazenadas na definição do stage
- D) Tokens OAuth gerenciados pelo usuário

**Q3.** Um Kafka Connector configurado com `snowflake.ingestion.method = SNOWPIPE_STREAMING` oferece qual vantagem sobre a ingestão baseada em arquivo?

- A) Menor custo
- B) Melhor compressão
- C) Menor latência (ingestão direta em nível de linha) ✅
- D) Suporte a mais formatos de arquivo

**Q4.** Qual recurso do Snowflake permite executar arquivos SQL diretamente de um repositório GitHub sem baixá-los primeiro?

- A) Snowflake CLI
- B) Snowsight Notebooks
- C) Git Integration ✅
- D) Storage Integration

**Q5.** Uma external function requer qual tipo de integração para chamar uma REST API externa?

- A) Storage Integration
- B) Notification Integration
- C) API Integration ✅
- D) Security Integration

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. **JDBC** = Java + ferramentas BI | **ODBC** = Excel, Power BI | **Python Connector** = scripts/apps
> 2. **Storage Integration** = autenticação via IAM role, sem credenciais armazenadas no Snowflake
> 3. **Kafka Connector v2+ com Snowpipe Streaming** = ingestão Kafka de menor latência
> 4. **API Integration** = obrigatório para External Functions que chamam REST APIs
> 5. **Git Integration** = executar SQL/Snowpark diretamente de um repositório Git
