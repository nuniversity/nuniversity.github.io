---
title: "Monitoramento e Depuração"
description: "Use a UI do Spark, servidor de histórico, análise de logs, métricas e estratégias de depuração para diagnosticar e corrigir problemas do Spark"
order: 9
duration: "35-45 minutos"
difficulty: "avançado"
---

# Monitoramento e Depuração

Mesmo aplicações Spark bem ajustadas encontram problemas. Esta lição cobre ferramentas de monitoramento, estratégias de depuração e técnicas de diagnóstico para identificar e resolver problemas de desempenho e erros.

## UI do Spark

A UI do Spark é a ferramenta principal para monitorar aplicações em execução e concluídas. Acesse-a em `http://<driver>:4040`.

### Visão Geral das Abas da UI

| Aba | Informação | Como Usar |
|---|---|---|
| **Jobs** | DAG em nível de job, status, duração | Identificar jobs lentos |
| **Stages** | Detalhes de estágio, leitura/escrita shuffle, spill | Encontrar skew de dados, spills |
| **Storage** | RDDs/DataFrames em cache | Verificar se o cache está funcionando |
| **Environment** | Valores de configuração | Verificar configuração efetiva |
| **Executors** | Métricas por executor | Identificar executores com falha |
| **SQL** | Planos de consultas SQL | Otimizar consultas |

```python
# Habilitar log de eventos para o servidor de histórico
spark.conf.set("spark.eventLog.enabled", "true")
spark.conf.set("spark.eventLog.dir", "hdfs://namenode:9000/spark-logs/")
```

### Leitura da Página de Stages

Métricas chave nos detalhes de Stage:

```
- Duration: Tempo por tarefa
- Shuffle Read/Write: Dados embaralhados
- Spill (Memory): Dados derramados para memória (aceitável)
- Spill (Disk): Dados derramados para disco (ruim — risco OOM)
- Shuffle Read Size/Records: Procurar skew (>10x média)
- GC Time: Tempo gasto em coleta de lixo
```

> [!NOTE]
> Spill para disco é o indicador mais forte de memória insuficiente. Se você vir qualquer spill para disco, aumente a memória do executor ou reduza o tamanho da partição.

### Usando a Aba SQL

```python
# Ver plano de consulta SQL
spark.sql("SELECT * FROM large_table JOIN small_table ON key").explain(True)

# Habilitar métricas SQL
spark.conf.set("spark.sql.ui.retainedExecutions", "50")
```

## Servidor de Histórico

O Servidor de Histórico persiste os dados da UI do Spark após a aplicação terminar.

```bash
# Iniciar o servidor de histórico
./sbin/start-history-server.sh

# Acessar em http://<host>:18080
```

```python
# Escrever logs de eventos para o servidor de histórico
spark.conf.set("spark.eventLog.enabled", "true")
spark.conf.set("spark.eventLog.dir", "file:///tmp/spark-logs/")
spark.conf.set("spark.history.fs.logDirectory", "file:///tmp/spark-logs/")
```

## Análise de Logs

### Configuração de Níveis de Log

```python
# Reduzir verbosidade de logs do Spark
from pyspark import SparkContext
sc = spark.sparkContext
sc.setLogLevel("WARN")

# Níveis: ALL < DEBUG < INFO < WARN < ERROR < FATAL < OFF

# Habilitar logs do driver
# Em log4j.properties:
# log4j.logger.org.apache.spark=INFO
# log4j.logger.org.apache.hadoop=WARN
```

### Captura de Logs do Executor

```bash
# Em spark-submit:
--conf spark.executor.extraJavaOptions=-Dlog4j.configuration=file:log4j.properties

# Logs YARN
yarn logs -applicationId application_123456789_0001
```

## Métricas e Monitoramento

### Métricas Incorporadas

```python
# Habilitar métricas
# conf/metrics.properties
# *.sink.servlet.class=org.apache.spark.metrics.sink.MetricsServlet
# *.source.jvm.class=org.apache.spark.metrics.source.JvmSource
```

### Métricas Personalizadas de Streaming

```python
from pyspark.sql.functions import col, count, sum, window, current_timestamp

# Rastrear progresso de streaming
streaming_query = streaming_df.writeStream \
    .format("console") \
    .queryName("metrics_stream") \
    .trigger(processingTime="10 seconds") \
    .start()

# Consultar progresso
import json
last_progress = streaming_query.lastProgress
if last_progress:
    print(f"Linhas processadas: {last_progress['numInputRows']}")
    print(f"Linhas de entrada por segundo: {last_progress['inputRowsPerSecond']}")
    print(f"Taxa de processamento: {last_progress['processedRowsPerSecond']}")

# Listar fluxos ativos
for q in spark.streams.active:
    status = q.status
    print(f"Stream {q.name}: {status['message']}")
```

### Acumuladores para Monitoramento Personalizado

```python
# Métricas personalizadas com acumuladores
rows_processed = sc.accumulator(0)
errors_found = sc.accumulator(0)
bytes_processed = sc.accumulator(0.0)

def monitor_row(row):
    rows_processed.add(1)
    if row.get("status", 200) >= 400:
        errors_found.add(1)
    return row

# Após a ação
print(f"Linhas: {rows_processed.value}, Erros: {errors_found.value}")
```

## Erros Comuns e Soluções

### OutOfMemoryError

```
java.lang.OutOfMemoryError: Java heap space
```

```python
# Soluções:
# 1. Aumentar memória do executor
spark.conf.set("spark.executor.memory", "8g")

# 2. Aumentar sobrecarga
spark.conf.set("spark.executor.memoryOverhead", "1g")

# 3. Reduzir tamanho da partição
spark.conf.set("spark.sql.shuffle.partitions", "200")

# 4. Reduzir dados por tarefa
df.repartition(100)

# 5. Usar DISK_ONLY para caches grandes
df.persist(StorageLevel.DISK_ONLY)

# 6. Habilitar memória fora do heap
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")
```

### Skew de Dados

Tarefas que demoram significativamente mais que outras:

```python
# Identificar skew
def check_skew(df, key_col):
    """Identificar chaves skew."""
    stats = df.groupBy(key_col).agg(
        count("*").alias("count")
    ).orderBy(col("count").desc())
    
    stats.show(10)
    top = stats.first()
    print(f"Chave principal: {top[key_col]} com {top['count']} linhas")

# Soluções:
# 1. Salting (adicionar sufixo aleatório a chaves skew)
# 2. Habilitar AQE skew join (Spark 3.x)
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# 3. Aumentar partições
spark.conf.set("spark.sql.shuffle.partitions", "200")
```

### Problemas de Shuffle

```python
# Erros de shuffle
# ERROR: ExecutorLostFailure
# ERROR: java.io.FileNotFoundException

# Soluções:
# 1. Aumentar buffer de shuffle
spark.conf.set("spark.shuffle.file.buffer", "64k")
spark.conf.set("spark.reducer.maxSizeInFlight", "96m")

# 2. Habilitar rastreamento de shuffle
spark.conf.set("spark.dynamicAllocation.shuffleTracking.enabled", "true")

# 3. Aumentar timeout de rede
spark.conf.set("spark.network.timeout", "800s")
```

### Erros de Serialização

```
org.apache.spark.SparkException: Task not serializable
```

```python
# Soluções:
# 1. Tornar classes Serializable
class MyClass:
    def __init__(self):
        self.data = []
    def __getstate__(self):
        return self.__dict__
    def __setstate__(self, state):
        self.__dict__ = state

# 2. Usar serialização Kryo
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

# 3. Definir funções no nível do módulo (não dentro de classes)
def my_function(x):
    return x * 2

# 4. Transmitir objetos grandes
broadcast_data = sc.broadcast(large_dictionary)
```

## Lista de Verificação de Depuração

```
P: O job está em execução?
  |-- SIM -> Ir para a UI do Spark
  |-- NÃO -> Verificar logs de erro
  
P: Tarefas lentas?
  |-- Skew de dados? -> Salting ou aumentar partições
  |-- Spilling para disco? -> Aumentar memória
  |-- Sobrecarga de GC? -> Ajustar GC ou usar fora do heap
  
P: O job está falhando?
  |-- OOM? -> Aumentar memória, reduzir tamanho da partição
  |-- Timeout de conexão? -> Aumentar timeout de rede
  |-- Erro de serialização? -> Verificar serializabilidade de classes
  |-- Arquivo não encontrado? -> Verificar caminhos, usar hadoop fs -ls
  
P: Resultados incorretos?
  |-- Verificar condições de join
  |-- Verificar tratamento de nulos
  |-- Verificar tipos de dados
  |-- Revisar UDFs para correção
```

## Perfilamento de Desempenho

```python
# Perfilar uma transformação DataFrame
import time

def time_transform(df, transform_fn, name="transform"):
    start = time.time()
    result = transform_fn(df)
    result.count()  # Forçar ação
    duration = time.time() - start
    print(f"{name}: {duration:.2f}s")
    return result, duration

# Comparar abordagens
result1, t1 = time_transform(df, lambda d: d.groupBy("key").agg(sum("value")))
result2, t2 = time_transform(df, lambda d: d.groupBy("key").sum("value"))
print(f"Speedup: {t1/t2:.1f}x")

# Perfilamento de memória
def profile_storage(df, action="count"):
    """Perfil de armazenamento e memória."""
    initial = sc.getRDDStorageInfo()
    result = getattr(df, action)()
    final = sc.getRDDStorageInfo()
    
    for info in final:
        print(f"RDD: {info.name}")
        print(f"  Memória: {info.memSize / 1024**2:.0f} MB")
        print(f"  Disco: {info.diskSize / 1024**2:.0f} MB")
    
    return result
```

## Perguntas de Prática

1. Que informação cada aba da UI do Spark fornece?
2. Como o Servidor de Histórico difere da UI do Spark ao vivo?
3. Quais métricas na página de Stage indicam problemas de desempenho?
4. Como você habilita o log de eventos para o Servidor de Histórico?
5. O que o spill para disco indica e como você o corrige?
6. Como você identifica e corrige o skew de dados?
7. O que causa "Task not serializable" e como você corrige?
8. Como você usa acumuladores para monitoramento personalizado?
9. Como você depuraria um job que funciona bem com dados pequenos mas falha com dados grandes?
10. Como você acessa e analisa os logs do executor?
