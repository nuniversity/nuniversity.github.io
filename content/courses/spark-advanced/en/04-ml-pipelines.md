---
title: "ML Pipelines and Hyperparameter Tuning"
description: "Build ML Pipelines, perform cross-validation, tune hyperparameters with grid/random search, and persist models"
order: 4
duration: "35-45 minutes"
difficulty: "advanced"
---

# ML Pipelines and Hyperparameter Tuning

ML Pipelines provide a modular, composable way to build machine learning workflows. Combined with automated hyperparameter tuning, they enable systematic model optimization at scale.

## ML Pipeline Architecture

A Pipeline chains multiple stages (Transformers + Estimators) into a single workflow.

```
Raw Data
   |
   v
StringIndexer (Transformer)  -> categorical to numeric
   |
   v
VectorAssembler (Transformer) -> consolidate features
   |
   v
StandardScaler (Transformer)  -> normalize
   |
   v
LogisticRegression (Estimator) -> train model
   |
   v
PipelineModel (Transformer)   -> ready for prediction
```

## Building a Complete Pipeline

```python
from pyspark.sql import SparkSession
from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    StringIndexer, VectorAssembler, StandardScaler, OneHotEncoder
)
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

spark = SparkSession.builder \
    .appName("MLPipeline") \
    .master("local[*]") \
    .getOrCreate()

data = spark.read.csv("data/customer_data.csv", header=True, inferSchema=True)
train, test = data.randomSplit([0.8, 0.2], seed=42)

# Define pipeline stages
categorical_cols = ["gender", "education", "occupation"]
numeric_cols = ["age", "income", "credit_score", "account_age_months"]

stages = []

# Index categorical columns
for c in categorical_cols:
    indexer = StringIndexer(inputCol=c, outputCol=f"{c}_indexed") \
        .setHandleInvalid("keep")
    stages.append(indexer)

# Encode indexed categories
for c in categorical_cols:
    encoder = OneHotEncoder(
        inputCol=f"{c}_indexed",
        outputCol=f"{c}_ohe"
    )
    stages.append(encoder)

# Assemble features
assembler = VectorAssembler(
    inputCols=[f"{c}_ohe" for c in categorical_cols] + numeric_cols,
    outputCol="unscaled_features"
)
stages.append(assembler)

# Scale features
scaler = StandardScaler(
    inputCol="unscaled_features",
    outputCol="features"
)
stages.append(scaler)

# Classifier
rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="churn",
    seed=42
)
stages.append(rf)

# Create pipeline
pipeline = Pipeline(stages=stages)
```

> [!SUCCESS]
> Pipelines ensure that exactly the same feature transformations are applied to training and test data. This eliminates a common source of data leakage and model evaluation errors.

## Fitting and Evaluating

```python
# Fit pipeline
pipeline_model = pipeline.fit(train)

# Transform test data
predictions = pipeline_model.transform(test)

# Evaluate
evaluator = MulticlassClassificationEvaluator(
    labelCol="churn",
    predictionCol="prediction",
    metricName="accuracy"
)

accuracy = evaluator.evaluate(predictions)
print(f"Test accuracy: {accuracy:.3f}")

# Detailed metrics
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

precision = evaluator.setMetricName("weightedPrecision").evaluate(predictions)
recall = evaluator.setMetricName("weightedRecall").evaluate(predictions)
f1 = evaluator.setMetricName("f1").evaluate(predictions)

print(f"Precision: {precision:.3f}")
print(f"Recall: {recall:.3f}")
print(f"F1: {f1:.3f}")
```

## Cross-Validation

Cross-validation splits training data into folds and evaluates the model on each fold.

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.evaluation import BinaryClassificationEvaluator

# Define parameter grid
param_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [20, 50, 100]) \
    .addGrid(rf.maxDepth, [5, 10, 15]) \
    .addGrid(rf.minInstancesPerNode, [1, 5, 10]) \
    .build()

print(f"Total parameter combinations: {len(param_grid)}")
# 3 x 3 x 3 = 27 combinations

# Configure cross-validator
crossval = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=BinaryClassificationEvaluator(
        labelCol="churn",
        metricName="areaUnderROC"
    ),
    numFolds=5,
    parallelism=3,  # Run folds in parallel
    seed=42
)

# Run cross-validation
print("Starting cross-validation...")
cv_model = crossval.fit(train)
print("Cross-validation complete.")
```

> [!WARNING]
> Cross-validation runs `numFolds × numParamCombinations` training jobs. With 5 folds and 27 parameter combinations, that's 135 training runs. Use `parallelism` to control concurrency, but be careful with resource usage.

### Best Model Selection

```python
# Best model from cross-validation
best_model = cv_model.bestModel
best_rf = best_model.stages[-1]  # Last stage is the classifier

print(f"Best parameters:")
print(f"  numTrees: {best_rf.getNumTrees}")
print(f"  maxDepth: {best_rf.getMaxDepth}")
print(f"  minInstancesPerNode: {best_rf.getMinInstancesPerNode}")

# Evaluate on test set
best_predictions = best_model.transform(test)
best_auc = BinaryClassificationEvaluator(
    labelCol="churn",
    metricName="areaUnderROC"
).evaluate(best_predictions)
print(f"Best model test AUC: {best_auc:.4f}")

# View cross-validation results
avg_metrics = cv_model.avgMetrics
for i, params in enumerate(param_grid):
    print(f"Params {i}: {params} -> AUC: {avg_metrics[i]:.4f}")
```

## Train-Validation Split (Alternative)

For faster tuning when data is abundant:

```python
from pyspark.ml.tuning import TrainValidationSplit

tvs = TrainValidationSplit(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=BinaryClassificationEvaluator(labelCol="churn"),
    trainRatio=0.8,
    parallelism=3
)

tvs_model = tvs.fit(train)
```

> [!NOTE]
> `TrainValidationSplit` uses a single train/validation split (vs. K-folds in CrossValidator). It's faster but produces more biased performance estimates. Use it for initial exploration and CrossValidator for final model selection.

## Random Search

For large parameter spaces, random search is more efficient than grid search.

```python
import random

def random_param_grid(base_estimator, n_iterations=20, seed=42):
    """Generate random hyperparameter combinations."""
    random.seed(seed)
    param_maps = []
    
    for _ in range(n_iterations):
        params = {
            base_estimator.numTrees: random.choice([20, 50, 100, 200]),
            base_estimator.maxDepth: random.randint(3, 20),
            base_estimator.minInstancesPerNode: random.randint(1, 20),
            base_estimator.maxBins: random.choice([32, 64, 128]),
            base_estimator.subsamplingRate: round(random.uniform(0.5, 1.0), 2)
        }
        param_maps.append(params)
    
    return ParamGridBuilder().baseOn(params).build()
    # Note: This is simplified — use ParamGridBuilder directly

# Alternative: Use grid with many values
random_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [20, 50, 100, 200]) \
    .addGrid(rf.maxDepth, [3, 5, 10, 15, 20]) \
    .addGrid(rf.minInstancesPerNode, [1, 5, 10, 20]) \
    .addGrid(rf.impurity, ["gini", "entropy"]) \
    .build()
```

## Model Persistence and Serving

```python
# Save pipeline and best model
best_model.write().overwrite().save("models/churn_pipeline_model")

# Save only the classifier
best_rf.write().overwrite().save("models/churn_rf_model")

# In production
from pyspark.ml import PipelineModel

loaded_model = PipelineModel.load("models/churn_pipeline_model")

# Transform new data
new_customers = spark.read.csv("data/new_customers.csv", header=True, inferSchema=True)
predictions = loaded_model.transform(new_customers)

# Save predictions
predictions.select("customer_id", "churn_prediction", "probability") \
    .write.mode("overwrite").parquet("data/churn_predictions/")
```

## Advanced Pipeline Patterns

### Branching Pipelines

```python
from pyspark.ml.feature import SQLTransformer

# Handle different feature groups separately
numeric_assembler = VectorAssembler(
    inputCols=["age", "income"],
    outputCol="numeric_features"
)

text_assembler = VectorAssembler(
    inputCols=["text_tfidf"],
    outputCol="text_features"
)

# Combine with VectorAssembler
final_assembler = VectorAssembler(
    inputCols=["numeric_features", "text_features"],
    outputCol="features"
)

# Note: ML Pipelines are linear. For complex DAGs, use separate pipelines
# and union/join features manually.
```

### Pipeline with Custom Transformers

```python
from pyspark.ml import Transformer
from pyspark.sql.functions import udf
from pyspark.sql.types import DoubleType

class CustomFeatureTransformer(Transformer):
    def __init__(self, inputCol=None, outputCol=None):
        super().__init__()
        self.inputCol = inputCol
        self.outputCol = outputCol
    
    def _transform(self, dataset):
        transform_udf = udf(self._compute, DoubleType())
        return dataset.withColumn(self.outputCol, transform_udf(dataset[self.inputCol]))
    
    def _compute(self, value):
        # Custom transformation logic
        return value * 2.0 if value else 0.0
```

## Practice Questions

1. What is the advantage of using a Pipeline over applying transformations manually?
2. How does CrossValidator split data and evaluate models?
3. What is the difference between CrossValidator and TrainValidationSplit?
4. How do you access the best model after cross-validation?
5. What is the risk of using too many folds (e.g., 10 folds)?
6. How does `parallelism` affect cross-validation performance?
7. When would you use random search over grid search?
8. How do you save and reload a full pipeline model?
9. How do you extract the best hyperparameters from `cv_model`?
10. How do you evaluate a multiclass classification model in Spark?
