---
title: "AI & Machine Learning Capabilities"
description: "Navigate the ML lifecycle across platforms. Compare AWS SageMaker and Bedrock for enterprise MLOps, Snowflake Cortex for SQL-native LLMs, and Databricks Mosaic AI for end-to-end ML tracking."
order: 7
difficulty: advanced
duration: "75 min"
---

# AI & Machine Learning Capabilities

> **Bottom Line:** Databricks is the most complete end-to-end ML platform — from feature engineering to model training, tracking, serving, and monitoring. Snowflake Cortex offers the lowest-friction path to LLM-powered analytics for SQL teams. AWS Bedrock + SageMaker is the most comprehensive enterprise AI infrastructure, but requires the most assembly.

---

## 7.1 The ML Lifecycle on Each Platform

```
Full ML Lifecycle:
┌──────────────┐ ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Data Prep   │ │Feature Engineer│ │ Model Train  │ │Model Register│ │Model Serving │
│  & EDA       │→│ & Feature Store│→│ & Experiment │→│ & Versioning │→│ & Monitoring │
└──────────────┘ └────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

Platform Coverage:
AWS:         ████████   SageMaker Data Wrangler | SageMaker Feature Store | SageMaker Training | Model Registry | SageMaker Endpoints
Snowflake:   ████       Snowpark ML (limited) | Cortex ML Functions | Model Registry [Preview] | n/a (no serving)
Databricks:  ████████   Spark/Pandas | Feature Store | MLflow | Unity Catalog | Model Serving
```

---

## 7.2 AWS AI/ML: Bedrock + SageMaker

### Amazon Bedrock — Foundation Models as a Service

Bedrock provides access to leading foundation models via a unified API, without managing infrastructure:

```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# --- Text Generation with Claude 3.5 Sonnet ---
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": "Summarise the key risk factors from this earnings report: ..."
            }
        ]
    })
)
result = json.loads(response['body'].read())
print(result['content'][0]['text'])

# --- Retrieval Augmented Generation (RAG) with Knowledge Bases ---
bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')

rag_response = bedrock_agent.retrieve_and_generate(
    input={'text': 'What were our top 3 revenue drivers in Q4?'},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': 'ABCD1234EF',        # Your KB with earnings reports
            'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
            'retrievalConfiguration': {
                'vectorSearchConfiguration': {'numberOfResults': 5}
            }
        }
    }
)
print(rag_response['output']['text'])

# --- Available Foundation Models on Bedrock ---
# Anthropic: Claude 3.5 Sonnet, Claude 3 Opus, Claude Instant
# Amazon:    Titan Text, Titan Embeddings, Titan Image Generator
# Meta:      Llama 3.1 405B, Llama 3 70B
# Mistral:   Mistral Large, Mixtral 8x7B
# Cohere:    Command R+, Command Light
# AI21:      Jamba, Jurassic-2
# Stability: Stable Diffusion XL
```

### Amazon SageMaker — Enterprise MLOps

SageMaker is AWS's comprehensive ML platform — covering every stage of the ML lifecycle:

```python
import sagemaker
from sagemaker.sklearn import SKLearn
from sagemaker.feature_store.feature_group import FeatureGroup
import pandas as pd

session = sagemaker.Session()
role = 'arn:aws:iam::123456789:role/SageMakerRole'

# --- Feature Store ---
feature_group = FeatureGroup(
    name='customer-churn-features',
    sagemaker_session=session
)

feature_group.load_feature_definitions(data_frame=features_df)
feature_group.create(
    s3_uri=f's3://my-bucket/feature-store/',
    record_identifier_name='customer_id',
    event_time_feature_name='event_time',
    role_arn=role,
    enable_online_store=True   # For real-time inference lookups
)

# --- Model Training ---
sklearn_estimator = SKLearn(
    entry_point='train_churn_model.py',
    framework_version='1.2-1',
    instance_type='ml.m5.2xlarge',
    role=role,
    hyperparameters={
        'n_estimators': 200,
        'max_depth': 8,
        'min_samples_leaf': 5
    }
)

sklearn_estimator.fit({
    'train': 's3://my-bucket/data/train/',
    'validation': 's3://my-bucket/data/validation/'
})

# --- Deploy to Endpoint ---
predictor = sklearn_estimator.deploy(
    initial_instance_count=2,
    instance_type='ml.c5.xlarge',
    endpoint_name='churn-predictor-v1'
)

# Real-time prediction
result = predictor.predict({'customer_id': 'cust-001', 'features': [...]})
```

---

## 7.3 Snowflake AI: Cortex + Snowpark ML

### Snowflake Cortex — LLM Functions in SQL

Cortex brings LLM capabilities directly into Snowflake SQL — no Python, no infrastructure:

```sql
-- Text Summarisation
SELECT
    customer_id,
    review_text,
    SNOWFLAKE.CORTEX.SUMMARIZE(review_text) AS review_summary
FROM customer_reviews
WHERE review_date >= '2024-01-01'
LIMIT 100;
-- Runs the LLM directly in Snowflake — data never leaves your account

-- Sentiment Analysis
SELECT
    review_id,
    review_text,
    SNOWFLAKE.CORTEX.SENTIMENT(review_text) AS sentiment_score
    -- Returns: -1 (very negative) to +1 (very positive)
FROM customer_reviews;

-- Classification
SELECT
    support_ticket_id,
    ticket_text,
    SNOWFLAKE.CORTEX.CLASSIFY_TEXT(
        ticket_text,
        ['billing', 'technical', 'account', 'shipping', 'returns']
    ):label::STRING AS ticket_category
FROM support_tickets;

-- Extract structured data from unstructured text
SELECT
    contract_id,
    SNOWFLAKE.CORTEX.EXTRACT_ANSWER(
        contract_text,
        'What is the payment term in days?'
    ) AS payment_terms
FROM contracts;

-- Translation
SELECT
    review_id,
    original_text,
    SNOWFLAKE.CORTEX.TRANSLATE(original_text, 'de', 'en') AS english_text
FROM german_reviews;
```

### Cortex Complete — Prompt-Based LLM Calls

```sql
-- Call an LLM directly from SQL with a custom prompt
SELECT
    order_id,
    customer_name,
    SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large',  -- or 'claude-3-5-sonnet', 'llama3.1-405b', 'snowflake-arctic'
        CONCAT(
            'You are a customer service agent. Write a personalised apology email ',
            'for a delayed order. Customer name: ', customer_name,
            '. Order ID: ', order_id,
            '. Expected delay: ', delay_days, ' days.',
            '. Keep it under 100 words.'
        )
    ) AS apology_email
FROM delayed_orders
WHERE delay_days > 5;
```

### Snowflake Cortex Search — RAG in Snowflake

```sql
-- Create a Cortex Search Service on a table containing documents
CREATE CORTEX SEARCH SERVICE product_docs_search
    ON document_text
    ATTRIBUTES product_id, category, last_updated
    WAREHOUSE = cortex_wh
    TARGET_LAG = '1 hour'
AS (
    SELECT document_text, product_id, category, last_updated
    FROM product_documentation
    WHERE is_published = TRUE
);

-- Query the search service (hybrid vector + keyword search)
SELECT PARSE_JSON(
    SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
        'product_docs_search',
        '{
            "query": "how to reset two-factor authentication",
            "columns": ["document_text", "product_id"],
            "limit": 5
        }'
    )
) AS search_results;
```

### Snowpark ML — Python ML in Snowflake

```python
from snowflake.ml.modeling.preprocessing import StandardScaler, OrdinalEncoder
from snowflake.ml.modeling.ensemble import RandomForestClassifier
from snowflake.ml.modeling.model_selection import GridSearchCV
from snowflake.snowpark import Session

session = Session.builder.configs(connection_params).create()

# Load training data as Snowpark DataFrame
train_df = session.table("ml_features.customer_churn_features")

# Preprocessing (all runs IN Snowflake — no data movement to Python client)
scaler = StandardScaler(
    input_cols=["avg_revenue", "session_count", "days_since_login"],
    output_cols=["avg_revenue_scaled", "session_count_scaled", "days_since_login_scaled"]
)
train_scaled = scaler.fit(train_df).transform(train_df)

# Model training (Snowpark pushes to Snowflake's Snowpark Container Services or VW)
clf = RandomForestClassifier(
    input_cols=["avg_revenue_scaled", "session_count_scaled", "days_since_login_scaled",
                "customer_segment", "contract_type"],
    label_cols=["churned"],
    n_estimators=100,
    max_depth=10
)
clf.fit(train_scaled)

# Save model to Snowflake Model Registry
from snowflake.ml.registry import Registry
registry = Registry(session=session, database_name="ML_PROD", schema_name="MODELS")

registry.log_model(
    clf,
    model_name="customer_churn_model",
    version_name="v3",
    metrics={"accuracy": 0.892, "auc_roc": 0.94},
    tags={"team": "data-science", "use_case": "retention"}
)

# Inference as SQL function
registry.get_model("customer_churn_model").version("v3").run(
    test_df,
    function_name="predict"
)
# Creates a SQL UDF: SELECT predict(avg_revenue, session_count, ...) FROM customers;
```

---

## 7.4 Databricks AI: Mosaic AI

Databricks' AI platform (branded Mosaic AI) is the most integrated data + ML platform available:

### MLflow — The Universal Experiment Tracker

MLflow originated at Databricks and is now the industry standard for ML experiment tracking:

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, accuracy_score
import pandas as pd

# Set experiment
mlflow.set_experiment("/projects/customer-churn/gbm-experiments")

# Train with automatic logging
with mlflow.start_run(run_name="gbm-v3-tuned"):
    # Log hyperparameters
    params = {"n_estimators": 300, "max_depth": 6, "learning_rate": 0.05}
    mlflow.log_params(params)

    # Train
    model = GradientBoostingClassifier(**params)
    model.fit(X_train, y_train)

    # Log metrics
    preds = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, preds)
    acc = accuracy_score(y_test, preds > 0.5)

    mlflow.log_metrics({"auc_roc": auc, "accuracy": acc})

    # Log the model itself
    mlflow.sklearn.log_model(
        model,
        artifact_path="churn-model",
        registered_model_name="customer_churn_predictor",
        signature=mlflow.models.infer_signature(X_train, preds)
    )

    # Log feature importance chart as artifact
    fig = plot_feature_importance(model, X_train.columns)
    mlflow.log_figure(fig, "feature_importance.png")

    print(f"AUC-ROC: {auc:.4f} | Accuracy: {acc:.4f}")
```

### Databricks Feature Store

```python
from databricks.feature_engineering import FeatureEngineeringClient

fe = FeatureEngineeringClient()

# Create a feature table
fe.create_table(
    name="ml_prod.feature_store.customer_lifetime_features",
    primary_keys=["customer_id"],
    timestamp_keys=["snapshot_date"],  # For point-in-time lookup (prevents leakage)
    schema=features_schema,
    description="Customer lifetime value features for retention models"
)

# Write features
fe.write_table(
    name="ml_prod.feature_store.customer_lifetime_features",
    df=features_df,
    mode="merge"  # Upsert by primary key
)

# Training with feature lookups (point-in-time correct)
training_set = fe.create_training_set(
    df=training_labels_df,  # Has customer_id + label + event_timestamp
    feature_lookups=[
        FeatureLookup(
            table_name="ml_prod.feature_store.customer_lifetime_features",
            feature_names=["avg_revenue_90d", "session_count_30d", "days_since_last_order"],
            lookup_key="customer_id",
            timestamp_lookup_key="event_timestamp"  # Critical: only use features BEFORE label date
        )
    ],
    label="churned"
)

training_df = training_set.load_df().toPandas()
```

### Model Serving — Real-Time Inference

```python
# Register model to Unity Catalog Model Registry
mlflow.set_registry_uri("databricks-uc")
mlflow.register_model(
    "runs:/abc123/churn-model",
    "ml_prod.models.customer_churn_predictor"
)

# Deploy as REST endpoint via Databricks Model Serving
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.serving import (
    EndpointCoreConfigInput,
    ServedModelInput,
    ServedModelInputWorkloadSize
)

w = WorkspaceClient()

endpoint = w.serving_endpoints.create(
    name="churn-predictor-v1",
    config=EndpointCoreConfigInput(
        served_models=[
            ServedModelInput(
                name="churn-model-primary",
                model_name="ml_prod.models.customer_churn_predictor",
                model_version="3",
                workload_size=ServedModelInputWorkloadSize.SMALL,  # SMALL/MEDIUM/LARGE
                scale_to_zero_enabled=True
            )
        ]
    )
)

# The endpoint becomes a REST API:
# POST https://<workspace>/serving-endpoints/churn-predictor-v1/invocations
# Body: {"dataframe_records": [{"customer_id": "c001", "avg_revenue": 250.5, ...}]}
```

### Databricks AutoML

```python
from databricks import automl

# AutoML runs a full experiment: feature engineering, algorithm selection,
# hyperparameter tuning, and picks the best model automatically
summary = automl.classify(
    dataset=training_df,
    target_col="churned",
    primary_metric="roc_auc",
    timeout_minutes=30,     # Budget for the experiment
    max_trials=20           # Max number of models to try
)

# Best model run is automatically registered
print(f"Best model: {summary.best_trial.mlflow_run_id}")
print(f"Best AUC: {summary.best_trial.metrics['val_roc_auc_score']:.4f}")

# AutoML generates a notebook explaining the best model — inspect it!
print(f"Generated notebook: {summary.best_trial.notebook_url}")
```

---

## 7.5 LLM / GenAI Capabilities Comparison

| Capability | AWS Bedrock | Snowflake Cortex | Databricks Mosaic AI |
|-----------|-------------|-----------------|----------------------|
| **LLM providers** | ⚡ Anthropic, Meta, Mistral, Amazon, Cohere, AI21, Stability | Snowflake Arctic, Mistral, Llama, Claude | ⚠️ Via MLflow + API (not managed LLMs) |
| **SQL-native LLM calls** | ❌ (Athena UDF workaround) | ⚡ Native SQL functions | ⚠️ AI_QUERY() function 🔬 |
| **RAG (managed)** | ✅ Bedrock Knowledge Bases | ✅ Cortex Search | ✅ Vector Search 🔬 |
| **Embeddings** | ✅ Titan Embeddings | ✅ EMBED_TEXT_768/1024 | ✅ Via MLflow models |
| **Fine-tuning** | ✅ Bedrock Fine-tuning | ⚠️ Not yet GA | ✅ Full training on GPU clusters |
| **Agents / Tool Use** | ✅ Bedrock Agents | 🔬 Cortex Agents | ✅ LangChain, custom |
| **Data privacy** | ✅ No data used for training | ✅ No data used for training | ✅ Self-hosted option |
| **GPU clusters** | ✅ SageMaker (p4d, p5) | ❌ Not available | ✅ A100/H100 on demand |

---

## 7.6 End-to-End ML Platform Comparison

| Dimension | AWS (SageMaker + Bedrock) | Snowflake (Cortex + Snowpark ML) | Databricks (Mosaic AI) |
|-----------|--------------------------|----------------------------------|------------------------|
| **Feature Store** | ✅ SageMaker Feature Store | ⚠️ Basic (Snowpark tables) | ✅ Databricks Feature Store |
| **Experiment Tracking** | ✅ SageMaker Experiments | ⚠️ Limited (no MLflow native) | ⚡ MLflow (authored it) |
| **Model Registry** | ✅ SageMaker Model Registry | ✅ Snowflake Model Registry | ⚡ UC + MLflow Registry |
| **Real-Time Serving** | ✅ SageMaker Endpoints | ⚠️ Snowpark Container Services | ✅ Model Serving (REST) |
| **Batch Inference** | ✅ SageMaker Batch Transform | ✅ Model inference as SQL UDF | ✅ Spark batch inference |
| **AutoML** | ✅ SageMaker Autopilot | ⚠️ Cortex ML Functions (basic) | ✅ Databricks AutoML |
| **GPU Training** | ✅ p4d.24xlarge, p5.48xlarge | ❌ Not available | ✅ A100/H100 clusters |
| **LLM SQL Integration** | ❌ Requires UDF wrapper | ⚡ Native (Cortex functions) | ⚠️ AI_QUERY() 🔬 |
| **Operational Complexity** | ⚠️ High (many services) | ⚡ Very Low (SQL-native) | Medium |
| **For SQL teams** | ❌ Not designed | ⚡ Best | ⚠️ Requires code |
| **For ML engineers** | ✅ Best infra options | ⚠️ Limited | ⚡ Best end-to-end |
