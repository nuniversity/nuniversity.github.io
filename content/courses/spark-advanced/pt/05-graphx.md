---
title: "GraphX"
description: "Processe dados de grafos com GraphX: vértices, arestas, PageRank, componentes conectados e contagem de triângulos em escala"
order: 5
duration: "35-45 minutos"
difficulty: "avançado"
---

# GraphX

GraphX é a API do Spark para processamento de grafos e computação paralela de grafos. Ela estende a abstração RDD com grafos de propriedades — multigrafos direcionados com propriedades definidas pelo usuário anexadas a vértices e arestas.

## Conceitos de Grafos

| Conceito | Descrição | Exemplo |
|---|---|---|
| **Vértice** | Nó no grafo | Usuário, página, produto |
| **Aresta** | Relação entre vértices | Segue, gosta, compra |
| **Grafo de propriedades** | Vértices e arestas com dados definidos pelo usuário | Usuário: {nome, idade}, Aresta: {relação, peso} |
| **Triplete** | Aresta com propriedades de ambos os extremos | (UsuárioA -> UsuárioB, "amigo") |

> [!NOTE]
> GraphX é mais adequado para algoritmos paralelos de grafos como PageRank e componentes conectados. Para processamento geral de grafos (ETL, consultas), use DataFrames. Para grafos muito grandes (>1B arestas), considere GraphFrames ou bancos de dados de grafos especializados.

## Criação de um Grafo

```python
from pyspark.sql import SparkSession
from pyspark.graphx import Graph, GraphLoader
from pyspark.storagelevel import StorageLevel

spark = SparkSession.builder \
    .appName("GraphXIntro") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Criar RDD de vértices (id, atributos)
vertices = sc.parallelize([
    (1L, ("Alice", 34)),
    (2L, ("Bob", 28)),
    (3L, ("Charlie", 41)),
    (4L, ("Diana", 25)),
    (5L, ("Eve", 38))
])

# Criar RDD de arestas (src, dst, atributos)
edges = sc.parallelize([
    (1L, 2L, "friend"),
    (1L, 3L, "colleague"),
    (2L, 3L, "friend"),
    (3L, 4L, "mentor"),
    (4L, 5L, "friend"),
    (1L, 5L, "colleague")
])

# Criar o grafo
graph = Graph(vertices, edges, defaultVertexAttr=("Unknown", 0))
print(f"Vértices: {graph.vertices.count()}")
print(f"Arestas: {graph.edges.count()}")
```

> [!WARNING]
> GraphX requer Scala/Java para a API completa. PySpark GraphX tem funcionalidade limitada. Para processamento de grafos em Python, considere GraphFrames (baseado em DataFrames) ou use Scala GraphX via `spark.jars`.

## Propriedades do Grafo

```python
# Propriedades básicas
print(f"Número de vértices: {graph.vertices.count()}")
print(f"Número de arestas: {graph.edges.count()}")

# Graus
print(f"Graus de entrada (arestas recebidas):")
graph.inDegrees.collect()

print(f"Graus de saída (arestas enviadas):")
graph.outDegrees.collect()

print(f"Graus totais:")
graph.degrees.collect()

# Coletar tripletes (aresta + atributos de ambos vértices)
triplets = graph.triplets.collect()
for t in triplets:
    print(f"{t.srcAttr[0]} --[{t.attr}]--> {t.dstAttr[0]}")
# Saída:
# Alice --[friend]--> Bob
# Alice --[colleague]--> Charlie
# Bob --[friend]--> Charlie
# Charlie --[mentor]--> Diana
# Diana --[friend]--> Eve
# Alice --[colleague]--> Eve
```

## PageRank

PageRank mede a importância dos vértices com base na estrutura de arestas.

```python
# Executar PageRank
page_rank = graph.pageRank(tol=0.0001).vertices

# Ordenar por ranking
page_rank.orderBy(page_rank.rank.desc()).show()
# +---+------------------+
# | id|              rank|
# +---+------------------+
# |  3|1.5729151412236738|  <- Charlie (mais conectado)
# |  1|1.4247814820465146|  <- Alice
# |  2|1.0732970879088205|
# |  5| 0.841083306787525|
# |  4|0.7070498174332198|
# +---+------------------+

# Parâmetros personalizados de PageRank
custom_pr = graph.pageRank(tol=0.01, resetProb=0.15).vertices
```

> [!SUCCESS]
> PageRank é útil além da busca web: encontre usuários influentes em redes sociais, artigos importantes em grafos de citação ou nós críticos em grafos de dependências.

## Componentes Conectados

Encontra todos os subgrafos conectados (vértices alcançáveis através de arestas).

```python
# Encontrar componentes conectados
cc = graph.connectedComponents().vertices
cc.orderBy(cc.component.asc()).show()
# +---+-----------+
# | id|  component|
# +---+-----------+
# |  1|          1|  <- Todos no mesmo componente (grafo conectado)
# |  2|          1|
# |  3|          1|
# |  4|          1|
# |  5|          1|
# +---+-----------+

# Com múltiplos subgrafos desconectados
vertices2 = sc.parallelize([
    (1L, "A"), (2L, "B"), (3L, "C"),
    (100L, "X"), (200L, "Y")
])
edges2 = sc.parallelize([
    (1L, 2L, "link"), (2L, 3L, "link"),
    (100L, 200L, "link")
])
graph2 = Graph(vertices2, edges2)
cc2 = graph2.connectedComponents().vertices
# Dois componentes: {1,2,3} e {100,200}
```

## Contagem de Triângulos

Conta o número de triângulos em que cada vértice participa.

```python
# Contar triângulos
tri_counts = graph.triangleCount().vertices
tri_counts.show()
# +---+-------------+
# | id|triangleCount|
# +---+-------------+
# |  1|            1|  <- Alice em 1 triângulo (Alice-Bob-Charlie)
# |  2|            1|  <- Bob em 1 triângulo
# |  3|            1|  <- Charlie em 1 triângulo
# |  4|            0|
# |  5|            0|
# +---+-------------+
```

> [!NOTE]
> A contagem de triângulos é usada em análise de redes sociais para medir "clusterização" — quão conectados estão os vizinhos de um vértice. Contagens altas de triângulos indicam comunidades muito unidas.

## Operações de Grafos

### Subgrafo

Filtra o grafo por condições de vértices ou arestas.

```python
# Subgrafo: manter apenas vértices com idade > 30
filtered_graph = graph.subgraph(
    vpred=lambda id, attr: attr[1] > 30
)
print(f"Vértices filtrados: {filtered_graph.vertices.count()}")  # 3
print(f"Arestas filtradas: {filtered_graph.edges.count()}")

# Subgrafo: manter apenas arestas "friend"
friend_graph = graph.subgraph(
    epred=lambda triplet: triplet.attr == "friend"
)
print(f"Arestas de amizade: {friend_graph.edges.count()}")  # 3
```

### Mask

Mantém vértices do grafo original que também aparecem em outro grafo.

```python
# Mask: manter apenas vértices que existem em outro grafo
important_vertices = sc.parallelize([(1L, None), (3L, None)])
masked = graph.mask(Graph(important_vertices, sc.parallelize([])))
```

### GroupEdges

Mescla arestas duplicadas e combina seus atributos.

```python
# Agrupar arestas duplicadas
graph_with_weights = Graph(vertices, sc.parallelize([
    (1L, 2L, 1),
    (1L, 2L, 2),  # Aresta duplicada com peso diferente
    (2L, 3L, 3)
]))

def sum_weights(a, b):
    return a + b

grouped = graph_with_weights.groupEdges(sum_weights)
# Aresta (1,2) agora tem peso 3
```

## Resumo de Algoritmos de Grafos

| Algoritmo | Caso de Uso | Complexidade |
|---|---|---|
| **PageRank** | Ranking de importância | O(V + E) por iteração |
| **Componentes Conectados** | Conectividade de grafos | O(V + E) |
| **Contagem de Triângulos** | Detecção de comunidades | O(E^1.5) |
| **SVDPlusPlus** | Recomendação | O(E) por iteração |
| **Propagação de Rótulos** | Detecção de comunidades | O(V + E) por iteração |

## GraphFrames (Alternativa para Python)

GraphFrames fornece processamento de grafos baseado em DataFrames com uma API Python mais rica.

```python
# Usando GraphFrames (requer pacote separado)
from graphframes import GraphFrame

# Criar DataFrames de vértices e arestas
v = spark.createDataFrame([
    (1, "Alice"), (2, "Bob"), (3, "Charlie"),
    (4, "Diana"), (5, "Eve")
], ["id", "name"])

e = spark.createDataFrame([
    (1, 2, "friend"), (1, 3, "colleague"),
    (2, 3, "friend"), (3, 4, "mentor"),
    (4, 5, "friend"), (1, 5, "colleague")
], ["src", "dst", "relationship"])

gf = GraphFrame(v, e)

# PageRank
results = gf.pageRank(resetProbability=0.15, maxIter=10)
results.vertices.select("id", "pagerank").show()

# BFS (Busca em Largura)
paths = gf.bfs("name = 'Alice'", "name = 'Eve'", maxPathLength=3)
paths.show()

# Busca de motivos
motifs = gf.find("(a)-[e]->(b); (b)-[e2]->(c)")
motifs.show()
```

## Perguntas de Prática

1. O que é um grafo de propriedades no GraphX?
2. Como o PageRank calcula a importância dos vértices?
3. O que os componentes conectados dizem sobre a estrutura do grafo?
4. O que uma contagem alta de triângulos indica sobre um vértice?
5. Como subgraph() filtra vértices e arestas?
6. Por que o GraphX está disponível principalmente em Scala e não em Python?
7. Qual é a diferença entre `inDegrees` e `outDegrees`?
8. Como você encontra o caminho mais curto entre dois vértices?
9. O que é um triplete de grafo e como você o acessa?
10. Como o GraphFrames difere do GraphX para usuários Python?
