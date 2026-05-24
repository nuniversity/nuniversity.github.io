---
title: "Structured Streaming"
description: "Entenda conceitos de streaming, arquitetura de micro-batches, readStream, writeStream e construção de pipelines de dados em tempo real"
order: 1
duration: "35-45 minutos"
difficulty: "avançado"
---

# Structured Streaming

Structured Streaming fornece um motor de processamento de fluxo escalável e tolerante a falhas construído sobre a API do Spark SQL. Você escreve consultas de streaming usando a mesma API DataFrame/SQL das consultas em lote, e o Spark as executa incrementalmente sobre dados em streaming.

## Conceitos de Streaming

### Modelos de Processamento de Fluxo

| Modelo | Descrição | Latência |
|---|---|---|
| **Micro-batch** | Processa dados em pequenos lotes (padrão) | 100ms - 1s |
| **Contínuo** | Processa cada registro à medida que chega (Spark 2.3+) | 1ms - 10ms |

> [!NOTE]
> O modo micro-batch é o padrão e mais confiável. O processamento contínuo oferece menor latência mas suporta menos operações. Comece com micro-batch e mude apenas se latência abaixo de 100ms for necessária.

### Conceitos Chave

- **Fluxo de entrada**: Dados não limitados que chegam continuamente (Kafka, arquivos, sockets, etc.)
- **Fluxo de saída**: Resultados escritos continuamente para um sink
- **Trigger**: Intervalo no qual os dados de streaming são processados
- **Watermark**: Atraso máximo para esperar dados tardios
- **Checkpointing**: Armazena metadados de progresso para recuperação de falhas

## Arquitetura de Streaming

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("StructuredStreaming") \
    .master("local[*]") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoints") \
    .getOrCreate()
```

## readStream

Leitura de uma fonte de streaming:

```python
# Fonte de arquivos (monitorar um diretório para novos arquivos)
streaming_df = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .option("cleanSource", "archive") \
    .csv("data/input/")

# Fonte Kafka
kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .load()

# Fonte Rate (para testes)
rate_df = spark.readStream \
    .format("rate") \
    .option("rowsPerSecond", 10) \
    .option("numPartitions", 1) \
    .load()

# Fonte Socket (testes simples)
socket_df = spark.readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()
```

> [!SUCCESS]
> A fonte de arquivos é a maneira mais fácil de aprender streaming. Coloque arquivos em um diretório e o Spark os processa incrementalmente. A opção `maxFilesPerTrigger` controla a vazão.

## writeStream

Escrita para um sink de streaming:

```python
# Sink Console (depuração)
query = streaming_df.writeStream \
    .format("console") \
    .outputMode("append") \
    .option("truncate", "false") \
    .start()

# Sink Memory (para consultas interativas)
query = streaming_df.writeStream \
    .format("memory") \
    .queryName("recent_events") \
    .outputMode("append") \
    .start()

# Consultar a tabela em memória
spark.sql("SELECT * FROM recent_events").show()

# Sink File (escrever para Parquet/CSV/JSON)
query = streaming_df.writeStream \
    .format("parquet") \
    .option("path", "data/output/") \
    .option("checkpointLocation", "/tmp/checkpoints") \
    .outputMode("append") \
    .start()

# Sink Kafka
query = streaming_df.selectExpr("key", "value") \
    .writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "processed-events") \
    .option("checkpointLocation", "/tmp/checkpoints") \
    .start()

# Sink ForeachBatch (processamento personalizado)
def process_batch(batch_df, batch_id):
    batch_df.write.mode("append").parquet(f"data/batches/{batch_id}/")

query = streaming_df.writeStream \
    .foreachBatch(process_batch) \
    .outputMode("append") \
    .start()
```

## Modos de Saída

| Modo | Descrição | Quando Usar |
|---|---|---|
| **Append** | Apenas novas linhas | Operações map/filter (sem agregação) |
| **Complete** | Tabela de resultados completa a cada trigger | Consultas agregadas (sem watermark) |
| **Update** | Apenas linhas atualizadas | Consultas agregadas (com watermark) |

## Exemplo Completo de Streaming

```python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType
from pyspark.sql.functions import window, col, count, sum, avg, to_timestamp

# Definir esquema para dados de streaming
schema = StructType([
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("amount", IntegerType()),
    StructField("timestamp", StringType())
])

# Ler dados de streaming
raw_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .json("data/events/")

# Analisar timestamp
parsed_stream = raw_stream \
    .withColumn("event_time", to_timestamp(col("timestamp"))) \
    .drop("timestamp")

# Agregação por janela com watermark
aggregated = parsed_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event_type")
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount")
    )

# Escrever resultados agregados
query = aggregated.writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", "false") \
    .option("numRows", 10) \
    .start()

query.awaitTermination()
```

## Gerenciamento de Consultas de Streaming

```python
# Iniciar múltiplos fluxos
query1 = stream1.writeStream.queryName("stream1").format("console").start()
query2 = stream2.writeStream.queryName("stream2").format("console").start()

# Listar fluxos ativos
for q in spark.streams.active:
    print(f"Query: {q.name}, Status: {q.status}")

# Aguardar qualquer fluxo terminar
spark.streams.awaitAnyTermination()

# Parar uma consulta específica
query.stop()

# Parar todas as consultas
spark.streams.resetTerminated()
```

## Checkpointing e Recuperação

Checkpointing armazena o progresso e estado de uma consulta de streaming para recuperação de falhas.

```python
checkpoint_dir = "hdfs://namenode:9000/checkpoints/log_processor"

query = streaming_df.writeStream \
    .option("checkpointLocation", checkpoint_dir) \
    .format("parquet") \
    .option("path", "data/output/") \
    .start()
```

> [!WARNING]
> Diretórios de checkpoint devem ser armazenados em um sistema de arquivos tolerante a falhas (HDFS, S3, GCS). Checkpoints do sistema de arquivos local são perdidos se o driver falhar. Nunca reutilize um diretório de checkpoint para uma consulta diferente.

## Testando Aplicações de Streaming

```python
# Stream para sink Memory para teste
def test_streaming_pipeline():
    test_df = spark.readStream \
        .format("rate") \
        .option("rowsPerSecond", 5) \
        .load()
    
    result = test_df \
        .withColumn("doubled", col("value") * 2) \
        .writeStream \
        .format("memory") \
        .queryName("test_results") \
        .outputMode("append") \
        .start()
    
    import time
    time.sleep(3)
    
    # Consultar tabela em memória
    df = spark.sql("SELECT * FROM test_results")
    assert df.count() > 0
    print(f"Teste passou: {df.count()} linhas")
    
    result.stop()
```

## Perguntas de Prática

1. Qual é a diferença entre processamento micro-batch e contínuo?
2. Quais são os três modos de saída no Structured Streaming?
3. Como o checkpointing permite a recuperação de falhas?
4. O que é um watermark e por que é necessário para agregações?
5. Como você lê do Kafka em uma consulta de streaming?
6. O que acontece se você reiniciar uma consulta de streaming sem um checkpoint?
7. Como `maxFilesPerTrigger` controla a vazão do fluxo de arquivos?
8. Para que serve `foreachBatch`?
9. Como você lida com mudanças de esquema em dados de streaming?
10. Projete um pipeline de streaming que leia do Kafka, agregue por janelas de 5 minutos e escreva para Parquet.
