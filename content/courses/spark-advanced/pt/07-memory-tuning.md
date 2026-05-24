---
title: "Ajuste de Memória"
description: "Domine o gerenciamento de memória do Spark: memória de execução vs armazenamento, memória fora do heap, ajuste do coletor de lixo e otimização de spill"
order: 7
duration: "35-45 minutos"
difficulty: "avançado"
---

# Ajuste de Memória

A memória é o recurso mais crítico no Spark. Um mau gerenciamento de memória causa erros OOM, pausas excessivas do GC e spills para disco que degradam o desempenho. Esta lição cobre o modelo de memória do Spark e as estratégias de ajuste.

## Modelo de Memória do Spark

```
Memória do Executor (ex., 8g)
  |
  +-- Memória Reservada (300 MB) — sobrecarga do sistema
  |
  +-- Memória do Usuário (40%) — código do usuário, UDFs, estruturas de dados
  |   spark.memory.userFraction = 0.4
  |
  +-- Memória Spark (60%) — execução + armazenamento unificados
      spark.memory.fraction = 0.6
        |
        +-- Memória de Execução (50% da Memória Spark)
        |   spark.memory.storageFraction = 0.5
        |   (pode pegar emprestado do armazenamento se não usado)
        |
        +-- Memória de Armazenamento (50% da Memória Spark)
            (pode pegar emprestado da execução se não usado)
```

### Exemplo de Detalhamento de Memória

```python
# Para um executor de 8g:
# Reservada:     300 MB
# Usuário:       (8g - 300 MB) × 0.4 = ~3.1g
# Execução:     (8g - 300 MB) × 0.6 × 0.5 = ~2.3g
# Armazenamento: (8g - 300 MB) × 0.6 × 0.5 = ~2.3g
# 
# Execução pode expandir para 4.6g se o armazenamento estiver vazio
```

> [!NOTE]
> O modelo de memória unificada permite que execução e armazenamento peguem emprestado um do outro. A execução pode despejar blocos de armazenamento, mas o armazenamento não pode despejar blocos de execução. Isso prioriza o processamento sobre o cache.

## Memória de Execução

Usada para shuffle, joins, agregações e ordenação.

```python
# Configuração de memória de execução
spark.conf.set("spark.memory.fraction", "0.6")
spark.conf.set("spark.memory.storageFraction", "0.5")

# Configuração de spill
spark.conf.set("spark.shuffle.spill.compress", "true")
spark.conf.set("spark.shuffle.spill.initialMemoryThreshold", "5m")
spark.conf.set("spark.shuffle.spill.numElementsForceSpillThreshold", "10000000")
```

### Comportamento de Spill

Quando a memória de execução se esgota, o Spark derrama dados para o disco:

```python
from pyspark.sql.functions import col

# Esta operação pode fazer spill se a memória for insuficiente
large_df.groupBy("key").agg(sum("value")).show()

# Monitorar spills na UI do Spark:
# Stages > Stage ID > Shuffle Write/Read > Spill (disk)
# Alto spill = memória de execução insuficiente
```

> [!WARNING]
> Derramar para disco reduz drasticamente a velocidade dos trabalhos Spark. Se você vir spill significativo na UI do Spark, aumente a memória do executor ou reduza as partições de shuffle para que cada partição seja menor.

## Memória de Armazenamento

Usada para armazenar em cache RDDs, DataFrames e variáveis de broadcast.

```python
# Cache com diferentes níveis de armazenamento
from pyspark import StorageLevel

# Padrão: MEMORY_ONLY
df.cache()

# Memória e disco (derramar para disco se a memória estiver cheia)
df.persist(StorageLevel.MEMORY_AND_DISK)

# Apenas disco
df.persist(StorageLevel.DISK_ONLY)

# Serializado (menor pegada de memória)
df.persist(StorageLevel.MEMORY_ONLY_SER)

# Verificar status do cache
from pyspark.sql.functions import col

catalog = spark.catalog
print(f"Tabelas em cache: {catalog.listTables()}")
# Verificar tamanho do cache
df_cached = df.cache()
df_cached.count()  # Materializar cache
print(spark.sparkContext.getRDDStorageInfo())
```

### Estimativa do Tamanho do Cache

```python
# Estimar tamanho de cache para um DataFrame
def estimate_cache_size(df):
    """Amostrar linhas para estimar o tamanho completo do cache."""
    sample = df.sample(0.01, seed=42).cache()
    sample.count()
    
    # Obter tamanhos por partição
    sizes = sample.rdd.mapPartitions(
        lambda it: [sum(len(str(x).encode('utf-8')) for x in it)]
    ).collect()
    
    avg_partition_size = sum(sizes) / len(sizes)
    num_partitions = df.rdd.getNumPartitions()
    
    estimated_total = avg_partition_size * num_partitions
    return estimated_total

# Uso
est_size = estimate_cache_size(df)
print(f"Tamanho estimado do cache: {est_size / 1024**3:.2f} GB")
```

## Memória Fora do Heap

A memória fora do heap evita a coleta de lixo JVM.

```python
# Habilitar memória fora do heap
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")

# Tungsten usa memória fora do heap para:
# - Operações de shuffle
# - Armazenamento em cache de dados serializados
# - Buffers de ordenação e agregação
```

> [!SUCCESS]
> A memória fora do heap pode reduzir significativamente as pausas do GC para shuffles grandes ao manter dados fora do heap JVM. No entanto, a memória fora do heap deve ser contabilizada nas solicitações de memória do contêiner/YARN.

## Ajuste do Coletor de Lixo

Pausas do GC podem causar timeouts de executores e falhas de trabalhos.

### Monitoramento de GC

```python
# Adicionar registro de GC ao spark-submit
# --conf spark.executor.extraJavaOptions="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps"
```

```bash
spark-submit \
  --conf "spark.executor.extraJavaOptions=-XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=35 -XX:ConcGCThreads=4 -verbose:gc -XX:+PrintGCDetails" \
  --conf "spark.driver.extraJavaOptions=-XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=35" \
  app.py
```

### Estratégias de Ajuste de GC

```python
# Estratégia 1: Usar G1GC (padrão no Java 8u45+)
# -XX:+UseG1GC
# -XX:InitiatingHeapOccupancyPercent=35 (iniciar GC mais cedo)
# -XX:ConcGCThreads=4 (threads GC paralelos)

# Estratégia 2: Aumentar NewRatio para trabalhos com muito shuffle
# -XX:NewRatio=3 (geração antiga maior para dados em cache)

# Estratégia 3: Reduzir pressão do GC armazenando em cache serializado
df.persist(StorageLevel.MEMORY_ONLY_SER)
```

| Estratégia de GC | Melhor Para |
|---|---|
| **G1GC** | Propósito geral, heaps grandes (>4g) |
| **Parallel GC** | Orientado a throughput, heaps médios |
| **CMS** | Baixa latência (obsoleto no Java 14) |
| **ZGC** | Heaps muito grandes (>100g), baixa latência |

## Prevenção de Out of Memory (OOM)

```python
# Ajustar memória para evitar OOM

# 1. Aumentar memória
spark.conf.set("spark.executor.memory", "16g")
spark.conf.set("spark.executor.memoryOverhead", "2g")  # Sobrecarga fora do heap

# 2. Reduzir dados por partição
spark.conf.set("spark.sql.shuffle.partitions", "400")  # Mais partições = menos dados cada

# 3. Habilitar spill
spark.conf.set("spark.shuffle.spill.compress", "true")

# 4. Usar broadcast para tabelas pequenas
from pyspark.sql.functions import broadcast
df_large.join(broadcast(df_small), "key")

# 5. Cachear com julgamento — apenas quando reutilizado
# Não cachear tudo

# 6. Reduzir tamanho do lote para UDFs
spark.conf.set("spark.sql.execution.arrow.maxRecordsPerBatch", "5000")
```

## Perfilamento de Memória

```python
from pyspark.sql.functions import col, size

# Encontrar colunas pesadas em memória
def profile_memory_usage(df):
    """Identificar colunas que consomem mais memória."""
    
    shape = len(df.columns)
    estimated_bytes = {
        "string": 40,    # Sobrecarga por campo string
        "integer": 4,
        "long": 8,
        "double": 8,
        "array": 16
    }
    
    for field in df.schema.fields:
        col_name = field.name
        dtype = str(field.dataType).lower()
        
        sample = df.select(col(col_name)).limit(1000).collect()
        total_bytes = sum(len(str(row[0]).encode('utf-8')) for row in sample)
        avg_bytes = total_bytes / len(sample)
        
        print(f"{col_name}: {dtype}, avg {avg_bytes:.0f} bytes/linha")

# Verificar tamanhos de partição
def check_partition_sizes(df):
    """Verificar distribuição de dados entre partições."""
    sizes = df.rdd.mapPartitions(
        lambda it: [sum(len(str(x).encode('utf-8')) for x in it)]
    ).collect()
    
    print(f"Tamanhos de partição: min={min(sizes)}, max={max(sizes)}, "
          f"avg={sum(sizes)/len(sizes):.0f}")
    print(f"Skew: max/avg = {max(sizes) / (sum(sizes)/len(sizes)):.1f}x")
```

## Árvore de Decisão de Ajuste de Memória

```
O trabalho tem OOM ou spill?
  |
  +-- Sim: Aumentar memória do executor? 
  |   |  
  |   +-- Sim, disponível: Aumentar memória
  |   |
  |   +-- Não (no limite): 
  |       +-- Muito shuffle? Aumentar partições
  |       +-- Muito cache? Usar MEMORY_AND_DISK ou MEMORY_ONLY_SER
  |       +-- Muitas UDFs? Reduzir tamanho do lote, otimizar UDF
  |
  +-- Não, mas GC lento:
      +-- Usar G1GC
      +-- Reduzir cache
      +-- Usar memória fora do heap

O tempo de GC excede 10% do tempo de execução?
  +-- Sim: Ajustar GC, reduzir objetos
  +-- Não: Focar em outras otimizações
```

## Perguntas de Prática

1. Qual é a diferença entre memória de execução e memória de armazenamento?
2. Como o modelo de memória unificada lida com a contenção entre execução e armazenamento?
3. O que causa o derramamento de dados para o disco?
4. Como a memória fora do heap reduz a pressão do GC?
5. Qual algoritmo de GC é recomendado para grandes executores Spark?
6. Como você monitora o uso de memória na UI do Spark?
7. Qual é o impacto de armazenar muitos dados em cache?
8. Como o cache serializado difere do cache não serializado?
9. Que mudanças de configuração reduzem erros OOM?
10. Como você calcula a memória ótima do executor para uma determinada carga de trabalho?
