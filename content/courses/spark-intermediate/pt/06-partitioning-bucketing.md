---
title: "Particionamento e Bucketing"
description: "Aprenda repartition, coalesce, partitionBy, bucketing e otimização do layout de dados para melhor desempenho do Spark"
order: 6
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Particionamento e Bucketing

O layout adequado de dados é crítico para o desempenho do Spark. Particionamento e bucketing controlam como os dados são organizados em disco e memória, impactando diretamente o tamanho do shuffle, o paralelismo e a velocidade das consultas.

## Particionamento em Memória: repartition vs coalesce

### repartition()

Aumenta ou diminui o número de partições embaralhando os dados.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Partitioning") \
    .master("local[*]") \
    .getOrCreate()

df = spark.range(1, 10000, numPartitions=8)
print(f"Partições iniciais: {df.rdd.getNumPartitions()}")  # 8

# Aumentar partições (shuffle completo)
repartitioned = df.repartition(16)
print(f"Após repartition: {repartitioned.rdd.getNumPartitions()}")  # 16

# Reparticionar por coluna (baseado em hash)
df_repartitioned = df.repartition(10, "id")
print(f"Por coluna: {df_repartitioned.rdd.getNumPartitions()}")  # 10
```

> [!NOTE]
> `repartition()` causa um shuffle completo. Use-o para aumentar o paralelismo ou agrupar dados relacionados na mesma partição.

### coalesce()

Reduz partições sem um shuffle completo (mescla partições existentes).

```python
# Diminuir partições (sem shuffle)
coalesced = repartitioned.coalesce(4)
print(f"Após coalesce: {coalesced.rdd.getNumPartitions()}")  # 4
```

| Aspecto | repartition() | coalesce() |
|---|---|---|
| **Shuffle** | Shuffle completo | Mínimo (mescla) |
| **Partições** | Aumenta ou diminui | Apenas diminui |
| **Distribuição de dados** | Uniforme (round-robin) | Desigual possível |
| **Caso de uso** | Aumentar paralelismo | Reduzir partições para saída |

> [!WARNING]
> `coalesce()` não pode aumentar partições. Ela apenas mescla partições existentes, o que pode resultar em distribuição desigual de dados. Use `repartition()` quando precisar aumentar o paralelismo ou distribuir dados uniformemente.

## Particionamento em Disco: partitionBy

Ao escrever dados, `partitionBy()` organiza arquivos em hierarquias de diretórios baseadas nos valores das colunas.

```python
# Escrever com particionamento
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales")

# Estrutura de diretórios:
# data/sales/
#   year=2024/month=01/
#     part-00001.parquet
#     part-00002.parquet
#   year=2024/month=02/
#     part-00001.parquet
#   year=2024/month=03/
#     ...

# Leitura — Spark usa automaticamente poda de partições
df_2024 = spark.read.parquet("data/sales") \
    .filter(col("year") == 2024)
# Apenas lê diretórios year=2024/
```

> [!SUCCESS]
> A poda de partições é uma das otimizações mais eficazes. Quando você filtra por uma coluna de partição, o Spark lê apenas os diretórios relevantes. Para uma tabela particionada por data, consultar um único dia lê apenas os dados daquele dia.

### Escolhendo Colunas de Partição

```python
# Bom: baixa cardinalidade, filtrado frequente
.write.partitionBy("region", "year")

# Ruim: alta cardinalidade (cria muitos diretórios)
.write.partitionBy("user_id")

# Ruim: muitas colunas de partição (explosão de diretórios)
.write.partitionBy("year", "month", "day", "hour", "region")
```

| Melhores Práticas | Razão |
|---|---|
| **≤ 3 colunas de partição** | Evita explosão de diretórios |
| **Baixa cardinalidade** | < 500 valores distintos por coluna de partição |
| **Filtro frequente** | Usado em cláusulas WHERE |
| **Distribuição uniforme de dados** | Evita problema de arquivos pequenos |

## Bucketing

Bucketing organiza dados em um número fixo de arquivos (buckets) usando um hash da coluna de bucketing.

```python
# Escrever com bucketing
df.write \
    .mode("overwrite") \
    .bucketBy(10, "emp_id") \
    .sortBy("salary") \
    .saveAsTable("employees_bucketed")

# Benefícios: sem shuffle em chaves de join com bucketing
# Ler (usa automaticamente info do bucket)
bucketed_df = spark.table("employees_bucketed")
```

### Bucketing para Otimização de Joins

```python
# Criar duas tabelas com bucketing na mesma chave
df1.write.bucketBy(10, "key").saveAsTable("t1")
df2.write.bucketBy(10, "key").saveAsTable("t2")

# Join — sem shuffle necessário!
result = spark.table("t1").join(spark.table("t2"), "key")
result.explain()
# SortMergeJoin (sem exchange/shuffle antes do join)
```

> [!NOTE]
> Bucketing elimina o shuffle para joins e agregações na coluna buckeada. Ambas as tabelas devem usar o mesmo número de buckets e a mesma coluna de bucketing para que esta otimização funcione.

### Bucketing vs Particionamento

| Aspecto | Particionamento | Bucketing |
|---|---|---|
| **Organização em disco** | Diretório por valor | Número fixo de arquivos |
| **Limite de cardinalidade** | Baixa (< 500) | Qualquer |
| **Eliminação de shuffle** | Poda de partições (leitura) | Shuffle join/agg (escrita) |
| **Melhor para** | Dados temporais, geográficos | Chaves de alta cardinalidade (user_id) |
| **Quantidade de arquivos** | Variável (depende de valores) | Fixo (número de buckets) |

## Gerenciamento Prático de Partições

### Particionamento Dinâmico vs Estático

```python
# Particionamento dinâmico (Spark decide os valores)
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .format("parquet") \
    .save("data/sales_dynamic")

# Particionamento estático (especificar valor de partição)
df.write \
    .mode("overwrite") \
    .option("partitionOverwriteMode", "static") \
    .partitionBy("year") \
    .parquet("data/sales_static")
```

### Ferramentas de Gerenciamento de Partições

```python
# Reparar metadados de tabela
spark.sql("MSCK REPAIR TABLE sales_table")

# Mostrar partições
spark.sql("SHOW PARTITIONS sales_table").show()

# Adicionar partição manualmente
spark.sql("ALTER TABLE sales_table ADD PARTITION (year=2024, month=4)")

# Remover partição
spark.sql("ALTER TABLE sales_table DROP PARTITION (year=2023)")
```

## Problema de Arquivos Pequenos

Muitos arquivos pequenos criam sobrecarga de metadados e leituras lentas.

```python
# Problema: escrever com muitas partições
df.repartition(1000).write.parquet("output/")  # 1000 arquivos pequenos!

# Solução 1: Reduzir número de partições para saída
df.coalesce(4).write.parquet("output/")

# Solução 2: Usar maxRecordsPerFile
df.write \
    .option("maxRecordsPerFile", 100000) \
    .parquet("output/")

# Solução 3: Pós-processamento com compactação de arquivos
df_output = spark.read.parquet("output/")
df_output.coalesce(4).write.mode("overwrite").parquet("output_compacted/")
```

## Fórmula de Número Ótimo de Partições

```
Número de partições = (Tamanho total dos dados) / (tamanho alvo da partição)
Tamanho alvo da partição = Tamanho do bloco HDFS (128 MB) ou ligeiramente menor
```

```python
# Para 1 TB de dados com partições alvo de 128 MB
target_partitions = 1 * 1024 * 1024  # MB / 128 MB = ~8192 partições

# Ajustar conforme recursos do cluster
cores_available = 100  # Total de cores de executor
partitions = max(cores_available * 2, 8192)  # Pelo menos 2x cores
```

## Estratégia de Layout de Dados

Escolha conforme os padrões de consulta:

```python
# Dados de séries temporais: particionar por data
df.write.partitionBy("event_date").parquet("events/")

# Consultas centradas em usuário: bucketing por user_id
df.write.bucketBy(50, "user_id").sortBy("event_date").saveAsTable("user_events")

# Geográfico: particionar por região, bucketing por store_id
df.write \
    .partitionBy("region") \
    .bucketBy(20, "store_id") \
    .sortBy("sale_date") \
    .saveAsTable("store_sales")
```

## Perguntas de Prática

1. Qual é a diferença entre `repartition()` e `coalesce()`?
2. Quando você usaria `partitionBy` ao escrever dados?
3. Como o bucketing elimina o shuffle durante os joins?
4. O que é o "problema de arquivos pequenos" e como evitá-lo?
5. Por que o particionamento de alta cardinalidade (ex., por user_id) é problemático?
6. Como você escolhe entre particionamento e bucketing?
7. O que é poda de partições e como funciona?
8. Como a coalescência dinâmica do AQE melhora o gerenciamento de partições?
9. Qual é a fórmula recomendada para o número de partições?
10. O que `MSCK REPAIR TABLE` faz e quando é necessário?
