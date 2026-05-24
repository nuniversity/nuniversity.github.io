---
title: "Pipelines ML y Ajuste de Hiperparámetros"
description: "Construye Pipelines ML, realiza validación cruzada, ajusta hiperparámetros con búsqueda en cuadrícula/aleatoria y persiste modelos"
order: 4
duration: "35-45 minutos"
difficulty: "avanzado"
---

# Pipelines ML y Ajuste de Hiperparámetros

Los Pipelines ML proporcionan una forma modular y componible de construir flujos de trabajo de machine learning. Combinados con el ajuste automatizado de hiperparámetros, permiten la optimización sistemática de modelos a escala.

## Arquitectura de Pipeline ML

Un Pipeline encadena múltiples etapas (Transformers + Estimators) en un solo flujo de trabajo.

```
Datos Crudos
   |
   v
StringIndexer (Transformer)  -> categórico a numérico
   |
   v
VectorAssembler (Transformer) -> consolidar características
   |
   v
StandardScaler (Transformer)  -> normalizar
   |
   v
LogisticRegression (Estimator) -> entrenar modelo
   |
   v
PipelineModel (Transformer)   -> listo para predicción
```

## Construcción de un Pipeline Completo

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

# Definir etapas del pipeline
categorical_cols = ["gender", "education", "occupation"]
numeric_cols = ["age", "income", "credit_score", "account_age_months"]

stages = []

# Indexar columnas categóricas
for c in categorical_cols:
    indexer = StringIndexer(inputCol=c, outputCol=f"{c}_indexed") \
        .setHandleInvalid("keep")
    stages.append(indexer)

# Codificar categorías indexadas
for c in categorical_cols:
    encoder = OneHotEncoder(
        inputCol=f"{c}_indexed",
        outputCol=f"{c}_ohe"
    )
    stages.append(encoder)

# Ensamblar características
assembler = VectorAssembler(
    inputCols=[f"{c}_ohe" for c in categorical_cols] + numeric_cols,
    outputCol="unscaled_features"
)
stages.append(assembler)

# Escalar características
scaler = StandardScaler(
    inputCol="unscaled_features",
    outputCol="features"
)
stages.append(scaler)

# Clasificador
rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="churn",
    seed=42
)
stages.append(rf)

# Crear pipeline
pipeline = Pipeline(stages=stages)
```

> [!SUCCESS]
> Los pipelines aseguran que exactamente las mismas transformaciones de características se aplican a los datos de entrenamiento y prueba. Esto elimina una fuente común de fuga de datos y errores de evaluación de modelos.

## Ajuste y Evaluación

```python
# Ajustar pipeline
pipeline_model = pipeline.fit(train)

# Transformar datos de prueba
predictions = pipeline_model.transform(test)

# Evaluar
evaluator = MulticlassClassificationEvaluator(
    labelCol="churn",
    predictionCol="prediction",
    metricName="accuracy"
)

accuracy = evaluator.evaluate(predictions)
print(f"Precisión de prueba: {accuracy:.3f}")

# Métricas detalladas
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

precision = evaluator.setMetricName("weightedPrecision").evaluate(predictions)
recall = evaluator.setMetricName("weightedRecall").evaluate(predictions)
f1 = evaluator.setMetricName("f1").evaluate(predictions)

print(f"Precisión: {precision:.3f}")
print(f"Recall: {recall:.3f}")
print(f"F1: {f1:.3f}")
```

## Validación Cruzada

La validación cruzada divide los datos de entrenamiento en pliegues y evalúa el modelo en cada pliegue.

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.evaluation import BinaryClassificationEvaluator

# Definir cuadrícula de parámetros
param_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [20, 50, 100]) \
    .addGrid(rf.maxDepth, [5, 10, 15]) \
    .addGrid(rf.minInstancesPerNode, [1, 5, 10]) \
    .build()

print(f"Combinaciones totales de parámetros: {len(param_grid)}")
# 3 x 3 x 3 = 27 combinaciones

# Configurar validador cruzado
crossval = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=BinaryClassificationEvaluator(
        labelCol="churn",
        metricName="areaUnderROC"
    ),
    numFolds=5,
    parallelism=3,  # Ejecutar pliegues en paralelo
    seed=42
)

# Ejecutar validación cruzada
print("Iniciando validación cruzada...")
cv_model = crossval.fit(train)
print("Validación cruzada completa.")
```

> [!WARNING]
> La validación cruzada ejecuta `numFolds × numParamCombinations` trabajos de entrenamiento. Con 5 pliegues y 27 combinaciones de parámetros, eso son 135 ejecuciones de entrenamiento. Usa `parallelism` para controlar la concurrencia, pero ten cuidado con el uso de recursos.

### Selección del Mejor Modelo

```python
# Mejor modelo de la validación cruzada
best_model = cv_model.bestModel
best_rf = best_model.stages[-1]  # La última etapa es el clasificador

print(f"Mejores parámetros:")
print(f"  numTrees: {best_rf.getNumTrees}")
print(f"  maxDepth: {best_rf.getMaxDepth}")
print(f"  minInstancesPerNode: {best_rf.getMinInstancesPerNode}")

# Evaluar en conjunto de prueba
best_predictions = best_model.transform(test)
best_auc = BinaryClassificationEvaluator(
    labelCol="churn",
    metricName="areaUnderROC"
).evaluate(best_predictions)
print(f"AUC del mejor modelo en prueba: {best_auc:.4f}")

# Ver resultados de validación cruzada
avg_metrics = cv_model.avgMetrics
for i, params in enumerate(param_grid):
    print(f"Params {i}: {params} -> AUC: {avg_metrics[i]:.4f}")
```

## División Entrenamiento-Validación (Alternativa)

Para ajuste más rápido cuando los datos son abundantes:

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
> `TrainValidationSplit` usa una sola división entrenamiento/validación (vs. K-pliegues en CrossValidator). Es más rápido pero produce estimaciones de rendimiento más sesgadas. Úsalo para exploración inicial y CrossValidator para la selección final del modelo.

## Búsqueda Aleatoria

Para espacios de parámetros grandes, la búsqueda aleatoria es más eficiente que la búsqueda en cuadrícula.

```python
import random

def random_param_grid(base_estimator, n_iterations=20, seed=42):
    """Generar combinaciones aleatorias de hiperparámetros."""
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
    # Nota: Esto está simplificado — usa ParamGridBuilder directamente

# Alternativa: Usar cuadrícula con muchos valores
random_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [20, 50, 100, 200]) \
    .addGrid(rf.maxDepth, [3, 5, 10, 15, 20]) \
    .addGrid(rf.minInstancesPerNode, [1, 5, 10, 20]) \
    .addGrid(rf.impurity, ["gini", "entropy"]) \
    .build()
```

## Persistencia y Servicio de Modelos

```python
# Guardar pipeline y mejor modelo
best_model.write().overwrite().save("models/churn_pipeline_model")

# Guardar solo el clasificador
best_rf.write().overwrite().save("models/churn_rf_model")

# En producción
from pyspark.ml import PipelineModel

loaded_model = PipelineModel.load("models/churn_pipeline_model")

# Transformar nuevos datos
new_customers = spark.read.csv("data/new_customers.csv", header=True, inferSchema=True)
predictions = loaded_model.transform(new_customers)

# Guardar predicciones
predictions.select("customer_id", "churn_prediction", "probability") \
    .write.mode("overwrite").parquet("data/churn_predictions/")
```

## Patrones Avanzados de Pipeline

### Pipelines Ramificados

```python
from pyspark.ml.feature import SQLTransformer

# Manejar diferentes grupos de características por separado
numeric_assembler = VectorAssembler(
    inputCols=["age", "income"],
    outputCol="numeric_features"
)

text_assembler = VectorAssembler(
    inputCols=["text_tfidf"],
    outputCol="text_features"
)

# Combinar con VectorAssembler
final_assembler = VectorAssembler(
    inputCols=["numeric_features", "text_features"],
    outputCol="features"
)

# Nota: Los Pipelines ML son lineales. Para DAGs complejos, usa pipelines separados
# y une fusiona las características manualmente.
```

### Pipeline con Transformadores Personalizados

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
        # Lógica de transformación personalizada
        return value * 2.0 if value else 0.0
```

## Preguntas de Práctica

1. ¿Cuál es la ventaja de usar un Pipeline sobre aplicar transformaciones manualmente?
2. ¿Cómo divide CrossValidator los datos y evalúa los modelos?
3. ¿Cuál es la diferencia entre CrossValidator y TrainValidationSplit?
4. ¿Cómo accedes al mejor modelo después de la validación cruzada?
5. ¿Cuál es el riesgo de usar demasiados pliegues (ej., 10 pliegues)?
6. ¿Cómo afecta `parallelism` al rendimiento de la validación cruzada?
7. ¿Cuándo usarías búsqueda aleatoria sobre búsqueda en cuadrícula?
8. ¿Cómo guardas y recargas un modelo de pipeline completo?
9. ¿Cómo extraes los mejores hiperparámetros de `cv_model`?
10. ¿Cómo evalúas un modelo de clasificación multiclase en Spark?
