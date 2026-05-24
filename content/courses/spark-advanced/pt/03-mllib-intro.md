---
title: "Introdução ao MLlib"
description: "Explore o Spark MLlib: transformadores, estimadores, pipelines e técnicas de engenharia de características para machine learning escalável"
order: 3
duration: "35-45 minutos"
difficulty: "avançado"
---

# Introdução ao MLlib

MLlib é a biblioteca de machine learning escalável do Spark. Ela fornece implementações distribuídas de algoritmos ML comuns, transformadores de características e infraestrutura de pipeline que executam no motor distribuído do Spark.

## Visão Geral do MLlib

MLlib é projetado em torno de duas abstrações principais:

| Abstração | Descrição | Exemplo |
|---|---|---|
| **Transformer** | Converte um DataFrame em outro | `Tokenizer`, `VectorAssembler`, modelo treinado |
| **Estimator** | Ajusta um modelo aos dados (produz Transformer) | `LogisticRegression`, `RandomForestClassifier` |
| **Pipeline** | Encadeia múltiplos estágios em um fluxo de trabalho | Tokenizer -> HashingTF -> LogisticRegression |

> [!NOTE]
> MLlib segue o padrão de design inspirado no scikit-learn: `Estimator.fit()` produz um `Transformer` (modelo), e `Transformer.transform()` aplica a transformação.

## Configuração do MLlib

```python
from pyspark.sql import SparkSession
from pyspark.ml.feature import (
    VectorAssembler, StringIndexer, OneHotEncoder,
    StandardScaler, Tokenizer, HashingTF, IDF
)
from pyspark.ml.classification import LogisticRegression, RandomForestClassifier
from pyspark.ml.regression import LinearRegression
from pyspark.ml.clustering import KMeans
from pyspark.ml.evaluation import BinaryClassificationEvaluator
from pyspark.ml import Pipeline

spark = SparkSession.builder \
    .appName("MLlibIntro") \
    .master("local[*]") \
    .getOrCreate()
```

## Engenharia de Características

### VectorAssembler

Combina múltiplas colunas em um único vetor de características.

```python
data = [
    (1, 0.5, 10, 100, "good"),
    (2, 0.8, 20, 200, "bad"),
    (3, 0.3, 15, 150, "good"),
    (4, 0.9, 25, 300, "bad")
]
df = spark.createDataFrame(data, ["id", "feature1", "feature2", "feature3", "label"])

assembler = VectorAssembler(
    inputCols=["feature1", "feature2", "feature3"],
    outputCol="features"
)

assembled_df = assembler.transform(df)
assembled_df.show(truncate=False)
# +---+--------+--------+--------+-----+-----------------+
# |id |feature1|feature2|feature3|label|features         |
# +---+--------+--------+--------+-----+-----------------+
# |1  |0.5     |10      |100     |good |[0.5,10.0,100.0] |
# |2  |0.8     |20      |200     |bad  |[0.8,20.0,200.0] |
# |3  |0.3     |15      |150     |good |[0.3,15.0,150.0] |
# |4  |0.9     |25      |300     |bad  |[0.9,25.0,300.0] |
# +---+--------+--------+--------+-----+-----------------+
```

> [!SUCCESS]
> VectorAssembler é o transformador de características mais crítico. Quase todos os pipelines ML no Spark o usam para consolidar características brutas em um único vetor de coluna exigido pelos algoritmos ML.

### StringIndexer

Converte rótulos categóricos de texto em índices numéricos.

```python
indexer = StringIndexer(
    inputCol="label",
    outputCol="label_index"
)
indexed_df = indexer.fit(assembled_df).transform(assembled_df)
indexed_df.show()
# +---+--------+--------+--------+-----+-----------------+-----------+
# |id |feature1|feature2|feature3|label|features         |label_index|
# +---+--------+--------+--------+-----+-----------------+-----------+
# |1  |0.5     |10      |100     |good |[0.5,10.0,100.0]|1.0        |
# |2  |0.8     |20      |200     |bad  |[0.8,20.0,200.0]|0.0        |
# ...
# +---+--------+--------+--------+-----+-----------------+-----------+
```

### OneHotEncoder

Cria colunas binárias a partir de índices categóricos.

```python
encoder = OneHotEncoder(
    inputCol="label_index",
    outputCol="label_ohe"
)
encoded_df = encoder.fit(indexed_df).transform(indexed_df)
```

### StandardScaler

Normaliza características numéricas para média zero e variância unitária.

```python
scaler = StandardScaler(
    inputCol="features",
    outputCol="scaled_features",
    withStd=True,
    withMean=True
)
scaler_model = scaler.fit(assembled_df)
scaled_df = scaler_model.transform(assembled_df)
```

### Extração de Características de Texto

```python
text_data = spark.createDataFrame([
    (1, "Spark MLlib is great for machine learning"),
    (2, "I love working with big data"),
    (3, "Apache Spark is a unified analytics engine")
], ["id", "text"])

# Tokenizar
tokenizer = Tokenizer(inputCol="text", outputCol="words")
tokenized = tokenizer.transform(text_data)

# HashingTF (frequência de termos)
hashing_tf = HashingTF(inputCol="words", outputCol="raw_features", numFeatures=100)
featurized = hashing_tf.transform(tokenized)

# IDF (frequência inversa de documento)
idf = IDF(inputCol="raw_features", outputCol="features")
idf_model = idf.fit(featurized)
result = idf_model.transform(featurized)
```

## Construção de um Modelo de Classificação

```python
# Preparar dados
data = spark.read.csv("data/sample.csv", header=True, inferSchema=True)

# Estágios de engenharia de características
stages = []

# Indexar colunas categóricas
categorical_cols = ["category", "region"]
for c in categorical_cols:
    indexer = StringIndexer(inputCol=c, outputCol=f"{c}_index")
    stages.append(indexer)

# Montar características
numeric_cols = ["age", "income", "score"]
feature_cols = [f"{c}_index" for c in categorical_cols] + numeric_cols
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
stages.append(assembler)

# Escalar características
scaler = StandardScaler(inputCol="features", outputCol="scaled_features")
stages.append(scaler)

# Criar pipeline
pipeline = Pipeline(stages=stages)
pipeline_model = pipeline.fit(data)
processed_data = pipeline_model.transform(data)

# Divisão treinamento-teste
train, test = processed_data.randomSplit([0.8, 0.2], seed=42)

# Treinar classificador
lr = LogisticRegression(
    featuresCol="scaled_features",
    labelCol="label",
    maxIter=100
)
model = lr.fit(train)

# Avaliar
predictions = model.transform(test)
evaluator = BinaryClassificationEvaluator(
    labelCol="label",
    metricName="areaUnderROC"
)
auc = evaluator.evaluate(predictions)
print(f"AUC de teste: {auc:.3f}")
```

## Visão Geral dos Algoritmos MLlib

| Categoria | Algoritmo | Caso de Uso |
|---|---|---|
| **Classificação** | Logistic Regression | Classificação binária |
| | Random Forest | Multiclasse, não linear |
| | Gradient Boosted Trees | Alta precisão |
| | Linear SVM | Grandes espaços de características |
| | Naive Bayes | Classificação de texto |
| **Regressão** | Linear Regression | Alvo contínuo |
| | Random Forest Regression | Regressão não linear |
| | Generalized Linear Regression | Distribuições não normais |
| **Clusterização** | K-Means | Segmentação de clientes |
| | Bisecting K-Means | Clusterização hierárquica |
| | Gaussian Mixture | Clusterização suave |
| **Filtragem Colaborativa** | ALS | Sistemas de recomendação |
| **Redução de Dimensionalidade** | PCA | Redução de características |
| | SVD | Fatoração de matrizes |

## Persistência de Modelos

```python
# Salvar pipeline
pipeline_model.write().overwrite().save("models/feature_pipeline")

# Salvar modelo treinado
model.write().overwrite().save("models/lr_model")

# Carregar modelos
from pyspark.ml import PipelineModel
from pyspark.ml.classification import LogisticRegressionModel

loaded_pipeline = PipelineModel.load("models/feature_pipeline")
loaded_model = LogisticRegressionModel.load("models/lr_model")

# Transformar novos dados
new_data = spark.read.csv("data/new_data.csv", header=True, inferSchema=True)
processed = loaded_pipeline.transform(new_data)
predictions = loaded_model.transform(processed)
```

> [!WARNING]
> Modelos MLlib salvam o estado completo do modelo, incluindo parâmetros aprendidos. O modelo salvo é autossuficiente e pode ser carregado em qualquer aplicação Spark sem retreinamento. Sempre versione seus modelos junto com seu código.

## Perguntas de Prática

1. Qual é a diferença entre um Transformer e um Estimator no MLlib?
2. Como o VectorAssembler prepara as características para os algoritmos ML?
3. Por que o escalonamento é importante para algoritmos baseados em distância como K-Means?
4. Qual é a diferença entre StringIndexer e OneHotEncoder?
5. Como o TF-IDF funciona para extração de características de texto?
6. O que `Pipeline` fornece além de executar estágios sequencialmente?
7. Como você salva e carrega um modelo ML treinado?
8. Quais métricas de avaliação o `BinaryClassificationEvaluator` suporta?
9. Como você lida com características categóricas de alta cardinalidade?
10. Como você combina múltiplos tipos de características (numéricas, categóricas, texto) em um pipeline?
