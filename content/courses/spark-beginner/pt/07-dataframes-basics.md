---
title: "Fundamentos de DataFrames"
description: "Crie DataFrames a partir de RDDs, arquivos CSV e JSON; entenda inferência de esquema vs definição explícita de esquema"
order: 7
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Fundamentos de DataFrames

DataFrames são a principal API de alto nível no Spark moderno. Eles organizam dados em colunas nomeadas, similar a uma tabela em um banco de dados relacional ou um DataFrame na biblioteca pandas do Python. DataFrames fornecem melhor desempenho que RDDs graças ao otimizador Catalyst e ao motor de execução Tungsten.

## DataFrame vs RDD

| Aspecto | RDD | DataFrame |
|---|---|---|
| **Nível da API** | Baixo nível | Alto nível |
| **Esquema** | Sem esquema (objetos brutos) | Colunas nomeadas com tipos |
| **Otimização** | Otimização manual | Otimizador Catalyst |
| **Serialização** | Serialização Java/Python | Tungsten (formato binário) |
| **Desempenho** | Mais lento | 5-10x mais rápido |
| **Suporte SQL** | Não | Sim (Spark SQL) |
| **Caso de uso** | Dados não estruturados, lógica personalizada | Dados estruturados/semiestruturados |

> [!NOTE]
> No Spark 3.x, DataFrames são a API recomendada para a maioria dos casos de uso. Eles oferecem melhor desempenho, otimizações mais ricas e uma interface mais amigável.

## Criando DataFrames

### A partir de uma SparkSession

```python
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

spark = SparkSession.builder \
    .appName("DataFrameBasics") \
    .master("local[*]") \
    .getOrCreate()
```

### A partir de uma Lista de Rows

```python
from pyspark.sql import Row

data = [
    Row(name="Alice", age=34, dept="Engineering"),
    Row(name="Bob", age=28, dept="Design"),
    Row(name="Charlie", age=41, dept="Engineering"),
    Row(name="Diana", age=25, dept="Marketing")
]

df = spark.createDataFrame(data)
df.show()
# +-------+---+-----------+
# |   name|age|       dept|
# +-------+---+-----------+
# |  Alice| 34|Engineering|
# |    Bob| 28|     Design|
# |Charlie| 41|Engineering|
# |  Diana| 25|  Marketing|
# +-------+---+-----------+
```

### A partir de uma Lista de Dicionários Python

```python
data = [
    {"name": "Alice", "age": 34, "dept": "Engineering"},
    {"name": "Bob", "age": 28, "dept": "Design"}
]

df = spark.createDataFrame(data)
df.printSchema()
# root
#  |-- name: string (nullable = true)
#  |-- age: long (nullable = true)
#  |-- dept: string (nullable = true)
```

### A partir de um RDD

```python
rdd = sc.parallelize([
    ("Alice", 34, "Engineering"),
    ("Bob", 28, "Design"),
    ("Charlie", 41, "Engineering")
])

# Inferir nomes e tipos de colunas
df = rdd.toDF(["name", "age", "dept"])
df.show()
```

> [!SUCCESS]
> O método `toDF()` em RDDs é a ponte mais simples entre as APIs RDD e DataFrame. O esquema é inferido a partir dos tipos da primeira linha.

### A partir de Arquivos CSV

```python
# Inferência de esquema (Spark lê as primeiras linhas para inferir tipos)
df = spark.read.csv("data/people.csv", header=True, inferSchema=True)
df.show()
df.printSchema()

# Sem cabeçalho — Spark atribui nomes _c0, _c1, ...
df_no_header = spark.read.csv("data/people.csv", inferSchema=True)
df_no_header.show()
```

| Opção CSV | Padrão | Descrição |
|---|---|---|
| `header` | `false` | Primeira linha são nomes de colunas |
| `inferSchema` | `false` | Inferir tipos de coluna a partir dos dados |
| `sep` | `,` | Delimitador de campo |
| `quote` | `"` | Caractere de citação |
| `escape` | `\` | Caractere de escape |
| `mode` | `PERMISSIVE` | Modo de análise (PERMISSIVE, DROPMALFORMED, FAILFAST) |
| `nullValue` | `""` | Qual string representa nulo |
| `dateFormat` | `yyyy-MM-dd` | String de formato de data |

```python
# Opções CSV explícitas
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("sep", "|") \
    .option("nullValue", "NA") \
    .csv("data/pipe_delimited.txt")
```

### A partir de Arquivos JSON

```python
# JSON (cada linha é um objeto JSON)
df = spark.read.json("data/people.json")
df.show()
df.printSchema()

# JSON multi-linha (pretty-printed)
df = spark.read \
    .option("multiLine", "true") \
    .json("data/people_pretty.json")
```

> [!NOTE]
> Spark espera arquivos JSON no formato "JSON Lines" onde cada linha é um objeto JSON separado. Para JSON pretty-printed (múltiplas linhas por objeto), use `multiLine=true`.

## Inferência de Esquema vs Esquema Explícito

### Inferência de Esquema

Spark lê uma amostra dos dados para determinar nomes e tipos de colunas.

```python
df_inferred = spark.read \
    .option("inferSchema", "true") \
    .option("samplingRatio", "0.1") \
    .csv("data/large_file.csv")
```

**Vantagens**: Rápido, sem manutenção de código, bom para exploração
**Desvantagens**:
- Passagem extra sobre os dados (até 10% mais tempo)
- Pode inferir tipos errados (string em vez de int se as primeiras 1000 linhas forem nulas)
- Sobrecarga de desempenho

> [!WARNING]
> A inferência de esquema lê uma amostra dos dados para determinar tipos. Se a amostra não for representativa (por exemplo, todos os valores nulos nas primeiras linhas), você obtém tipos incorretos. Sempre verifique esquemas inferidos em dados de produção.

### Esquema Explícito

Defina o esquema programaticamente para controle total e melhor desempenho.

```python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType

schema = StructType([
    StructField("name", StringType(), nullable=False),
    StructField("age", IntegerType(), nullable=True),
    StructField("salary", DoubleType(), nullable=True),
    StructField("dept", StringType(), nullable=False)
])

df = spark.read \
    .schema(schema) \
    .csv("data/people.csv")
print(df.printSchema())
```

**Vantagens**:
- Sem passagem extra para amostragem
- Segurança de tipos — sem mudanças surpresa de tipo
- Melhor desempenho (sem sobrecarga de inferência)

**Desvantagens**:
- Mais código para escrever
- Esquema deve corresponder exatamente aos dados

### Sintaxe de String DDL

Spark suporta strings DDL para definições compactas de esquema.

```python
ddl_schema = "name STRING, age INT, salary DOUBLE, dept STRING"

df = spark.read \
    .schema(ddl_schema) \
    .csv("data/people.csv")
```

## Explorando o Esquema do DataFrame

```python
# Imprimir árvore do esquema
df.printSchema()

# Obter esquema como objeto StructType
schema = df.schema
print(schema)

# Obter nomes de colunas
print(df.columns)  # ['name', 'age', 'dept']

# Obter tipos de dados
for field in df.schema.fields:
    print(f"{field.name}: {field.dataType}")
```

## Tipos de Dados no Spark

| DataType | Descrição | Exemplo |
|---|---|---|
| `StringType` | Strings de texto | `"hello"` |
| `IntegerType` | Inteiro de 4 bytes | `42` |
| `LongType` | Inteiro de 8 bytes | `10000000000L` |
| `FloatType` | Float de 4 bytes | `3.14f` |
| `DoubleType` | Float de 8 bytes | `3.14159265` |
| `BooleanType` | Verdadeiro/Falso | `True` |
| `DateType` | Apenas data | `2024-01-15` |
| `TimestampType` | Data e hora | `2024-01-15 14:30:00` |
| `ArrayType` | Lista de elementos | `[1, 2, 3]` |
| `MapType` | Pares chave-valor | `{"a": 1}` |
| `StructType` | Estrutura aninhada | `(a: 1, b: "x")` |

## Lidando com Valores Nulos

```python
# Criar DataFrame com nulos
data = [
    (1, "Alice", None),
    (2, None, 50000.0),
    (3, "Bob", 60000.0)
]
df = spark.createDataFrame(data, ["id", "name", "salary"])

# Remover linhas com qualquer nulo
df.dropna().show()

# Remover linhas onde colunas específicas são nulas
df.dropna(subset=["name", "salary"]).show()

# Preencher nulos com um valor
df.fillna({"name": "Unknown", "salary": 0.0}).show()
```

## Principais Conclusões

1. DataFrames são a API Spark recomendada para dados estruturados
2. Crie DataFrames a partir de RDDs, CSV, JSON, coleções Python e bancos de dados
3. Inferência de esquema é conveniente, mas perigosa para produção
4. Esquemas explícitos fornecem segurança de tipos e melhor desempenho
5. Strings DDL oferecem definições compactas de esquema
6. Funções de tratamento de nulos (`dropna`, `fillna`) gerenciam dados ausentes

## Perguntas de Prática

1. Quais vantagens os DataFrames têm sobre os RDDs?
2. Como o otimizador Catalyst melhora o desempenho do DataFrame?
3. Qual é a diferença entre `toDF()` e `createDataFrame()`?
4. Por que a inferência de esquema é potencialmente perigosa para pipelines de produção?
5. Como você define um esquema com uma string DDL?
6. Quais opções CSV controlam o cabeçalho e o tratamento do delimitador?
7. Quando você usaria `multiLine=true` para arquivos JSON?
8. O que é o formato "JSON Lines" e por que o Spark o prefere?
9. Como você verifica o esquema de um DataFrame existente?
10. O que acontece se você definir `inferSchema=false` sem fornecer um esquema?
