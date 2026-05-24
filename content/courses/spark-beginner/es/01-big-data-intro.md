---
title: "Introducción al Big Data"
description: "Entiende qué es big data, los desafíos que plantea, el ecosistema Hadoop y cómo MapReduce se compara con Apache Spark"
order: 1
duration: "30-40 minutos"
difficulty: "principiante"
---

# Introducción al Big Data

Big data se refiere a conjuntos de datos tan grandes o complejos que las herramientas tradicionales de procesamiento no pueden manejarlos eficientemente. Apache Spark surgió como una solución que supera las limitaciones de sistemas anteriores como Hadoop MapReduce.

## ¿Qué es Big Data?

Big data se caracteriza por las **5 V's**:

| V | Significado | Ejemplo |
|---|---|---|
| **Volumen** | Cantidad masiva de datos | Petabytes de logs de sensores |
| **Velocidad** | Rapidez de generación de datos | Millones de tweets por minuto |
| **Variedad** | Diferentes formatos de datos | CSV, JSON, imágenes, video |
| **Veracidad** | Calidad y confiabilidad de los datos | Lecturas ruidosas de sensores |
| **Valor** | Información de negocio a partir de datos | Patrones de detección de fraude |

> [!NOTE]
> El marco de las 5 V's ayuda a las organizaciones a determinar si realmente tienen un problema de "big data" versus un problema regular de datos que las bases de datos tradicionales pueden resolver.

### Volumen

Las organizaciones generan terabytes a petabytes de datos diariamente. Un solo motor a reacción produce varios terabytes de datos por vuelo. Las plataformas de redes sociales generan cientos de terabytes cada día. Los sistemas RDBMS tradicionales alcanzan límites de escalabilidad en umbrales mucho más bajos.

### Velocidad

Los datos fluyen a velocidades sin precedentes. Los tickers del mercado de valores se actualizan en microsegundos, los sensores IoT reportan lecturas cada segundo y los logs de clickstream acumulan millones de eventos por hora. El procesamiento debe mantenerse al día con las tasas de ingestión.

### Variedad

Los datos llegan en formatos estructurados (tablas de base de datos), semiestructurados (JSON, XML, CSV) y no estructurados (texto, imágenes, video). Las bases de datos tradicionales son excelentes con datos estructurados pero tienen dificultades con contenido no estructurado.

> [!WARNING]
> Muchos proyectos fallan porque tratan todos los datos de la misma manera. Cada formato tiene requisitos únicos de análisis y consideraciones de almacenamiento.

## Desafíos del Big Data

1. **Almacenamiento**: Los sistemas de almacenamiento tradicionales no escalan económicamente a petabytes
2. **Procesamiento**: El procesamiento en una sola máquina toma demasiado tiempo o falla por completo
3. **Transferencia de Datos**: Mover grandes conjuntos de datos por la red crea cuellos de botella
4. **Tolerancia a Fallos**: Las fallas de hardware son comunes a escala — los sistemas deben recuperarse automáticamente
5. **Brecha de Habilidades**: Las herramientas de big data requieren conocimiento especializado

## El Ecosistema Hadoop

Hadoop fue la primera plataforma de big data ampliamente adoptada. Su ecosistema incluye:

### HDFS (Hadoop Distributed File System)
HDFS divide archivos en bloques (predeterminado 128 MB) y los distribuye entre los nodos del clúster. Cada bloque se replica (predeterminado 3x) para tolerancia a fallos.

```
Archivo: 1 GB de log
Bloques: 8 bloques de 128 MB
Replicación: 3 copias de cada bloque
Almacenamiento total usado: 3 GB
```

### Hadoop MapReduce
MapReduce procesa datos en dos fases:
- **Map**: Transforma cada registro de entrada en pares clave-valor
- **Reduce**: Agrega valores por clave

> [!WARNING]
> MapReduce escribe resultados intermedios en disco entre las fases Map y Reduce. Esta E/S de disco lo hace lento para cargas de trabajo iterativas e interactivas.

### YARN (Yet Another Resource Negotiator)
YARN gestiona recursos del clúster, programando aplicaciones entre los nodos. Desacopla la gestión de recursos del marco de procesamiento.

### Otros Componentes Hadoop
- **Hive**: Interfaz tipo SQL sobre MapReduce
- **HBase**: Base de datos NoSQL columnar en HDFS
- **Sqoop**: Transferencia de datos entre Hadoop y bases de datos relacionales
- **Flume**: Ingestión de datos de log
- **Oozie**: Programación de flujos de trabajo

## MapReduce vs Spark

| Aspecto | MapReduce | Apache Spark |
|---|---|---|
| **Modelo de Procesamiento** | Basado en disco, dos etapas | En memoria, basado en DAG |
| **Velocidad** | Lento (sobrecarga de E/S de disco) | Hasta 100x más rápido en memoria |
| **API** | Solo Java | Python, Scala, Java, R, SQL |
| **Procesamiento Iterativo** | Malo (escribe en disco cada iteración) | Excelente (mantiene datos en memoria) |
| **Tiempo Real** | Solo lote | Lote, streaming, interactivo |
| **Tolerancia a Fallos** | Re-ejecución de tareas | Linaje RDD, re-ejecución de tareas |
| **Soporte SQL** | Hive (separado) | Spark SQL (integrado) |
| **Soporte ML** | Mahout (separado) | MLlib (integrado) |
| **Procesamiento de Grafos** | Giraph (separado) | GraphX (integrado) |
| **Streaming** | No nativo | Structured Streaming |

> [!SUCCESS]
> La ventaja clave de Spark es mantener datos en memoria entre operaciones, lo cual es transformador para algoritmos iterativos (aprendizaje automático) y consultas interactivas.

### Cuándo Elegir Spark sobre MapReduce

- **Algoritmos iterativos**: El entrenamiento de ML necesita múltiples pasadas sobre los datos
- **Analítica interactiva**: Consultas ad-hoc que requieren tiempos de respuesta rápidos
- **Cargas de trabajo de streaming**: Procesamiento de datos en tiempo real
- **Pipelines multi-carga**: Combinar SQL, ML y streaming en una aplicación

### Cuándo MapReduce Todavía Tiene Sentido

- **Conjuntos de datos extremadamente grandes que exceden la memoria del clúster**
- **Clústeres de bajo costo con RAM limitada**
- **Sistemas heredados ya invertidos en el ecosistema Hadoop**

## La Ventaja de Spark

Apache Spark proporciona un motor de análisis unificado para:
- **Procesamiento por lotes** (DataFrames, RDDs)
- **Streaming** (Structured Streaming)
- **Aprendizaje automático** (MLlib)
- **Procesamiento de grafos** (GraphX)
- **Analítica SQL** (Spark SQL)

Todo desde una única API, eliminando la necesidad de combinar herramientas separadas.

> [!NOTE]
> Spark no incluye su propio sistema de almacenamiento. Lee y escribe desde HDFS, S3, GCS, Azure Blob Storage, Cassandra, HBase, fuentes JDBC y más.

## Caso de Uso: Pipeline de Análisis de Logs

Un pipeline típico de big data usando Spark:

```
Logs Brutos (HDFS/S3)
    |
    v
Spark Batch/Streaming (limpieza, análisis)
    |
    v
Datos Transformados (Parquet en HDFS/S3)
    |
    v
Spark SQL (análisis ad-hoc)
    |
    v
Dashboard de BI (Tableau, Superset)
```

## Conclusiones Clave

1. Big data se define por volumen, velocidad, variedad, veracidad y valor
2. Hadoop proporcionó la base pero MapReduce es demasiado lento para cargas interactivas/iterativas
3. Spark procesa datos en memoria usando un motor DAG, logrando aceleraciones de 10-100x
4. Spark unificó lote, streaming, SQL, ML y procesamiento de grafos en un marco
5. Spark lee de almacenamiento externo — es un motor de procesamiento, no un sistema de almacenamiento

## Preguntas de Práctica

1. ¿Cuáles son las 5 V's del big data? Explique cada una.
2. ¿Por qué la E/S de disco es un cuello de botella en MapReduce pero no en Spark?
3. ¿Cómo logra HDFS tolerancia a fallos para los datos almacenados?
4. ¿Cuál es el rol de YARN en el ecosistema Hadoop?
5. Liste tres escenarios donde Spark supera claramente a MapReduce.
6. ¿Qué sucede con los datos intermedios entre Map y Reduce en MapReduce?
7. ¿Por qué Spark es particularmente adecuado para algoritmos iterativos de aprendizaje automático?
8. ¿Cómo difiere el enfoque unificado de Spark de combinar herramientas Hadoop separadas?
9. ¿Qué sistemas de almacenamiento puede leer y escribir Spark?
10. Dé un caso de uso del mundo real donde el volumen, la velocidad y la variedad de big data se apliquen.
