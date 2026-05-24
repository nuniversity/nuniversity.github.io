---
title: "Projeto Intermediário: Pipeline ETL de Logs de Servidor Web"
description: "Construa um pipeline ETL completo processando logs de servidor web usando DataFrames do Spark, SQL e melhores práticas"
order: 10
duration: "45-60 minutos"
difficulty: "intermediário"
---

# Projeto Intermediário: Pipeline ETL de Logs de Servidor Web

Este projeto final combina todas as habilidades intermediárias do Spark. Você construirá um pipeline ETL que ingere logs de servidor web, limpa e transforma, calcula análises e carrega os resultados para consumo.

## Visão Geral do Projeto

Você construirá um pipeline que:

1. Lê arquivos de log de servidor web brutos (Formato de Log Comum Apache)
2. Analisa e limpa os dados
3. Enriquece os logs com geolocalização e informação de sessão
4. Calcula análises de tráfego usando funções janela
5. Detecta anomalias e atividade de bots
6. Carrega dados limpos e agregações para Parquet
7. Executa verificações de qualidade ao longo do pipeline

## Formato de Dados

Formato de Log Comum Apache:

```
127.0.0.1 - frank [10/Oct/2024:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
192.168.1.1 - - [10/Oct/2024:14:00:12 -0700] "POST /api/users HTTP/1.1" 201 124
10.0.0.2 - - [10/Oct/2024:14:01:05 -0700] "GET /index.html HTTP/1.1" 200 4321
```

### Gerar Logs de Amostra

```python
import random
from datetime import datetime, timedelta

def generate_logs(output_path, num_lines=10000):
    """Gerar dados de log Apache de amostra para teste."""
    
    ips = [f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,255)}" 
           for _ in range(50)]
    users = ["alice", "bob", "charlie", "diana", "eve", "-"]
    methods = ["GET", "POST", "PUT", "DELETE"]
    paths = ["/index.html", "/api/users", "/api/products", "/about", "/login",
             "/api/orders", "/images/logo.png", "/css/style.css", "/js/app.js",
             "/api/search?q=spark", "/checkout", "/cart"]
    statuses = [200]*60 + [201]*10 + [301]*5 + [302]*5 + [400]*3 + [401]*2 + [404]*8 + [500]*5 + [503]*2
    
    with open(output_path, "w") as f:
        start = datetime(2024, 10, 1)
        for i in range(num_lines):
            timestamp = start + timedelta(seconds=random.randint(0, 86400*30))
            ip = random.choice(ips)
            user = random.choice(users) if random.random() > 0.7 else "-"
            method = random.choice(methods)
            path = random.choice(paths)
            status = random.choice(statuses)
            size = random.randint(50, 50000)
            
            f.write(f'{ip} - {user} [{timestamp.strftime("%d/%b/%Y:%H:%M:%S %z")}] '
                    f'"{method} {path} HTTP/1.1" {status} {size}\n')

generate_logs("data/weblogs/access.log", 10000)
```

## Implementação do Pipeline

### 1. Analisar Arquivos de Log

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType
import re

spark = SparkSession.builder \
    .appName("WebLogETL") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.shuffle.partitions", "10") \
    .getOrCreate()

# Analisar linha de log Apache usando regex
LOG_PATTERN = r'^(\S+) \S+ (\S+) \[([^\]]+)\] "(\S+) (\S+) [^"]+" (\d{3}) (\d+)$'

# Analisar com RDD depois converter para DataFrame
log_rdd = spark.sparkContext.textFile("data/weblogs/access.log")

def parse_log(line):
    match = re.match(LOG_PATTERN, line)
    if match:
        ip, user, timestamp, method, path, status, size = match.groups()
        try:
            parsed_ts = datetime.strptime(timestamp, "%d/%b/%Y:%H:%M:%S %z")
        except:
            parsed_ts = None
        return (ip, user if user != "-" else None, parsed_ts, method, path, int(status), int(size))
    return None

parsed_rdd = log_rdd.map(parse_log).filter(lambda x: x is not None)

logs_df = parsed_rdd.toDF(["ip", "user", "timestamp", "method", "path", "status", "bytes"])
logs_df.printSchema()
logs_df.show(5, truncate=False)
```

> [!SUCCESS]
> Usar regex com RDD para a análise inicial dá controle total sobre linhas malformadas. Após analisar, converta para DataFrame para acesso à otimização Catalyst.

### 2. Limpar e Transformar

```python
# Adicionar colunas derivadas
logs_clean = logs_df \
    .withColumn("date", to_date(col("timestamp"))) \
    .withColumn("hour", hour(col("timestamp"))) \
    .withColumn("day_of_week", dayofweek(col("timestamp"))) \
    .withColumn("is_error", when(col("status") >= 400, True).otherwise(False)) \
    .withColumn("is_bot", 
        when(col("user_agent").like("%bot%"), True)
        .when(col("user_agent").like("%crawler%"), True)
        .when(col("user_agent").like("%spider%"), True)
        .otherwise(False)) \
    .withColumn("path_category",
        when(col("path").startswith("/api"), "API")
        .when(col("path").rlike(r"\.(css|js|png|jpg|gif|ico)$"), "Static")
        .when(col("path") == "/", "Home")
        .otherwise("Page"))

# Cachear dados limpos
logs_clean.cache()
print(f"Total logs: {logs_clean.count()}")
print(f"Logs de erro: {logs_clean.filter(col("is_error")).count()}")
```

### 3. Análise de Tráfego com Funções Janela

```python
logs_clean.createOrReplaceTempView("logs")

# Padrão de tráfego por hora
hourly_traffic = spark.sql("""
    SELECT date, hour,
           COUNT(*) as hits,
           COUNT(DISTINCT ip) as unique_ips,
           SUM(bytes) as total_bytes,
           ROUND(AVG(bytes), 0) as avg_bytes
    FROM logs
    GROUP BY date, hour
    ORDER BY date, hour
""")
hourly_traffic.show(10)

# Páginas principais
top_pages = spark.sql("""
    SELECT path,
           COUNT(*) as hits,
           COUNT(DISTINCT ip) as unique_visitors,
           ROUND(AVG(bytes), 0) as avg_size,
           ROUND(SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as error_pct
    FROM logs
    GROUP BY path
    ORDER BY hits DESC
    LIMIT 20
""")
top_pages.show(truncate=False)
```

### 4. Detecção de Sessões

```python
# Detectar sessões usando funções janela (timeout de 30 minutos)
sessions = spark.sql("""
    WITH ordered_logs AS (
        SELECT ip, timestamp, path,
               LAG(timestamp) OVER (PARTITION BY ip ORDER BY timestamp) as prev_timestamp
        FROM logs
    ),
    session_starts AS (
        SELECT ip, timestamp, path,
               CASE WHEN prev_timestamp IS NULL 
                    OR (unix_timestamp(timestamp) - unix_timestamp(prev_timestamp)) > 1800
                    THEN 1 ELSE 0 END as is_new_session
        FROM ordered_logs
    ),
    session_ids AS (
        SELECT ip, timestamp, path,
               SUM(is_new_session) OVER (PARTITION BY ip ORDER BY timestamp 
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as session_id
        FROM session_starts
    )
    SELECT ip, 
           CONCAT(ip, '_', session_id) as full_session_id,
           timestamp, path
    FROM session_ids
""")

session_analysis = spark.sql("""
    SELECT full_session_id, ip,
           COUNT(*) as page_views,
           MIN(timestamp) as session_start,
           MAX(timestamp) as session_end,
           (unix_timestamp(MAX(timestamp)) - unix_timestamp(MIN(timestamp))) / 60 as duration_minutes
    FROM sessions
    GROUP BY full_session_id, ip
""")
session_analysis.show(10)
```

> [!NOTE]
> A detecção de sessões usa um timeout de inatividade de 30 minutos. Cada clique reinicia o temporizador. Sessões que excedem 24 horas normalmente são divididas na maioria das plataformas de análise.

### 5. Detecção de Anomalias

```python
# Detectar possível DDoS ou scraping
anomalies = spark.sql("""
    WITH ip_stats AS (
        SELECT ip,
               COUNT(*) as request_count,
               COUNT(DISTINCT path) as unique_paths,
               COUNT(DISTINCT user) as unique_users,
               COUNT(CASE WHEN status >= 400 THEN 1 END) as error_count,
               ROUND(AVG(bytes), 0) as avg_bytes
        FROM logs
        GROUP BY ip
    ),
    thresholds AS (
        SELECT PERCENTILE(request_count, 0.95) as p95_requests,
               PERCENTILE(error_count, 0.95) as p95_errors
        FROM ip_stats
    )
    SELECT i.*
    FROM ip_stats i, thresholds t
    WHERE i.request_count > t.p95_requests * 3
       OR (i.error_count > 50 AND i.error_count > i.request_count * 0.5)
    ORDER BY i.request_count DESC
""")
print("Possíveis IPs anômalos:")
anomalies.show(truncate=False)
```

### 6. Detecção de Bots

```python
bot_activity = spark.sql("""
    WITH bot_candidates AS (
        SELECT ip,
               COUNT(*) as requests,
               COUNT(DISTINCT path) as paths,
               COUNT(DISTINCT user) as users,
               MIN(timestamp) as first_seen,
               MAX(timestamp) as last_seen,
               ROUND((unix_timestamp(MAX(timestamp)) - unix_timestamp(MIN(timestamp))) / 60, 0) as active_minutes
        FROM logs
        WHERE is_bot = true
        GROUP BY ip
    )
    SELECT *,
           ROUND(requests / NULLIF(active_minutes, 0), 0) as req_per_minute
    FROM bot_candidates
    ORDER BY requests DESC
""")
print("Atividade de bots:")
bot_activity.show(truncate=False)
```

### 7. Carregar Resultados

```python
# Escrever logs limpos
logs_clean.write \
    .mode("overwrite") \
    .partitionBy("date") \
    .option("compression", "snappy") \
    .parquet("data/weblogs/cleaned/")

# Escrever análises
hourly_traffic.write \
    .mode("overwrite") \
    .partitionBy("date") \
    .parquet("data/weblogs/analytics/hourly/")

top_pages.coalesce(1).write \
    .mode("overwrite") \
    .option("header", "true") \
    .csv("data/weblogs/analytics/top_pages/")

# Escrever anomalias para alertas
anomalies.coalesce(1).write \
    .mode("overwrite") \
    .json("data/weblogs/alerts/anomalies/")

# Escrever dados de sessão
session_analysis.write \
    .mode("overwrite") \
    .parquet("data/weblogs/analytics/sessions/")
```

### 8. Verificações de Qualidade de Dados

```python
def validate_pipeline():
    checks = []
    
    # Sem timestamps nulos
    null_count = logs_clean.filter(col("timestamp").isNull()).count()
    checks.append(("null_timestamps", null_count == 0))
    
    # Códigos de status válidos
    invalid_status = logs_clean.filter(~col("status").between(100, 599)).count()
    checks.append(("invalid_status", invalid_status == 0))
    
    # Bytes não negativos
    neg_bytes = logs_clean.filter(col("bytes") < 0).count()
    checks.append(("negative_bytes", neg_bytes == 0))
    
    # Existem dados por hora para cada dia
    days_with_data = hourly_traffic.select("date").distinct().count()
    checks.append(("has_multiple_days", days_with_data >= 1))
    
    # Verificar se a saída particionada existe
    import os
    output_exists = os.path.exists("data/weblogs/cleaned/")
    checks.append(("output_exists", output_exists))
    
    for name, passed in checks:
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {name}")
    
    return all(passed for _, passed in checks)

validate_pipeline()
```

## Perguntas de Negócio

Responda estas usando os resultados do seu pipeline:

1. Qual hora do dia tem o tráfego mais alto?
2. Qual é a duração média da sessão?
3. Quais páginas têm a maior taxa de erro?
4. Qual porcentagem do tráfego vem de bots?
5. Quais IPs mostram comportamento anômalo?
6. Qual é o pico de requisições por minuto para cada IP?
7. Quantos usuários únicos por dia?
8. Qual é o endpoint de API mais solicitado?
9. Qual é a distribuição dos métodos HTTP (GET, POST, etc.)?
10. Como o padrão de tráfego difere entre dias úteis e fins de semana?

## Perguntas de Prática

1. Qual padrão regex corresponde ao Formato de Log Comum Apache?
2. Como você detecta sessões com um timeout de 30 minutos?
3. Qual função janela cria IDs de sessão a partir de timestamps?
4. Como você identifica possíveis ataques DDoS a partir de dados de log?
5. Quais critérios indicam atividade de bots em logs web?
6. Como você calcula a taxa de erro por endpoint?
7. Como você particiona logs limpos por data para consultas eficientes?
8. Quais verificações de qualidade um pipeline de processamento de logs deve incluir?
9. Como você usa `LAG()` para calcular o tempo entre requisições?
10. Como você estenderia este pipeline para lidar com streaming em tempo real?
