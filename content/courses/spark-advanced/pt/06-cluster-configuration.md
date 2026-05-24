---
title: "Configuração de Cluster"
description: "Configure clusters Spark: spark.sql.shuffle.partitions, spark.executor.memory, alocação dinâmica e otimização de recursos"
order: 6
duration: "35-45 minutos"
difficulty: "avançado"
---

# Configuração de Cluster

A configuração adequada do Spark é essencial para desempenho, estabilidade e eficiência de custos. Esta lição cobre os parâmetros de configuração mais críticos e como ajustá-los.

## Prioridade de Configuração

A configuração do Spark segue uma hierarquia:

| Prioridade | Fonte | Substitui |
|---|---|---|
| 1 (Mais alta) | `spark-submit --conf` | Tudo abaixo |
| 2 | `SparkSession.conf.set()` | Padrões do arquivo |
| 3 | `spark-defaults.conf` | Padrões hardcoded |
| 4 (Mais baixa) | Padrões hardcoded | — |

## Configuração Principal de Recursos

### Recursos do Executor

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("OptimizedApp") \
    .config("spark.executor.memory", "8g") \
    .config("spark.executor.cores", "4") \
    .config("spark.executor.instances", "10") \
    .config("spark.driver.memory", "4g") \
    .getOrCreate()
```

### Fórmula de Cálculo de Recursos

```
Total de cores = executor.instances × executor.cores
Total de memória = executor.instances × executor.memory

Exemplo:
  10 executores × 4 cores = 40 cores
  10 executores × 8g = 80g de memória total
  Sobrecarga: 8g × 0.1 = 0.8g por executor (spark.executor.memoryOverhead)
```

> [!NOTE]
> Deixe 1-2 cores por nó para SO e serviços Hadoop. Para YARN, a sobrecarga do contêiner reduz a memória disponível. Defina `spark.executor.memoryOverhead` como 10-15% da memória do executor para sobrecarga JVM.

### Detalhamento de Memória

```python
# Alocação de memória padrão dentro de um executor
# spark.executor.memory = 8g
# spark.memory.fraction = 0.6 (60% para execução + armazenamento)
# spark.memory.storageFraction = 0.5 (50% do unificado para armazenamento)
#
# Execução: 8g × 0.6 × 0.5 = 2.4g
# Armazenamento: 8g × 0.6 × 0.5 = 2.4g  (pode pegar emprestado da execução)
# Reservado: 8g × 0.4 = 3.2g (código do usuário, sobrecarga)
```

## Configuração de Shuffle

```python
# Partições de shuffle
spark.conf.set("spark.sql.shuffle.partitions", "200")

# Regra geral: 2-4 partições por core
# 40 cores × 3 = 120 partições

# Buffer de memória de shuffle
spark.conf.set("spark.shuffle.file.buffer", "64k")
spark.conf.set("spark.reducer.maxSizeInFlight", "96m")

# Compressão de shuffle
spark.conf.set("spark.shuffle.compress", "true")
spark.conf.set("spark.shuffle.spill.compress", "true")
spark.conf.set("spark.io.compression.codec", "snappy")
```

| Parâmetro de Shuffle | Padrão | Descrição |
|---|---|---|
| `spark.sql.shuffle.partitions` | 200 | Partições após o shuffle |
| `spark.shuffle.file.buffer` | 32k | Tamanho do buffer para escritas shuffle |
| `spark.reducer.maxSizeInFlight` | 48m | Tamanho máximo da saída do mapa por redutor |
| `spark.shuffle.compress` | true | Comprimir saída de shuffle |
| `spark.shuffle.spill.compress` | true | Comprimir dados derramados |

## Alocação Dinâmica

A alocação dinâmica ajusta o número de executores com base na carga de trabalho.

```python
# Habilitar alocação dinâmica
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.minExecutors", "2")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "50")
spark.conf.set("spark.dynamicAllocation.initialExecutors", "5")
spark.conf.set("spark.dynamicAllocation.executorIdleTimeout", "60s")
spark.conf.set("spark.dynamicAllocation.cachedExecutorIdleTimeout", "120s")

# Com rastreamento de shuffle (mantém executores durante shuffles)
spark.conf.set("spark.dynamicAllocation.shuffleTracking.enabled", "true")
```

> [!SUCCESS]
> A alocação dinâmica é essencial para clusters multi-inquilino. Ela escala automaticamente para baixo quando a demanda é baixa e para cima durante cargas de pico, melhorando a utilização do cluster.

### Quando Usar Alocação Dinâmica

| Cenário | Recomendado |
|---|---|
| Cluster YARN multi-inquilino | Sim |
| Cluster dedicado | Talvez (alocação fixa mais simples) |
| Cargas de trabalho de streaming | Talvez (considere fixo para latência previsível) |
| Kubernetes | Sim (autoescalonamento) |
| Consultas ad-hoc curtas | Sim |

## Execução Adaptativa de Consultas (AQE)

```python
# Habilitar AQE (padrão no Spark 3.x)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Coalescência dinâmica de partições
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitions", "10")
spark.conf.set("spark.sql.adaptive.coalescePartitions.maxPartitions", "500")
spark.conf.set("spark.sql.adaptive.coalescePartitions.parallelismFirst", "true")

# Otimização de join skew
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")

# Troca dinâmica de join (broadcast vs sort-merge)
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
```

## Serialização e Compressão

```python
# Serialização Kryo (mais rápida que serialização Java)
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "256m")
spark.conf.set("spark.kryo.registrationRequired", "false")

# Registrar classes personalizadas para Kryo
spark.conf.set("spark.kryo.classesToRegister", 
    "com.example.MyClass,com.example.AnotherClass")

# Compressão RDD
spark.conf.set("spark.rdd.compress", "true")

# Compressão de broadcast
spark.conf.set("spark.broadcast.compress", "true")
```

## Rede e E/S

```python
# Timeouts de rede
spark.conf.set("spark.network.timeout", "600s")
spark.conf.set("spark.executor.heartbeatInterval", "30s")
spark.conf.set("spark.sql.broadcastTimeout", "600")

# Tamanho máximo de resultado
spark.conf.set("spark.driver.maxResultSize", "4g")

# Otimizações de E/S
spark.conf.set("spark.hadoop.parquet.enable.summary-metadata", "false")
spark.conf.set("spark.sql.parquet.mergeSchema", "false")
spark.conf.set("spark.sql.parquet.filterPushdown", "true")
```

## Tarefas e Paralelismo

```python
# Configuração de tarefas
spark.conf.set("spark.task.maxFailures", "8")
spark.conf.set("spark.speculation", "true")
spark.conf.set("spark.speculation.interval", "100ms")
spark.conf.set("spark.speculation.multiplier", "1.5")

# Paralelismo padrão
# spark.default.parallelism = max(2, total_cores)
# spark.sql.shuffle.partitions = 200 
```

## Configurações Comuns por Caso de Uso

### ETL em Lote

```python
spark.conf.set("spark.executor.memory", "4g")
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.sql.shuffle.partitions", "200")
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.dynamicAllocation.enabled", "true")
```

### Machine Learning

```python
spark.conf.set("spark.executor.memory", "16g")  # Mais memória para ML
spark.conf.set("spark.executor.cores", "4")
spark.conf.set("spark.sql.shuffle.partitions", "100")
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "256m")
```

### Streaming

```python
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.executor.cores", "3")
spark.conf.set("spark.sql.shuffle.partitions", "10")  # Menos partições
spark.conf.set("spark.streaming.backpressure.enabled", "true")
spark.conf.set("spark.streaming.kafka.maxRatePerPartition", "1000")
```

### Interativo/Ad-hoc

```python
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.sql.shuffle.partitions", "50")
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "20")
```

## Exemplos de CLI de Configuração

```bash
# spark-submit com configuração
spark-submit \
  --class com.example.Main \
  --master yarn \
  --deploy-mode cluster \
  --num-executors 20 \
  --executor-memory 8g \
  --executor-cores 4 \
  --driver-memory 4g \
  --conf spark.sql.shuffle.partitions=200 \
  --conf spark.sql.adaptive.enabled=true \
  --conf spark.dynamicAllocation.enabled=true \
  --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
  app.jar
```

## Perguntas de Prática

1. Qual é a fórmula para calcular os recursos totais do cluster?
2. Como `spark.memory.fraction` divide a memória do executor?
3. Quando você deve habilitar a alocação dinâmica?
4. Qual é o valor recomendado para `spark.sql.shuffle.partitions`?
5. Como o AQE melhora a distribuição de partições de shuffle?
6. Qual é a vantagem da serialização Kryo sobre a serialização Java?
7. Como a especulação ajuda com tarefas lentas?
8. Que mudanças de configuração você faria para uma carga de trabalho de streaming vs lote?
9. Por que `spark.sql.shuffle.partitions` é definido mais baixo para streaming?
10. Como você configura o Spark para uma carga de trabalho ML intensiva em memória?
