---
title: "Fundamentos de Spark SQL"
description: "Usa SparkSession.sql(), crea vistas temporales y ejecuta consultas SQL en DataFrames para análisis de datos potente"
order: 9
duration: "30-40 minutos"
difficulty: "principiante"
---

# Fundamentos de Spark SQL

Spark SQL permite consultar datos estructurados usando SQL estándar. Cierra la brecha entre DataFrames programáticos y análisis SQL tradicional, permitiendo que analistas e ingenieros de datos usen el mismo lenguaje para exploración y pipelines de producción.

## ¿Por qué Spark SQL?

| Ventaja | Descripción |
|---|---|
| **Sintaxis familiar** | El conocimiento SQL se transfiere directamente |
| **Optimización** | El optimizador Catalyst funciona igual que la API DataFrame |
| **Interoperabilidad** | Mezcla operaciones SQL y DataFrame en un pipeline |
| **Soporte de herramientas** | Herramientas de BI (Tableau, Power BI) se conectan via JDBC/ODBC |
| **Rendimiento** | Mismo motor de ejecución Tungsten |

## Creando Vistas Temporales

Una vista temporal registra un DataFrame como una tabla SQL dentro de la sesión Spark.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("SparkSQL") \
    .master("local[*]") \
    .getOrCreate()

# Crear un DataFrame
data = [
    ("Alice", 34, "Engineering", 120000, "NY"),
    ("Bob", 28, "Design", 90000, "SF"),
    ("Charlie", 41, "Engineering", 150000, "NY"),
    ("Diana", 25, "Marketing", 80000, "SF"),
    ("Eve", 38, "Engineering", 135000, "NY"),
    ("Frank", 30, "Design", 95000, "LA"),
    ("Grace", 45, "Marketing", 110000, "NY"),
    ("Henry", 32, "Engineering", 125000, "LA")
]

df = spark.createDataFrame(data, ["name", "age", "dept", "salary", "city"])

# Registrar como vista temporal
df.createOrReplaceTempView("employees")
```

> [!NOTE]
> `createOrReplaceTempView()` crea una vista temporal con ámbito de sesión. No se comparte entre sesiones y desaparece cuando la SparkSession se detiene. Use `createGlobalTempView()` para compartir entre sesiones.

## Ejecutando Consultas SQL

```python
# SELECT simple
result = spark.sql("SELECT * FROM employees")
result.show()

# Filtrado
engineers = spark.sql("""
    SELECT name, age, salary
    FROM employees
    WHERE dept = 'Engineering'
    ORDER BY salary DESC
""")
engineers.show()

# Agregación
dept_stats = spark.sql("""
    SELECT dept,
           COUNT(*) as emp_count,
           ROUND(AVG(salary), 0) as avg_salary,
           MAX(salary) as max_salary
    FROM employees
    GROUP BY dept
    ORDER BY avg_salary DESC
""")
dept_stats.show()
```

> [!SUCCESS]
> Las consultas Spark SQL pasan por el mismo optimizador Catalyst que las operaciones DataFrame. Una consulta escrita en SQL y una consulta escrita con la API DataFrame producen planes de ejecución idénticos.

## Combinando SQL y APIs DataFrame

Puede moverse sin problemas entre operaciones SQL y DataFrame.

```python
# Comenzar con SQL
high_earners = spark.sql("""
    SELECT name, salary, dept
    FROM employees
    WHERE salary > 100000
""")

# Continuar con API DataFrame
high_earners_with_bonus = high_earners \
    .withColumn("bonus", high_earners.salary * 0.2) \
    .withColumn("total", high_earners.salary * 1.2)

high_earners_with_bonus.createOrReplaceTempView("high_earners")

# Volver a SQL para análisis final
final = spark.sql("""
    SELECT dept,
           COUNT(*) as count,
           ROUND(AVG(total), 0) as avg_total
    FROM high_earners
    GROUP BY dept
""")
final.show()
```

## Creando Vistas desde Diferentes Fuentes

```python
# Desde CSV
df_csv = spark.read.option("header", "true").csv("data/employees.csv")
df_csv.createOrReplaceTempView("employees_csv")

# Desde JSON
df_json = spark.read.json("data/employees.json")
df_json.createOrReplaceTempView("employees_json")

# Desde múltiples vistas, puede hacer join
joined = spark.sql("""
    SELECT c.*, j.department
    FROM employees_csv c
    JOIN employees_json j ON c.emp_id = j.emp_id
""")
```

## Vistas Temporales Globales

Las vistas temporales globales son visibles en todas las sesiones Spark dentro de la misma aplicación.

```python
# Crear vista temporal global
df.createGlobalTempView("global_employees")

# Acceder via base de datos global_temp
result = spark.sql("SELECT * FROM global_temp.global_employees")
result.show()

# En otra sesión (dentro de la misma aplicación)
# spark2.sql("SELECT * FROM global_temp.global_employees")
```

> [!NOTE]
> Las vistas temporales globales están vinculadas al tiempo de vida de la aplicación Spark. Sobreviven entre sesiones pero no se persisten en disco.

## CTEs y Subconsultas

Spark SQL soporta Common Table Expressions (CTEs) y subconsultas.

```python
# CTE
result = spark.sql("""
    WITH dept_avg AS (
        SELECT dept, AVG(salary) as avg_dept_salary
        FROM employees
        GROUP BY dept
    ),
    above_avg AS (
        SELECT e.name, e.dept, e.salary, a.avg_dept_salary
        FROM employees e
        JOIN dept_avg a ON e.dept = a.dept
        WHERE e.salary > a.avg_dept_salary
    )
    SELECT * FROM above_avg
    ORDER BY salary DESC
""")
result.show()

# Subconsulta
result = spark.sql("""
    SELECT name, dept, salary
    FROM employees
    WHERE salary > (
        SELECT AVG(salary) FROM employees
    )
""")
result.show()
```

## Funciones SQL

Spark SQL proporciona un rico conjunto de funciones integradas.

```python
# Funciones de string
spark.sql("""
    SELECT name,
           UPPER(name) as name_upper,
           LENGTH(name) as name_length,
           SUBSTRING(name, 1, 3) as name_prefix
    FROM employees
""").show()

# Funciones de fecha
spark.sql("""
    SELECT CURRENT_DATE as today,
           DATE_ADD(CURRENT_DATE, 7) as next_week,
           DATEDIFF('2024-12-31', CURRENT_DATE) as days_until_nye
""").show()

# Funciones condicionales
spark.sql("""
    SELECT name, salary,
           CASE
               WHEN salary > 130000 THEN 'High'
               WHEN salary > 100000 THEN 'Medium'
               ELSE 'Low'
           END as salary_level
    FROM employees
""").show()
```

## Instrucciones DDL y DML

Spark SQL soporta DDL (Data Definition Language) para gestión de metadatos.

```python
# Crear base de datos
spark.sql("CREATE DATABASE IF NOT EXISTS analytics")

# Usar base de datos
spark.sql("USE analytics")

# Crear tabla desde consulta
spark.sql("""
    CREATE TABLE IF NOT EXISTS high_salary_employees AS
    SELECT * FROM default.employees WHERE salary > 100000
""")

# DROP VIEW
spark.sql("DROP VIEW IF EXISTS employees")
```

> [!WARNING]
> Las operaciones DDL como `CREATE TABLE` crean tablas en el metastore Hive cuando Spark está configurado con soporte Hive. Sin Hive, las tablas son efímeras y con ámbito de sesión.

## Consideraciones de Rendimiento

```python
# Verificar el plan de la consulta
spark.sql("SELECT * FROM employees WHERE salary > 100000").explain(True)
# == Parsed Logical Plan ==
# == Analyzed Logical Plan ==
# == Optimized Logical Plan ==
# == Physical Plan ==

# Cachear una vista consultada frecuentemente
spark.sql("CACHE TABLE employees")
spark.sql("UNCACHE TABLE employees")

# Establecer configuraciones SQL
spark.sql("SET spark.sql.shuffle.partitions=50")
```

| Optimización | Sintaxis SQL | Beneficio |
|---|---|---|
| **Caching** | `CACHE TABLE t` | Evita recálculo |
| **Broadcast hint** | `SELECT /*+ BROADCAST(t) */ *` | Fuerza broadcast join |
| **Coalesce hint** | `SELECT /*+ COALESCE(4) */ *` | Controla particiones de salida |
| **Repartition hint** | `SELECT /*+ REPARTITION(10) */ *` | Redistribuye datos |

## Conclusiones Clave

1. `createOrReplaceTempView()` registra DataFrames como tablas SQL
2. Las APIs SQL y DataFrame son intercambiables y producen planes de ejecución idénticos
3. CTEs, subconsultas y funciones de ventana funcionan en Spark SQL
4. Las vistas temporales tienen ámbito de sesión; las vistas temporales globales abarcan sesiones
5. SQL proporciona una interfaz familiar para analistas en transición a Spark
6. Use `explain()` para entender y optimizar la ejecución de consultas

## Preguntas de Práctica

1. ¿Cómo se registra un DataFrame como una tabla SQL?
2. ¿Cuál es la diferencia entre una vista temporal y una vista temporal global?
3. ¿Cómo se combinan resultados de consultas SQL con operaciones DataFrame?
4. ¿Qué es una CTE y cómo se escribe una en Spark SQL?
5. ¿Cómo maneja el optimizador Catalyst las consultas Spark SQL?
6. ¿Cómo se verifica el plan de ejecución de una consulta SQL?
7. ¿Qué función SQL calcula totales acumulados? (Pista: funciones de ventana)
8. ¿Cómo se cachea una tabla en Spark SQL?
9. ¿Para qué sirve la pista `/*+ BROADCAST(t) */`?
10. ¿Puede mezclar APIs SQL y DataFrame en el mismo pipeline? Dé un ejemplo.
