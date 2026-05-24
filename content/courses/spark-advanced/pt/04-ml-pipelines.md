---
title: "Pipelines ML e Ajuste de Hiperparâmetros"
description: "Construa Pipelines ML, realize validação cruzada, ajuste hiperparâmetros com busca em grade/aleatória e persista modelos"
order: 4
duration: "35-45 minutos"
difficulty: "avançado"
---

# Pipelines ML e Ajuste de Hiperparâmetros

Os Pipelines ML fornecem uma forma modular e componível de construir fluxos de trabalho de machine learning. Combinados com o ajuste automatizado de hiperparâmetros, permitem a otimização sistemática de modelos em escala.

## Arquitetura de Pipeline ML

Um Pipeline encadeia múltiplos estágios (Transformers + Estimators) em um único fluxo de trabalho.

```
Dados Crus
   |
   v
StringIndexer (Transformer)  -> categórico para numérico
   |
   v
VectorAssembler (Transformer) -> consolidar características
   |
   v
StandardScaler (Transformer)  -> normalizar
   |
   v
LogisticRegression (Estimator) -> treinar modelo
   |
   v
PipelineModel (Transformer)   -> pronto para predição
```

## Construção de um Pipeline Completo

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

# Definir estágios do pipeline
categorical_cols = ["gender", "education", "occupation"]
numeric_cols = ["age", "income", "credit_score", "account_age_months"]

stages = []

# Indexar colunas categóricas
for c in categorical_cols:
    indexer = StringIndexer(inputCol=c, outputCol=f"{c}_indexed") \
        .setHandleInvalid("keep")
    stages.append(indexer)

# Codificar categorias indexadas
for c in categorical_cols:
    encoder = OneHotEncoder(
        inputCol=f"{c}_indexed",
        outputCol=f"{c}_ohe"
    )
    stages.append(encoder)

# Montar características
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

# Classificador
rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="churn",
    seed=42
)
stages.append(rf)

# Criar pipeline
pipeline = Pipeline(stages=stages)
```

> [!SUCCESS]
> Pipelines garantem que exatamente as mesmas transformações de características são aplicadas aos dados de treinamento e teste. Isso elimina uma fonte comum de vazamento de dados e erros de avaliação de modelos.

## Ajuste e Avaliação

```python
# Ajustar pipeline
pipeline_model = pipeline.fit(train)

# Transformar dados de teste
predictions = pipeline_model.transform(test)

# Avaliar
evaluator = MulticlassClassificationEvaluator(
    labelCol="churn",
    predictionCol="prediction",
    metricName="accuracy"
)

accuracy = evaluator.evaluate(predictions)
print(f"Acurácia de teste: {accuracy:.3f}")

# Métricas detalhadas
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

precision = evaluator.setMetricName("weightedPrecision").evaluate(predictions)
recall = evaluator.setMetricName("weightedRecall").evaluate(predictions)
f1 = evaluator.setMetricName("f1").evaluate(predictions)

print(f"Precisão: {precision:.3f}")
print(f"Recall: {recall:.3f}")
print(f"F1: {f1:.3f}")
```

## Validação Cruzada

A validação cruzada divide os dados de treinamento em dobras e avalia o modelo em cada dobra.

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.evaluation import BinaryClassificationEvaluator

# Definir grade de parâmetros
param_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [20, 50, 100]) \
    .addGrid(rf.maxDepth, [5, 10, 15]) \
    .addGrid(rf.minInstancesPerNode, [1, 5, 10]) \
    .build()

print(f"Combinações totais de parâmetros: {len(param_grid)}")
# 3 x 3 x 3 = 27 combinações

# Configurar validador cruzado
crossval = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=BinaryClassificationEvaluator(
        labelCol="churn",
        metricName="areaUnderROC"
    ),
    numFolds=5,
    parallelism=3,  # Executar dobras em paralelo
    seed=42
)

# Executar validação cruzada
print("Iniciando validação cruzada...")
cv_model = crossval.fit(train)
print("Validação cruzada completa.")
```

> [!WARNING]
> A validação cruzada executa `numFolds × numParamCombinations` trabalhos de treinamento. Com 5 dobras e 27 combinações de parâmetros, são 135 execuções de treinamento. Use `parallelism` para controlar a concorrência, mas tome cuidado com o uso de recursos.

### Seleção do Melhor Modelo

```python
# Melhor modelo da validação cruzada
best_model = cv_model.bestModel
best_rf = best_model.stages[-1]  # O último estágio é o classificador

print(f"Melhores parâmetros:")
print(f"  numTrees: {best_rf.getNumTrees}")
print(f"  maxDepth: {best_rf.getMaxDepth}")
print(f"  minInstancesPerNode: {best_rf.getMinInstancesPerNode}")

# Avaliar no conjunto de teste
best_predictions = best_model.transform(test)
best_auc = BinaryClassificationEvaluator(
    labelCol="churn",
    metricName="areaUnderROC"
).evaluate(best_predictions)
print(f"AUC do melhor modelo no teste: {best_auc:.4f}")

# Ver resultados da validação cruzada
avg_metrics = cv_model.avgMetrics
for i, params in enumerate(param_grid):
    print(f"Params {i}: {params} -> AUC: {avg_metrics[i]:.4f}")
```

## Divisão Treinamento-Validation (Alternativa)

Para ajuste mais rápido quando os dados são abundantes:

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
> `TrainValidationSplit` usa uma única divisão treinamento/validação (vs. K-dobras no CrossValidator). É mais rápido mas produz estimativas de desempenho mais enviesadas. Use-o para exploração inicial e CrossValidator para a seleção final do modelo.

## Busca Aleatória

Para espaços de parâmetros grandes, a busca aleatória é mais eficiente que a busca em grade.

```python
import random

def random_param_grid(base_estimator, n_iterations=20, seed=42):
    """Gerar combinações aleatórias de hiperparâmetros."""
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
    # Nota: Isto está simplificado — use ParamGridBuilder diretamente

# Alternativa: Usar grade com muitos valores
random_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [20, 50, 100, 200]) \
    .addGrid(rf.maxDepth, [3, 5, 10, 15, 20]) \
    .addGrid(rf.minInstancesPerNode, [1, 5, 10, 20]) \
    .addGrid(rf.impurity, ["gini", "entropy"]) \
    .build()
```

## Persistência e Serviço de Modelos

```python
# Salvar pipeline e melhor modelo
best_model.write().overwrite().save("models/churn_pipeline_model")

# Salvar apenas o classificador
best_rf.write().overwrite().save("models/churn_rf_model")

# Em produção
from pyspark.ml import PipelineModel

loaded_model = PipelineModel.load("models/churn_pipeline_model")

# Transformar novos dados
new_customers = spark.read.csv("data/new_customers.csv", header=True, inferSchema=True)
predictions = loaded_model.transform(new_customers)

# Salvar predições
predictions.select("customer_id", "churn_prediction", "probability") \
    .write.mode("overwrite").parquet("data/churn_predictions/")
```

## Padrões Avançados de Pipeline

### Pipelines Ramificados

```python
from pyspark.ml.feature import SQLTransformer

# Lidar com diferentes grupos de características separadamente
numeric_assembler = VectorAssembler(
    inputCols=["age", "income"],
    outputCol="numeric_features"
)

text_assembler = VectorAssembler(
    inputCols=["text_tfidf"],
    outputCol="text_features"
)

# Combinar com VectorAssembler
final_assembler = VectorAssembler(
    inputCols=["numeric_features", "text_features"],
    outputCol="features"
)

# Nota: Pipelines ML são lineares. Para DAGs complexos, use pipelines separados
# e mescle as características manualmente.
```

### Pipeline com Transformadores Personalizados

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
        # Lógica de transformação personalizada
        return value * 2.0 if value else 0.0
```

## Perguntas de Prática

1. Qual é a vantagem de usar um Pipeline em vez de aplicar transformações manualmente?
2. Como o CrossValidator divide os dados e avalia os modelos?
3. Qual é a diferença entre CrossValidator e TrainValidationSplit?
4. Como você acessa o melhor modelo após a validação cruzada?
5. Qual é o risco de usar muitas dobras (ex., 10 dobras)?
6. Como `parallelism` afeta o desempenho da validação cruzada?
7. Quando você usaria busca aleatória em vez de busca em grade?
8. Como você salva e recarrega um modelo de pipeline completo?
9. Como você extrai os melhores hiperparâmetros de `cv_model`?
10. Como você avalia um modelo de classificação multiclasse no Spark?
