---
title: "GraphX"
description: "Process graph data with GraphX: vertices, edges, PageRank, connected components, and triangle counting at scale"
order: 5
duration: "35-45 minutes"
difficulty: "advanced"
---

# GraphX

GraphX is Spark's API for graph processing and graph-parallel computation. It extends the RDD abstraction with property graphs — directed multigraphs with user-defined properties attached to vertices and edges.

## Graph Concepts

| Concept | Description | Example |
|---|---|---|
| **Vertex** | Node in the graph | User, page, product |
| **Edge** | Relationship between vertices | Follows, likes, purchases |
| **Property Graph** | Vertices and edges with user-defined data | User: {name, age}, Edge: {relationship, weight} |
| **Triplet** | Edge with both endpoint properties | (UserA -> UserB, "friend") |

> [!NOTE]
> GraphX is best suited for graph-parallel algorithms like PageRank and connected components. For general graph processing (ETL, queries), use DataFrames. For very large graphs (>1B edges), consider GraphFrames or specialized graph databases.

## Creating a Graph

```python
from pyspark.sql import SparkSession
from pyspark.graphx import Graph, GraphLoader
from pyspark.storagelevel import StorageLevel

spark = SparkSession.builder \
    .appName("GraphXIntro") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Create vertices RDD (id, attributes)
vertices = sc.parallelize([
    (1L, ("Alice", 34)),
    (2L, ("Bob", 28)),
    (3L, ("Charlie", 41)),
    (4L, ("Diana", 25)),
    (5L, ("Eve", 38))
])

# Create edges RDD (src, dst, attributes)
edges = sc.parallelize([
    (1L, 2L, "friend"),
    (1L, 3L, "colleague"),
    (2L, 3L, "friend"),
    (3L, 4L, "mentor"),
    (4L, 5L, "friend"),
    (1L, 5L, "colleague")
])

# Create the graph
graph = Graph(vertices, edges, defaultVertexAttr=("Unknown", 0))
print(f"Vertices: {graph.vertices.count()}")
print(f"Edges: {graph.edges.count()}")
```

> [!WARNING]
> GraphX requires Scala/Java for the full API. PySpark GraphX has limited functionality. For Python graph processing, consider GraphFrames (DataFrame-based) or use Scala GraphX via `spark.jars`.

## Graph Properties

```python
# Basic properties
print(f"Number of vertices: {graph.vertices.count()}")
print(f"Number of edges: {graph.edges.count()}")

# Degrees
print(f"In-degrees (incoming edges):")
graph.inDegrees.collect()

print(f"Out-degrees (outgoing edges):")
graph.outDegrees.collect()

print(f"Total degrees:")
graph.degrees.collect()

# Collect triplets (edge + both vertex attributes)
triplets = graph.triplets.collect()
for t in triplets:
    print(f"{t.srcAttr[0]} --[{t.attr}]--> {t.dstAttr[0]}")
# Output:
# Alice --[friend]--> Bob
# Alice --[colleague]--> Charlie
# Bob --[friend]--> Charlie
# Charlie --[mentor]--> Diana
# Diana --[friend]--> Eve
# Alice --[colleague]--> Eve
```

## PageRank

PageRank measures vertex importance based on edge structure.

```python
# Run PageRank
page_rank = graph.pageRank(tol=0.0001).vertices

# Sort by rank
page_rank.orderBy(page_rank.rank.desc()).show()
# +---+------------------+
# | id|              rank|
# +---+------------------+
# |  3|1.5729151412236738|  <- Charlie (most connected)
# |  1|1.4247814820465146|  <- Alice
# |  2|1.0732970879088205|
# |  5| 0.841083306787525|
# |  4|0.7070498174332198|
# +---+------------------+

# Custom PageRank parameters
custom_pr = graph.pageRank(tol=0.01, resetProb=0.15).vertices
```

> [!SUCCESS]
> PageRank is useful beyond web search: find influential users in social networks, important papers in citation graphs, or critical nodes in dependency graphs.

## Connected Components

Finds all connected subgraphs (vertices reachable through edges).

```python
# Find connected components
cc = graph.connectedComponents().vertices
cc.orderBy(cc.component.asc()).show()
# +---+-----------+
# | id|  component|
# +---+-----------+
# |  1|          1|  <- All in same component (connected graph)
# |  2|          1|
# |  3|          1|
# |  4|          1|
# |  5|          1|
# +---+-----------+

# With multiple disconnected subgraphs
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
# Two components: {1,2,3} and {100,200}
```

## Triangle Counting

Counts the number of triangles each vertex participates in.

```python
# Count triangles
tri_counts = graph.triangleCount().vertices
tri_counts.show()
# +---+-------------+
# | id|triangleCount|
# +---+-------------+
# |  1|            1|  <- Alice in 1 triangle (Alice-Bob-Charlie)
# |  2|            1|  <- Bob in 1 triangle
# |  3|            1|  <- Charlie in 1 triangle
# |  4|            0|
# |  5|            0|
# +---+-------------+
```

> [!NOTE]
> Triangle counting is used in social network analysis to measure "clustering" — how connected a vertex's neighbors are. High triangle counts indicate tightly knit communities.

## Graph Operations

### Subgraph

Filter the graph by vertex or edge conditions.

```python
# Subgraph: keep only vertices with age > 30
filtered_graph = graph.subgraph(
    vpred=lambda id, attr: attr[1] > 30
)
print(f"Filtered vertices: {filtered_graph.vertices.count()}")  # 3
print(f"Filtered edges: {filtered_graph.edges.count()}")

# Subgraph: keep only "friend" edges
friend_graph = graph.subgraph(
    epred=lambda triplet: triplet.attr == "friend"
)
print(f"Friend edges: {friend_graph.edges.count()}")  # 3
```

### Mask

Keeps vertices from the original graph that also appear in another graph.

```python
# Mask: keep only vertices that exist in another graph
important_vertices = sc.parallelize([(1L, None), (3L, None)])
masked = graph.mask(Graph(important_vertices, sc.parallelize([])))
```

### GroupEdges

Merges duplicate edges and combines their attributes.

```python
# Group duplicate edges
graph_with_weights = Graph(vertices, sc.parallelize([
    (1L, 2L, 1),
    (1L, 2L, 2),  # Duplicate edge with different weight
    (2L, 3L, 3)
]))

def sum_weights(a, b):
    return a + b

grouped = graph_with_weights.groupEdges(sum_weights)
# Edge (1,2) now has weight 3
```

## Graph Algorithms Summary

| Algorithm | Use Case | Complexity |
|---|---|---|
| **PageRank** | Importance ranking | O(V + E) per iteration |
| **Connected Components** | Graph connectivity | O(V + E) |
| **Triangle Counting** | Community detection | O(E^1.5) |
| **SVDPlusPlus** | Recommendation | O(E) per iteration |
| **Label Propagation** | Community detection | O(V + E) per iteration |

## GraphFrames (Alternative for Python)

GraphFrames provides DataFrame-based graph processing with a richer Python API.

```python
# Using GraphFrames (requires separate package)
from graphframes import GraphFrame

# Create vertex and edge DataFrames
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

# BFS (Breadth-First Search)
paths = gf.bfs("name = 'Alice'", "name = 'Eve'", maxPathLength=3)
paths.show()

# Motif finding
motifs = gf.find("(a)-[e]->(b); (b)-[e2]->(c)")
motifs.show()
```

## Practice Questions

1. What is a property graph in GraphX?
2. How does PageRank compute vertex importance?
3. What do connected components tell you about graph structure?
4. What does a high triangle count indicate about a vertex?
5. How does subgraph() filter vertices and edges?
6. Why is GraphX primarily available in Scala rather than Python?
7. What is the difference between `inDegrees` and `outDegrees`?
8. How do you find the shortest path between two vertices?
9. What is a graph triplet and how do you access it?
10. How does GraphFrames differ from GraphX for Python users?
