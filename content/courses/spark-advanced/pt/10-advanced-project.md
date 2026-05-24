---
title: "Projeto Avançado: Análise de Streaming em Tempo Real com Inferência ML"
description: "Projeto final: construa um pipeline de análise de streaming em tempo real com inferência ML usando Structured Streaming, MLlib e Delta Lake"
order: 10
duration: "60-90 minutos"
difficulty: "avançado"
---

# Projeto Avançado: Análise de Streaming em Tempo Real com Inferência ML

Este projeto final combina structured streaming, modelos ML, operações de janela, Delta Lake e monitoramento em um pipeline de análise em tempo real completo.

## Visão Geral do Projeto

Você construirá um pipeline em tempo real que:

1. Ingere dados de eventos em streaming do Kafka
2. Calcula agregações em tempo real com janelas tumbling
3. Executa inferência de modelos ML em dados de streaming
4. Armazena dados crus e agregados no Delta Lake
5. Detecta anomalias usando métodos estatísticos
6. Monitora a saúde do pipeline com métricas personalizadas
7. Lida com dados tardios usando watermarks

## Arquitetura

```
Dispositivos IoT / Apps Web
    |
    v
Kafka (tópico events)
    |
    v
Structured Streaming
    |-- Agregações por janela (tumbling de 5 min)
    |-- Inferência ML (modelo de detecção de fraude)
    |-- Detecção de anomalias (limiares estatísticos)
    |-- Armazenamento de eventos crus (Delta Lake)
    |
    v
Tabelas Delta Lake
    |-- raw_events
    |-- agg_events
    |-- predictions
    |-- anomalies
    |
    v
Consumo (BI, dashboards, alertas)
```

## Configuração

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
from delta.tables import DeltaTable
import json

spark = SparkSession.builder \
    .appName("RealTimeStreamingAnalytics") \
    .master("local[*]") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoints/analytics") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.shuffle.partitions", "10") \
    .getOrCreate()

sc = spark.sparkContext
sc.setLogLevel("WARN")
```

## Passo 1: Gerar Dados de Streaming Sintéticos

```python
import random
from datetime import datetime, timedelta
import time

def generate_events(num_events=1000):
    """Gerar eventos sintéticos de streaming para teste."""
    
    users = [f"user_{i}" for i in range(100)]
    events = ["purchase", "click", "login", "logout", "view", "add_to_cart"]
    categories = ["electronics", "clothing", "home", "sports", "books"]
    
    events_data = []
    base_time = datetime.now()
    
    for i in range(num_events):
        event_time = base_time - timedelta(
            seconds=random.randint(0, 3600),
            milliseconds=random.randint(0, 1000)
        )
        
        amount = round(random.uniform(5.0, 500.0), 2) if random.random() > 0.3 else 0.0
        
        events_data.append({
            "user_id": random.choice(users),
            "event_type": random.choice(events),
            "amount": amount,
            "category": random.choice(categories),
            "ip_address": f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,255)}",
            "timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "device": random.choice(["web", "mobile", "tablet"]),
            "session_id": f"sess_{random.randint(1000, 9999)}"
        })
    
    return events_data

# Escrever dados de teste como arquivos JSON (simulando streaming)
import os
os.makedirs("data/streaming_input", exist_ok=True)

for batch in range(5):
    batch_data = generate_events(200)
    batch_file = f"data/streaming_input/batch_{batch}.json"
    
    with open(batch_file, "w") as f:
        for event in batch_data:
            f.write(json.dumps(event) + "\n")
    
    print(f"Escrito {batch_file}: {len(batch_data)} eventos")
    time.sleep(1)  # Simular atraso entre lotes
```

## Passo 2: Definir Esquema e Ler Stream

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType

schema = StructType([
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("amount", DoubleType()),
    StructField("category", StringType()),
    StructField("ip_address", StringType()),
    StructField("timestamp", StringType()),
    StructField("device", StringType()),
    StructField("session_id", StringType())
])

# Ler dados de streaming do diretório
raw_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .json("data/streaming_input/")

# Analisar timestamp
parsed_stream = raw_stream \
    .withColumn("event_time", to_timestamp(col("timestamp"), "yyyy-MM-dd HH:mm:ss.SSS")) \
    .withColumn("processing_time", current_timestamp()) \
    .drop("timestamp")

# Cache de checkpoint
parsed_stream.printSchema()
```

> [!SUCCESS]
> Usar uma fonte de arquivos para testes simplifica o desenvolvimento. Em produção, substitua por Kafka: `spark.readStream.format("kafka").option("subscribe", "events")`.

## Passo 3: Treinar Modelo ML (Pré-computado)

```python
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.classification import LogisticRegression
from pyspark.ml import Pipeline

# Treinar um modelo simples de detecção de fraude
training_data = spark.createDataFrame([
    ("purchase", 500.0, 0), ("purchase", 25.0, 0), ("purchase", 450.0, 1),
    ("click", 0.0, 0), ("login", 0.0, 0), ("purchase", 300.0, 0),
    ("purchase", 475.0, 1), ("add_to_cart", 0.0, 0), ("purchase", 50.0, 0),
    ("purchase", 490.0, 1), ("purchase", 100.0, 0), ("purchase", 480.0, 1)
], ["event_type", "amount", "is_fraud"])

# Engenharia de características
feature_assembler = VectorAssembler(
    inputCols=["amount"],
    outputCol="features_raw"
)

scaler = StandardScaler(
    inputCol="features_raw",
    outputCol="features"
)

classifier = LogisticRegression(
    featuresCol="features",
    labelCol="is_fraud",
    maxIter=50
)

ml_pipeline = Pipeline(stages=[feature_assembler, scaler, classifier])
fraud_model = ml_pipeline.fit(training_data)

# Salvar modelo
fraud_model.write().overwrite().save("models/fraud_detection")
print("Modelo de detecção de fraude treinado e salvo.")
```

> [!NOTE]
> Em uma implantação real, retreine o modelo periodicamente com trabalhos em lote e use o pipeline de streaming apenas para inferência. Carregue a versão mais recente do modelo de um registro de modelos.

## Passo 4: Pipeline de Inferência em Streaming

```python
from pyspark.ml import PipelineModel

# Carregar modelo pré-treinado
loaded_model = PipelineModel.load("models/fraud_detection")

# Aplicar modelo a dados de streaming
features_for_ml = parsed_stream \
    .filter(col("event_type") == "purchase") \
    .withColumn("amount", col("amount").cast("double"))

predictions = loaded_model.transform(features_for_ml)

# Selecionar colunas relevantes
ml_results = predictions.select(
    col("user_id"),
    col("event_time"),
    col("amount"),
    col("event_type"),
    col("category"),
    col("device"),
    col("prediction").alias("is_fraud_prediction"),
    col("probability").getItem(1).alias("fraud_probability")
)
```

## Passo 5: Agregações em Tempo Real com Janelas

```python
# Agregações por janela
windowed_aggs = parsed_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event_type"),
        col("category")
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount"),
        countDistinct("user_id").alias("unique_users"),
        countDistinct("ip_address").alias("unique_ips")
    )

# Estatísticas móveis de usuário
user_window = Window.partitionBy("user_id") \
    .orderBy(col("event_time")) \
    .rowsBetween(-100, Window.currentRow)

rolling_stats = parsed_stream \
    .withColumn("user_event_count", count("*").over(user_window)) \
    .withColumn("user_total_amount", sum("amount").over(user_window))
```

## Passo 6: Detecção de Anomalias

```python
# Detecção estatística de anomalias
anomaly_check = parsed_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("user_id")
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        countDistinct("ip_address").alias("ip_count")
    ) \
    .withColumn("is_anomalous_rate",
        when(col("event_count") > 100, lit(True))
        .otherwise(lit(False))
    ) \
    .withColumn("is_anomalous_amount",
        when(col("total_amount") > 10000, lit(True))
        .otherwise(lit(False))
    ) \
    .withColumn("is_anomalous_geo",
        when(col("ip_count") > 5, lit(True))
        .otherwise(lit(False))
    ) \
    .withColumn("anomaly_score",
        col("is_anomalous_rate").cast("int") +
        col("is_anomalous_amount").cast("int") +
        col("is_anomalous_geo").cast("int")
    ) \
    .filter(col("anomaly_score") > 0)
```

## Passo 7: Escrever para Sinks Delta Lake

```python
# Sink de dados crus
raw_query = parsed_stream.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/raw_events") \
    .table("raw_events")

# Sink de agregações
agg_query = windowed_aggs.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/agg_events") \
    .table("agg_events")

# Sink de predições ML
ml_query = ml_results.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/predictions") \
    .table("predictions")

# Sink de alertas de anomalias
anomaly_query = anomaly_check.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/anomalies") \
    .table("anomalies")

# Saída para console para monitoramento
console_query = ml_results.writeStream \
    .format("console") \
    .outputMode("append") \
    .option("truncate", "false") \
    .queryName("fraud_alerts") \
    .start()
```

## Passo 8: Monitoramento e Observabilidade

```python
# Acumuladores personalizados de monitoramento
events_processed = sc.accumulator(0)
fraud_detected = sc.accumulator(0)
anomalies_detected = sc.accumulator(0)

def monitor_stream(query, name):
    """Monitorar o progresso da consulta de streaming."""
    
    def report():
        progress = query.lastProgress
        if progress:
            print(f"[{name}] Linhas: {progress.get('numInputRows', 0)}, "
                  f"Taxa: {progress.get('inputRowsPerSecond', 0):.1f}/s, "
                  f"Duração do lote: {progress.get('durationMs', {}).get('triggerExecution', 0)}ms")
    
    return report

# Registrar monitor de progresso
import threading

def monitoring_loop(interval=5):
    while True:
        for q in spark.streams.active:
            if q.lastProgress:
                p = q.lastProgress
                print(f"[{q.name}] Linhas: {p.get('numInputRows', 0)}, "
                      f"Taxa: {p.get('inputRowsPerSecond', 0):.1f}/s")
        time.sleep(interval)

monitor_thread = threading.Thread(target=monitoring_loop, daemon=True)
monitor_thread.start()
```

## Passo 9: Consultar Resultados

```python
# Consultar tabelas Delta (em outra sessão ou após o streaming)
spark.sql("SELECT * FROM raw_events LIMIT 5").show(truncate=False)
spark.sql("SELECT * FROM agg_events ORDER BY window DESC LIMIT 10").show()
spark.sql("SELECT * FROM predictions WHERE is_fraud_prediction = 1 LIMIT 10").show()
spark.sql("SELECT * FROM anomalies ORDER BY anomaly_score DESC LIMIT 10").show()

# Agregar métricas de fraude
fraud_metrics = spark.sql("""
    SELECT category,
           COUNT(*) as total_purchases,
           SUM(is_fraud_prediction) as fraud_count,
           ROUND(AVG(fraud_probability), 4) as avg_fraud_prob
    FROM predictions
    GROUP BY category
    ORDER BY fraud_count DESC
""")
fraud_metrics.show()

# Verificar último watermark
for q in spark.streams.active:
    status = q.status
    print(f"Stream: {q.name}")
    print(f"  Status: {status['message']}")
```

## Passo 10: Limpeza e Script Final

```python
# Script completo do pipeline
class RealTimeAnalyticsPipeline:
    def __init__(self, spark):
        self.spark = spark
        self.queries = []
    
    def build_pipeline(self):
        schema = self._define_schema()
        stream = self._read_stream(schema)
        parsed = self._parse_timestamp(stream)
        model = self._load_model()
        
        # Fluxos paralelos
        self.queries.append(self._write_raw(parsed))
        self.queries.append(self._write_aggregations(parsed))
        self.queries.append(self._write_predictions(parsed, model))
        self.queries.append(self._write_anomalies(parsed))
        return self
    
    def start(self):
        for q in self.queries:
            q.start()
        return self
    
    def await_termination(self):
        self.spark.streams.awaitAnyTermination()
    
    def stop(self):
        for q in self.queries:
            q.stop()

# Executar o pipeline
pipeline = RealTimeAnalyticsPipeline(spark)
pipeline.build_pipeline().start()

try:
    pipeline.await_termination()
except KeyboardInterrupt:
    print("Desligando...")
    pipeline.stop()
```

## Perguntas de Negócio

Responda estas usando os resultados do seu pipeline:

1. Qual é a probabilidade média de fraude por categoria?
2. Quais usuários mostram padrões de comportamento anômalos?
3. Como as contagens de eventos variam através de janelas de 5 minutos?
4. Qual é a taxa de pico de eventos por minuto?
5. Qual tipo de dispositivo tem a maior taxa de fraude?
6. Qual é a proporção de compras em relação a outros eventos?
7. Quantas anomalias únicas foram detectadas?
8. Qual é a latência média de processamento?
9. Quais horas têm os maiores volumes de transação?
10. Qual é a distribuição das pontuações de anomalia?

## Perguntas de Prática

1. Como o pipeline de streaming aplica a inferência ML a cada lote?
2. Como watermarks e janelas trabalham juntos neste pipeline?
3. Por que as agregações são escritas com o modo `append`?
4. Como você adicionaria mais características ao modelo de detecção de fraude?
5. Como você monitora a saúde das consultas de streaming em produção?
6. Qual é o propósito do sink `foreachBatch` neste pipeline?
7. Como você lidaria com o retreinamento do modelo sem tempo de inatividade?
8. Quais características do Delta Lake garantem semântica exactly-once?
9. Como você escalaria este pipeline para 10x mais dados?
10. Como você implementa alertas quando a probabilidade de fraude excede um limiar?
