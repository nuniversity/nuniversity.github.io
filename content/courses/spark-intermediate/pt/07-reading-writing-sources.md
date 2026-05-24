---
title: "Leitura e Escrita de Fontes de Dados"
description: "Domine a leitura/escrita dos formatos CSV, JSON, Parquet, Avro e ORC com particionamento, modos de salvamento e compressão"
order: 7
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Leitura e Escrita de Fontes de Dados

O Spark suporta diversos formatos de dados, cada um com trade-offs em desempenho, suporte a esquemas e compressão. Escolher o formato e a estratégia de escrita corretos é crucial para construir pipelines de dados eficientes.

## Formatos Suportados

| Formato | Esquema | Compressão | Dividível | Melhor Para |
|---|---|---|---|---|
| **Parquet** | Sim (nativo) | Snappy, gzip, zstd | Sim | Analítica, acesso colunar |
| **ORC** | Sim (nativo) | Snappy, zlib, zstd | Sim | Cargas de trabalho Hive/ACID |
| **Avro** | Sim (embutido) | Snappy, deflate | Sim | Streaming, Kafka |
| **JSON** | Esquema inferido | gzip | Sim (delimitado por linhas) | Semiestruturado, interoperabilidade |
| **CSV** | Esquema inferido | gzip | Sim | Sistemas legados, tabelas simples |

## Leitura de Fontes de Dados

### Parquet (Colunar, Padrão)

```python
# Ler Parquet (esquema preservado nativamente)
df = spark.read.parquet("data/sales.parquet")

# Ler com poda de esquema (apenas ler colunas necessárias)
df = spark.read.parquet("data/sales.parquet").select("date", "amount")

# Ler Parquet particionado
df = spark.read.parquet("data/sales/", basePath="data/sales/")
```

> [!SUCCESS]
> Parquet é o formato recomendado para análise. Seu armazenamento colunar, pushdown de predicados e preservação de esquema o tornam a escolha mais eficiente para o Spark.

### ORC (Optimized Row Columnar)

```python
# Ler ORC
df = spark.read.orc("data/sales.orc")

# Com esquema
schema = StructType([...])
df = spark.read.schema(schema).orc("data/sales.orc")
```

### Avro (Baseado em Linhas)

```python
# Ler Avro (requer pacote spark-avro)
df = spark.read.format("avro").load("data/events.avro")

# Ler versão específica de esquema Avro
df = spark.read \
    .option("avroSchema", '{"type":"record","name":"Event","fields":[{"name":"id","type":"int"}]}') \
    .format("avro") \
    .load("data/specific.avro")
```

### CSV

```python
# Ler CSV com opções completas
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("sep", ",") \
    .option("quote", "\"") \
    .option("escape", "\\") \
    .option("mode", "PERMISSIVE") \
    .option("nullValue", "NULL") \
    .option("dateFormat", "yyyy-MM-dd") \
    .option("timestampFormat", "yyyy-MM-dd HH:mm:ss") \
    .option("maxColumns", "2048") \
    .csv("data/people.csv")
```

> [!WARNING]
> CSV não tem esquema nativo. A inferência requer uma passagem extra sobre os dados. Sempre forneça um esquema explícito para pipelines de produção.

### JSON

```python
# Ler JSON Lines (um objeto JSON por linha)
df = spark.read.json("data/events.json")

# Ler JSON multilinha
df = spark.read \
    .option("multiLine", "true") \
    .option("primitivesAsString", "false") \
    .option("prefersDecimal", "false") \
    .option("allowComments", "false") \
    .option("allowUnquotedFieldNames", "false") \
    .json("data/nested_data.json")

# Ler JSON comprimido
df = spark.read.json("data/events.json.gz")
```

## Escrita de Fontes de Dados

### Modos de Escrita

```python
# Overwrite (substituir dados existentes)
df.write.mode("overwrite").parquet("output/")

# Append (adicionar a dados existentes)
df.write.mode("append").parquet("output/")

# Ignore (não fazer nada se a saída existir)
df.write.mode("ignore").parquet("output/")

# ErrorIfExists (padrão — falhar se a saída existir)
df.write.mode("errorifexists").parquet("output/")
```

> [!NOTE]
> `overwrite` substitui todo o diretório de saída, não arquivos individuais. Se quiser sobrescrever apenas partições específicas, use sobrescrita dinâmica de partições.

### Escrita com Particionamento

```python
# Particionar por uma ou mais colunas
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales_partitioned")

# Sobrescrita dinâmica de partições (apenas sobrescreve partições correspondentes)
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales_partitioned")
```

### Escrita com Compressão

```python
# Compressão Parquet
df.write \
    .option("compression", "snappy") \
    .parquet("output/sales_snappy.parquet")

# Codecs disponíveis: snappy, gzip, lzo, brotli, lz4, zstd
# Snappy: Rápido + compressão moderada (melhor para a maioria dos casos)
# Gzip: Lento + alta compressão (arquivamento, armazenamento lento)
# Zstd: Rápido + boa compressão (equilíbrio)

# Compressão ORC
df.write \
    .option("compression", "zlib") \
    .orc("output/sales.orc")

# Compressão CSV
df.write \
    .option("compression", "gzip") \
    .csv("output/sales_csv_gz/")

# Compressão JSON
df.write \
    .option("compression", "gzip") \
    .json("output/sales_json_gz/")
```

## Opções Avançadas de Escrita

```python
# Controlar número de arquivos de saída
df.coalesce(4).write.parquet("output/")  # 4 arquivos de saída
df.repartition(10).write.parquet("output/")  # 10 arquivos de saída

# Máximo de registros por arquivo (evitar arquivos pequenos)
df.write \
    .option("maxRecordsPerFile", 500000) \
    .parquet("output/")

# Arquivo único de saída
df.coalesce(1).write \
    .option("header", "true") \
    .csv("output/single_file.csv")
```

## Leitura de Múltiplas Fontes

```python
# Ler todos os arquivos Parquet em um diretório
df = spark.read.parquet("data/year=2024/*/")

# Ler com globs de caminho
df = spark.read \
    .option("basePath", "data/") \
    .parquet("data/year=2024/month=*/day=*/")

# Ler múltiplos caminhos específicos
df = spark.read.parquet("data/sales_2024.parquet", "data/sales_2025.parquet")
```

## Mesclagem de Esquemas

```python
# Mesclagem de esquemas Parquet (dois arquivos com esquemas diferentes)
spark.conf.set("spark.sql.parquet.mergeSchema", "true")

df1 = spark.createDataFrame([(1, "Alice")], ["id", "name"])
df1.write.mode("overwrite").parquet("data/merge_test/")

df2 = spark.createDataFrame([(2, 50000)], ["id", "salary"])
df2.write.mode("append").parquet("data/merge_test/")

merged = spark.read.parquet("data/merge_test/")
merged.printSchema()
# id, name, salary  (todas as colunas mescladas)
```

> [!WARNING]
> A mesclagem de esquemas é cara — requer ler todos os arquivos para descobrir seus esquemas antes do processamento. Use-a apenas quando necessário.

## Exemplos de Conversão de Formatos

```python
# CSV para Parquet (padrão ETL comum)
df_csv = spark.read.option("header", "true").csv("data/input/")
df_csv.write.parquet("data/processed/")

# JSON para ORC (para compatibilidade com Hive)
df_json = spark.read.json("data/events.json")
df_json.write.orc("data/events_processed/")

# Parquet para Avro (para sink do Kafka)
df_parquet = spark.read.parquet("data/sales.parquet")
df_parquet.write.format("avro").save("data/sales_avro/")
```

## Comparação de Desempenho de Fontes de Dados

| Operação | Parquet | ORC | Avro | JSON | CSV |
|---|---|---|---|---|---|
| **Velocidade de leitura** | Mais rápido | Rápido | Moderado | Lento | Lento |
| **Velocidade de escrita** | Moderada | Lenta | Rápida | Moderada | Rápida |
| **Taxa de compressão** | 4-8x | 5-10x | 2-4x | 2-5x | 2-5x |
| **Evolução de esquema** | Boa | Boa | Excelente | Boa | Ruim |
| **Dividível** | Sim | Sim | Sim | Sim (linha) | Sim |
| **Dados aninhados** | Excelente | Excelente | Bom | Nativo | Ruim |

## Perguntas de Prática

1. Quais são as vantagens do Parquet sobre o CSV para cargas de trabalho de análise?
2. Como os modos de escrita (overwrite, append, ignore) diferem?
3. Quando você usaria Avro em vez de Parquet?
4. Qual codec de compressão oferece o melhor equilíbrio entre velocidade e compressão?
5. Como você controla o número de arquivos de saída ao escrever?
6. O que é sobrescrita dinâmica de partições e quando é útil?
7. Como funciona a mesclagem de esquemas no Parquet?
8. Qual é o propósito do `maxRecordsPerFile`?
9. Como você lê dados de múltiplos diretórios particionados?
10. Como você converte um conjunto de dados CSV para Parquet eficientemente?
