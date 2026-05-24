---
title: "Mejores Prácticas de ETL"
description: "Diseña pipelines ETL robustos con cargas incrementales, manejo de datos tardíos, evolución de esquemas y mejores prácticas de producción"
order: 8
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Mejores Prácticas de ETL

Los pipelines de Extracción, Transformación y Carga (ETL) son la columna vertebral de la ingeniería de datos. Esta lección cubre patrones listos para producción para construir pipelines ETL confiables, mantenibles y eficientes en Spark.

## Arquitectura de Pipeline ETL

```
Sistemas de Origen
  (BD, Kafka, APIs, Archivos)
       |
   Extracción
       |
   Área de Staging (Crudo)
       |
   Transformación (Limpiar, Enriquecer)
       |
   Carga (Curado)
       |
   Capa de Consumo
  (BI, ML, Analítica)
```

```python
# Estructura básica de pipeline ETL
def extract(spark, source_config):
    """Extraer datos crudos de la fuente."""
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
    """Aplicar transformaciones de lógica de negocio."""
    return df \
        .filter(col("amount").isNotNull()) \
        .withColumn("processed_date", current_date()) \
        .withColumn("amount_usd", when(col("currency") == "EUR", col("amount") * 1.18)
                                   .otherwise(col("amount")))

def load(df, target_config):
    """Escribir datos limpios al destino."""
    df.write \
        .mode(target_config.get("mode", "append")) \
        .partitionBy(target_config.get("partition_cols", [])) \
        .option("compression", "snappy") \
        .format(target_config.get("format", "parquet")) \
        .save(target_config["path"])
```

## Cargas Incrementales

Las cargas completas se vuelven impracticables a medida que los datos crecen. Las cargas incrementales procesan solo datos nuevos o modificados.

```python
# Patrón de carga incremental usando watermark
def incremental_load(spark, source_table, watermark_col, last_run):
    """Cargar solo registros más recientes que last_run."""
    
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

# Escribir a tabla particionada
df.write \
    .mode("append") \
    .partitionBy("year", "month", "day") \
    .parquet("data/sales/")
```

> [!NOTE]
> Para cargas incrementales, siempre almacena el último watermark exitoso (máxima marca de tiempo procesada) en una tabla de metadatos, archivo o base de datos. Esto permite la recuperación y previene la pérdida de datos.

### Captura de Cambios de Datos (CDC)

```python
# Manejo de CDC (inserciones, actualizaciones, eliminaciones)
def process_cdc(cdc_df):
    """Aplicar cambios CDC a la tabla destino."""
    
    # Separar operaciones
    inserts = cdc_df.filter(col("operation") == "I")
    updates = cdc_df.filter(col("operation") == "U")
    deletes = cdc_df.filter(col("operation") == "D")
    
    # Estado actual
    current = spark.read.parquet("data/target/")
    
    # Aplicar eliminaciones
    remaining = current.join(
        deletes.select("id"),
        on="id",
        how="left_anti"
    )
    
    # Aplicar upserts
    from delta.tables import DeltaTable  # Requiere Delta Lake
    # Ver lección de Delta Lake (curso avanzado) para detalles de merge
    return remaining
```

## Manejo de Datos Tardíos

Los datos que llegan tarde pueden corromper agregaciones e informes.

```python
from pyspark.sql.functions import current_timestamp, col

# Estrategia 1: Sobrescritura de partición
def handle_late_data(late_df, target_path):
    """Reprocesar solo las particiones afectadas."""
    
    # Determinar particiones afectadas
    affected_partitions = late_df \
        .select(col("event_date")) \
        .distinct() \
        .collect()
    
    for row in affected_partitions:
        date = row.event_date
        
        # Leer partición existente
        existing = spark.read \
            .parquet(f"{target_path}/event_date={date}")
        
        # Fusionar con datos tardíos
        updated = existing.union(late_df.filter(col("event_date") == date))
        
        # Sobrescribir partición
        updated.write \
            .mode("overwrite") \
            .option("partitionOverwriteMode", "dynamic") \
            .parquet(target_path)

# Estrategia 2: Reprocesamiento basado en watermark
def reprocess_late_data(spark, source_path, watermark_days=3):
    """Reprocesar últimos N días incluyendo llegadas tardías."""
    
    cutoff_date = date.today() - timedelta(days=watermark_days)
    
    df = spark.read \
        .option("basePath", source_path) \
        .parquet(f"{source_path}/event_date > '{cutoff_date}'/")
    
    return df.transform(apply_business_logic)
```

> [!WARNING]
> El manejo de datos tardíos es un equilibrio complejo. Establecer una ventana de reprocesamiento corta (1-2 días) captura la mayoría de los datos tardíos mientras limita el costo. Ventanas más largas aumentan la precisión pero también aumentan el tiempo de procesamiento y almacenamiento.

## Evolución de Esquemas

Las fuentes de datos cambian con el tiempo. Los pipelines de producción deben manejar la evolución de esquemas con gracia.

```python
# Estrategias de evolución de esquemas

# Estrategia 1: Fusionar esquema (Parquet)
spark.conf.set("spark.sql.parquet.mergeSchema", "true")
df = spark.read.parquet("data/evolving_source/")

# Estrategia 2: Usar esquema sin distinción de mayúsculas
spark.conf.set("spark.sql.caseSensitive", "false")

# Estrategia 3: Valores predeterminados de columna
def safe_read_with_evolution(spark, path, expected_schema):
    """Leer datos, añadiendo columnas faltantes con valores nulos predeterminados."""
    
    df = spark.read.parquet(path)
    existing_cols = set(df.columns)
    
    for field in expected_schema.fields:
        if field.name not in existing_cols:
            df = df.withColumn(field.name, lit(None).cast(field.dataType))
    
    return df.select([f.name for f in expected_schema.fields])

# Estrategia 4: Manejo dinámico de columnas
def handle_new_columns(df, known_columns):
    """Separar columnas conocidas y desconocidas."""
    
    new_cols = [c for c in df.columns if c not in known_columns]
    
    known_df = df.select(*known_columns)
    if new_cols:
        # Registrar nuevas columnas
        print(f"Nuevas columnas detectadas: {new_cols}")
        # Almacenar datos crudos para procesamiento posterior
        df.select("id", *new_cols).write.json("data/new_columns/")
    
    return known_df
```

## Controles de Calidad

```python
def run_quality_checks(df, checks):
    """Ejecutar controles de calidad de datos y fallar si las violaciones superan el umbral."""
    
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
            print(f"CONTROL DE CALIDAD FALLÓ: {check_name}")
            print(f"  Violaciones: {violation_count} ({violation_pct:.2f}%)")
    
    # Fallar pipeline si fallan controles críticos
    critical_failures = [r for r in results.values() 
                        if not r["passed"]]
    if critical_failures:
        raise Exception(f"{len(critical_failures)} controles de calidad fallaron")
    
    return results

# Ejemplo de controles de calidad
quality_checks = [
    {"name": "no_null_keys", "condition": "id IS NOT NULL", "threshold": 0},
    {"name": "positive_amount", "condition": "amount > 0", "threshold": 0.1},
    {"name": "valid_dates", "condition": "event_date <= current_date()", "threshold": 0},
]

run_quality_checks(df, quality_checks)
```

## Modularidad del Pipeline

```python
# Componentes ETL reutilizables

class ETLPipeline:
    def __init__(self, spark, config):
        self.spark = spark
        self.config = config
        self.audit_log = []
    
    def extract(self):
        """Extraer de la fuente."""
        self._log("Iniciando extracción")
        df = self._read_source()
        self._log(f"Extraídas {df.count()} filas")
        return df
    
    def transform(self, df):
        """Aplicar transformaciones."""
        self._log("Iniciando transformación")
        for transform_fn in self.config["transforms"]:
            df = transform_fn(df)
        self._log(f"Transformación completa: {df.count()} filas")
        return df
    
    def validate(self, df):
        """Ejecutar controles de calidad."""
        self._log("Iniciando validación")
        run_quality_checks(df, self.config["quality_checks"])
        return df
    
    def load(self, df):
        """Cargar al destino."""
        self._log("Iniciando carga")
        df.write \
            .mode(self.config["write_mode"]) \
            .partitionBy(self.config["partition_cols"]) \
            .parquet(self.config["target_path"])
        self._log(f"Cargadas {df.count()} filas")
    
    def run(self):
        """Ejecutar pipeline."""
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

## Lista de Verificación de Producción

1. **Procesamiento incremental** — Nunca escanear completamente tablas en crecimiento
2. **Pipelines idempotentes** — Re-ejecutar produce el mismo resultado
3. **Evolución de esquemas** — Manejar adiciones de columnas con gracia
4. **Seguimiento de watermark** — Almacenar marca de tiempo de última ejecución exitosa
5. **Controles de calidad** — Validar antes de cargar
6. **Salida particionada** — Organizar para eficiencia de consultas
7. **Registro de auditoría** — Rastrear filas procesadas, fallos, tiempo de ejecución
8. **Manejo de errores** — Try/catch con lógica de reintento
9. **Configuración de recursos** — Dimensionar correctamente los recursos del ejecutor

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre carga completa y carga incremental?
2. ¿Cómo rastreas watermarks para procesamiento incremental?
3. ¿Qué estrategias pueden manejar datos que llegan tarde?
4. ¿Cómo gestionas la evolución de esquemas cuando cambian los esquemas de origen?
5. ¿Cuáles son los controles de calidad críticos para un pipeline ETL?
6. ¿Por qué es importante la idempotencia en pipelines ETL?
7. ¿Cómo manejas la captura de cambios de datos (CDC) en Spark?
8. ¿Qué registro y auditoría deben incluir los pipelines ETL?
9. ¿Cómo reprocesas datos cuando cambia la lógica de negocio?
10. Diseña un pipeline ETL para datos de ventas diarias desde una base de datos PostgreSQL.
