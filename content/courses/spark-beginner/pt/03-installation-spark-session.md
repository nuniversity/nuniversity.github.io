---
title: "Instalação do Spark e SparkSession"
description: "Instale o Apache Spark localmente, configure o PySpark, configure a SparkSession e verifique sua instalação"
order: 3
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Instalação do Spark e SparkSession

Antes de escrever código Spark, você precisa de uma instalação funcional. Este guia cobre a instalação do Spark localmente, configuração do PySpark e entendimento do ponto de entrada SparkSession.

## Pré-requisitos

- **Java 8/11/17**: Spark executa na JVM. Instale OpenJDK.
- **Python 3.8+**: Necessário para PySpark.
- **pip**: Gerenciador de pacotes Python.

```bash
# Verificar pré-requisitos
java -version
python --version
pip --version
```

> [!NOTE]
> Spark 3.5.x requer suporte a Java 17 (executa em Java 8/11/17). Spark 3.4 e anteriores funcionam melhor com Java 11.

## Instalando o Spark

### Opção 1: Usando pip (apenas PySpark)

A maneira mais simples de começar com PySpark:

```bash
pip install pyspark
```

Isso instala o PySpark e um runtime Spark pré-construído. Nenhum download separado do Spark é necessário.

### Opção 2: Instalação Manual

Baixe de [spark.apache.org/downloads.html](https://spark.apache.org/downloads.html).

```bash
# Extrair Spark
wget https://dlcdn.apache.org/spark/spark-3.5.1/spark-3.5.1-bin-hadoop3.tgz
tar -xzf spark-3.5.1-bin-hadoop3.tgz
sudo mv spark-3.5.1-bin-hadoop3 /opt/spark

# Definir variáveis de ambiente
echo 'export SPARK_HOME=/opt/spark' >> ~/.bashrc
echo 'export PATH=$SPARK_HOME/bin:$PATH' >> ~/.bashrc
echo 'export PYTHONPATH=$SPARK_HOME/python:$PYTHONPATH' >> ~/.bashrc
source ~/.bashrc
```

### Verificar Instalação

```bash
# Executar shell Spark
pyspark

# Ou executar um teste rápido
spark-submit --version
```

> [!SUCCESS]
> Executar `pyspark` inicia uma sessão Spark interativa. Você está pronto para escrever código Spark!

## SparkSession

`SparkSession` é o ponto de entrada unificado para toda a funcionalidade do Spark. Ele substitui `SparkContext`, `SQLContext` e `HiveContext` de versões anteriores.

### Criando uma SparkSession

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("MyFirstApp") \
    .config("spark.sql.shuffle.partitions", "4") \
    .config("spark.executor.memory", "2g") \
    .getOrCreate()
```

> [!NOTE]
> `getOrCreate()` reutiliza uma SparkSession existente se houver uma, prevenindo erros ao executar no shell Spark ou ambientes de notebook onde uma sessão já pode estar ativa.

### Principais Opções de Configuração

| Chave de Configuração | Padrão | Descrição |
|---|---|---|
| `spark.app.name` | (nenhum) | Nome da aplicação para UI |
| `spark.master` | `local[*]` | URL do cluster ou `local[N]` |
| `spark.sql.shuffle.partitions` | `200` | Partições para shuffles |
| `spark.executor.memory` | `1g` | Memória por executor |
| `spark.driver.memory` | `1g` | Memória para driver |
| `spark.executor.cores` | `1` | Núcleos por executor |
| `spark.sql.adaptive.enabled` | `true` | Otimização AQE |

### Modo Local

Para desenvolvimento e testes, use o modo local:

```python
# Usar todos os núcleos disponíveis
spark = SparkSession.builder \
    .appName("LocalMode") \
    .master("local[*]") \
    .getOrCreate()

# Usar exatamente 4 núcleos
spark = SparkSession.builder \
    .appName("LocalMode") \
    .master("local[4]") \
    .getOrCreate()
```

> [!WARNING]
> O modo local executa tudo em uma única JVM. É ótimo para aprendizado e testes pequenos, mas não simula o comportamento distribuído real. Condições de corrida ou bugs de serialização podem aparecer apenas no modo cluster.

## Métodos de Configuração do PySpark

### Usando o método config()

```python
spark = SparkSession.builder \
    .appName("ConfigExample") \
    .config("spark.sql.shuffle.partitions", "50") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .getOrCreate()
```

### Usando um dicionário de configuração

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

Crie `$SPARK_HOME/conf/spark-defaults.conf`:

```
spark.master                     yarn
spark.executor.memory            8g
spark.driver.memory              2g
spark.sql.shuffle.partitions     200
spark.sql.adaptive.enabled       true
```

## Verificando a SparkSession

```python
# Verificar se a sessão Spark está funcionando
print(spark.version)
print(spark.sparkContext.defaultParallelism)

# Teste de sanidade simples
df = spark.range(1, 100)
print(df.count())
```

## Configuração Específica de Ambiente

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

Notebooks Databricks têm uma variável `spark` pré-configurada. Nenhuma configuração necessária.

```python
# Databricks — spark já existe
display(spark.range(10))
```

### Docker

```bash
docker run -it --rm \
  -p 8888:8888 \
  -v $(pwd):/home/jovyan/work \
  jupyter/pyspark-notebook
```

## Problemas Comuns de Instalação

| Problema | Solução |
|---|---|
| `java not found` | Instale JDK 8/11/17 e defina `JAVA_HOME` |
| `Py4JJavaError` | Incompatibilidade de versão entre PySpark e Spark |
| `OutOfMemoryError` | Aumente `spark.driver.memory` |
| `ModuleNotFoundError: pyspark` | Ative ambiente virtual ou reinstale |
| Aviso `HADOOP_HOME` | Defina `HADOOP_HOME` ou ignore no Windows sem Hadoop |

## Principais Conclusões

1. Instale PySpark via `pip install pyspark` para a configuração mais rápida
2. `SparkSession` é o ponto de entrada unificado para todas as APIs Spark
3. `local[N]` executa em N núcleos em uma única JVM para desenvolvimento
4. A configuração pode ser definida programaticamente ou via arquivos de configuração
5. Diferentes ambientes (Colab, Databricks, Docker) têm etapas de configuração específicas

## Perguntas de Prática

1. Qual é a diferença entre `SparkContext` e `SparkSession`?
2. O que significa `master("local[*]")`?
3. Como você define a quantidade de memória alocada para cada executor?
4. Qual é o propósito de `getOrCreate()` vs `create()`?
5. Como você configuraria o número de partições de shuffle?
6. Quais métodos de instalação estão disponíveis para PySpark?
7. Por que um `Py4JJavaError` pode ocorrer?
8. Como você verifica qual versão do Spark está em execução?
9. Quais variáveis de ambiente são necessárias para uma instalação manual do Spark?
10. Como a configuração do Spark em `spark-defaults.conf` difere da configuração programática?
