---
title: "Introdução aos RDDs"
description: "Aprenda sobre Resilient Distributed Datasets, criando RDDs com parallelize() e textFile(), e entendendo a linhagem RDD"
order: 4
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Introdução aos RDDs

Resilient Distributed Datasets (RDDs) são a estrutura de dados fundamental no Apache Spark. Eles representam uma coleção imutável e particionada de elementos que podem ser processados em paralelo.

## O que é um RDD?

Um RDD tem três características principais:

| Característica | Descrição |
|---|---|
| **Resilient** | Recupera-se automaticamente de falhas usando linhagem |
| **Distributed** | Dados são particionados em múltiplos nós |
| **Dataset** | Uma coleção de objetos tipados (Python, Scala, Java) |

> [!NOTE]
> Embora DataFrames e Datasets sejam agora as APIs recomendadas, entender RDDs é crucial para otimização de baixo nível e quando se trabalha com dados não estruturados.

### Propriedades dos RDDs

1. **Imutabilidade**: RDDs não podem ser modificados após a criação. Transformações produzem novos RDDs.
2. **Avaliação Preguiçosa**: Transformações não são executadas até que uma ação seja chamada.
3. **Particionamento**: Dados são divididos em partições que podem ser processadas em paralelo.
4. **Linhagem**: Spark rastreia as transformações usadas para construir um RDD, permitindo recuperação de falhas.

## Criando RDDs

### De uma Coleção com `parallelize()`

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("RDDIntro") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Criar um RDD a partir de uma lista Python
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
rdd = sc.parallelize(data)

print(rdd.collect())
# Saída: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### Especificando a Contagem de Partições

```python
# Criar RDD com 4 partições
rdd = sc.parallelize(data, numSlices=4)
print(f"Número de partições: {rdd.getNumPartitions()}")

# Obter tamanhos das partições
glommed = rdd.glom().collect()
for i, partition in enumerate(glommed):
    print(f"Partição {i}: {partition}")
```

> [!WARNING]
> Muitas poucas partições subutilizam os recursos do cluster. Muitas partições criam sobrecarga de agendamento. Um bom ponto de partida é 2-4 partições por núcleo.

### De um Arquivo com `textFile()`

```python
# Ler um arquivo de texto — cada linha se torna um elemento
rdd = sc.textFile("data/sample.txt")

# Ler múltiplos arquivos usando wildcards
rdd = sc.textFile("data/logs/*.log")

# Ler do HDFS
rdd = sc.textFile("hdfs://namenode:9000/user/data/logs/")

# Ler do S3
rdd = sc.textFile("s3a://my-bucket/logs/2024/*.gz")

print(f"Número de linhas: {rdd.count()}")
print(f"Primeiras 5 linhas: {rdd.take(5)}")
```

### Controlando a Contagem de Partições para Arquivos

```python
# Partições mínimas (Spark pode usar mais com base na contagem de blocos HDFS)
rdd = sc.textFile("data/large_file.txt", minPartitions=10)
```

> [!NOTE]
> Para `textFile()`, se o arquivo estiver no HDFS, Spark cria uma partição por bloco HDFS (padrão 128 MB). Você pode aumentar partições com `minPartitions` mas não pode reduzir abaixo da contagem de blocos HDFS.

### Outros Métodos de Criação

```python
# De um arquivo de texto inteiro (retorna pares (nome_arquivo, conteúdo))
rdd = sc.wholeTextFiles("data/directory/")

# De um arquivo tipo CSV (parsing manual necessário)
rdd = sc.textFile("data/people.csv")
header = rdd.first()
data = rdd.filter(lambda row: row != header)

# RDD vazio
empty_rdd = sc.emptyRDD()

# Range RDD
range_rdd = sc.range(1, 1000, step=1, numSlices=10)
```

## Linhagem RDD

Spark registra cada transformação como um **grafo de linhagem** (DAG). Se uma partição for perdida, Spark a recalcula reproduzindo a linhagem.

```python
rdd1 = sc.textFile("data/sample.txt")
rdd2 = rdd1.filter(lambda line: "ERROR" in line)
rdd3 = rdd2.map(lambda line: (line.split(",")[0], 1))
rdd4 = rdd3.reduceByKey(lambda a, b: a + b)

# Visualizar linhagem
print(rdd4.toDebugString())
# (4) ShuffledRDD[4] at reduceByKey at <...>
#  +-(3) MapPartitionsRDD[3] at map at <...>
#     |  MapPartitionsRDD[2] at filter at <...>
#     |  data/sample.txt MapPartitionsRDD[1] at textFile at <...>
#     |  data/sample.txt HadoopRDD[0] at textFile at <...>
```

> [!SUCCESS]
> A linhagem RDD é o principal mecanismo de tolerância a falhas do Spark. Ela evita a necessidade de replicação ou checkpointing porque partições perdidas podem sempre ser recalculadas a partir dos dados de origem.

## Tipos de RDDs

| Tipo de RDD | Descrição | Exemplo |
|---|---|---|
| **HadoopRDD** | Lê de HDFS, S3, etc. | `sc.textFile()` |
| **ParallelCollectionRDD** | De uma coleção local | `sc.parallelize()` |
| **MapPartitionsRDD** | Após map/flatMap/filter | `rdd.map()` |
| **ShuffledRDD** | Após operações de shuffle | `rdd.reduceByKey()` |
| **UnionRDD** | União de múltiplos RDDs | `rdd1.union(rdd2)` |
| **CoGroupedRDD** | Após cogroup/join | `rdd1.join(rdd2)` |

## Entendendo o Spark Context

O `SparkContext` (`sc`) é o ponto de entrada para a funcionalidade Spark de baixo nível.

```python
from pyspark import SparkContext

# Criar SparkContext diretamente (menos comum com SparkSession)
sc = SparkContext("local[*]", "MyContext")

# Obter contexto do SparkSession
sc = spark.sparkContext

print(f"Paralelismo padrão: {sc.defaultParallelism}")
print(f"ID da Aplicação: {sc.applicationId}")
print(f"Versão Spark: {sc.version}")
```

## Trabalhando com RDDs Chave-Valor

Muitas operações Spark trabalham com pares chave-valor (tuplas de dois elementos).

```python
# Criar um RDD chave-valor
data = [("Alice", 34), ("Bob", 45), ("Charlie", 28)]
rdd = sc.parallelize(data)

# Chaves e valores
print(rdd.keys().collect())    # ['Alice', 'Bob', 'Charlie']
print(rdd.values().collect())  # [34, 45, 28]

# Consultar uma chave (eficiente se RDD for particionado)
print(rdd.lookup("Alice"))     # [34]
```

> [!WARNING]
> Operações chave-valor como `reduceByKey` e `groupByKey` disparam um **shuffle** — os dados são redistribuídos entre partições por chave. Shuffles são caros e devem ser minimizados.

## Persistência RDD

Por padrão, RDDs são recalculados cada vez que uma ação é executada. Use `cache()` ou `persist()` para manter dados em memória.

```python
# Cachear RDD em memória
rdd_cached = rdd.cache()

# Persistir com nível de armazenamento
from pyspark import StorageLevel
rdd_persisted = rdd.persist(StorageLevel.MEMORY_AND_DISK)
```

| Nível de Armazenamento | Descrição |
|---|---|
| `MEMORY_ONLY` | Armazenar como objetos desserializados em memória (padrão) |
| `MEMORY_AND_DISK` | Memória primeiro, spill para disco |
| `DISK_ONLY` | Armazenar apenas em disco |
| `MEMORY_ONLY_SER` | Armazenar como objetos serializados (mais compacto) |
| `OFF_HEAP` | Armazenar em memória off-heap |

## Principais Conclusões

1. RDDs são coleções imutáveis, particionadas e tolerantes a falhas
2. Crie RDDs via `parallelize()` (coleções) ou `textFile()` (arquivos)
3. Transformações são preguiçosas — nada acontece até uma ação
4. Linhagem rastreia como recalcular qualquer partição perdida
5. RDDs chave-valor permitem operações baseadas em shuffle
6. Persistência (cache/persist) evita recálculo

## Perguntas de Prática

1. O que significa "Resilient" no contexto de RDDs?
2. Qual é a diferença entre `parallelize()` e `textFile()`?
3. Como a avaliação preguiçosa melhora o desempenho do Spark?
4. O que é linhagem RDD e como ela permite tolerância a falhas?
5. Quantas partições `sc.textFile()` cria para um arquivo de 512 MB no HDFS (blocos de 128 MB)?
6. O que é um shuffle e por que é caro?
7. Quando você usaria `persist(StorageLevel.MEMORY_AND_DISK)` em vez de `cache()`?
8. O que `rdd.glom().collect()` mostra?
9. Como você cria um RDD com um número específico de partições?
10. Qual é a diferença entre um RDD e uma lista Python regular?
