---
title: "Proyecto Principiante: Análisis de Viajes en Taxi de NYC"
description: "Aplica todo lo que aprendiste: analiza datos de viajes en taxi de NYC usando RDDs y DataFrames en un proyecto completo"
order: 10
duration: "45-60 minutos"
difficulty: "principiante"
---

# Proyecto Principiante: Análisis de Viajes en Taxi de NYC

Este proyecto final combina todas las habilidades de este curso. Analizarás un conjunto de datos de viajes en taxi de NYC usando ambas APIs RDD y DataFrame, practicando transformaciones, acciones, SQL y E/S de archivos.

## Visión General del Proyecto

Tú vas a:
1. Cargar datos brutos de viajes en taxi en CSV
2. Limpiar y transformar datos con RDDs
3. Cargar y analizar datos con DataFrames
4. Ejecutar consultas SQL en el conjunto de datos
5. Calcular información y guardar resultados
6. Responder preguntas específicas de negocio

## Conjunto de Datos

Para este proyecto, usaremos los Datos de Viajes en Taxi Amarillo de NYC. Puedes descargar una muestra del portal de datos abiertos de la NYC Taxi & Limousine Commission. Para desarrollo local, crea un CSV de muestra.

> [!NOTE]
> Para ejecutar este proyecto, descarga una muestra de datos de taxi de NYC de https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page o usa el generador de muestras a continuación.

### Generación de Datos de Muestra (para prueba)

```python
import csv
import random
from datetime import datetime, timedelta

# Generar datos de muestra de viajes en taxi
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
            0.0  # se calculará
        ])
```

## Parte 1: Análisis con RDD

### 1.1 Cargar y Explorar con RDDs

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("NYCTaxiRDD") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Cargar CSV como RDD
taxi_rdd = sc.textFile("data/taxi_trips.csv")

# Separar encabezado y datos
header = taxi_rdd.first()
data_rdd = taxi_rdd.filter(lambda row: row != header)

# Analizar líneas CSV
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

# Estadísticas básicas
print(f"Total de viajes: {parsed_rdd.count()}")

total_distance = parsed_rdd.map(lambda r: r["distance"]).reduce(lambda a, b: a + b)
avg_distance = total_distance / parsed_rdd.count()
print(f"Distancia promedio del viaje: {avg_distance:.2f} millas")
```

> [!SUCCESS]
> Usar RDDs te da control explícito sobre la lógica de análisis y transformación. Esto es útil al lidiar con formatos de datos desordenados y no estándar.

### 1.2 Transformaciones y Acciones RDD

```python
# Encontrar los 10 viajes más largos
longest_trips = parsed_rdd \
    .map(lambda r: (r["distance"], r)) \
    .sortByKey(ascending=False) \
    .map(lambda x: x[1]) \
    .take(10)

print("Viajes más largos:")
for t in longest_trips:
    print(f"  {t['distance']} millas, tarifa: ${t['fare']}")

# Propina promedio por tipo de pago
tip_by_payment = parsed_rdd \
    .map(lambda r: (r["payment"], (r["tip"], 1))) \
    .reduceByKey(lambda a, b: (a[0] + b[0], a[1] + b[1])) \
    .mapValues(lambda v: v[0] / v[1]) \
    .collect()

print("\nPropina promedio por tipo de pago:")
for payment, avg_tip in sorted(tip_by_payment):
    print(f"  Tipo {payment}: ${avg_tip:.2f}")

# Filtrar viajes con alto porcentaje de propina
generous_trips = parsed_rdd \
    .filter(lambda r: r["fare"] > 0 and r["tip"] / r["fare"] > 0.25)
print(f"\nViajes con propina > 25%: {generous_trips.count()}")

# Contar viajes por cantidad de pasajeros
passenger_dist = parsed_rdd \
    .map(lambda r: (r["passengers"], 1)) \
    .reduceByKey(lambda a, b: a + b) \
    .sortByKey() \
    .collect()

print("\nDistribución de viajes por cantidad de pasajeros:")
for passengers, count in passenger_dist:
    print(f"  {passengers} pasajero(s): {count} viajes")
```

## Parte 2: Análisis con DataFrame

### 2.1 Cargar y Explorar con DataFrames

```python
# Cargar CSV directamente en DataFrame
taxi_df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .csv("data/taxi_trips.csv")

print(f"Esquema:")
taxi_df.printSchema()

print(f"\nConteo de filas: {taxi_df.count()}")
print(f"\nDatos de muestra:")
taxi_df.show(5, truncate=False)

print(f"\nEstadísticas resumidas:")
taxi_df.describe(["fare_amount", "tip_amount", "trip_distance", "total_amount"]).show()
```

### 2.2 Transformaciones DataFrame

```python
from pyspark.sql.functions import col, avg, max, min, sum, count, when, round, hour

# Limpiar datos — filtrar viajes inválidos
clean_df = taxi_df \
    .filter(col("trip_distance") > 0) \
    .filter(col("fare_amount") > 0) \
    .filter(col("passenger_count") > 0) \
    .filter(col("total_amount") > 0)

print(f"Viajes después de limpieza: {clean_df.count()}")

# Añadir columnas derivadas
analyzed_df = clean_df \
    .withColumn("tip_percentage", round(col("tip_amount") / col("fare_amount") * 100, 2)) \
    .withColumn("price_per_mile", round(col("fare_amount") / col("trip_distance"), 2)) \
    .withColumn("pickup_hour", hour(col("tpep_pickup_datetime")))

# Análisis por hora
hourly_stats = analyzed_df \
    .groupBy("pickup_hour") \
    .agg(
        count("*").alias("trip_count"),
        round(avg("fare_amount"), 2).alias("avg_fare"),
        round(avg("tip_percentage"), 2).alias("avg_tip_pct")
    ) \
    .orderBy("pickup_hour")

print("Análisis horario:")
hourly_stats.show(24)
```

### 2.3 Consultas SQL

```python
# Registrar como vista temporal
clean_df.createOrReplaceTempView("trips")

# Horas más ocupadas
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
print("Horas más ocupadas:")
busiest_hours.show()

# Análisis por tipo de pago
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
print("Análisis por tipo de pago:")
payment_analysis.show()

# Viajes de alto valor
high_value = spark.sql("""
    SELECT *
    FROM trips
    WHERE total_amount > 50
      AND tip_amount > 10
    ORDER BY total_amount DESC
    LIMIT 10
""")
print("Viajes de alto valor:")
high_value.show()
```

## Parte 3: Guardar Resultados

```python
# Guardar análisis en Parquet (formato columnar eficiente)
hourly_stats.write.mode("overwrite").parquet("output/hourly_stats")
payment_analysis.write.mode("overwrite").json("output/payment_analysis")

# Guardar como CSV único (re particionar a 1 archivo)
high_value \
    .coalesce(1) \
    .write \
    .mode("overwrite") \
    .option("header", "true") \
    .csv("output/high_value_trips")

# Guardar resultados RDD como texto
sc.parallelize(tip_by_payment) \
    .map(lambda x: f"TipoPago{x[0]}: ${x[1]:.2f}") \
    .saveAsTextFile("output/avg_tip_by_payment")
```

> [!WARNING]
> `coalesce(1)` fuerza todos los datos a través de una sola partición. Use solo para conjuntos pequeños de resultados. Para salidas grandes, mantenga el recuento natural de particiones para escrituras paralelas.

## Parte 4: Preguntas de Negocio

Responde estas preguntas usando tu análisis:

```python
# Q1: ¿Cuál es la distancia promedio y tarifa promedio de los viajes?
avg_metrics = spark.sql("""
    SELECT ROUND(AVG(trip_distance), 2) as avg_distance,
           ROUND(AVG(fare_amount), 2) as avg_fare,
           ROUND(AVG(total_amount), 2) as avg_total
    FROM trips
""")
print("Q1 - Métricas promedio:")
avg_metrics.show()

# Q2: ¿Qué hora tiene el porcentaje promedio de propina más alto?
best_tip_hour = spark.sql("""
    SELECT HOUR(tpep_pickup_datetime) as hour,
           ROUND(AVG(tip_amount / fare_amount * 100), 2) as avg_tip_pct
    FROM trips
    WHERE fare_amount > 0
    GROUP BY hour
    ORDER BY avg_tip_pct DESC
    LIMIT 3
""")
print("Q2 - Mejores horas para propina:")
best_tip_hour.show()

# Q3: ¿Cuál es la distribución de ingresos entre los tipos de pago?
revenue_dist = spark.sql("""
    SELECT payment_type,
           COUNT(*) as trips,
           ROUND(SUM(total_amount), 2) as total_revenue,
           ROUND(AVG(total_amount), 2) as avg_trip_value
    FROM trips
    GROUP BY payment_type
    ORDER BY total_revenue DESC
""")
print("Q3 - Ingresos por tipo de pago:")
revenue_dist.show()

# Q4: ¿Cómo se correlaciona la distancia del viaje con el monto de la tarifa?
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
print("Q4 - Tarifa por rango de distancia:")
correlation.show()
```

## Script Completo del Pipeline

```python
# taxi_analysis.py - Pipeline completo
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("NYCTaxiAnalysis") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# Cargar
df = spark.read.option("header", "true") \
    .option("inferSchema", "true") \
    .csv("data/taxi_trips.csv")

# Limpiar
clean = df.filter(col("trip_distance") > 0) \
    .filter(col("fare_amount") > 0)

# Enriquecer
enriched = clean.withColumn("tip_pct",
    round(col("tip_amount") / col("fare_amount") * 100, 2)) \
    .withColumn("pickup_hour", hour("tpep_pickup_datetime"))

# Analizar
result = enriched.groupBy("pickup_hour").agg(
    count("*").alias("trips"),
    round(avg("fare_amount"), 2).alias("avg_fare")
).orderBy("pickup_hour")

# Guardar
result.coalesce(1).write.mode("overwrite") \
    .option("header", "true").csv("output/taxi_analysis")

spark.stop()
```

## Preguntas de Práctica

1. ¿Cómo se analiza un archivo CSV manualmente usando RDDs?
2. ¿Por qué es importante limpiar datos (eliminar distancias negativas, tarifas cero) antes del análisis?
3. ¿Cuáles son las ventajas de cargar datos con DataFrames en lugar de RDDs?
4. ¿Cómo se calcula el porcentaje de propina como una columna derivada?
5. ¿Qué consulta SQL encuentra las horas más ocupadas del día?
6. ¿Cómo se guardan resultados en formato Parquet vs formato CSV?
7. ¿Por qué `saveAsTextFile` produce múltiples archivos de parte?
8. ¿Cómo se guardan resultados de DataFrame como un único archivo CSV?
9. ¿Cuáles son tres conocimientos de negocio que puedes extraer de los datos de taxi de NYC?
10. ¿Cómo modificarías el pipeline para analizar datos por día de la semana en lugar de hora?
