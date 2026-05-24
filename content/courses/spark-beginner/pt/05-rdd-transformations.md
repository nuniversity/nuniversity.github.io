---
title: "Transformações RDD"
description: "Domine transformações RDD incluindo map, filter, flatMap, distinct, groupByKey e reduceByKey com exemplos Python"
order: 5
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Transformações RDD

Transformações criam novos RDDs a partir de existentes. Elas são **preguiçosas** — Spark registra a operação mas não a executa até que uma ação dispare a computação. Isso permite que o otimizador Catalyst (para DataFrames) e o agendador DAG construam planos de execução eficientes.

## Tipos de Transformações

| Tipo | Comportamento | Exemplos |
|---|---|---|
| **Estreita** | Cada partição de entrada contribui para no máximo uma partição de saída | `map`, `filter`, `flatMap` |
| **Ampla (Shuffle)** | Múltiplas partições de entrada contribuem para partições de saída | `reduceByKey`, `groupByKey`, `distinct` |

> [!NOTE]
> Transformações estreitas são encadeadas e executam dentro de um único estágio. Transformações amplas causam um shuffle e criam um limite de novo estágio.

## Transformação Map

Aplica uma função a cada elemento e retorna um elemento de saída por entrada.

```python
rdd = sc.parallelize([1, 2, 3, 4, 5])

# Elevar cada número ao quadrado
squared = rdd.map(lambda x: x ** 2)
print(squared.collect())  # [1, 4, 9, 16, 25]

# Analisar linhas tipo CSV
lines = sc.parallelize(["Alice,34,Engineer", "Bob,28,Designer"])
parsed = lines.map(lambda line: line.split(","))
print(parsed.collect())
# [['Alice', '34', 'Engineer'], ['Bob', '28', 'Designer']]

# Converter tipos
typed = parsed.map(lambda fields: (fields[0], int(fields[1]), fields[2]))
print(typed.collect())
# [('Alice', 34, 'Engineer'), ('Bob', 28, 'Designer')]
```

## Transformação Filter

Mantém elementos que satisfazem uma função predicado.

```python
rdd = sc.parallelize(range(1, 21))

# Manter números pares
evens = rdd.filter(lambda x: x % 2 == 0)
print(evens.collect())
# [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

# Filtrar linhas de log
logs = sc.parallelize([
    "INFO: Server started",
    "ERROR: Connection refused",
    "WARN: Disk space low",
    "ERROR: Timeout exceeded"
])
errors = logs.filter(lambda line: line.startswith("ERROR"))
print(errors.collect())
# ['ERROR: Connection refused', 'ERROR: Timeout exceeded']
```

> [!SUCCESS]
> Filter é uma transformação estreita e muito eficiente. Nunca causa um shuffle.

## Transformação FlatMap

Aplica uma função que retorna múltiplos elementos (ou zero) para cada entrada. Os resultados são achatados em um único RDD.

```python
# Tokenizar frases em palavras
sentences = sc.parallelize([
    "hello world",
    "spark is awesome",
    "big data processing"
])
words = sentences.flatMap(lambda sentence: sentence.split(" "))
print(words.collect())
# ['hello', 'world', 'spark', 'is', 'awesome', 'big', 'data', 'processing']

# Extrair todos os caracteres
chars = sentences.flatMap(lambda s: list(s))
print(chars.take(10))
# ['h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l']

# Retornar múltiplos registros por entrada
def expand_number(n):
    """Retornar n cópias do número como uma lista."""
    return [n] * n

rdd = sc.parallelize([1, 2, 3])
expanded = rdd.flatMap(expand_number)
print(expanded.collect())  # [1, 2, 2, 3, 3, 3]
```

### map vs flatMap

| Aspecto | map | flatMap |
|---|---|---|
| **Saída por entrada** | Exatamente um | Zero ou mais |
| **Tipo de resultado** | RDD do mesmo tamanho | RDD pode diferir em tamanho |
| **Caso de uso** | Transformar cada elemento | Dividir/expandir elementos |
| **Exemplo** | Analisar cada linha | Tokenizar em palavras |

## Distinct

Remove elementos duplicados. Isso causa um **shuffle** porque duplicatas podem estar em diferentes partições.

```python
rdd = sc.parallelize([1, 1, 2, 2, 3, 3, 4, 4, 5])
unique = rdd.distinct()
print(sorted(unique.collect()))  # [1, 2, 3, 4, 5]

# Contar valores distintos
print(rdd.distinct().count())

# Em RDDs chave-valor — distinct considera a tupla inteira
kv_rdd = sc.parallelize([("a", 1), ("a", 1), ("b", 2)])
print(kv_rdd.distinct().collect())
# [('a', 1), ('b', 2)]
```

> [!WARNING]
> `distinct()` é caro porque requer um shuffle completo. Para grandes conjuntos de dados, considere abordagens alternativas como reduzir precisão ou usar algoritmos aproximados.

## groupByKey

Agrupa todos os valores para cada chave em um único iterável. Esta é uma **transformação ampla** que causa um shuffle.

```python
pairs = sc.parallelize([
    ("fruit", "apple"), ("fruit", "banana"),
    ("veggie", "carrot"), ("fruit", "orange"),
    ("veggie", "broccoli")
])

grouped = pairs.groupByKey()
result = grouped.mapValues(list).collect()
print(dict(result))
# {'fruit': ['apple', 'banana', 'orange'], 'veggie': ['carrot', 'broccoli']}
```

> [!WARNING]
> `groupByKey` envia todos os valores para cada chave para uma única partição. Se uma chave tem milhões de valores, a memória do executor pode ser sobrecarregada. Prefira `reduceByKey` ou `aggregateByKey` quando possível.

## reduceByKey

Combina valores para cada chave usando uma função de redução associativa. Diferente de `groupByKey`, realiza uma **combinação no lado do map** para reduzir dados antes do shuffle.

```python
pairs = sc.parallelize([
    ("a", 1), ("b", 1), ("a", 2),
    ("b", 3), ("a", 4), ("c", 1)
])

# Somar valores por chave
summed = pairs.reduceByKey(lambda a, b: a + b)
print(summed.collect())
# [('a', 7), ('b', 4), ('c', 1)]

# Exemplo de contagem de palavras
text = sc.parallelize([
    "hello world hello",
    "world spark hello",
    "spark is awesome"
])
word_counts = text \
    .flatMap(lambda line: line.split(" ")) \
    .map(lambda word: (word, 1)) \
    .reduceByKey(lambda a, b: a + b)
print(dict(word_counts.collect()))
# {'hello': 3, 'world': 2, 'spark': 2, 'is': 1, 'awesome': 1}
```

### groupByKey vs reduceByKey

| Aspecto | groupByKey | reduceByKey |
|---|---|---|
| **Combinação no lado do map** | Não | Sim |
| **Tamanho dos dados do shuffle** | Todos os valores | Valores reduzidos |
| **Risco de memória** | Alto (grandes listas de valores) | Baixo |
| **Desempenho** | Mais lento | Mais rápido |
| **Quando usar** | Precisar de todos os valores por chave | Precisar de valores agregados |

> [!SUCCESS]
> O exemplo de Contagem de Palavras acima demonstra o padrão clássico do Spark: flatMap para tokenizar, map para criar pares chave-valor, depois reduceByKey para agregação. Este padrão aparece em inúmeras aplicações reais.

## Outras Transformações Importantes

```python
# sortByKey — ordenar por chave (requer um shuffle)
pairs = sc.parallelize([("b", 2), ("a", 1), ("c", 3)])
sorted_rdd = pairs.sortByKey()
print(sorted_rdd.collect())  # [('a', 1), ('b', 2), ('c', 3)]

# sortBy — ordenar por qualquer função
rdd = sc.parallelize([3, 1, 4, 1, 5, 9, 2])
sorted_rdd = rdd.sortBy(lambda x: x)
print(sorted_rdd.collect())  # [1, 1, 2, 3, 4, 5, 9]

# sample — amostragem aleatória
rdd = sc.parallelize(range(1, 101))
sampled = rdd.sample(withReplacement=False, fraction=0.1)
print(sampled.collect())

# union — combinar dois RDDs
rdd1 = sc.parallelize([1, 2, 3])
rdd2 = sc.parallelize([3, 4, 5])
union_rdd = rdd1.union(rdd2)
print(union_rdd.collect())  # [1, 2, 3, 3, 4, 5]

# intersection — elementos comuns
intersection_rdd = rdd1.intersection(rdd2)
print(intersection_rdd.collect())  # [3]

# subtract — elementos no primeiro mas não no segundo
sub_rdd = rdd1.subtract(rdd2)
print(sub_rdd.collect())  # [1, 2]

# cartesian — todos os pares (perigoso para dados grandes!)
cart = rdd1.cartesian(rdd2)
print(cart.collect())
# [(1,3), (1,4), (1,5), (2,3), (2,4), (2,5), (3,3), (3,4), (3,5)]
```

## Perguntas de Prática

1. Qual é a diferença entre transformações estreitas e amplas? Dê dois exemplos de cada.
2. Por que `reduceByKey` é geralmente preferido sobre `groupByKey`?
3. Como `flatMap` difere de `map`? Forneça um caso de uso para cada.
4. O que acontece com elementos duplicados ao chamar `distinct()`?
5. Explique por que `filter` é eficiente mas `distinct` não é.
6. Como você implementaria uma contagem de palavras usando `map` e `reduceByKey`?
7. O que é uma combinação no lado do map e por que reduz os dados do shuffle?
8. O que `rdd.sample(withReplacement=True, fraction=0.5)` faz?
9. Por que `cartesian` é perigoso em grandes conjuntos de dados?
10. Como o Spark encadeia transformações estreitas dentro de um único estágio?
