---
title: "Ações RDD"
description: "Aprenda ações RDD: collect, count, take, reduce, foreach e saveAsTextFile com exemplos PySpark"
order: 6
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Ações RDD

Ações disparam Spark para executar o DAG de transformações e retornar um resultado ao driver ou escrever dados no armazenamento. Sem ações, as transformações nunca são computadas.

> [!NOTE]
> Cada ação faz com que o Spark reavalie toda a linhagem a partir dos dados de origem. Use `cache()` ou `persist()` para evitar recalcular RDDs intermediários ao executar múltiplas ações.

## collect()

Retorna todos os elementos do RDD como uma lista para o driver.

```python
rdd = sc.parallelize(range(1, 11))
data = rdd.collect()
print(data)  # [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

> [!WARNING]
> `collect()` traz todos os dados para o driver. Para RDDs grandes, isso pode causar erros de falta de memória. Use `collect()` apenas em conjuntos de dados pequenos ou após filtragem/agregação.

## count()

Retorna o número de elementos no RDD.

```python
rdd = sc.parallelize(range(1, 1001))
print(f"Contagem: {rdd.count()}")  # Contagem: 1000

# Contar com filtro
errors = sc.parallelize([
    "INFO: OK", "ERROR: Failed", "INFO: Done", "ERROR: Timeout"
])
error_count = errors.filter(lambda x: "ERROR" in x).count()
print(f"Erros: {error_count}")  # Erros: 2
```

## take(n)

Retorna os primeiros `n` elementos do RDD para o driver. Diferente de `collect()`, recupera apenas um número limitado de elementos.

```python
rdd = sc.parallelize(range(1, 10001))

# Pegar primeiros 5 elementos
print(rdd.take(5))   # [1, 2, 3, 4, 5]

# Pegar ordenado (usa mais recursos)
print(rdd.takeOrdered(5))          # [1, 2, 3, 4, 5]
print(rdd.takeOrdered(5, key=lambda x: -x))  # [10000, 9999, 9998, 9997, 9996]

# Pegar amostra
print(rdd.takeSample(False, 3))    # 3 elementos aleatórios
```

> [!SUCCESS]
> Use `take(n)` para explorar dados em vez de `collect()`. É muito mais seguro e fornece uma amostra representativa para entender sua estrutura de dados.

## first()

Retorna o primeiro elemento do RDD. Equivalente a `take(1)[0]`.

```python
rdd = sc.parallelize(["first", "second", "third"])
print(rdd.first())  # first
```

## reduce()

Agrega elementos usando uma função associativa e comutativa.

```python
rdd = sc.parallelize(range(1, 11))

# Somar todos os elementos
total = rdd.reduce(lambda a, b: a + b)
print(total)  # 55

# Encontrar máximo
max_val = rdd.reduce(lambda a, b: a if a > b else b)
print(max_val)  # 10

# Encontrar mínimo
min_val = rdd.reduce(lambda a, b: a if a < b else b)
print(min_val)  # 1
```

> [!NOTE]
> A função passada para `reduce()` deve ser associativa e comutativa. Isso é necessário porque os dados são processados em múltiplas partições em paralelo, e os resultados são combinados em ordem arbitrária.

## fold()

Similar a `reduce()`, mas recebe um valor zero para cada partição.

```python
rdd = sc.parallelize(range(1, 11))

# Somar com valor zero 0
total = rdd.fold(0, lambda a, b: a + b)
print(total)  # 55

# Concatenar strings
words = sc.parallelize(["hello", " ", "world"])
result = words.fold("", lambda a, b: a + b)
print(result)  # hello world
```

> [!WARNING]
> O valor zero é aplicado a cada partição, não apenas uma vez. Para adição, `0` funciona. Para multiplicação, use `1`. Um valor zero incorreto produzirá resultados errados.

## aggregate()

Fornece controle refinado sobre agregação com funções de combinação separadas no nível da partição e global.

```python
rdd = sc.parallelize(range(1, 11))

# Computar (soma, contagem) em uma passagem
seq_op = lambda agg, x: (agg[0] + x, agg[1] + 1)
comb_op = lambda a, b: (a[0] + b[0], a[1] + b[1])
zero = (0, 0)

result = rdd.aggregate(zero, seq_op, comb_op)
print(f"Soma: {result[0]}, Contagem: {result[1]}, Média: {result[0]/result[1]}")
# Soma: 55, Contagem: 10, Média: 5.5
```

## foreach()

Aplica uma função a cada elemento sem retornar nada ao driver. Usado para efeitos colaterais como escrever em bancos de dados.

```python
rdd = sc.parallelize([1, 2, 3, 4, 5])

# Imprimir cada elemento (saída aparece no stdout dos executores)
rdd.foreach(lambda x: print(f"Processando: {x}"))

# Escrever cada elemento em um banco de dados
def write_to_db(record):
    # database_connection.insert(record)
    pass

rdd.foreach(write_to_db)
```

> [!NOTE]
> `foreach()` executa nos executores, então a impressão vai para os logs do executor — não seu console driver. Use `foreachPartition()` para gerenciamento de recursos mais eficiente (uma conexão por partição).

## foreachPartition()

Como `foreach()` mas opera em uma partição inteira de uma vez. Útil para inicializar recursos caros uma vez por partição.

```python
def process_partition(iterator):
    # Abrir conexão com banco de dados uma vez por partição
    conn = create_connection()
    for record in iterator:
        conn.insert(record)
    conn.close()

rdd.foreachPartition(process_partition)
```

## saveAsTextFile()

Escreve o RDD como um arquivo de texto (ou arquivos) em um diretório.

```python
rdd = sc.parallelize(["line1", "line2", "line3", "line4"])

# Salvar no sistema de arquivos local
rdd.saveAsTextFile("output/text_data")

# Salvar no HDFS
rdd.saveAsTextFile("hdfs://namenode:9000/user/data/output/")

# Salvar com compressão
rdd.saveAsTextFile("output/compressed", compressionCodecClass="org.apache.hadoop.io.compress.GzipCodec")
```

> [!WARNING]
> `saveAsTextFile` cria um **diretório** contendo múltiplos arquivos de parte (um por partição). Isso é padrão para sistemas distribuídos, mas pode ser inesperado se você espera um único arquivo.

```
output/text_data/
  _SUCCESS
  part-00000
  part-00001
```

## Outras Ações Úteis

```python
# countByKey — contar elementos por chave (retorna dict)
pairs = sc.parallelize([("a", 1), ("b", 1), ("a", 1), ("c", 1)])
counts = pairs.countByKey()
print(dict(counts))  # {'a': 2, 'b': 1, 'c': 1}

# countByValue — contar ocorrências de cada valor
rdd = sc.parallelize([1, 2, 1, 3, 2, 1, 4])
value_counts = rdd.countByValue()
print(dict(value_counts))  # {1: 3, 2: 2, 3: 1, 4: 1}

# isEmpty — verificar se RDD está vazio
rdd = sc.parallelize([])
print(rdd.isEmpty())   # True

# max / min
rdd = sc.parallelize([5, 2, 9, 1, 7])
print(rdd.max())  # 9
print(rdd.min())  # 1

# stdev / variance / mean (aproximado)
from pyspark.statcounter import StatCounter
rdd = sc.parallelize(range(1, 101))
stats = rdd.stats()
print(f"Média: {stats.mean()}, Desvio: {stats.stdev()}")

# histogram
rdd = sc.parallelize(range(1, 11))
buckets, counts = rdd.histogram(5)
print(f"Intervalos: {buckets}, Contagens: {counts}")
```

## Tabela Resumo de Ações

| Ação | Retorna | Dados no Driver | Quando Usar |
|---|---|---|---|
| `collect()` | Lista | Todos os dados | Apenas resultados pequenos |
| `count()` | Int | Número único | Qualquer conjunto de dados |
| `take(n)` | Lista | n elementos | Exploração de dados |
| `first()` | Elemento | 1 elemento | Olhada rápida |
| `reduce()` | Elemento | Valor único | Agregação |
| `fold()` | Elemento | Valor único | Agregação com zero |
| `aggregate()` | Elemento | Valor único | Agregação complexa |
| `foreach()` | Nada | Nenhum | Efeitos colaterais |
| `saveAsTextFile()` | Nada | Nenhum | Persistir resultados |
| `countByKey()` | Dict | Dict de contagens | Frequência por chave |

## Perguntas de Prática

1. Por que `collect()` arrisca erros de falta de memória em grandes conjuntos de dados?
2. Qual é a diferença entre `take(10)` e `collect()`?
3. Quais restrições a função passada para `reduce()` deve satisfazer? Por quê?
4. Como `fold()` difere de `reduce()`? Quando você usaria cada um?
5. Qual é a vantagem de `aggregate()` sobre `fold()`?
6. Por que `saveAsTextFile` cria um diretório em vez de um único arquivo?
7. Como `foreachPartition()` é mais eficiente que `foreach()`?
8. O que `takeOrdered(3, key=lambda x: -x)` retorna?
9. Por que `countByValue()` pode ser caro em grandes conjuntos de dados?
10. Quando você deve chamar `cache()` antes de executar múltiplas ações no mesmo RDD?
