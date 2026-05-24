---
title: "Operações de Janela e Watermarking"
description: "Domine janelas tumbling e sliding, watermarking, tratamento de dados tardios e modos de saída para agregações em streaming"
order: 2
duration: "35-45 minutos"
difficulty: "avançado"
---

# Operações de Janela e Watermarking

As operações de janela são a base da análise em streaming. Combinadas com watermarking, permitem um tratamento robusto de dados que chegam tarde enquanto mantêm resultados corretos.

## Janelas Tumbling

Janelas de tamanho fixo e não sobrepostas.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import window, col, count, sum, avg
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType

spark = SparkSession.builder \
    .appName("WindowOperations") \
    .master("local[*]") \
    .getOrCreate()

schema = StructType([
    StructField("user_id", StringType()),
    StructField("event", StringType()),
    StructField("amount", IntegerType()),
    StructField("event_time", TimestampType())
])

# Janela tumbling (5 minutos)
tumbling = stream_df \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event")
    ) \
    .agg(
        count("*").alias("count"),
        sum("amount").alias("total_amount")
    )

tumbling.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()
```

```
Saída de janela (tumbling, 5 min):
+--------------------+--------+-----+------------+
|                 window|    event|count|total_amount|
+--------------------+--------+-----+------------+
|{2024-01-01 12:00, 12:05}|   click|  150|       12000|
|{2024-01-01 12:00, 12:05}| purchase|   20|        8000|
|{2024-01-01 12:05, 12:10}|   click|  200|       16000|
+--------------------+--------+-----+------------+
```

> [!SUCCESS]
> Janelas tumbling são a agregação em streaming mais simples. Cada evento pertence exatamente a uma janela. Use-as para métricas periódicas (ex., "requisições por 5 minutos").

## Janelas Sliding

Janelas sobrepostas com um intervalo de deslizamento.

```python
# Janela sliding (15 minutos, deslizando a cada 5 minutos)
sliding = stream_df \
    .groupBy(
        window(col("event_time"), "15 minutes", "5 minutes"),
        col("event")
    ) \
    .agg(count("*").alias("count"))

sliding.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

```
Saída de janela (sliding, 15 min janela, 5 min deslizamento):
+--------------------+--------+-----+
|                 window|    event|count|
+--------------------+--------+-----+
|{2024-01-01 12:00, 12:15}|   click|  450|
|{2024-01-01 12:05, 12:20}|   click|  520|
|{2024-01-01 12:10, 12:25}|   click|  480|
+--------------------+--------+-----+
```

> [!NOTE]
> Janelas sliding criam janelas sobrepostas. Eventos pertencentes a múltiplas janelas são incluídos em cada uma. O número de janelas = duração_janela / intervalo_deslizamento. Use janelas sliding para suavização (ex., "média móvel sobre 30 minutos").

### Tumbling vs Sliding

| Aspecto | Tumbling | Sliding |
|---|---|---|
| **Sobreposição** | Nenhuma | Sim |
| **Linhas de saída por evento** | 1 | duração_janela / intervalo_deslizamento |
| **Caso de uso** | Instantâneos periódicos | Médias móveis |
| **Complexidade** | Menor | Maior |
| **Tamanho do estado** | Menor | Maior |

## Watermarking

Watermarks definem quanto tempo os dados podem chegar atrasados e ainda serem incluídos nos resultados.

```python
# Watermark: 10 minutos de dados atrasados permitidos
with_watermark = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event")
    ) \
    .agg(count("*").alias("count"))

with_watermark.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### Como Funcionam os Watermarks

```
Progressão do Tempo do Evento:

12:00  12:05  12:10  12:15  12:20  12:25  12:30
  |------|------|------|------|------|------|
  W1     W2     W3     W4     W5     W6

Tempo de processamento atual: 12:35
Watermark: 12:25 (10 minutos atrás)

Eventos com tempo 12:26 chegam: incluídos em W5 (ainda aberta)
Eventos com tempo 12:24 chegam: incluídos em W4 (ainda aberta)
Eventos com tempo 12:15 chegam: DESCARTADOS (antes do watermark)
```

> [!WARNING]
> Uma vez que um watermark passa o tempo de término de uma janela, essa janela é finalizada e seus resultados são emitidos. Eventos atrasados que chegam após o watermark são descartados. Defina o limiar do watermark cuidadosamente com base no atraso típico dos seus dados.

### Escolhendo a Duração do Watermark

```python
# Agressivo (menor latência, mais dados atrasados descartados)
df.withWatermark("event_time", "2 minutes")

# Conservador (maior latência, menos registros descartados)
df.withWatermark("event_time", "1 hour")

# Baseado em análise de dados
def estimate_watermark_delay(spark, source_path, percentile=0.99):
    """Analisar dados históricos para determinar o atraso do watermark."""
    df = spark.read.parquet(source_path)
    
    delay_stats = df \
        .withColumn("processing_delay", 
            col("processing_time").cast("long") - col("event_time").cast("long")) \
        .selectExpr(f"percentile(processing_delay, {percentile}) / 60 as p99_delay_minutes")
    
    return delay_stats.collect()[0]["p99_delay_minutes"]
```

## Estratégias de Tratamento de Dados Tardios

### Estratégia 1: Watermark com Modo Update

```python
# Dados tardios atualizam a janela até o watermark passar
query = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(window(col("event_time"), "5 minutes")) \
    .agg(count("*").alias("count")) \
    .writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### Estratégia 2: Fila Separada de Dados Tardios

```python
# Roteir dados tardios para um fluxo separado para reprocessamento
from pyspark.sql.functions import current_timestamp, expr

late_data = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .filter(expr("event_time < current_timestamp() - interval 15 minutes"))

late_data.writeStream \
    .format("parquet") \
    .option("path", "data/late_events/") \
    .outputMode("append") \
    .start()
```

### Estratégia 3: Reprocessar com Janela Mais Ampla Periodicamente

```python
def reprocess_late_data(spark):
    """Trabalho em lote diário para reprocessar dados recentes com uma janela mais ampla."""
    
    df = spark.read.parquet("data/raw_events/") \
        .filter(col("event_date") >= date.today() - timedelta(days=3))
    
    result = df \
        .withWatermark("event_time", "2 hours") \
        .groupBy(window(col("event_time"), "5 minutes")) \
        .agg(count("*").alias("corrected_count"))
    
    result.write.mode("overwrite").parquet("data/corrected/")
```

## Comportamento do Modo de Saída com Janelas

| Modo de Saída | Com Watermark | Sem Watermark |
|---|---|---|
| **Append** | Apenas resultados finais (após o watermark) | Não suportado |
| **Complete** | Resultado completo a cada trigger | Resultado completo a cada trigger (estado cresce ilimitado) |
| **Update** | Apenas resultados atualizados | Não suportado |

> [!NOTE]
> Sem um watermark, o modo `complete` acumula todo o estado da janela indefinidamente, o que eventualmente causará erros OOM. Sempre use watermarks com agregações em streaming.

## Múltiplas Agregações de Janela

```python
# Múltiplos tamanhos de janela em uma consulta
multi_window = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes").alias("window_5m"),
        window(col("event_time"), "15 minutes").alias("window_15m"),
        window(col("event_time"), "1 hour").alias("window_1h"),
        col("event_type")
    ) \
    .agg(count("*").alias("count"))

multi_window.writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", "false") \
    .start()
```

## Perguntas de Prática

1. Qual é a diferença entre janelas tumbling e sliding?
2. Como um watermark evita o crescimento ilimitado do estado?
3. O que acontece com eventos que chegam após o watermark?
4. Qual é a relação entre o intervalo de deslizamento e a duração da janela em janelas sliding?
5. Por que o modo `append` só é suportado com watermarks para agregações?
6. Como você escolhe a duração correta do watermark?
7. O que acontece se você usar o modo `complete` sem um watermark?
8. Como você lida com dados que chegam atrasados e devem atualizar resultados já emitidos?
9. Quais modos de saída funcionam melhor para agregações de janelas tumbling?
10. Como você calcula uma média móvel de 7 dias em streaming?
