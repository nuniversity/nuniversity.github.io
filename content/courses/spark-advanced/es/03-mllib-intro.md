---
title: "Introducción a MLlib"
description: "Explora Spark MLlib: transformadores, estimadores, pipelines y técnicas de ingeniería de características para machine learning escalable"
order: 3
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Introducción a MLlib

MLlib es la biblioteca de machine learning escalable de Spark. Proporciona implementaciones distribuidas de algoritmos ML comunes, transformadores de características e infraestructura de pipeline que se ejecutan en el motor distribuido de Spark.

## Descripción General de MLlib

MLlib está diseñado alrededor de dos abstracciones principales:

| Abstracción | Descripción | Ejemplo |
|---|---|---|
| **Transformer** | Convierte un DataFrame en otro | `Tokenizer`, `VectorAssembler`, modelo entrenado |
| **Estimator** | Ajusta un modelo a los datos (produce Transformer) | `LogisticRegression`, `RandomForestClassifier` |
| **Pipeline** | Encadena múltiples etapas en un flujo de trabajo | Tokenizer -> HashingTF -> LogisticRegression |

> [!NOTE]
> MLlib sigue el patrón de diseño inspirado en scikit-learn: `Estimator.fit()` produce un `Transformer` (modelo), y `Transformer.transform()` aplica la transformación.

## Configuración de MLlib

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

## Ingeniería de Características

### VectorAssembler

Combina múltiples columnas en un único vector de características.

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
> VectorAssembler es el transformador de características más crítico. Casi todos los pipelines ML en Spark lo usan para consolidar características sin procesar en un único vector de columna requerido por los algoritmos ML.

### StringIndexer

Convierte etiquetas categóricas de texto en índices numéricos.

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

Crea columnas binarias a partir de índices categóricos.

```python
encoder = OneHotEncoder(
    inputCol="label_index",
    outputCol="label_ohe"
)
encoded_df = encoder.fit(indexed_df).transform(indexed_df)
```

### StandardScaler

Normaliza características numéricas a media cero y varianza unitaria.

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

### Extracción de Características de Texto

```python
text_data = spark.createDataFrame([
    (1, "Spark MLlib is great for machine learning"),
    (2, "I love working with big data"),
    (3, "Apache Spark is a unified analytics engine")
], ["id", "text"])

# Tokenizar
tokenizer = Tokenizer(inputCol="text", outputCol="words")
tokenized = tokenizer.transform(text_data)

# HashingTF (frecuencia de términos)
hashing_tf = HashingTF(inputCol="words", outputCol="raw_features", numFeatures=100)
featurized = hashing_tf.transform(tokenized)

# IDF (frecuencia inversa de documento)
idf = IDF(inputCol="raw_features", outputCol="features")
idf_model = idf.fit(featurized)
result = idf_model.transform(featurized)
```

## Construcción de un Modelo de Clasificación

```python
# Preparar datos
data = spark.read.csv("data/sample.csv", header=True, inferSchema=True)

# Etapas de ingeniería de características
stages = []

# Indexar columnas categóricas
categorical_cols = ["category", "region"]
for c in categorical_cols:
    indexer = StringIndexer(inputCol=c, outputCol=f"{c}_index")
    stages.append(indexer)

# Ensamblar características
numeric_cols = ["age", "income", "score"]
feature_cols = [f"{c}_index" for c in categorical_cols] + numeric_cols
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
stages.append(assembler)

# Escalar características
scaler = StandardScaler(inputCol="features", outputCol="scaled_features")
stages.append(scaler)

# Crear pipeline
pipeline = Pipeline(stages=stages)
pipeline_model = pipeline.fit(data)
processed_data = pipeline_model.transform(data)

# División entrenamiento-prueba
train, test = processed_data.randomSplit([0.8, 0.2], seed=42)

# Entrenar clasificador
lr = LogisticRegression(
    featuresCol="scaled_features",
    labelCol="label",
    maxIter=100
)
model = lr.fit(train)

# Evaluar
predictions = model.transform(test)
evaluator = BinaryClassificationEvaluator(
    labelCol="label",
    metricName="areaUnderROC"
)
auc = evaluator.evaluate(predictions)
print(f"AUC de prueba: {auc:.3f}")
```

## Resumen de Algoritmos MLlib

| Categoría | Algoritmo | Caso de Uso |
|---|---|---|
| **Clasificación** | Logistic Regression | Clasificación binaria |
| | Random Forest | Multiclase, no lineal |
| | Gradient Boosted Trees | Alta precisión |
| | Linear SVM | Grandes espacios de características |
| | Naive Bayes | Clasificación de texto |
| **Regresión** | Linear Regression | Objetivo continuo |
| | Random Forest Regression | Regresión no lineal |
| | Generalized Linear Regression | Distribuciones no normales |
| **Clustering** | K-Means | Segmentación de clientes |
| | Bisecting K-Means | Clustering jerárquico |
| | Gaussian Mixture | Clustering suave |
| **Filtrado Colaborativo** | ALS | Sistemas de recomendación |
| **Reducción de Dimensionalidad** | PCA | Reducción de características |
| | SVD | Factorización de matrices |

## Persistencia de Modelos

```python
# Guardar pipeline
pipeline_model.write().overwrite().save("models/feature_pipeline")

# Guardar modelo entrenado
model.write().overwrite().save("models/lr_model")

# Cargar modelos
from pyspark.ml import PipelineModel
from pyspark.ml.classification import LogisticRegressionModel

loaded_pipeline = PipelineModel.load("models/feature_pipeline")
loaded_model = LogisticRegressionModel.load("models/lr_model")

# Transformar nuevos datos
new_data = spark.read.csv("data/new_data.csv", header=True, inferSchema=True)
processed = loaded_pipeline.transform(new_data)
predictions = loaded_model.transform(processed)
```

> [!WARNING]
> Los modelos MLlib guardan el estado completo del modelo, incluidos los parámetros aprendidos. El modelo guardado es autónomo y se puede cargar en cualquier aplicación Spark sin reentrenamiento. Siempre versiona tus modelos junto con tu código.

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre un Transformer y un Estimator en MLlib?
2. ¿Cómo prepara VectorAssembler las características para los algoritmos ML?
3. ¿Por qué es importante el escalado para algoritmos basados en distancia como K-Means?
4. ¿Cuál es la diferencia entre StringIndexer y OneHotEncoder?
5. ¿Cómo funciona TF-IDF para la extracción de características de texto?
6. ¿Qué proporciona `Pipeline` más allá de ejecutar etapas secuencialmente?
7. ¿Cómo guardas y cargas un modelo ML entrenado?
8. ¿Qué métricas de evaluación soporta `BinaryClassificationEvaluator`?
9. ¿Cómo manejas características categóricas con alta cardinalidad?
10. ¿Cómo combinas múltiples tipos de características (numéricas, categóricas, texto) en un pipeline?
