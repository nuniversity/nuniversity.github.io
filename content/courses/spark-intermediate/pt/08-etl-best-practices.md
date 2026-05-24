---
title: "Melhores Práticas de ETL"
description: "Projete pipelines ETL robustos com cargas incrementais, tratamento de dados tardios, evolução de esquemas e melhores práticas de produção"
order: 8
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Melhores Práticas de ETL

Os pipelines de Extração, Transformação e Carga (ETL) são a espinha dorsal da engenharia de dados. Esta lição cobre padrões prontos para produção para construir pipelines ETL confiáveis, sustentáveis e eficientes no Spark.

## Arquitetura de Pipeline ETL

```
Sistemas de Origem
  (BD, Kafka, APIs, Arquivos)
       |
   Extração
       |
   Área de Staging (Cru)
       |
   Transformação (Limpar, Enriquecer)
       |
   Carga (Curado)
       |
   Camada de Consumo
  (BI, ML, Analítica)
```

```python
# Estrutura básica de pipeline ETL
def extract(spark, source_config):
    """Extrair dados crus da fonte."""
    if source_config["type"] == "csv":
        return spark.read \
            .option("header", "true") \
            .option("inferSchema", "false") \
            .schema(source_config["schema"]) \
            .csv(source_config["path"])
    elif source_config["type"] == "jdbc":
        return spark.read \
            .format("jdbc") \
            .option("url", source_config["url"]) \
            .option("dbtable", source_config["table"]) \
            .option("user", source_config["user"]) \
            .option("password", source_config["password"]) \
            .load()

def transform(df):
    """Aplicar transformações de lógica de negócio."""
    return df \
        .filter(col("amount").isNotNull()) \
        .withColumn("processed_date", current_date()) \
        .withColumn("amount_usd", when(col("currency") == "EUR", col("amount") * 1.18)
                                   .otherwise(col("amount")))

def load(df, target_config):
    """Escrever dados limpos no destino."""
    df.write \
        .mode(target_config.get("mode", "append")) \
        .partitionBy(target_config.get("partition_cols", [])) \
        .option("compression", "snappy") \
        .format(target_config.get("format", "parquet")) \
        .save(target_config["path"])
```

## Cargas Incrementais

Cargas completas se tornam impraticáveis à medida que os dados crescem. Cargas incrementais processam apenas dados novos ou modificados.

```python
# Padrão de carga incremental usando watermark
def incremental_load(spark, source_table, watermark_col, last_run):
    """Carregar apenas registros mais recentes que last_run."""
    
    df = spark.read \
        .format("jdbc") \
        .option("url", source_config["url"]) \
        .option("dbtable", f"""
            (SELECT * FROM {source_table}
             WHERE {watermark_col} > '{last_run}'
             AND {watermark_col} <= '{current_run}') tmp
        """) \
        .load()
    
    return df

# Escrever para tabela particionada
df.write \
    .mode("append") \
    .partitionBy("year", "month", "day") \
    .parquet("data/sales/")
```

> [!NOTE]
> Para cargas incrementais, sempre armazene o último watermark bem-sucedido (máximo timestamp processado) em uma tabela de metadados, arquivo ou banco de dados. Isso permite recuperação e evita perda de dados.

### Captura de Mudanças de Dados (CDC)

```python
# Manipulação de CDC (inserções, atualizações, exclusões)
def process_cdc(cdc_df):
    """Aplicar mudanças CDC à tabela de destino."""
    
    # Separar operações
    inserts = cdc_df.filter(col("operation") == "I")
    updates = cdc_df.filter(col("operation") == "U")
    deletes = cdc_df.filter(col("operation") == "D")
    
    # Estado atual
    current = spark.read.parquet("data/target/")
    
    # Aplicar exclusões
    remaining = current.join(
        deletes.select("id"),
        on="id",
        how="left_anti"
    )
    
    # Aplicar upserts
    from delta.tables import DeltaTable  # Requer Delta Lake
    # Veja lição de Delta Lake (curso avançado) para detalhes de merge
    return remaining
```

## Tratamento de Dados Tardios

Dados que chegam tarde podem corromper agregações e relatórios.

```python
from pyspark.sql.functions import current_timestamp, col

# Estratégia 1: Sobrescrita de partição
def handle_late_data(late_df, target_path):
    """Reprocessar apenas as partições afetadas."""
    
    # Determinar partições afetadas
    affected_partitions = late_df \
        .select(col("event_date")) \
        .distinct() \
        .collect()
    
    for row in affected_partitions:
        date = row.event_date
        
        # Ler partição existente
        existing = spark.read \
            .parquet(f"{target_path}/event_date={date}")
        
        # Mesclar com dados tardios
        updated = existing.union(late_df.filter(col("event_date") == date))
        
        # Sobrescrever partição
        updated.write \
            .mode("overwrite") \
            .option("partitionOverwriteMode", "dynamic") \
            .parquet(target_path)

# Estratégia 2: Reprocessamento baseado em watermark
def reprocess_late_data(spark, source_path, watermark_days=3):
    """Reprocessar últimos N dias incluindo chegadas tardias."""
    
    cutoff_date = date.today() - timedelta(days=watermark_days)
    
    df = spark.read \
        .option("basePath", source_path) \
        .parquet(f"{source_path}/event_date > '{cutoff_date}'/")
    
    return df.transform(apply_business_logic)
```

> [!WARNING]
> O tratamento de dados tardios é um equilíbrio complexo. Definir uma janela de reprocessamento curta (1-2 dias) captura a maioria dos dados tardios enquanto limita o custo. Janelas mais longas aumentam a precisão mas também aumentam o tempo de processamento e armazenamento.

## Evolução de Esquemas

As fontes de dados mudam com o tempo. Pipelines de produção devem lidar com a evolução de esquemas graciosamente.

```python
# Estratégias de evolução de esquemas

# Estratégia 1: Mesclar esquema (Parquet)
spark.conf.set("spark.sql.parquet.mergeSchema", "true")
df = spark.read.parquet("data/evolving_source/")

# Estratégia 2: Usar esquema sem distinção de maiúsculas
spark.conf.set("spark.sql.caseSensitive", "false")

# Estratégia 3: Valores padrão de coluna
def safe_read_with_evolution(spark, path, expected_schema):
    """Ler dados, adicionando colunas faltantes com valores nulos padrão."""
    
    df = spark.read.parquet(path)
    existing_cols = set(df.columns)
    
    for field in expected_schema.fields:
        if field.name not in existing_cols:
            df = df.withColumn(field.name, lit(None).cast(field.dataType))
    
    return df.select([f.name for f in expected_schema.fields])

# Estratégia 4: Tratamento dinâmico de colunas
def handle_new_columns(df, known_columns):
    """Separar colunas conhecidas e desconhecidas."""
    
    new_cols = [c for c in df.columns if c not in known_columns]
    
    known_df = df.select(*known_columns)
    if new_cols:
        # Registrar novas colunas
        print(f"Novas colunas detectadas: {new_cols}")
        # Armazenar dados crus para processamento posterior
        df.select("id", *new_cols).write.json("data/new_columns/")
    
    return known_df
```

## Verificações de Qualidade

```python
def run_quality_checks(df, checks):
    """Executar verificações de qualidade de dados e falhar se violações excederem o limiar."""
    
    results = {}
    for check in checks:
        check_name = check["name"]
        condition = check["condition"]
        threshold = check.get("threshold", 0)
        
        violation_count = df.filter(~expr(condition)).count()
        violation_pct = violation_count / df.count() * 100
        
        results[check_name] = {
            "violations": violation_count,
            "percentage": violation_pct,
            "passed": violation_pct <= threshold
        }
        
        if not results[check_name]["passed"]:
            print(f"VERIFICAÇÃO DE QUALIDADE FALHOU: {check_name}")
            print(f"  Violações: {violation_count} ({violation_pct:.2f}%)")
    
    # Falhar pipeline se verificações críticas falharem
    critical_failures = [r for r in results.values() 
                        if not r["passed"]]
    if critical_failures:
        raise Exception(f"{len(critical_failures)} verificações de qualidade falharam")
    
    return results

# Exemplo de verificações de qualidade
quality_checks = [
    {"name": "no_null_keys", "condition": "id IS NOT NULL", "threshold": 0},
    {"name": "positive_amount", "condition": "amount > 0", "threshold": 0.1},
    {"name": "valid_dates", "condition": "event_date <= current_date()", "threshold": 0},
]

run_quality_checks(df, quality_checks)
```

## Modularidade do Pipeline

```python
# Componentes ETL reutilizáveis

class ETLPipeline:
    def __init__(self, spark, config):
        self.spark = spark
        self.config = config
        self.audit_log = []
    
    def extract(self):
        """Extrair da fonte."""
        self._log("Iniciando extração")
        df = self._read_source()
        self._log(f"Extraídas {df.count()} linhas")
        return df
    
    def transform(self, df):
        """Aplicar transformações."""
        self._log("Iniciando transformação")
        for transform_fn in self.config["transforms"]:
            df = transform_fn(df)
        self._log(f"Transformação completa: {df.count()} linhas")
        return df
    
    def validate(self, df):
        """Executar verificações de qualidade."""
        self._log("Iniciando validação")
        run_quality_checks(df, self.config["quality_checks"])
        return df
    
    def load(self, df):
        """Carregar no destino."""
        self._log("Iniciando carga")
        df.write \
            .mode(self.config["write_mode"]) \
            .partitionBy(self.config["partition_cols"]) \
            .parquet(self.config["target_path"])
        self._log(f"Carregadas {df.count()} linhas")
    
    def run(self):
        """Executar pipeline."""
        df = self.extract()
        df = self.transform(df)
        df = self.validate(df)
        self.load(df)
        return self.audit_log
    
    def _log(self, message):
        self.audit_log.append({
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "pipeline": self.config["name"]
        })
```

## Lista de Verificação de Produção

1. **Processamento incremental** — Nunca escanear completamente tabelas em crescimento
2. **Pipelines idempotentes** — Reexecutar produz o mesmo resultado
3. **Evolução de esquemas** — Lidar com adições de colunas graciosamente
4. **Rastreamento de watermark** — Armazenar timestamp da última execução bem-sucedida
5. **Verificações de qualidade** — Validar antes de carregar
6. **Saída particionada** — Organizar para eficiência de consultas
7. **Registro de auditoria** — Rastrear linhas processadas, falhas, tempo de execução
8. **Tratamento de erros** — Try/catch com lógica de repetição
9. **Configuração de recursos** — Dimensionar corretamente os recursos do executor

## Perguntas de Prática

1. Qual é a diferença entre carga completa e carga incremental?
2. Como você rastreia watermarks para processamento incremental?
3. Que estratégias podem lidar com dados que chegam tarde?
4. Como você gerencia a evolução de esquemas quando os esquemas de origem mudam?
5. Quais são as verificações de qualidade críticas para um pipeline ETL?
6. Por que a idempotência é importante em pipelines ETL?
7. Como você lida com captura de mudanças de dados (CDC) no Spark?
8. Que registro e auditoria os pipelines ETL devem incluir?
9. Como você reprocessa dados quando a lógica de negócio muda?
10. Projete um pipeline ETL para dados de vendas diárias de um banco de dados PostgreSQL.
