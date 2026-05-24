---
title: "Projeto Iniciante: Análise de Corridas de Táxi em NYC"
description: "Aplique tudo que você aprendeu: analise dados de corridas de táxi em NYC usando RDDs e DataFrames em um projeto completo"
order: 10
duration: "45-60 minutos"
difficulty: "iniciante"
---

# Projeto Iniciante: Análise de Corridas de Táxi em NYC

Este projeto final combina todas as habilidades deste curso. Você analisará um conjunto de dados de corridas de táxi em NYC usando ambas as APIs RDD e DataFrame, praticando transformações, ações, SQL e E/S de arquivos.

## Visão Geral do Projeto

Você irá:
1. Carregar dados brutos de corridas de táxi em CSV
2. Limpar e transformar dados com RDDs
3. Carregar e analisar dados com DataFrames
4. Executar consultas SQL no conjunto de dados
5. Computar insights e salvar resultados
6. Responder perguntas específicas de negócio

## Conjunto de Dados

Para este projeto, usaremos os Dados de Corridas de Táxi Amarelo de NYC. Você pode baixar uma amostra do portal de dados abertos da NYC Taxi & Limousine Commission. Para desenvolvimento local, crie um CSV de amostra.

> [!NOTE]
> Para executar este projeto, baixe uma amostra dos dados de táxi de NYC de https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page ou use o gerador de amostras abaixo.

### Geração de Dados de Amostra (para teste)

```python
import csv
import random
from datetime import datetime, timedelta

# Gerar dados de amostra de corridas de táxi
headers = [
    "VendorID", "tpep_pickup_datetime", "tpep_dropoff_datetime",
    "passenger_count", "trip_distance", "RatecodeID",
    "store_and_fwd_flag", "PULocationID", "DOLocationID",
    "payment_type", "fare_amount", "extra", "mta_tax",
    "tip_amount", "tolls_amount", "improvement_surcharge",
    "total_amount"
]

with open("data/taxi_trips.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for _ in range(10000):
        pickup = datetime(2024, 1, 1) + timedelta(
            minutes=random.randint(0, 525600)
        )
        dropoff = pickup + timedelta(minutes=random.randint(5, 120))
        writer.writerow([
            random.randint(1, 2),
            pickup.strftime("%Y-%m-%d %H:%M:%S"),
            dropoff.strftime("%Y-%m-%d %H:%M:%S"),
            random.randint(1, 6),
            round(random.uniform(0.5, 30.0), 2),
            random.randint(1, 6),
            random.choice(["N", "Y"]),
            random.randint(1, 265),
            random.randint(1, 265),
            random.randint(1, 4),
            round(random.uniform(3.0, 100.0), 2),
            round(random.uniform(0.0, 5.0), 2),
            round(random.uniform(0.5, 1.0), 2),
            round(random.uniform(0.0, 25.0), 2),
            round(random.uniform(0.0, 15.0), 2),
            round(random.uniform(0.3, 0.5), 2),
            0.0  # será calculado
        ])
```

## Parte 1: Análise com RDD

### 1.1 Carregar e Explorar com RDDs

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("NYCTaxiRDD") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Carregar CSV como RDD
taxi_rdd = sc.textFile("data/taxi_trips.csv")

# Separar cabeçalho e dados
header = taxi_rdd.first()
data_rdd = taxi_rdd.filter(lambda row: row != header)

# Analisar linhas CSV
def parse_row(line):
    fields = line.split(",")
    return {
        "vendor": int(fields[0]),
        "pickup": fields[1],
        "dropoff": fields[2],
        "passengers": int(fields[3]),
        "distance": float(fields[4]),
        "fare": float(fields[10]),
        "tip": float(fields[13]),
        "total": float(fields[16]),
        "payment": int(fields[9])
    }

parsed_rdd = data_rdd.map(parse_row)

# Estatísticas básicas
print(f"Total de corridas: {parsed_rdd.count()}")

total_distance = parsed_rdd.map(lambda r: r["distance"]).reduce(lambda a, b: a + b)
avg_distance = total_distance / parsed_rdd.count()
print(f"Distância média da corrida: {avg_distance:.2f} milhas")
```

> [!SUCCESS]
> Usar RDDs dá a você controle explícito sobre a lógica de análise e transformação. Isso é útil ao lidar com formatos de dados confusos e não padronizados.

### 1.2 Transformações e Ações RDD

```python
# Encontrar as 10 corridas mais longas
longest_trips = parsed_rdd \
    .map(lambda r: (r["distance"], r)) \
    .sortByKey(ascending=False) \
    .map(lambda x: x[1]) \
    .take(10)

print("Corridas mais longas:")
for t in longest_trips:
    print(f"  {t['distance']} milhas, tarifa: ${t['fare']}")

# Gorjeta média por tipo de pagamento
tip_by_payment = parsed_rdd \
    .map(lambda r: (r["payment"], (r["tip"], 1))) \
    .reduceByKey(lambda a, b: (a[0] + b[0], a[1] + b[1])) \
    .mapValues(lambda v: v[0] / v[1]) \
    .collect()

print("\nGorjeta média por tipo de pagamento:")
for payment, avg_tip in sorted(tip_by_payment):
    print(f"  Tipo {payment}: ${avg_tip:.2f}")

# Filtrar corridas com alta porcentagem de gorjeta
generous_trips = parsed_rdd \
    .filter(lambda r: r["fare"] > 0 and r["tip"] / r["fare"] > 0.25)
print(f"\nCorridas com gorjeta > 25%: {generous_trips.count()}")

# Contar corridas por quantidade de passageiros
passenger_dist = parsed_rdd \
    .map(lambda r: (r["passengers"], 1)) \
    .reduceByKey(lambda a, b: a + b) \
    .sortByKey() \
    .collect()

print("\nDistribuição de corridas por quantidade de passageiros:")
for passengers, count in passenger_dist:
    print(f"  {passengers} passageiro(s): {count} corridas")
```

## Parte 2: Análise com DataFrame

### 2.1 Carregar e Explorar com DataFrames

```python
# Carregar CSV diretamente em DataFrame
taxi_df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .csv("data/taxi_trips.csv")

print(f"Esquema:")
taxi_df.printSchema()

print(f"\nContagem de linhas: {taxi_df.count()}")
print(f"\nDados de amostra:")
taxi_df.show(5, truncate=False)

print(f"\nEstatísticas resumidas:")
taxi_df.describe(["fare_amount", "tip_amount", "trip_distance", "total_amount"]).show()
```

### 2.2 Transformações DataFrame

```python
from pyspark.sql.functions import col, avg, max, min, sum, count, when, round, hour

# Limpar dados — filtrar corridas inválidas
clean_df = taxi_df \
    .filter(col("trip_distance") > 0) \
    .filter(col("fare_amount") > 0) \
    .filter(col("passenger_count") > 0) \
    .filter(col("total_amount") > 0)

print(f"Corridas após limpeza: {clean_df.count()}")

# Adicionar colunas derivadas
analyzed_df = clean_df \
    .withColumn("tip_percentage", round(col("tip_amount") / col("fare_amount") * 100, 2)) \
    .withColumn("price_per_mile", round(col("fare_amount") / col("trip_distance"), 2)) \
    .withColumn("pickup_hour", hour(col("tpep_pickup_datetime")))

# Análise por hora
hourly_stats = analyzed_df \
    .groupBy("pickup_hour") \
    .agg(
        count("*").alias("trip_count"),
        round(avg("fare_amount"), 2).alias("avg_fare"),
        round(avg("tip_percentage"), 2).alias("avg_tip_pct")
    ) \
    .orderBy("pickup_hour")

print("Análise horária:")
hourly_stats.show(24)
```

### 2.3 Consultas SQL

```python
# Registrar como visualização temporária
clean_df.createOrReplaceTempView("trips")

# Horas mais movimentadas
busiest_hours = spark.sql("""
    SELECT HOUR(tpep_pickup_datetime) as hour,
           COUNT(*) as trip_count,
           ROUND(AVG(fare_amount), 2) as avg_fare,
           ROUND(AVG(tip_amount), 2) as avg_tip
    FROM trips
    GROUP BY hour
    ORDER BY trip_count DESC
    LIMIT 5
""")
print("Horas mais movimentadas:")
busiest_hours.show()

# Análise por tipo de pagamento
payment_analysis = spark.sql("""
    SELECT payment_type,
           COUNT(*) as count,
           ROUND(AVG(total_amount), 2) as avg_total,
           ROUND(AVG(tip_amount), 2) as avg_tip,
           ROUND(SUM(total_amount), 2) as revenue
    FROM trips
    GROUP BY payment_type
    ORDER BY count DESC
""")
print("Análise por tipo de pagamento:")
payment_analysis.show()

# Corridas de alto valor
high_value = spark.sql("""
    SELECT *
    FROM trips
    WHERE total_amount > 50
      AND tip_amount > 10
    ORDER BY total_amount DESC
    LIMIT 10
""")
print("Corridas de alto valor:")
high_value.show()
```

## Parte 3: Salvar Resultados

```python
# Salvar análise em Parquet (formato colunar eficiente)
hourly_stats.write.mode("overwrite").parquet("output/hourly_stats")
payment_analysis.write.mode("overwrite").json("output/payment_analysis")

# Salvar como CSV único (repartitionar para 1 arquivo)
high_value \
    .coalesce(1) \
    .write \
    .mode("overwrite") \
    .option("header", "true") \
    .csv("output/high_value_trips")

# Salvar resultados RDD como texto
sc.parallelize(tip_by_payment) \
    .map(lambda x: f"TipoPagamento{x[0]}: ${x[1]:.2f}") \
    .saveAsTextFile("output/avg_tip_by_payment")
```

> [!WARNING]
> `coalesce(1)` força todos os dados através de uma única partição. Use apenas para pequenos conjuntos de resultados. Para grandes saídas, mantenha a contagem natural de partições para escritas paralelas.

## Parte 4: Perguntas de Negócio

Responda estas perguntas usando sua análise:

```python
# Q1: Qual é a distância média e tarifa média das corridas?
avg_metrics = spark.sql("""
    SELECT ROUND(AVG(trip_distance), 2) as avg_distance,
           ROUND(AVG(fare_amount), 2) as avg_fare,
           ROUND(AVG(total_amount), 2) as avg_total
    FROM trips
""")
print("Q1 - Métricas médias:")
avg_metrics.show()

# Q2: Qual hora tem a maior porcentagem média de gorjeta?
best_tip_hour = spark.sql("""
    SELECT HOUR(tpep_pickup_datetime) as hour,
           ROUND(AVG(tip_amount / fare_amount * 100), 2) as avg_tip_pct
    FROM trips
    WHERE fare_amount > 0
    GROUP BY hour
    ORDER BY avg_tip_pct DESC
    LIMIT 3
""")
print("Q2 - Melhores horas para gorjeta:")
best_tip_hour.show()

# Q3: Qual é a distribuição de receita entre os tipos de pagamento?
revenue_dist = spark.sql("""
    SELECT payment_type,
           COUNT(*) as trips,
           ROUND(SUM(total_amount), 2) as total_revenue,
           ROUND(AVG(total_amount), 2) as avg_trip_value
    FROM trips
    GROUP BY payment_type
    ORDER BY total_revenue DESC
""")
print("Q3 - Receita por tipo de pagamento:")
revenue_dist.show()

# Q4: Como a distância da corrida se correlaciona com o valor da tarifa?
correlation = spark.sql("""
    SELECT CASE
        WHEN trip_distance < 1 THEN '<1 mile'
        WHEN trip_distance < 3 THEN '1-3 miles'
        WHEN trip_distance < 5 THEN '3-5 miles'
        WHEN trip_distance < 10 THEN '5-10 miles'
        ELSE '10+ miles'
    END as distance_range,
    COUNT(*) as trips,
    ROUND(AVG(fare_amount), 2) as avg_fare,
    ROUND(AVG(tip_amount), 2) as avg_tip
    FROM trips
    GROUP BY distance_range
    ORDER BY MIN(trip_distance)
""")
print("Q4 - Tarifa por faixa de distância:")
correlation.show()
```

## Script Completo do Pipeline

```python
# taxi_analysis.py - Pipeline completo
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("NYCTaxiAnalysis") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# Carregar
df = spark.read.option("header", "true") \
    .option("inferSchema", "true") \
    .csv("data/taxi_trips.csv")

# Limpar
clean = df.filter(col("trip_distance") > 0) \
    .filter(col("fare_amount") > 0)

# Enriquecer
enriched = clean.withColumn("tip_pct",
    round(col("tip_amount") / col("fare_amount") * 100, 2)) \
    .withColumn("pickup_hour", hour("tpep_pickup_datetime"))

# Analisar
result = enriched.groupBy("pickup_hour").agg(
    count("*").alias("trips"),
    round(avg("fare_amount"), 2).alias("avg_fare")
).orderBy("pickup_hour")

# Salvar
result.coalesce(1).write.mode("overwrite") \
    .option("header", "true").csv("output/taxi_analysis")

spark.stop()
```

## Perguntas de Prática

1. Como você analisa um arquivo CSV manualmente usando RDDs?
2. Por que limpar dados (removendo distâncias negativas, tarifas zero) é importante antes da análise?
3. Quais são as vantagens de carregar dados com DataFrames em vez de RDDs?
4. Como você calcula a porcentagem de gorjeta como uma coluna derivada?
5. Qual consulta SQL encontra as horas mais movimentadas do dia?
6. Como você salva resultados no formato Parquet vs formato CSV?
7. Por que `saveAsTextFile` produz múltiplos arquivos de parte?
8. Como você salva resultados de DataFrame como um único arquivo CSV?
9. Quais são três insights de negócio que você pode extrair dos dados de táxi de NYC?
10. Como você modificaria o pipeline para analisar dados por dia da semana em vez de hora?
