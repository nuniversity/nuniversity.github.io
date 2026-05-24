---
title: "Instalación de Spark y SparkSession"
description: "Instala Apache Spark localmente, configura PySpark, configura SparkSession y verifica tu instalación"
order: 3
duration: "30-40 minutos"
difficulty: "principiante"
---

# Instalación de Spark y SparkSession

Antes de escribir código Spark, necesitas una instalación funcional. Esta guía cubre la instalación de Spark localmente, la configuración de PySpark y la comprensión del punto de entrada SparkSession.

## Prerrequisitos

- **Java 8/11/17**: Spark se ejecuta en la JVM. Instala OpenJDK.
- **Python 3.8+**: Requerido para PySpark.
- **pip**: Administrador de paquetes de Python.

```bash
# Verificar prerrequisitos
java -version
python --version
pip --version
```

> [!NOTE]
> Spark 3.5.x requiere soporte Java 17 (se ejecuta en Java 8/11/17). Spark 3.4 y anteriores funcionan mejor con Java 11.

## Instalando Spark

### Opción 1: Usando pip (solo PySpark)

La forma más sencilla de empezar con PySpark:

```bash
pip install pyspark
```

Esto instala PySpark y un runtime de Spark preconstruido. No se necesita descarga separada de Spark.

### Opción 2: Instalación Manual

Descarga de [spark.apache.org/downloads.html](https://spark.apache.org/downloads.html).

```bash
# Extraer Spark
wget https://dlcdn.apache.org/spark/spark-3.5.1/spark-3.5.1-bin-hadoop3.tgz
tar -xzf spark-3.5.1-bin-hadoop3.tgz
sudo mv spark-3.5.1-bin-hadoop3 /opt/spark

# Establecer variables de entorno
echo 'export SPARK_HOME=/opt/spark' >> ~/.bashrc
echo 'export PATH=$SPARK_HOME/bin:$PATH' >> ~/.bashrc
echo 'export PYTHONPATH=$SPARK_HOME/python:$PYTHONPATH' >> ~/.bashrc
source ~/.bashrc
```

### Verificar Instalación

```bash
# Ejecutar shell Spark
pyspark

# O ejecutar una prueba rápida
spark-submit --version
```

> [!SUCCESS]
> Ejecutar `pyspark` lanza una sesión Spark interactiva. ¡Estás listo para escribir código Spark!

## SparkSession

`SparkSession` es el punto de entrada unificado para toda la funcionalidad de Spark. Reemplaza `SparkContext`, `SQLContext` y `HiveContext` de versiones anteriores.

### Creando una SparkSession

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("MyFirstApp") \
    .config("spark.sql.shuffle.partitions", "4") \
    .config("spark.executor.memory", "2g") \
    .getOrCreate()
```

> [!NOTE]
> `getOrCreate()` reutiliza una SparkSession existente si hay una, evitando errores al ejecutar en el shell Spark o entornos de notebook donde una sesión ya puede estar activa.

### Principales Opciones de Configuración

| Clave de Configuración | Predeterminado | Descripción |
|---|---|---|
| `spark.app.name` | (ninguno) | Nombre de la aplicación para UI |
| `spark.master` | `local[*]` | URL del clúster o `local[N]` |
| `spark.sql.shuffle.partitions` | `200` | Particiones para shuffles |
| `spark.executor.memory` | `1g` | Memoria por ejecutor |
| `spark.driver.memory` | `1g` | Memoria para driver |
| `spark.executor.cores` | `1` | Núcleos por ejecutor |
| `spark.sql.adaptive.enabled` | `true` | Optimización AQE |

### Modo Local

Para desarrollo y pruebas, usa el modo local:

```python
# Usar todos los núcleos disponibles
spark = SparkSession.builder \
    .appName("LocalMode") \
    .master("local[*]") \
    .getOrCreate()

# Usar exactamente 4 núcleos
spark = SparkSession.builder \
    .appName("LocalMode") \
    .master("local[4]") \
    .getOrCreate()
```

> [!WARNING]
> El modo local ejecuta todo en una sola JVM. Es excelente para aprender y pruebas pequeñas pero no simula el comportamiento distribuido real. Las condiciones de carrera o errores de serialización pueden aparecer solo en modo clúster.

## Métodos de Configuración de PySpark

### Usando el método config()

```python
spark = SparkSession.builder \
    .appName("ConfigExample") \
    .config("spark.sql.shuffle.partitions", "50") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .getOrCreate()
```

### Usando un diccionario de configuración

```python
conf = {
    "spark.sql.shuffle.partitions": "50",
    "spark.sql.adaptive.enabled": "true",
    "spark.executor.memory": "4g",
    "spark.driver.memory": "2g"
}

spark = SparkSession.builder \
    .appName("DictConfig") \
    .config(map=conf) \
    .getOrCreate()
```

### Usando spark-defaults.conf

Crea `$SPARK_HOME/conf/spark-defaults.conf`:

```
spark.master                     yarn
spark.executor.memory            8g
spark.driver.memory              2g
spark.sql.shuffle.partitions     200
spark.sql.adaptive.enabled       true
```

## Verificando SparkSession

```python
# Verificar que la sesión Spark funciona
print(spark.version)
print(spark.sparkContext.defaultParallelism)

# Prueba de cordura simple
df = spark.range(1, 100)
print(df.count())
```

## Configuración Específica de Entorno

### Google Colab / Jupyter

```python
!pip install pyspark

from pyspark.sql import SparkSession
spark = SparkSession.builder \
    .appName("ColabDemo") \
    .master("local[*]") \
    .getOrCreate()
```

### Databricks

Los notebooks de Databricks tienen una variable `spark` preconfigurada. No se necesita configuración.

```python
# Databricks — spark ya existe
display(spark.range(10))
```

### Docker

```bash
docker run -it --rm \
  -p 8888:8888 \
  -v $(pwd):/home/jovyan/work \
  jupyter/pyspark-notebook
```

## Problemas Comunes de Instalación

| Problema | Solución |
|---|---|
| `java not found` | Instala JDK 8/11/17 y establece `JAVA_HOME` |
| `Py4JJavaError` | Incompatibilidad de versión entre PySpark y Spark |
| `OutOfMemoryError` | Aumenta `spark.driver.memory` |
| `ModuleNotFoundError: pyspark` | Activa entorno virtual o reinstala |
| Advertencia `HADOOP_HOME` | Establece `HADOOP_HOME` o ignora en Windows sin Hadoop |

## Conclusiones Clave

1. Instala PySpark mediante `pip install pyspark` para la configuración más rápida
2. `SparkSession` es el punto de entrada unificado para todas las APIs de Spark
3. `local[N]` se ejecuta en N núcleos en una sola JVM para desarrollo
4. La configuración se puede establecer programáticamente o mediante archivos de configuración
5. Diferentes entornos (Colab, Databricks, Docker) tienen pasos de configuración específicos

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `SparkContext` y `SparkSession`?
2. ¿Qué significa `master("local[*]")`?
3. ¿Cómo se establece la cantidad de memoria asignada a cada ejecutor?
4. ¿Cuál es el propósito de `getOrCreate()` vs `create()`?
5. ¿Cómo configuraría el número de particiones de shuffle?
6. ¿Qué métodos de instalación están disponibles para PySpark?
7. ¿Por qué podría ocurrir un `Py4JJavaError`?
8. ¿Cómo se verifica qué versión de Spark se está ejecutando?
9. ¿Qué variables de entorno se necesitan para una instalación manual de Spark?
10. ¿Cómo difiere la configuración de Spark en `spark-defaults.conf` de la configuración programática?
