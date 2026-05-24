---
title: "Introduction to MLlib"
description: "Explore Spark MLlib: transformers, estimators, pipelines, and feature engineering techniques for scalable machine learning"
order: 3
duration: "35-45 minutes"
difficulty: "advanced"
---

# Introduction to MLlib

MLlib is Spark's scalable machine learning library. It provides distributed implementations of common ML algorithms, feature transformers, and pipeline infrastructure that run on Spark's distributed engine.

## MLlib Overview

MLlib is designed around two core abstractions:

| Abstraction | Description | Example |
|---|---|---|
| **Transformer** | Converts one DataFrame to another | `Tokenizer`, `VectorAssembler`, trained model |
| **Estimator** | Fits a model to data (produces Transformer) | `LogisticRegression`, `RandomForestClassifier` |
| **Pipeline** | Chains multiple stages into one workflow | Tokenizer -> HashingTF -> LogisticRegression |

> [!NOTE]
> MLlib follows the scikit-learn-inspired design pattern: `Estimator.fit()` produces a `Transformer` (model), and `Transformer.transform()` applies the transformation.

## Setting Up MLlib

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

## Feature Engineering

### VectorAssembler

Combines multiple columns into a single feature vector column.

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
> VectorAssembler is the most critical feature transformer. Almost every ML pipeline in Spark uses it to consolidate raw features into a single vector column required by ML algorithms.

### StringIndexer

Converts categorical string labels to numeric indices.

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

Creates binary columns from categorical indices.

```python
encoder = OneHotEncoder(
    inputCol="label_index",
    outputCol="label_ohe"
)
encoded_df = encoder.fit(indexed_df).transform(indexed_df)
```

### StandardScaler

Normalizes numeric features to zero mean and unit variance.

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

### Text Feature Extraction

```python
text_data = spark.createDataFrame([
    (1, "Spark MLlib is great for machine learning"),
    (2, "I love working with big data"),
    (3, "Apache Spark is a unified analytics engine")
], ["id", "text"])

# Tokenize
tokenizer = Tokenizer(inputCol="text", outputCol="words")
tokenized = tokenizer.transform(text_data)

# HashingTF (term frequency)
hashing_tf = HashingTF(inputCol="words", outputCol="raw_features", numFeatures=100)
featurized = hashing_tf.transform(tokenized)

# IDF (inverse document frequency)
idf = IDF(inputCol="raw_features", outputCol="features")
idf_model = idf.fit(featurized)
result = idf_model.transform(featurized)
```

## Building a Classification Model

```python
# Prepare data
data = spark.read.csv("data/sample.csv", header=True, inferSchema=True)

# Feature engineering stages
stages = []

# Index categorical columns
categorical_cols = ["category", "region"]
for c in categorical_cols:
    indexer = StringIndexer(inputCol=c, outputCol=f"{c}_index")
    stages.append(indexer)

# Assemble features
numeric_cols = ["age", "income", "score"]
feature_cols = [f"{c}_index" for c in categorical_cols] + numeric_cols
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
stages.append(assembler)

# Scale features
scaler = StandardScaler(inputCol="features", outputCol="scaled_features")
stages.append(scaler)

# Create pipeline
pipeline = Pipeline(stages=stages)
pipeline_model = pipeline.fit(data)
processed_data = pipeline_model.transform(data)

# Train-test split
train, test = processed_data.randomSplit([0.8, 0.2], seed=42)

# Train classifier
lr = LogisticRegression(
    featuresCol="scaled_features",
    labelCol="label",
    maxIter=100
)
model = lr.fit(train)

# Evaluate
predictions = model.transform(test)
evaluator = BinaryClassificationEvaluator(
    labelCol="label",
    metricName="areaUnderROC"
)
auc = evaluator.evaluate(predictions)
print(f"Test AUC: {auc:.3f}")
```

## MLlib Algorithm Overview

| Category | Algorithm | Use Case |
|---|---|---|
| **Classification** | Logistic Regression | Binary classification |
| | Random Forest | Multi-class, non-linear |
| | Gradient Boosted Trees | High accuracy |
| | Linear SVM | Large feature spaces |
| | Naive Bayes | Text classification |
| **Regression** | Linear Regression | Continuous target |
| | Random Forest Regression | Non-linear regression |
| | Generalized Linear Regression | Non-normal distributions |
| **Clustering** | K-Means | Customer segmentation |
| | Bisecting K-Means | Hierarchical clustering |
| | Gaussian Mixture | Soft clustering |
| **Collaborative Filtering** | ALS | Recommendation systems |
| **Dimensionality Reduction** | PCA | Feature reduction |
| | SVD | Matrix factorization |

## Model Persistence

```python
# Save pipeline model
pipeline_model.write().overwrite().save("models/feature_pipeline")

# Save trained model
model.write().overwrite().save("models/lr_model")

# Load models
from pyspark.ml import PipelineModel
from pyspark.ml.classification import LogisticRegressionModel

loaded_pipeline = PipelineModel.load("models/feature_pipeline")
loaded_model = LogisticRegressionModel.load("models/lr_model")

# Transform new data
new_data = spark.read.csv("data/new_data.csv", header=True, inferSchema=True)
processed = loaded_pipeline.transform(new_data)
predictions = loaded_model.transform(processed)
```

> [!WARNING]
> MLlib models save the full model state including learned parameters. The saved model is self-contained and can be loaded in any Spark application without retraining. Always version your models alongside your code.

## Practice Questions

1. What is the difference between a Transformer and an Estimator in MLlib?
2. How does VectorAssembler prepare features for ML algorithms?
3. Why is scaling important for distance-based algorithms like K-Means?
4. What is the difference between StringIndexer and OneHotEncoder?
5. How does TF-IDF work for text feature extraction?
6. What does `Pipeline` provide beyond running stages sequentially?
7. How do you save and load a trained ML model?
8. What evaluation metrics does `BinaryClassificationEvaluator` support?
9. How do you handle categorical features with high cardinality?
10. How do you combine multiple feature types (numeric, categorical, text) in one pipeline?
