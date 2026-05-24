---
title: "Técnicas de Optimización"
description: "Profundiza en el optimizador Catalyst, la ejecución Tungsten, variables de difusión y acumuladores para la optimización del rendimiento"
order: 5
duration: "35-45 minutos"
difficulty: "intermedio"
---

# Técnicas de Optimización

El rendimiento de Spark proviene de su avanzado motor de optimización. Comprender el optimizador Catalyst, la ejecución Tungsten, las variables de difusión y los acumuladores te ayuda a escribir aplicaciones Spark eficientes.

## Optimizador Catalyst

Catalyst es el optimizador de consultas de Spark SQL. Transforma consultas DataFrame/SQL en planes de ejecución física eficientes.

### Fases de Optimización

```
Código de Usuario -> Plan Lógico no Resuelto -> Plan Lógico Analizado
  -> Plan Lógico Optimizado -> Planes Físicos -> Plan Físico Seleccionado
  -> RDDs (ejecución)
```

### Fase 1: Análisis

Resuelve nombres de columnas, tipos y referencias a tablas.

```python
df = spark.range(1000).select("id", col("id") * 2 as "doubled")
df.explain(True)
# == Parsed Logical Plan ==
# == Analyzed Logical Plan ==  <- tipos de columna resueltos
# == Optimized Logical Plan ==
# == Physical Plan ==
```

### Fase 2: Optimización Lógica

Aplica optimizaciones basadas en reglas:
- **Pushdown de predicados**: Mueve filtros cerca de las fuentes de datos
- **Poda de proyecciones**: Selecciona solo las columnas necesarias temprano
- **Plegamiento de constantes**: Evalúa expresiones constantes en tiempo de compilación
- **Propagación de nulos**: Simplifica expresiones que involucran nulos

```python
# Ejemplo: Catalyst empuja el filtro a la fuente de datos
df = spark.read.parquet("data/sales.parquet")
optimized = df.filter(col("amount") > 100).select("id", "amount")
optimized.explain()
# Filter empujado al escaneo Parquet (pushdown de predicados)
```

> [!SUCCESS]
> El pushdown de predicados es una de las optimizaciones más impactantes. Al leer Parquet, filtrar por una columna lee solo los grupos de filas relevantes, reduciendo drásticamente E/S.

### Fase 3: Planificación Física

Convierte el plan lógico en uno o más planes físicos y selecciona el más barato mediante optimización basada en costos.

```python
# Muestra la selección del plan físico
df.join(small_df, "key").explain(True)
# == Physical Plan ==
# BroadcastHashJoin o SortMergeJoin elegido según estadísticas
```

### Fase 4: Generación de Código

Genera bytecode Java optimizado usando Tungsten.

## Motor de Ejecución Tungsten

Tungsten mejora el rendimiento mediante tres mecanismos:

### 1. Gestión de Memoria Fuera del Heap

```python
# Habilitar memoria fuera del heap
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")
```

Tungsten gestiona la memoria directamente usando `sun.misc.Unsafe`, evitando la sobrecarga del recolector de basura JVM.

### 2. Computación Consciente de Caché

Los datos se organizan en formato binario compacto (unsafe rows) para eficiencia de caché de CPU.

### 3. Generación de Código de Etapa Completa (WSCG)

```python
# Verificar si WSCG está habilitado
print(spark.conf.get("spark.sql.codegen.wholeStage"))
# true (por defecto)

# Ver código generado
df.explain("codegen")
```

> [!NOTE]
> La generación de código de etapa completa colapsa múltiples operadores en una sola función, eliminando llamadas a funciones virtuales y aumentando la eficiencia de la CPU. Por esto Spark SQL/DataFrames son más rápidos que los RDDs.

## Variables de Difusión

Las variables de difusión te permiten almacenar en caché un valor grande de solo lectura en cada ejecutor, evitando costosos shuffles.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("Broadcast").master("local[*]").getOrCreate()
sc = spark.sparkContext

# Crear una variable de difusión
lookup_table = {
    "NY": "New York",
    "SF": "San Francisco",
    "LA": "Los Angeles",
    "CHI": "Chicago"
}
broadcast_lookup = sc.broadcast(lookup_table)

# Usar en operaciones RDD
cities_rdd = sc.parallelize(["NY", "SF", "LA", "CHI", "NY", "SF"])
full_names = cities_rdd.map(lambda code: broadcast_lookup.value.get(code, "Unknown"))
print(full_names.collect())
# ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'New York', 'San Francisco']
```

### Broadcast vs Collect

| Aspecto | Broadcast | Collect |
|---|---|---|
| **Ubicación de datos** | Copiado a cada ejecutor | Enviado solo al driver |
| **Caso de uso** | Tablas de búsqueda, modelos ML | Resultados pequeños para el driver |
| **Memoria** | Una copia por ejecutor | Una copia en el driver |
| **Rendimiento** | Rápido para ejecutores | Cuello de botella en el driver |

> [!WARNING]
> Las variables de difusión son de solo lectura. Si necesitas actualizarlas, destruye la variable antigua y crea una nueva. Transmitir una variable más grande que la memoria del ejecutor causa errores OOM.

### Difusión en DataFrames

```python
# Hint de difusión en DataFrame
from pyspark.sql.functions import broadcast

# Difusión explícita de tabla pequeña
large_df.join(broadcast(small_df), "key").explain()
# BroadcastHashJoin

# Ver umbral de difusión
print(spark.conf.get("spark.sql.autoBroadcastJoinThreshold"))
# 10485760 (10 MB)
```

### Difusión de Modelos ML

```python
import pickle
from pyspark.ml.classification import LogisticRegressionModel

# Cargar modelo y difundirlo a todos los ejecutores
model = LogisticRegressionModel.load("models/lr_model")
broadcast_model = sc.broadcast(model)

# Aplicar modelo en paralelo
predictions = features_rdd.map(lambda features: broadcast_model.value.predict(features))
```

## Acumuladores

Los acumuladores proporcionan contadores distribuidos para agregar valores entre tareas.

```python
# Crear acumuladores
total_rows = sc.accumulator(0)
total_errors = sc.accumulator(0)
empty_lines = sc.accumulator(0)

def process_line(line):
    total_rows.add(1)
    if not line.strip():
        empty_lines.add(1)
        return None
    if "ERROR" in line:
        total_errors.add(1)
    return line

rdd = sc.parallelize(["INFO: OK", "ERROR: Failed", "", "ERROR: Timeout", "INFO: Done"])
processed = rdd.map(process_line).filter(lambda x: x is not None)

# Las acciones disparan actualizaciones de acumuladores
result = processed.collect()

print(f"Total filas: {total_rows.value}")     # 5
print(f"Líneas vacías: {empty_lines.value}")   # 1
print(f"Errores: {total_errors.value}")        # 2
```

> [!NOTE]
> Los acumuladores solo se actualizan cuando se ejecuta una acción. Las transformaciones pueden computarlos múltiples veces (reintentos de tareas). Los acumuladores nombrados son visibles en la UI de Spark.

### Acumuladores Nombrados

```python
# Los acumuladores nombrados aparecen en la UI de Spark
from pyspark.util import InheritableThreadLocal

# Mejor enfoque: usar sc.accumulator con nombre
from pyspark.accumulators import AccumulatorParam

class StringAccumulatorParam(AccumulatorParam):
    def zero(self, value):
        return ""
    def addInPlace(self, val1, val2):
        return val1 + val2

error_log = sc.accumulator("", StringAccumulatorParam())

def log_error(line):
    if "ERROR" in line:
        error_log.add(line + "\n")
    return line
```

### Casos de Uso de Acumuladores

```python
# Validación y métricas de calidad
valid_rows = sc.accumulator(0)
invalid_rows = sc.accumulator(0)
null_fields = sc.accumulator(0)

def validate(row):
    try:
        if row["age"] < 0:
            invalid_rows.add(1)
            return None
        if row["name"] is None:
            null_fields.add(1)
        valid_rows.add(1)
        return row
    except Exception:
        invalid_rows.add(1)
        return None

# Monitoreo personalizado
bytes_processed = sc.accumulator(0)

def track_bytes(line):
    bytes_processed.add(len(line.encode("utf-8")))
    return line
```

## AQE (Ejecución Adaptativa de Consultas)

El AQE de Spark 3.x optimiza dinámicamente las consultas en tiempo de ejecución.

```python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

| Característica AQE | Beneficio |
|---|---|
| **Coalescencia dinámica** | Reduce particiones cuando los datos son pequeños |
| **Cambio dinámico de join** | Cambia a difusión si las estadísticas revelan tabla pequeña |
| **Manejo dinámico de skew** | Divide particiones de join sesgadas |
| **Lector de shuffle local optimizado** | Evita shuffle cuando es posible |

## Lista de Verificación de Rendimiento

1. **Usa DataFrames/SQL** sobre RDDs (Catalyst + Tungsten)
2. **Habilita AQE** para optimización dinámica
3. **Difunde tablas pequeñas** con hints explícitos
4. **Cachea resultados intermedios** usados por múltiples acciones
5. **Filtra temprano** (pushdown de predicados)
6. **Selecciona solo columnas necesarias** (poda de proyecciones)
7. **Evita UDFs** cuando las funciones incorporadas sean suficientes
8. **Usa acumuladores** para monitoreo, no para lógica de negocio

## Preguntas de Práctica

1. ¿Cuáles son las cuatro fases del optimizador Catalyst?
2. ¿Cómo mejora el pushdown de predicados el rendimiento de las consultas?
3. ¿Qué es la generación de código de etapa completa y por qué es más rápida?
4. ¿Cuándo usarías una variable de difusión en lugar de un hint de broadcast join?
5. ¿En qué se diferencian los acumuladores de las variables regulares?
6. ¿Qué sucede con el valor de un acumulador si una tarea falla y se reintenta?
7. ¿Por qué es más rápida la gestión de memoria fuera del heap de Tungsten?
8. ¿Qué tres optimizaciones dinámicas proporciona AQE?
9. ¿Cómo verificas si la generación de código de etapa completa está habilitada?
10. ¿Qué información aparece en `df.explain("codegen")`?
