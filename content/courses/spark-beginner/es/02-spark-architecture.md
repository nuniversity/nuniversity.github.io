---
title: "Arquitectura Spark"
description: "Explora la arquitectura Spark: driver, ejecutores, administradores de clúster incluyendo Standalone, YARN y Kubernetes"
order: 2
duration: "30-40 minutos"
difficulty: "principiante"
---

# Arquitectura Spark

Entender la arquitectura distribuida de Spark es esencial para escribir aplicaciones eficientes y diagnosticar problemas de rendimiento. Spark sigue un patrón maestro-esclavo con un driver central coordinando procesos ejecutores distribuidos.

## Arquitectura de Alto Nivel

Las aplicaciones Spark se ejecutan como conjuntos independientes de procesos coordinados por un **SparkContext** en el programa driver.

```
+---------------------+
|   Driver Program    |
|  (SparkContext)      |
+----------+----------+
           |
    Cluster Manager
  (Standalone/YARN/K8s)
           |
     +-----+------+
     |            |
+----+----+  +----+----+
| Executor |  | Executor |
| Core 1   |  | Core 1   |
| Core 2   |  | Core 2   |
| ...      |  | ...      |
+----------+  +----------+
```

## Driver

El driver es el coordinador central de una aplicación Spark. Ejecuta la función `main()` del usuario y crea el `SparkContext` (o `SparkSession` en Spark moderno).

### Responsabilidades del Driver

1. **Convertir código de usuario en tareas**: El driver transforma transformaciones en un DAG (Directed Acyclic Graph) de etapas y tareas
2. **Programar tareas**: Asigna tareas a ejecutores basándose en la localidad de los datos
3. **Coordinar ejecución**: Sigue el progreso de las tareas, maneja fallos
4. **Gestionar el SparkContext**: Mantiene el estado y configuración de la aplicación

> [!NOTE]
> El driver debe ser accesible desde todos los ejecutores a través de la red. Si la máquina del driver falla, toda la aplicación falla. Para producción, ejecute drivers en infraestructura resiliente.

## Ejecutores

Los ejecutores son procesos de trabajo que ejecutan tareas y almacenan datos.

### Responsabilidades de los Ejecutores

1. **Ejecutar tareas**: Ejecutan código asignado por el driver
2. **Almacenar datos**: Cachean RDDs, DataFrames o variables de broadcast en memoria o disco
3. **Reportar resultados**: Envían resultados de vuelta al driver

### Configuración de Ejecutores

Parámetros clave de ejecutor en `spark-submit`:

```bash
# 4 ejecutores, cada uno con 4 núcleos y 8GB de memoria
spark-submit \
  --num-executors 4 \
  --executor-cores 4 \
  --executor-memory 8g \
  app.py
```

> [!WARNING]
> Solicitar demasiados núcleos por ejecutor (>5) puede causar contención de E/S en HDFS. Una regla general es 3-5 núcleos por ejecutor.

## Administradores de Clúster

Spark soporta varios administradores de clúster que manejan la asignación de recursos entre máquinas.

### Modo Standalone

Administrador de clúster simple integrado de Spark.

| Característica | Detalles |
|---|---|
| **Configuración** | Iniciar scripts master y worker |
| **Escalabilidad** | Bueno para clústeres pequeños a medianos |
| **Alta Disponibilidad** | Failover basado en ZooKeeper |
| **Mejor para** | Aprendizaje, desarrollo, pequeñas implantaciones de producción |

```bash
# Iniciar clúster Standalone
./sbin/start-master.sh
./sbin/start-worker.sh spark://host:7077

# Enviar aplicación
spark-submit --master spark://host:7077 app.py
```

### Modo YARN

Administrador de recursos de Hadoop, ideal para clústeres que ya ejecutan Hadoop.

| Característica | Detalles |
|---|---|
| **Modos** | `yarn-client` (driver en cliente) y `yarn-cluster` (driver en YARN) |
| **Integración** | Perfecta con HDFS y otras herramientas Hadoop |
| **Seguridad** | Autenticación Kerberos, ACLs |
| **Asignación Dinámica** | Soportada nativamente |
| **Mejor para** | Organizaciones que ya usan el ecosistema Hadoop |

```bash
# Modo YARN cluster (driver ejecuta dentro de YARN)
spark-submit --master yarn --deploy-mode cluster app.py

# Modo YARN client (driver ejecuta en máquina que envía)
spark-submit --master yarn --deploy-mode client app.py
```

> [!NOTE]
> En modo `yarn-cluster`, el driver ejecuta dentro de un contenedor ApplicationMaster. Si falla, YARN lo reinicia. Esto es más resiliente que el modo `client`.

### Modo Kubernetes

Orquestación moderna de contenedores para ejecutar Spark.

| Característica | Detalles |
|---|---|
| **Implantación** | Contenedores Docker gestionados por K8s |
| **Aislamiento de Recursos** | Namespaces, cuotas de recursos |
| **Auto-escalado** | Auto-escalado horizontal de pods |
| **Mejor para** | Arquitecturas cloud-native, organizaciones ya en K8s |

```bash
# Modo Kubernetes
spark-submit \
  --master k8s://https://<k8s-api-server> \
  --deploy-mode cluster \
  --conf spark.kubernetes.container.image=spark:3.5 \
  --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
  app.py
```

### Comparación de Administradores de Clúster

| Característica | Standalone | YARN | Kubernetes |
|---|---|---|---|
| **Complejidad de Configuración** | Baja | Media | Alta |
| **Escalabilidad** | Media | Alta | Alta |
| **Multi-inquilino** | Limitada | Excelente | Excelente |
| **Asignación Dinámica** | Sí | Sí | Sí (v3.3+) |
| **Soporte a Contenedores** | No | No | Nativo |
| **Mejor para** | Dev/Pequeña Prod | Entornos Hadoop | Cloud Native |

## Ciclo de Vida de la Aplicación

1. **Usuario envía aplicación** mediante `spark-submit`
2. **Driver inicia y conecta** al administrador de clúster solicitando recursos
3. **Administrador de clúster asigna** contenedores ejecutores
4. **Ejecutores se registran** con el driver
5. **Driver transforma** el código del usuario en un DAG, divide en etapas y tareas
6. **Driver programa** tareas a ejecutores basándose en la localidad de los datos
7. **Ejecutores ejecutan tareas** y devuelven resultados (o hacen spill a disco)
8. **Aplicación completa** y libera todos los recursos

## Localidad de los Datos

Spark intenta programar tareas cerca de sus datos para minimizar la transferencia de red.

| Nivel de Localidad | Descripción |
|---|---|
| **PROCESS_LOCAL** | Datos en la misma JVM que la tarea |
| **NODE_LOCAL** | Datos en el mismo nodo (JVM diferente) |
| **RACK_LOCAL** | Datos en el mismo rack |
| **ANY** | Datos en cualquier lugar del clúster |

> [!SUCCESS]
> La localidad de los datos es una de las optimizaciones más importantes de Spark. Procesar datos donde ya están evita costosas transferencias de red.

## Particiones y Paralelismo

Una partición es un bloque lógico de datos procesado por una tarea. El número de particiones determina el paralelismo.

```
Archivo: 1 GB en HDFS (tamaño de bloque 128 MB)
Particiones: ~8 particiones
Tareas: Hasta 8 tareas ejecutándose en paralelo
```

## Conclusiones Clave

1. El **driver** coordina la aplicación y convierte código en tareas
2. Los **ejecutores** ejecutan tareas y almacenan datos en caché
3. Los **administradores de clúster** (Standalone, YARN, K8s) asignan recursos
4. La localidad de los datos minimiza la sobrecarga de red
5. El recuento de particiones determina el nivel de paralelismo
6. Elegir el administrador de clúster adecuado depende de su infraestructura

## Preguntas de Práctica

1. ¿Cuáles son los tres componentes principales de una aplicación Spark?
2. ¿Qué sucede si el proceso driver falla?
3. ¿Por qué debería limitar el recuento de núcleos del ejecutor a 3-5?
4. ¿Cuál es la diferencia entre los modos de implementación `yarn-client` y `yarn-cluster`?
5. ¿Cuándo elegiría Kubernetes sobre YARN para Spark?
6. Explique los cinco niveles de localidad que Spark usa para la programación de tareas.
7. ¿Cómo determina Spark el número de particiones al leer de HDFS?
8. ¿Cuál es el rol del administrador de clúster durante el ciclo de vida de una aplicación Spark?
9. ¿Por qué es útil la asignación dinámica en un clúster multi-inquilino?
10. ¿Qué parámetros de configuración controlan los recursos del ejecutor?
