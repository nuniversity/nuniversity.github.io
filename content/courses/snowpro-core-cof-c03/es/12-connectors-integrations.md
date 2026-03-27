---
title: "Dominio 3.3 — Conectores e Integraciones de Snowflake"
description: "Comprende el ecosistema de drivers, conectores e integraciones de Snowflake: JDBC, ODBC, conector Python, Kafka connector, integraciones de almacenamiento, integraciones de API e integración con Git."
order: 12
difficulty: intermediate
duration: "50 min"
---

# Dominio 3.3 — Conectores e Integraciones de Snowflake

## Peso en el Examen

El **Dominio 3.0** representa aproximadamente el **~18%** del examen.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 3.3**: *Identificar los diferentes conectores e integraciones de Snowflake*, incluyendo drivers, conectores, integraciones de almacenamiento, integraciones de API e integración con Git.

---

## Drivers de Snowflake

Los **drivers** proporcionan conectividad SQL directa a Snowflake desde aplicaciones y herramientas. Implementan protocolos estándar (JDBC, ODBC) para que las herramientas existentes funcionen sin modificaciones.

### Driver JDBC

Usado por aplicaciones Java, herramientas BI (Tableau, Looker, DBeaver) y plataformas de integración de datos:

```java
// Conexión JDBC en Java
Properties props = new Properties();
props.put("user", "myuser");
props.put("password", "mypassword");
props.put("db", "MY_DB");
props.put("schema", "PUBLIC");
props.put("warehouse", "WH_ANALYTICS");
props.put("role", "ANALYST");

Connection conn = DriverManager.getConnection(
    "jdbc:snowflake://myaccount.snowflakecomputing.com/",
    props
);
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM orders LIMIT 10");
```

### Driver ODBC

Usado por Excel, Power BI, MicroStrategy y otras herramientas compatibles con ODBC:
- Disponible para Windows, macOS, Linux
- Configurado vía el Administrador de Orígenes de Datos ODBC (Windows) o `odbc.ini` (Linux/macOS)

### Conector Python

El conector oficial de Snowflake para Python:

```python
import snowflake.connector

# Conexión estándar
conn = snowflake.connector.connect(
    account='myaccount.us-east-1',
    user='myuser',
    password='mypassword',
    warehouse='WH_ANALYTICS',
    database='MY_DB',
    schema='PUBLIC',
    role='ANALYST'
)

cursor = conn.cursor()
cursor.execute("SELECT count(*) FROM orders")
result = cursor.fetchone()
print(f"Total de pedidos: {result[0]}")

# Ejecutar con parámetros (previene inyección SQL)
cursor.execute(
    "SELECT * FROM orders WHERE customer_id = %s AND status = %s",
    (customer_id, 'ACTIVE')
)

# Usar DictCursor para resultados como diccionarios
cursor_dict = conn.cursor(snowflake.connector.DictCursor)
cursor_dict.execute("SELECT order_id, amount FROM orders LIMIT 5")
for row in cursor_dict:
    print(row['ORDER_ID'], row['AMOUNT'])
```

### Otros Drivers Oficiales

| Driver | Caso de Uso |
|---|---|
| **Node.js** | Aplicaciones JavaScript/TypeScript |
| **.NET** | Aplicaciones C# |
| **Go** | Aplicaciones Go |
| **PHP PDO** | Aplicaciones web PHP |
| **Spark Connector** | Integración con Apache Spark |
| **Kafka Connector** | Transmisión de Apache Kafka → Snowflake |

---

## Conectores de Snowflake

Los **conectores** son integraciones de nivel superior construidas sobre los drivers — manejan patrones específicos de fuentes de datos.

### Snowflake Connector para Apache Kafka

El **Kafka Connector** habilita la transmisión de mensajes en tiempo real desde tópicos de Kafka a tablas de Snowflake:

```json
// Configuración del Kafka Connector (connector.json)
{
  "name": "snowflake-sink",
  "config": {
    "connector.class": "com.snowflake.kafka.connector.SnowflakeSinkConnector",
    "tasks.max": "8",
    "topics": "orders,events,users",
    "snowflake.url.name": "myaccount.snowflakecomputing.com:443",
    "snowflake.user.name": "kafka_user",
    "snowflake.private.key": "<RSA_PRIVATE_KEY>",
    "snowflake.database.name": "RAW_DB",
    "snowflake.schema.name": "KAFKA",
    "snowflake.ingestion.method": "SNOWPIPE_STREAMING",
    "buffer.flush.time": "10",
    "buffer.count.records": "10000"
  }
}
```

| Método de Ingesta | Descripción |
|---|---|
| **Snowpipe (v1)** | Ingesta basada en archivos vía stages |
| **Snowpipe Streaming (v2+)** | Ingesta directa a nivel de fila (menor latencia) |

### Conector Snowpark para Python

El conector Snowpark para Python proporciona una API DataFrame:

```python
from snowflake.snowpark import Session

session = Session.builder.configs({
    "account": "myaccount",
    "user": "myuser",
    "authenticator": "externalbrowser",  # SSO
    "warehouse": "WH_DS",
    "database": "ANALYTICS",
    "schema": "PUBLIC"
}).create()

# Operaciones con DataFrame
df = session.table("orders")
df.filter(df["amount"] > 100).group_by("region").count().show()
```

### Conector de Snowflake para Spark

Conecta cargas de trabajo de Apache Spark con Snowflake:

```scala
// Scala/Spark con el conector de Snowflake
val df = spark.read
  .format("snowflake")
  .options(sfOptions)
  .option("dbtable", "MY_DB.PUBLIC.ORDERS")
  .load()

df.write
  .format("snowflake")
  .options(sfOptions)
  .option("dbtable", "MY_DB.PUBLIC.ORDERS_OUTPUT")
  .mode(SaveMode.Overwrite)
  .save()
```

---

## Integraciones de Almacenamiento

Una **integración de almacenamiento** crea una relación de confianza entre Snowflake y tu cloud storage **sin almacenar credenciales en Snowflake**. Usa IAM (Gestión de Identidad y Acceso) de la nube para la autenticación.

### Integración con AWS S3

```sql
-- Paso 1: Crear la integración
CREATE STORAGE INTEGRATION aws_s3_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = S3
    ENABLED = TRUE
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789012:role/SnowflakeRole'
    STORAGE_ALLOWED_LOCATIONS = ('s3://my-data-bucket/snowflake/');

-- Paso 2: Obtener la identidad AWS de Snowflake para la política de confianza
DESC INTEGRATION aws_s3_integration;
-- Nota: STORAGE_AWS_IAM_USER_ARN y STORAGE_AWS_EXTERNAL_ID

-- Paso 3: Actualizar la política de confianza IAM en AWS con esos valores
-- Paso 4: Crear un stage usando la integración
CREATE STAGE my_s3_stage
    URL = 's3://my-data-bucket/snowflake/'
    STORAGE_INTEGRATION = aws_s3_integration
    FILE_FORMAT = (TYPE = PARQUET);
```

### Integración con Azure Blob Storage

```sql
CREATE STORAGE INTEGRATION azure_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = AZURE
    ENABLED = TRUE
    AZURE_TENANT_ID = '<tu-tenant-id>'
    STORAGE_ALLOWED_LOCATIONS = ('azure://myaccount.blob.core.windows.net/mycontainer/');

-- Obtener los detalles del principal de servicio para la asignación de roles en Azure
DESC INTEGRATION azure_integration;
```

### Integración con GCS

```sql
CREATE STORAGE INTEGRATION gcs_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = GCS
    ENABLED = TRUE
    STORAGE_ALLOWED_LOCATIONS = ('gcs://my-bucket/snowflake/');

-- Obtener la cuenta de servicio para la asignación de roles IAM en GCS
DESC INTEGRATION gcs_integration;
```

---

## Integraciones de API

Una **integración de API** permite a Snowflake llamar a **endpoints REST API externos** — usada para Funciones Externas e integraciones de notificación.

### Funciones Externas (*External Functions*)

Las funciones externas llaman a APIs fuera de Snowflake vía un API Gateway:

```sql
-- Crear una integración de API (apuntando a AWS API Gateway / Azure App Service)
CREATE API INTEGRATION my_api_integration
    API_PROVIDER = AWS_API_GATEWAY
    API_AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/SnowflakeAPIRole'
    API_ALLOWED_PREFIXES = ('https://abc123.execute-api.us-east-1.amazonaws.com/prod/')
    ENABLED = TRUE;

-- Crear la función externa
CREATE EXTERNAL FUNCTION call_sentiment_api(text STRING)
RETURNS VARIANT
API_INTEGRATION = my_api_integration
AS 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/sentiment';

-- Usar en SQL
SELECT call_sentiment_api(review_text) AS sentimiento
FROM product_reviews;
```

### Integraciones de Notificación

Usadas para notificaciones de eventos de Snowpipe y sistemas de alertas:

```sql
-- Integración de notificación con AWS SNS
CREATE NOTIFICATION INTEGRATION aws_sns_integration
    ENABLED = TRUE
    TYPE = QUEUE
    NOTIFICATION_PROVIDER = AWS_SNS
    DIRECTION = OUTBOUND
    AWS_SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789:my-topic'
    AWS_SNS_ROLE_ARN = 'arn:aws:iam::123456789:role/SNSRole';

-- Auto-ingesta (Snowpipe) usando SQS
CREATE NOTIFICATION INTEGRATION sqs_ingest
    ENABLED = TRUE
    TYPE = QUEUE
    NOTIFICATION_PROVIDER = AWS_SQS
    AWS_SQS_ARN = 'arn:aws:sqs:us-east-1:123456789:snowpipe-queue';
```

---

## Integración con Git

La **Integración con Git** permite a Snowflake conectarse a un repositorio Git (GitHub, GitLab, Bitbucket) y ejecutar archivos SQL, código Snowpark u otros scripts directamente desde el repositorio:

```sql
-- Crear una integración de API para el proveedor Git
CREATE API INTEGRATION github_integration
    API_PROVIDER = GIT_HTTPS_API
    API_ALLOWED_PREFIXES = ('https://github.com/myorg/')
    ENABLED = TRUE;

-- Crear un objeto de repositorio Git en Snowflake
CREATE GIT REPOSITORY my_repo
    API_INTEGRATION = github_integration
    GIT_CREDENTIALS = my_github_credentials  -- almacenado como Secret
    ORIGIN = 'https://github.com/myorg/snowflake-pipelines.git';

-- Obtener los últimos cambios del repositorio remoto
ALTER GIT REPOSITORY my_repo FETCH;

-- Listar archivos en el repositorio
SHOW GIT FILES IN @my_repo/branches/main;

-- Ejecutar un archivo SQL directamente desde Git
EXECUTE IMMEDIATE FROM @my_repo/branches/main/migrations/001_create_tables.sql;

-- Referenciar código Python de Snowpark desde Git en un procedimiento
CREATE PROCEDURE my_proc()
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
IMPORTS = ('@my_repo/branches/main/src/utils.py')
HANDLER = 'utils.run'
AS $$
# Código en Git
$$;
```

---

## Resumen de Conectores e Integraciones

| Tipo de Integración | Propósito | Ejemplos |
|---|---|---|
| **Driver JDBC** | Conectividad SQL desde apps Java / herramientas BI | Tableau, DBeaver, apps Java |
| **Driver ODBC** | Conectividad SQL desde clientes ODBC | Excel, Power BI |
| **Conector Python** | Conectividad de aplicaciones Python | Scripts ETL, ciencia de datos |
| **Kafka Connector** | Transmisión en tiempo real desde Kafka | Transmisión de eventos, CDC |
| **Spark Connector** | Intercambio de datos Spark ↔ Snowflake | Procesamiento de big data |
| **Integración de Almacenamiento** | Acceso seguro al cloud storage | S3, Azure Blob, GCS |
| **Integración de API** | Llamadas a REST APIs externas | Funciones externas, alertas |
| **Integración de Notificación** | Notificaciones push | SNS, SQS, Event Grid, Pub/Sub |
| **Integración con Git** | Ejecución de código con control de versiones | CI/CD, versionado de pipelines |

---

## Preguntas de Práctica

**P1.** Una empresa quiere conectar Power BI a Snowflake sin escribir ningún código. ¿Qué opción de conectividad es más apropiada?

- A) Conector Python
- B) Driver JDBC
- C) Driver ODBC ✅
- D) Kafka Connector

**P2.** Una integración de almacenamiento usa qué mecanismo para autenticarse con el cloud storage en lugar de almacenar credenciales?

- A) Usuario y contraseña almacenados en un Secret de Snowflake
- B) Roles IAM de la nube (relación de confianza) ✅
- C) Claves API almacenadas en la definición del stage
- D) Tokens OAuth gestionados por el usuario

**P3.** Un Kafka Connector configurado con `snowflake.ingestion.method = SNOWPIPE_STREAMING` proporciona qué ventaja sobre la ingesta basada en archivos?

- A) Menor costo
- B) Mejor compresión
- C) Menor latencia (ingesta directa a nivel de fila) ✅
- D) Soporte para más formatos de archivo

**P4.** ¿Qué funcionalidad de Snowflake permite ejecutar archivos SQL directamente desde un repositorio de GitHub sin descargarlos primero?

- A) Snowflake CLI
- B) Notebooks de Snowsight
- C) Integración con Git ✅
- D) Integración de Almacenamiento

**P5.** Una función externa requiere qué tipo de integración para llamar a una REST API externa?

- A) Integración de Almacenamiento
- B) Integración de Notificación
- C) Integración de API ✅
- D) Integración de Seguridad

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. **JDBC** = Java + herramientas BI | **ODBC** = Excel, Power BI | **Conector Python** = scripts/apps
> 2. **Integración de Almacenamiento** = autenticación por rol IAM, sin credenciales almacenadas en Snowflake
> 3. **Kafka Connector v2+ con Snowpipe Streaming** = ingesta Kafka de menor latencia
> 4. **Integración de API** = requerida para Funciones Externas que llaman a REST APIs
> 5. **Integración con Git** = ejecutar SQL/Snowpark directamente desde un repositorio Git
