---
title: "Delta Lake"
description: "Implemente Delta Lake: transações ACID, viagem no tempo, imposição de esquemas, operações merge (upsert) e otimização de desempenho"
order: 8
duration: "35-45 minutos"
difficulty: "avançado"
---

# Delta Lake

Delta Lake é uma camada de armazenamento de código aberto que traz transações ACID para o Apache Spark e cargas de trabalho de big data. Ela funciona sobre data lakes existentes (arquivos Parquet em HDFS/S3) e fornece capacidades de streaming, imposição de esquemas e viagem no tempo.

## O que Delta Lake Fornece

| Característica | Descrição | Benefício |
|---|---|---|
| **Transações ACID** | Atômicas, Consistentes, Isoladas, Duráveis | Sem falhas parciais, leitores concorrentes obtêm visão consistente |
| **Imposição de Esquemas** | Valida escritas contra o esquema da tabela | Previne corrupção de dados |
| **Evolução de Esquemas** | Permite mudanças seguras de esquema | Adições graduais de colunas |
| **Viagem no Tempo** | Consulta versões anteriores de dados | Auditoria, reversão, reprodutibilidade |
| **Merge/Upsert** | INSERT, UPDATE, DELETE com condição | CDC, dimensões lentamente mutáveis |
| **Vacuum** | Limpa arquivos antigos | Gerenciamento de armazenamento |

## Configuração

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("DeltaLake") \
    .master("local[*]") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()
```

## Criação de Tabelas Delta

```python
from pyspark.sql.functions import col, current_timestamp

data = [
    (1, "Alice", "Engineering", 120000),
    (2, "Bob", "Design", 90000),
    (3, "Charlie", "Engineering", 150000),
    (4, "Diana", "Marketing", 80000)
]
df = spark.createDataFrame(data, ["id", "name", "dept", "salary"])

# Salvar como tabela Delta
df.write.format("delta").mode("overwrite").save("/data/delta/employees")

# Criar tabela gerenciada
df.write.format("delta").saveAsTable("employees")

# Criar tabela Delta a partir de Parquet existente
df_parquet = spark.read.parquet("/data/parquet/employees")
df_parquet.write.format("delta").mode("overwrite").save("/data/delta/employees")
```

> [!SUCCESS]
> Tabelas Delta são autodescritivas — o esquema, histórico de versões e log de transações são armazenados junto com os dados. Nenhum metastore externo é necessário.

## Leitura de Tabelas Delta

```python
# Leitura padrão
df = spark.read.format("delta").load("/data/delta/employees")
df.show()

# Viagem no tempo — consultar versões anteriores
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .load("/data/delta/employees")

df_timestamp = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-15") \
    .load("/data/delta/employees")

# Comparar atual vs anterior
print(f"Contagem versão atual: {df.count()}")
print(f"Contagem versão 0: {df_v0.count()}")
```

## Transações ACID

```python
# Escritas concorrentes são atômicas
df1.write.format("delta").mode("append").save("/data/delta/employees/")
df2.write.format("delta").mode("append").save("/data/delta/employees/")
# Ambas as escritas ocorrem atomicamente — sem estado parcial

# Verificar histórico de transações
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/delta/employees")
history = delta_table.history()
history.show()
# +-------+------------------+------+--------+
# |version|      timestamp   |operation|...|
# +-------+------------------+------+--------+
# |      3|2024-01-15 10:30..|   WRITE|    |
# |      2|2024-01-15 09:15..|   WRITE|    |
# |      1|2024-01-14 16:00..|   WRITE|    |
# |      0|2024-01-14 10:00..|   WRITE|    |
# +-------+------------------+------+--------+
```

## Imposição e Evolução de Esquemas

```python
# Imposição de esquemas — rejeita escritas incompatíveis
bad_data = [(5, "Eve", 95000)]  # Falta coluna dept — FALHA
try:
    bad_df = spark.createDataFrame(bad_data, ["id", "name", "salary"])
    bad_df.write.format("delta").mode("append").save("/data/delta/employees")
except Exception as e:
    print(f"A imposição de esquema bloqueou a escrita: {e}")

# Evolução de esquemas — permitir adicionar colunas
new_data = [(5, "Eve", "Engineering", 125000, "NY")]
new_df = spark.createDataFrame(new_data, ["id", "name", "dept", "salary", "city"])

new_df.write \
    .format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save("/data/delta/employees")

# Ler esquema atualizado
updated_df = spark.read.format("delta").load("/data/delta/employees")
updated_df.printSchema()
# root
#  |-- id: integer
#  |-- name: string
#  |-- dept: string
#  |-- salary: integer
#  |-- city: string (nova coluna)
```

> [!WARNING]
> A evolução de esquemas (`mergeSchema=true`) adiciona novas colunas mas não remove ou altera tipos de colunas existentes. Para remoção de colunas, use ALTER TABLE ou reescreva a tabela.

## Merge (Upsert)

```python
delta_table = DeltaTable.forPath(spark, "/data/delta/employees")

# Novos dados com alterações
updates = spark.createDataFrame([
    (1, "Alice", "Engineering", 130000),   # Salário atualizado
    (2, "Bob", "Design", 95000),            # Salário atualizado
    (6, "Frank", "Marketing", 90000)        # Novo funcionário
], ["id", "name", "dept", "salary"])

# Merge: INSERT novo, UPDATE existente
delta_table.alias("target") \
    .merge(
        updates.alias("source"),
        "target.id = source.id"
    ) \
    .whenMatchedUpdate(set={
        "name": "source.name",
        "dept": "source.dept",
        "salary": "source.salary"
    }) \
    .whenNotMatchedInsert(values={
        "id": "source.id",
        "name": "source.name",
        "dept": "source.dept",
        "salary": "source.salary"
    }) \
    .execute()
```

### Operações Merge Avançadas

```python
# Excluir registros correspondentes
delta_table.alias("target") \
    .merge(updates.alias("source"), "target.id = source.id") \
    .whenMatchedDelete(condition="source.salary < 50000") \
    .whenNotMatchedInsertAll() \
    .execute()

# Atualizações condicionais com lógica diferente
delta_table.alias("target") \
    .merge(updates.alias("source"), "target.id = source.id") \
    .whenMatchedUpdate(condition="target.salary < source.salary", set={
        "salary": "source.salary",
        "updated_at": "current_timestamp()"
    }) \
    .whenNotMatchedInsertAll() \
    .execute()
```

## Streaming com Delta

```python
# Escrita streaming para Delta
streaming_df = spark.readStream \
    .format("kafka") \
    .option("subscribe", "events") \
    .load()

streaming_df.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/data/checkpoints/events") \
    .outputMode("append") \
    .start("/data/delta/events/")

# Leitura streaming do Delta (CDC)
streaming_read = spark.readStream \
    .format("delta") \
    .load("/data/delta/employees")

streaming_read.writeStream \
    .format("console") \
    .start()
```

## Vacuum e Otimização

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/delta/employees")

# Otimizar layout de arquivos (compactar arquivos pequenos)
delta_table.optimize().execute()

# Otimizar com Z-ordering (como clusterização)
delta_table.optimize().executeZOrderBy("id", "dept")

# Vacuum — remover arquivos antigos (retenção padrão: 7 dias)
delta_table.vacuum(retentionHours=168)  # 7 dias

# Descrever histórico
delta_table.history().show(10, truncate=False)

# Descrever detalhes
delta_table.detail().show(truncate=False)
```

> [!NOTE]
> Vacuum remove arquivos mais antigos que o período de retenção. As consultas de viagem no tempo do Spark não podem acessar versões removidas por vacuum. A retenção padrão de 7 dias protege contra operações concorrentes.

## Ajuste de Desempenho

```python
# Habilitar cache Delta
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")

# Auto-otimizar em escritas
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")

# Estatísticas de coluna para salto de dados
spark.conf.set("spark.databricks.delta.properties.defaults.dataSkippingNumIndexedCols", "10")

# Definir propriedades de tabela Delta
sql = """
ALTER TABLE employees SET TBLPROPERTIES (
    delta.minFileSize = 104857600,
    delta.maxFileSize = 1073741824,
    delta.autoOptimize.optimizeWrite = true,
    delta.autoOptimize.autoCompact = true
)
"""
spark.sql(sql)
```

## Perguntas de Prática

1. Quais garantias ACID o Delta Lake fornece sobre arquivos Parquet?
2. Como a viagem no tempo funciona no Delta Lake?
3. O que acontece durante uma operação merge (upsert)?
4. Como a imposição de esquemas protege a qualidade dos dados?
5. Qual é o propósito do vacuum e qual é a retenção padrão?
6. Como o Delta Lake suporta leituras e escritas em streaming?
7. O que é o log de transações do Delta e o que ele armazena?
8. Como você resolve conflitos durante escritas concorrentes?
9. Quando você usaria `optimize` e `ZORDER BY`?
10. Como o Delta Lake difere das tabelas Parquet padrão?
