---
title: "Spark Architecture"
description: "Explore the Spark architecture: driver, executors, cluster managers including Standalone, YARN, and Kubernetes"
order: 2
duration: "30-40 minutes"
difficulty: "beginner"
---

# Spark Architecture

Understanding Spark's distributed architecture is essential for writing efficient applications and diagnosing performance problems. Spark follows a master-slave pattern with a central driver coordinating distributed executor processes.

## High-Level Architecture

Spark applications run as independent sets of processes coordinated by a **SparkContext** in the driver program.

```
+---------------------+
|   Driver Program    |
|  (SparkContext)      |
+----------+----------+
           |
    Cluster Manager
  (Standalone/YARN/K8s)
           |
    +------+------+
    |             |
+----+----+  +----+----+
| Executor |  | Executor |
| Core 1   |  | Core 1   |
| Core 2   |  | Core 2   |
| ...      |  | ...      |
+----------+  +----------+
```

## Driver

The driver is the central coordinator of a Spark application. It runs the user's `main()` function and creates the `SparkContext` (or `SparkSession` in modern Spark).

### Driver Responsibilities

1. **Converting user code into tasks**: The driver transforms transformations into a DAG (Directed Acyclic Graph) of stages and tasks
2. **Scheduling tasks**: Assigns tasks to executors based on data locality
3. **Coordinating execution**: Tracks task progress, handles failures
4. **Managing the SparkContext**: Maintains application state and configuration

> [!NOTE]
> The driver must be reachable from all executors via network. If the driver machine fails, the entire application fails. For production, run drivers on resilient infrastructure.

## Executors

Executors are worker processes that run tasks and store data.

### Executor Responsibilities

1. **Running tasks**: Execute code assigned by the driver
2. **Storing data**: Cache RDDs, DataFrames, or broadcast variables in memory or disk
3. **Reporting results**: Send results back to the driver

### Executor Configuration

Key executor parameters in `spark-submit`:

```bash
# 4 executors, each with 4 cores and 8GB memory
spark-submit \
  --num-executors 4 \
  --executor-cores 4 \
  --executor-memory 8g \
  app.py
```

> [!WARNING]
> Requesting too many cores per executor (>5) can cause HDFS I/O contention. A rule of thumb is 3-5 cores per executor.

## Cluster Managers

Spark supports several cluster managers that handle resource allocation across machines.

### Standalone Mode

Spark's built-in simple cluster manager.

| Feature | Details |
|---|---|
| **Setup** | Start master and worker scripts |
| **Scalability** | Good for small to medium clusters |
| **High Availability** | ZooKeeper-based failover |
| **Best For** | Learning, development, small production deployments |

```bash
# Start Standalone cluster
./sbin/start-master.sh
./sbin/start-worker.sh spark://host:7077

# Submit application
spark-submit --master spark://host:7077 app.py
```

### YARN Mode

Hadoop's resource manager, ideal for clusters already running Hadoop.

| Feature | Details |
|---|---|
| **Modes** | `yarn-client` (driver on client) and `yarn-cluster` (driver on YARN) |
| **Integration** | Seamless with HDFS and other Hadoop tools |
| **Security** | Kerberos authentication, ACLs |
| **Dynamic Allocation** | Supported natively |
| **Best For** | Organizations already using the Hadoop ecosystem |

```bash
# YARN cluster mode (driver runs inside YARN)
spark-submit --master yarn --deploy-mode cluster app.py

# YARN client mode (driver runs on submitting machine)
spark-submit --master yarn --deploy-mode client app.py
```

> [!NOTE]
> In `yarn-cluster` mode, the driver runs inside an ApplicationMaster container. If it fails, YARN restarts it. This is more resilient than `client` mode.

### Kubernetes Mode

Modern container orchestration for running Spark.

| Feature | Details |
|---|---|
| **Deployment** | Docker containers managed by K8s |
| **Resource Isolation** | Namespaces, resource quotas |
| **Auto-scaling** | Horizontal pod autoscaling |
| **Best For** | Cloud-native architectures, organizations already on K8s |

```bash
# Kubernetes mode
spark-submit \
  --master k8s://https://<k8s-api-server> \
  --deploy-mode cluster \
  --conf spark.kubernetes.container.image=spark:3.5 \
  --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
  app.py
```

### Cluster Manager Comparison

| Feature | Standalone | YARN | Kubernetes |
|---|---|---|---|
| **Setup Complexity** | Low | Medium | High |
| **Scalability** | Medium | High | High |
| **Multi-tenancy** | Limited | Excellent | Excellent |
| **Dynamic Allocation** | Yes | Yes | Yes (v3.3+) |
| **Container Support** | No | No | Native |
| **Best For** | Dev/Small Prod | Hadoop Shops | Cloud Native |

## Application Lifecycle

1. **User submits application** via `spark-submit`
2. **Driver launches and connects** to the cluster manager requesting resources
3. **Cluster manager allocates** executor containers
4. **Executors register** with the driver
5. **Driver transforms** the user's code into a DAG, splits into stages and tasks
6. **Driver schedules** tasks to executors based on data locality
7. **Executors run tasks** and return results (or spill to disk)
8. **Application completes** and releases all resources

## Data Locality

Spark attempts to schedule tasks close to their data to minimize network transfer.

| Locality Level | Description |
|---|---|
| **PROCESS_LOCAL** | Data in same JVM as task |
| **NODE_LOCAL** | Data on same node (different JVM) |
| **RACK_LOCAL** | Data on same rack |
| **ANY** | Data elsewhere in the cluster |

> [!SUCCESS]
> Data locality is one of Spark's most important optimizations. Processing data where it already lives avoids costly network transfers.

## Partitions and Parallelism

A partition is a logical chunk of data processed by one task. The number of partitions determines parallelism.

```
File: 1 GB on HDFS (block size 128 MB)
Partitions: ~8 partitions
Tasks: Up to 8 tasks running in parallel
```

## Key Takeaways

1. The **driver** coordinates the application and converts code into tasks
2. **Executors** run tasks and cache data
3. **Cluster managers** (Standalone, YARN, K8s) allocate resources
4. Data locality minimizes network overhead
5. Partition count determines parallelism level
6. Choosing the right cluster manager depends on your infrastructure

## Practice Questions

1. What are the three main components of a Spark application?
2. What happens if the driver process fails?
3. Why should you limit executor core count to 3-5?
4. What is the difference between `yarn-client` and `yarn-cluster` deploy modes?
5. When would you choose Kubernetes over YARN for Spark?
6. Explain the five locality levels Spark uses for task scheduling.
7. How does Spark determine the number of partitions when reading from HDFS?
8. What is the role of the cluster manager during a Spark application lifecycle?
9. Why is dynamic allocation useful in a multi-tenant cluster?
10. What configuration parameters control executor resources?
