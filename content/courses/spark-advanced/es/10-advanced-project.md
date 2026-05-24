---
title: "Proyecto Avanzado: Analítica de Streaming en Tiempo Real con Inferencia ML"
description: "Proyecto final: construye un pipeline de analítica de streaming en tiempo real con inferencia ML usando Structured Streaming, MLlib y Delta Lake"
order: 10
duration: "60-90 minutos"
difficulty: "avanzado"
---

# Proyecto Avanzado: Analítica de Streaming en Tiempo Real con Inferencia ML

Este proyecto final combina structured streaming, modelos ML, operaciones de ventana, Delta Lake y monitoreo en un pipeline de analítica en tiempo real completo.

## Resumen del Proyecto

Construirás un pipeline en tiempo real que:

1. Ingiere datos de eventos en streaming desde Kafka
2. Calcula agregaciones en tiempo real con ventanas tumbling
3. Ejecuta inferencia de modelos ML en datos de streaming
4. Almacena datos crudos y agregados en Delta Lake
5. Detecta anomalías usando métodos estadísticos
6. Monitorea la salud del pipeline con métricas personalizadas
7. Maneja datos tardíos con watermarks

## Arquitectura

```
Dispositivos IoT / Apps Web
    |
    v
Kafka (topic events)
    |
    v
Structured Streaming
    |-- Agregaciones por ventana (tumbling de 5 min)
    |-- Inferencia ML (modelo de detección de fraude)
    |-- Detección de anomalías (umbrales estadísticos)
    |-- Almacenamiento de eventos crudos (Delta Lake)
    |
    v
Tablas Delta Lake
    |-- raw_events
    |-- agg_events
    |-- predictions
    |-- anomalies
    |
    v
Consumo (BI, dashboards, alertas)
```

## Configuración

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

## Paso 1: Generar Datos de Streaming Sintéticos

```python
import random
from datetime import datetime, timedelta
import time

def generate_events(num_events=1000):
    """Generar eventos sintéticos de streaming para pruebas."""
    
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

# Escribir datos de prueba como archivos JSON (simulando streaming)
import os
os.makedirs("data/streaming_input", exist_ok=True)

for batch in range(5):
    batch_data = generate_events(200)
    batch_file = f"data/streaming_input/batch_{batch}.json"
    
    with open(batch_file, "w") as f:
        for event in batch_data:
            f.write(json.dumps(event) + "\n")
    
    print(f"Escrito {batch_file}: {len(batch_data)} eventos")
    time.sleep(1)  # Simular retraso entre lotes
```

## Paso 2: Definir Esquema y Leer Stream

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

# Leer datos de streaming desde directorio
raw_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .json("data/streaming_input/")

# Analizar timestamp
parsed_stream = raw_stream \
    .withColumn("event_time", to_timestamp(col("timestamp"), "yyyy-MM-dd HH:mm:ss.SSS")) \
    .withColumn("processing_time", current_timestamp()) \
    .drop("timestamp")

# Cache de checkpoint
parsed_stream.printSchema()
```

> [!SUCCESS]
> Usar una fuente de archivos para pruebas simplifica el desarrollo. En producción, reemplázala con Kafka: `spark.readStream.format("kafka").option("subscribe", "events")`.

## Paso 3: Entrenar Modelo ML (Precomputado)

```python
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.classification import LogisticRegression
from pyspark.ml import Pipeline

# Entrenar un modelo simple de detección de fraude
training_data = spark.createDataFrame([
    ("purchase", 500.0, 0), ("purchase", 25.0, 0), ("purchase", 450.0, 1),
    ("click", 0.0, 0), ("login", 0.0, 0), ("purchase", 300.0, 0),
    ("purchase", 475.0, 1), ("add_to_cart", 0.0, 0), ("purchase", 50.0, 0),
    ("purchase", 490.0, 1), ("purchase", 100.0, 0), ("purchase", 480.0, 1)
], ["event_type", "amount", "is_fraud"])

# Ingeniería de características
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

# Guardar modelo
fraud_model.write().overwrite().save("models/fraud_detection")
print("Modelo de detección de fraude entrenado y guardado.")
```

> [!NOTE]
> En un despliegue real, reentrena el modelo periódicamente con trabajos por lotes y usa el pipeline de streaming solo para inferencia. Carga la versión más reciente del modelo desde un registro de modelos.

## Paso 4: Pipeline de Inferencia en Streaming

```python
from pyspark.ml import PipelineModel

# Cargar modelo pre-entrenado
loaded_model = PipelineModel.load("models/fraud_detection")

# Aplicar modelo a datos de streaming
features_for_ml = parsed_stream \
    .filter(col("event_type") == "purchase") \
    .withColumn("amount", col("amount").cast("double"))

predictions = loaded_model.transform(features_for_ml)

# Seleccionar columnas relevantes
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

## Paso 5: Agregaciones en Tiempo Real con Ventanas

```python
# Agregaciones por ventana
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

# Estadísticas móviles de usuario
user_window = Window.partitionBy("user_id") \
    .orderBy(col("event_time")) \
    .rowsBetween(-100, Window.currentRow)

rolling_stats = parsed_stream \
    .withColumn("user_event_count", count("*").over(user_window)) \
    .withColumn("user_total_amount", sum("amount").over(user_window))
```

## Paso 6: Detección de Anomalías

```python
# Detección estadística de anomalías
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

## Paso 7: Escribir a Sumideros Delta Lake

```python
# Sumidero de datos crudos
raw_query = parsed_stream.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/raw_events") \
    .table("raw_events")

# Sumidero de agregaciones
agg_query = windowed_aggs.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/agg_events") \
    .table("agg_events")

# Sumidero de predicciones ML
ml_query = ml_results.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/predictions") \
    .table("predictions")

# Sumidero de alertas de anomalías
anomaly_query = anomaly_check.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/anomalies") \
    .table("anomalies")

# Salida a consola para monitoreo
console_query = ml_results.writeStream \
    .format("console") \
    .outputMode("append") \
    .option("truncate", "false") \
    .queryName("fraud_alerts") \
    .start()
```

## Paso 8: Monitoreo y Observabilidad

```python
# Acumuladores personalizados de monitoreo
events_processed = sc.accumulator(0)
fraud_detected = sc.accumulator(0)
anomalies_detected = sc.accumulator(0)

def monitor_stream(query, name):
    """Monitorear el progreso de la consulta de streaming."""
    
    def report():
        progress = query.lastProgress
        if progress:
            print(f"[{name}] Filas: {progress.get('numInputRows', 0)}, "
                  f"Tasa: {progress.get('inputRowsPerSecond', 0):.1f}/s, "
                  f"Duración del lote: {progress.get('durationMs', {}).get('triggerExecution', 0)}ms")
    
    return report

# Registrar monitor de progreso
import threading

def monitoring_loop(interval=5):
    while True:
        for q in spark.streams.active:
            if q.lastProgress:
                p = q.lastProgress
                print(f"[{q.name}] Filas: {p.get('numInputRows', 0)}, "
                      f"Tasa: {p.get('inputRowsPerSecond', 0):.1f}/s")
        time.sleep(interval)

monitor_thread = threading.Thread(target=monitoring_loop, daemon=True)
monitor_thread.start()
```

## Paso 9: Consultar Resultados

```python
# Consultar tablas Delta (en otra sesión o después del streaming)
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
    print(f"  Estado: {status['message']}")
```

## Paso 10: Limpieza y Script Final

```python
# Script completo del pipeline
class RealTimeAnalyticsPipeline:
    def __init__(self, spark):
        self.spark = spark
        self.queries = []
    
    def build_pipeline(self):
        schema = self._define_schema()
        stream = self._read_stream(schema)
        parsed = self._parse_timestamp(stream)
        model = self._load_model()
        
        # Flujos paralelos
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

# Ejecutar el pipeline
pipeline = RealTimeAnalyticsPipeline(spark)
pipeline.build_pipeline().start()

try:
    pipeline.await_termination()
except KeyboardInterrupt:
    print("Apagando...")
    pipeline.stop()
```

## Preguntas de Negocio

Responde estas usando los resultados de tu pipeline:

1. ¿Cuál es la probabilidad promedio de fraude por categoría?
2. ¿Qué usuarios muestran patrones de comportamiento anómalos?
3. ¿Cómo varían los conteos de eventos a través de ventanas de 5 minutos?
4. ¿Cuál es la tasa pico de eventos por minuto?
5. ¿Qué tipo de dispositivo tiene la tasa de fraude más alta?
6. ¿Cuál es la proporción de compras frente a otros eventos?
7. ¿Cuántas anomalías únicas se detectaron?
8. ¿Cuál es la latencia promedio de procesamiento?
9. ¿Qué horas tienen los volúmenes de transacción más altos?
10. ¿Cuál es la distribución de las puntuaciones de anomalía?

## Preguntas de Práctica

1. ¿Cómo aplica el pipeline de streaming la inferencia ML a cada lote?
2. ¿Cómo trabajan juntos los watermarks y las ventanas en este pipeline?
3. ¿Por qué las agregaciones se escriben con modo `append`?
4. ¿Cómo añadirías más características al modelo de detección de fraude?
5. ¿Cómo monitoreas la salud de las consultas de streaming en producción?
6. ¿Cuál es el propósito del sumidero `foreachBatch` en este pipeline?
7. ¿Cómo manejarías el reentrenamiento del modelo sin tiempo de inactividad?
8. ¿Qué características de Delta Lake garantizan semántica exactly-once?
9. ¿Cómo escalarías este pipeline para 10x más datos?
10. ¿Cómo implementas alertas cuando la probabilidad de fraude supera un umbral?
