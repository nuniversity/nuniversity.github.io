---
title: "GraphX"
description: "Procesa datos de grafos con GraphX: vértices, aristas, PageRank, componentes conectados y conteo de triángulos a escala"
order: 5
duration: "35-45 minutos"
difficulty: "avanzado"
---

# GraphX

GraphX es la API de Spark para procesamiento de grafos y computación paralela de grafos. Extiende la abstracción RDD con grafos de propiedades — multigrafos dirigidos con propiedades definidas por el usuario adjuntas a vértices y aristas.

## Conceptos de Grafos

| Concepto | Descripción | Ejemplo |
|---|---|---|
| **Vértice** | Nodo en el grafo | Usuario, página, producto |
| **Arista** | Relación entre vértices | Sigue, gusta, compra |
| **Grafo de propiedades** | Vértices y aristas con datos definidos por el usuario | Usuario: {nombre, edad}, Arista: {relación, peso} |
| **Triplete** | Arista con propiedades de ambos extremos | (UsuarioA -> UsuarioB, "amigo") |

> [!NOTE]
> GraphX es más adecuado para algoritmos paralelos de grafos como PageRank y componentes conectados. Para procesamiento general de grafos (ETL, consultas), usa DataFrames. Para grafos muy grandes (>1B aristas), considera GraphFrames o bases de datos de grafos especializadas.

## Creación de un Grafo

```python
from pyspark.sql import SparkSession
from pyspark.graphx import Graph, GraphLoader
from pyspark.storagelevel import StorageLevel

spark = SparkSession.builder \
    .appName("GraphXIntro") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Crear RDD de vértices (id, atributos)
vertices = sc.parallelize([
    (1L, ("Alice", 34)),
    (2L, ("Bob", 28)),
    (3L, ("Charlie", 41)),
    (4L, ("Diana", 25)),
    (5L, ("Eve", 38))
])

# Crear RDD de aristas (src, dst, atributos)
edges = sc.parallelize([
    (1L, 2L, "friend"),
    (1L, 3L, "colleague"),
    (2L, 3L, "friend"),
    (3L, 4L, "mentor"),
    (4L, 5L, "friend"),
    (1L, 5L, "colleague")
])

# Crear el grafo
graph = Graph(vertices, edges, defaultVertexAttr=("Unknown", 0))
print(f"Vértices: {graph.vertices.count()}")
print(f"Aristas: {graph.edges.count()}")
```

> [!WARNING]
> GraphX requiere Scala/Java para la API completa. PySpark GraphX tiene funcionalidad limitada. Para procesamiento de grafos en Python, considera GraphFrames (basado en DataFrames) o usa Scala GraphX a través de `spark.jars`.

## Propiedades del Grafo

```python
# Propiedades básicas
print(f"Número de vértices: {graph.vertices.count()}")
print(f"Número de aristas: {graph.edges.count()}")

# Grados
print(f"Grados de entrada (aristas entrantes):")
graph.inDegrees.collect()

print(f"Grados de salida (aristas salientes):")
graph.outDegrees.collect()

print(f"Grados totales:")
graph.degrees.collect()

# Recoger tripletes (arista + atributos de ambos vértices)
triplets = graph.triplets.collect()
for t in triplets:
    print(f"{t.srcAttr[0]} --[{t.attr}]--> {t.dstAttr[0]}")
# Salida:
# Alice --[friend]--> Bob
# Alice --[colleague]--> Charlie
# Bob --[friend]--> Charlie
# Charlie --[mentor]--> Diana
# Diana --[friend]--> Eve
# Alice --[colleague]--> Eve
```

## PageRank

PageRank mide la importancia de los vértices basándose en la estructura de aristas.

```python
# Ejecutar PageRank
page_rank = graph.pageRank(tol=0.0001).vertices

# Ordenar por rango
page_rank.orderBy(page_rank.rank.desc()).show()
# +---+------------------+
# | id|              rank|
# +---+------------------+
# |  3|1.5729151412236738|  <- Charlie (más conectado)
# |  1|1.4247814820465146|  <- Alice
# |  2|1.0732970879088205|
# |  5| 0.841083306787525|
# |  4|0.7070498174332198|
# +---+------------------+

# Parámetros personalizados de PageRank
custom_pr = graph.pageRank(tol=0.01, resetProb=0.15).vertices
```

> [!SUCCESS]
> PageRank es útil más allá de la búsqueda web: encuentra usuarios influyentes en redes sociales, artículos importantes en grafos de citas o nodos críticos en grafos de dependencias.

## Componentes Conectados

Encuentra todos los subgrafos conectados (vértices alcanzables a través de aristas).

```python
# Encontrar componentes conectados
cc = graph.connectedComponents().vertices
cc.orderBy(cc.component.asc()).show()
# +---+-----------+
# | id|  component|
# +---+-----------+
# |  1|          1|  <- Todos en el mismo componente (grafo conectado)
# |  2|          1|
# |  3|          1|
# |  4|          1|
# |  5|          1|
# +---+-----------+

# Con múltiples subgrafos desconectados
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
# Dos componentes: {1,2,3} y {100,200}
```

## Conteo de Triángulos

Cuenta el número de triángulos en los que participa cada vértice.

```python
# Contar triángulos
tri_counts = graph.triangleCount().vertices
tri_counts.show()
# +---+-------------+
# | id|triangleCount|
# +---+-------------+
# |  1|            1|  <- Alice en 1 triángulo (Alice-Bob-Charlie)
# |  2|            1|  <- Bob en 1 triángulo
# |  3|            1|  <- Charlie en 1 triángulo
# |  4|            0|
# |  5|            0|
# +---+-------------+
```

> [!NOTE]
> El conteo de triángulos se usa en análisis de redes sociales para medir "clusterización" — qué tan conectados están los vecinos de un vértice. Recuentos altos de triángulos indican comunidades muy unidas.

## Operaciones de Grafos

### Subgrafo

Filtra el grafo por condiciones de vértices o aristas.

```python
# Subgrafo: mantener solo vértices con edad > 30
filtered_graph = graph.subgraph(
    vpred=lambda id, attr: attr[1] > 30
)
print(f"Vértices filtrados: {filtered_graph.vertices.count()}")  # 3
print(f"Aristas filtradas: {filtered_graph.edges.count()}")

# Subgrafo: mantener solo aristas "friend"
friend_graph = graph.subgraph(
    epred=lambda triplet: triplet.attr == "friend"
)
print(f"Aristas de amistad: {friend_graph.edges.count()}")  # 3
```

### Mask

Mantiene vértices del grafo original que también aparecen en otro grafo.

```python
# Mask: mantener solo vértices que existen en otro grafo
important_vertices = sc.parallelize([(1L, None), (3L, None)])
masked = graph.mask(Graph(important_vertices, sc.parallelize([])))
```

### GroupEdges

Fusiona aristas duplicadas y combina sus atributos.

```python
# Agrupar aristas duplicadas
graph_with_weights = Graph(vertices, sc.parallelize([
    (1L, 2L, 1),
    (1L, 2L, 2),  # Arista duplicada con peso diferente
    (2L, 3L, 3)
]))

def sum_weights(a, b):
    return a + b

grouped = graph_with_weights.groupEdges(sum_weights)
# Arista (1,2) ahora tiene peso 3
```

## Resumen de Algoritmos de Grafos

| Algoritmo | Caso de Uso | Complejidad |
|---|---|---|
| **PageRank** | Ranking de importancia | O(V + E) por iteración |
| **Componentes Conectados** | Conectividad de grafos | O(V + E) |
| **Conteo de Triángulos** | Detección de comunidades | O(E^1.5) |
| **SVDPlusPlus** | Recomendación | O(E) por iteración |
| **Propagación de Etiquetas** | Detección de comunidades | O(V + E) por iteración |

## GraphFrames (Alternativa para Python)

GraphFrames proporciona procesamiento de grafos basado en DataFrames con una API de Python más rica.

```python
# Usando GraphFrames (requiere paquete separado)
from graphframes import GraphFrame

# Crear DataFrames de vértices y aristas
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

# BFS (Búsqueda en Anchura)
paths = gf.bfs("name = 'Alice'", "name = 'Eve'", maxPathLength=3)
paths.show()

# Búsqueda de motivos
motifs = gf.find("(a)-[e]->(b); (b)-[e2]->(c)")
motifs.show()
```

## Preguntas de Práctica

1. ¿Qué es un grafo de propiedades en GraphX?
2. ¿Cómo calcula PageRank la importancia de los vértices?
3. ¿Qué te dicen los componentes conectados sobre la estructura del grafo?
4. ¿Qué indica un recuento alto de triángulos sobre un vértice?
5. ¿Cómo filtra subgraph() vértices y aristas?
6. ¿Por qué GraphX está disponible principalmente en Scala y no en Python?
7. ¿Cuál es la diferencia entre `inDegrees` y `outDegrees`?
8. ¿Cómo encuentras la ruta más corta entre dos vértices?
9. ¿Qué es un triplete de grafo y cómo lo accedes?
10. ¿En qué se diferencia GraphFrames de GraphX para usuarios de Python?
